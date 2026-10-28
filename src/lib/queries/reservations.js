import { db } from "@/lib/db";
import { reserveSteps, reserveFailureReason, explainFailure } from "./reserve-sql.mjs";

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

// "display_status" turns a lapsed hold into "expired" even before the daily cron runs.
const DISPLAY_STATUS = `case when r.status = 'reserved' and r.expires_at <= now()
  then 'expired' else r.status::text end`;
const DAYS_LEFT = `greatest(0, ceil(extract(epoch from (r.expires_at - now())) / 86400))::int`;

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

export async function markPickedUp(id) {
  const rows = await db().query(
    `update reservations set status = 'picked_up', picked_up_at = now()
     where id = $1 and status = 'reserved' and expires_at > now()
     returning id`,
    [id]
  );
  return rows.length === 1;
}

export const STATUSES = ["active", "reserved", "picked_up", "returned", "cancelled", "expired", "all"];

export async function listAllReservations({ status = "active", q = "" }) {
  const params = [];
  const where = [];
  if (status === "active") where.push(`(${DISPLAY_STATUS}) in ('reserved', 'picked_up')`);
  else if (status !== "all") {
    params.push(status);
    where.push(`(${DISPLAY_STATUS}) = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    where.push(`(u.email ilike $${params.length} or b.title ilike $${params.length})`);
  }
  return db().query(
    `select r.id, r.reserved_at, r.expires_at, r.picked_up_at, r.returned_at,
       ${DISPLAY_STATUS} as status, ${DAYS_LEFT} as days_left,
       b.id as book_id, b.title, u.name as user_name, u.email as user_email
     from reservations r
     join books b on b.id = r.book_id
     join neon_auth."user" u on u.id = r.user_id
     ${where.length ? "where " + where.join(" and ") : ""}
     order by r.reserved_at desc
     limit 200`,
    params
  );
}

// Daily tidy-up. Correctness doesn't depend on it (see active_reservations view).
export async function expireStaleHolds() {
  const rows = await db().query(
    `update reservations set status = 'expired'
     where status = 'reserved' and expires_at <= now() returning id`
  );
  return rows.length;
}
