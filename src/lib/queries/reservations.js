import { db } from "@/lib/db";
import { reserveSteps, reserveFailureReason, explainFailure } from "./reserve-sql.mjs";
import { liveHoldSteps } from "./hold-sql.mjs";
import { buildReservationQuery, DISPLAY_STATUS_SQL as DISPLAY_STATUS, DAYS_LEFT_SQL as DAYS_LEFT } from "./reservation-sql.mjs";
import { parseReservationParams, RESERVATION_PAGE_SIZE } from "../reservation-params.mjs";
export { RESERVATION_STATUSES as STATUSES } from "../reservation-params.mjs";

// Returns { ok: true } or { ok: false, error }.
// All three steps run in one transaction over a single HTTP request.
export async function reserveBook(userId, bookId) {
  const sql = db();
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
  const rows = await db().query(
    `update reservations set
       status = case when status = 'reserved' and expires_at > now() then 'cancelled'
                     when status = 'reserved' then 'expired'
                     else status end,
       hidden_by_user = true
     where id = $1 and user_id = $2 and status <> 'picked_up'
     returning id`,
    [id, userId]
  );
  return rows.length === 1;
}

export async function returnBook(id, userId = null) {
  const rows = await db().query(
    `update reservations set status = 'returned', returned_at = now()
     where id = $1 and status = 'picked_up' and ($2 is null or user_id = $2)
     returning id`,
    [id, userId]
  );
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
  const rows = await db().query(
    `update reservations set status = 'cancelled'
     where id = $1 and status = 'reserved' and expires_at > now() returning id`,
    [id]
  );
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

// Daily tidy-up. Correctness doesn't depend on it (see active_reservations view).
export async function expireStaleHolds() {
  const rows = await db().query(
    `update reservations set status = 'expired'
     where status = 'reserved' and expires_at <= now() returning id`
  );
  return rows.length;
}
