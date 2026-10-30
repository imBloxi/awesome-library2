import { borrowBlockedSql } from "./moderation-sql.mjs";
import { db } from "@/lib/db";
import { reserveSteps, reserveFailureReason, explainFailure } from "./reserve-sql.mjs";
import { liveHoldSteps } from "./hold-sql.mjs";
import { promotionLockSteps, promoteStep, joinWaitlist, leaveWaitlist, waitlistPosition } from "./waitlist-sql.mjs";
import { buildReservationQuery, renewLoanQuery, DISPLAY_STATUS_SQL as DISPLAY_STATUS, DAYS_LEFT_SQL as DAYS_LEFT, DUE_AT_SQL, IS_OVERDUE_SQL, IS_EXPIRING_SQL, MAX_RENEWALS } from "./reservation-sql.mjs";
import { parseReservationParams, RESERVATION_PAGE_SIZE } from "../reservation-params.mjs";
export { RESERVATION_STATUSES as STATUSES } from "../reservation-params.mjs";

// Run `mutation` (a statement on reservation $1) and then hand any freed copy to the
// book's waitlist, in one transaction. Returns the mutation's rows.
async function withPromotion(reservationId, mutation) {
  const sql = db();
  const book = "(select book_id from reservations where id = $1)";
  const results = await sql.transaction(
    [
      ...promotionLockSteps(book, [reservationId]).map((s) => sql.query(s.text, s.params)),
      sql.query(mutation.text, mutation.params),
      sql.query(promoteStep(book, [reservationId]).text, [reservationId]),
    ],
    { isolationLevel: "ReadCommitted" }
  );
  return results.at(-2);
}

// Give free copies of a book to its queue. Returns how many holds were created.
export async function promoteWaitlist(bookId) {
  const sql = db();
  const results = await sql.transaction(
    [
      ...promotionLockSteps("$1", [bookId]).map((s) => sql.query(s.text, s.params)),
      sql.query(promoteStep("$1", [bookId]).text, [bookId]),
    ],
    { isolationLevel: "ReadCommitted" }
  );
  return results.at(-1).length;
}

// Returns { ok: true } or { ok: false, error }.
// All three steps run in one transaction over a single HTTP request. If anyone is queued
// for the book, the queue is served first, so a walk-in can't take a copy a hold lapse freed.
export async function reserveBook(userId, bookId) {
  const sql = db();
  const [{ queued }] = await sql.query("select exists (select 1 from waitlist where book_id = $1) as queued", [bookId]);
  if (queued) await promoteWaitlist(bookId);
  const results = await sql.transaction(
    reserveSteps(userId, bookId).map((s) => sql.query(s.text, s.params)),
    { isolationLevel: "ReadCommitted" }
  );
  if (results.at(-1).length === 1) return { ok: true };

  const [row] = await sql.query(reserveFailureReason.text, [userId, bookId]);
  return { ok: false, error: explainFailure(row) };
}

export async function listUserReservations(userId) {
  return db().query(
    `select r.id, r.book_id, r.reserved_at, r.expires_at, r.picked_up_at, r.returned_at,
       ${DISPLAY_STATUS} as status, ${DAYS_LEFT} as days_left,
       ${DUE_AT_SQL} as due_at, coalesce(${IS_OVERDUE_SQL}, false) as is_overdue,
       coalesce(${IS_EXPIRING_SQL}, false) as is_expiring, r.from_waitlist,
       (r.status = 'picked_up' and r.renewals < ${MAX_RENEWALS} and not coalesce(${IS_OVERDUE_SQL}, false)
         and not exists (select 1 from waitlist w where w.book_id = r.book_id)) as can_renew,
       b.title, b.author
     from reservations r join books b on b.id = r.book_id
     where r.user_id = $1 and not r.hidden_by_user
     order by (${DISPLAY_STATUS}) in ('reserved', 'picked_up') desc, r.reserved_at desc
     limit 200`,
    [userId]
  );
}

export async function countActive(userId) {
  const [row] = await db().query(
    "select count(*)::int as n from active_reservations where user_id = $1",
    [userId]
  );
  return row.n;
}

// User "delete": an active hold is cancelled (frees the copy), and the row is
// hidden from the user's list. A picked-up book must be returned instead.
export async function deleteUserReservation(userId, id) {
  const rows = await withPromotion(id, {
    text: `update reservations set
       status = case when status = 'reserved' and expires_at > now() then 'cancelled'
                     when status = 'reserved' then 'expired'
                     else status end,
       hidden_by_user = true
     where id = $1 and user_id = $2 and status <> 'picked_up'
     returning id`,
    params: [id, userId],
  });
  return rows.length === 1;
}

// userId null = admin return. coalesce gives $2 the column's type: a bare "$2 is null"
// can't be typed by Postgres and made every return fail.
export async function returnBook(id, userId = null) {
  const rows = await withPromotion(id, {
    text: `update reservations set status = 'returned', returned_at = now()
     where id = $1 and status = 'picked_up' and user_id = coalesce($2, user_id)
     returning id`,
    params: [id, userId],
  });
  return rows.length === 1;
}

async function changeLiveHold(id, pickedUp) {
  const sql = db();
  const results = await sql.transaction(
    liveHoldSteps(id, pickedUp).map((s) => sql.query(s.text, s.params)),
    { isolationLevel: "ReadCommitted" }
  );
  return results.at(-1).length === 1;
}

export async function markPickedUp(id) {
  return changeLiveHold(id, true);
}

// Admin: cancel a hold that is still within its pickup window. Frees the copy.
export async function cancelHold(id) {
  const rows = await withPromotion(id, {
    text: `update reservations set status = 'cancelled'
     where id = $1 and status = 'reserved' and expires_at > now() returning id`,
    params: [id],
  });
  return rows.length === 1;
}

// Admin: give a live hold a fresh 7-day pickup window. A lapsed hold can't be revived,
// because its copy may already have gone to someone else.
export async function extendHold(id) {
  return changeLiveHold(id, false);
}

export async function listAllReservations(options = {}) {
  const { text, params } = buildReservationQuery(options);
  return db().query(text, params);
}

export async function listReservationPage(options = {}) {
  const parsed = parseReservationParams({ ...options, user: options.userId });
  const rows = await listAllReservations({ ...parsed, limit: RESERVATION_PAGE_SIZE + 1, offset: (parsed.page - 1) * RESERVATION_PAGE_SIZE });
  return { rows: rows.slice(0, RESERVATION_PAGE_SIZE), hasNext: rows.length > RESERVATION_PAGE_SIZE };
}

export async function getReservationMember(userId) {
  const [member] = await db().query('select id, name, email from neon_auth."user" where id::text = $1::text', [String(userId)]);
  return member ?? null;
}

// Daily tidy-up. Correctness doesn't depend on it (see active_reservations view), but it is
// also when copies freed by lapsed holds reach queued members who haven't been served yet.
export async function expireStaleHolds() {
  const rows = await db().query(
    `update reservations set status = 'expired'
     where status = 'reserved' and expires_at <= now() returning id`
  );
  const queued = await db().query("select distinct book_id from waitlist");
  let promoted = 0;
  for (const { book_id } of queued) promoted += await promoteWaitlist(book_id);
  return { expired: rows.length, promoted };
}

// Returns { ok: true } or { ok: false, error }.
export async function renewLoan(userId, id) {
  const rows = await db().query(renewLoanQuery.text, [id, userId]);
  if (rows.length === 1) return { ok: true };
  const [r] = await db().query(
    `select r.status, r.renewals, coalesce(${IS_OVERDUE_SQL}, false) as overdue,
       exists (select 1 from waitlist w where w.book_id = r.book_id) as queued,
       ${borrowBlockedSql("r.user_id")} as blocked
     from reservations r where r.id = $1 and r.user_id = $2`,
    [id, userId]
  );
  if (!r || r.status !== "picked_up") return { ok: false, error: "Only books you have borrowed can be renewed." };
  if (r.blocked) return { ok: false, error: "Borrowing is paused on your account, so loans can't be renewed. You can still return books." };
  if (r.overdue) return { ok: false, error: "This loan is overdue. Please return it." };
  if (r.renewals >= MAX_RENEWALS) return { ok: false, error: "This loan has already been renewed." };
  if (r.queued) return { ok: false, error: "Someone is waiting for this book, so it can't be renewed." };
  return { ok: false, error: "Could not renew. Please try again." };
}

// Waitlist entries with the member's place in each queue.
export async function listUserWaitlist(userId) {
  return db().query(
    `select w.book_id, w.created_at, b.title, b.author,
       (select count(*)::int from waitlist w2 where w2.book_id = w.book_id
          and (w2.created_at, w2.id) <= (w.created_at, w.id)) as position
     from waitlist w join books b on b.id = w.book_id
     where w.user_id = $1 and b.deleted_at is null
     order by w.created_at`,
    [userId]
  );
}

// Counts for the header badge and the notices on My reservations.
export async function getMemberNotices(userId) {
  const [row] = await db().query(
    `select
       count(*) filter (where r.status = 'reserved' and r.expires_at > now())::int as ready,
       count(*) filter (where r.status = 'reserved' and r.from_waitlist and r.expires_at > now())::int as from_waitlist,
       count(*) filter (where ${IS_EXPIRING_SQL})::int as expiring,
       count(*) filter (where ${IS_OVERDUE_SQL})::int as overdue
     from reservations r
     where r.user_id = $1 and r.status in ('reserved', 'picked_up')`,
    [userId]
  );
  return row;
}

// What the signed-in member has to do with one book, for the reserve panel.
export async function getMemberBookState(userId, bookId) {
  const [row] = await db().query(
    `select
       (select ${DISPLAY_STATUS} from reservations r where r.user_id = $1 and r.book_id = $2
          and r.id in (select id from active_reservations) limit 1) as holding,
       exists (select 1 from wishlist where user_id = $1 and book_id = $2) as saved,
       (select count(*)::int from active_reservations where user_id = $1) as active_count`,
    [userId, bookId]
  );
  const queue = await getWaitlistPosition(userId, bookId);
  return { ...row, position: queue?.position ?? null, queueLength: queue?.length ?? null };
}

export async function joinBookWaitlist(userId, bookId) {
  const rows = await db().query(joinWaitlist.text, [userId, bookId]);
  return rows.length === 1;
}

export async function leaveBookWaitlist(userId, bookId) {
  const rows = await db().query(leaveWaitlist.text, [userId, bookId]);
  return rows.length === 1;
}

export async function getWaitlistPosition(userId, bookId) {
  const [row] = await db().query(waitlistPosition.text, [userId, bookId]);
  return row ?? null;
}
