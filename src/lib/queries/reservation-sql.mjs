import { LOAN_DAYS } from "../constants.js";
import { RESERVATION_STATUSES } from "../reservation-params.mjs";
import { likePattern } from "./search-sql.mjs";

// These expressions use alias r and the statement's single consistent now().
export const DISPLAY_STATUS_SQL = `case when r.status = 'reserved' and r.expires_at <= now()
  then 'expired' else r.status::text end`;
export const DAYS_LEFT_SQL = `greatest(0, ceil(extract(epoch from (r.expires_at - now())) / 86400))::int`;
export const DUE_AT_SQL = `case when r.status = 'picked_up' then r.picked_up_at + interval '${LOAN_DAYS} days' end`;
export const IS_OVERDUE_SQL = `(r.status = 'picked_up' and r.picked_up_at < now() - interval '${LOAN_DAYS} days')`;
export const IS_EXPIRING_SQL = `(r.status = 'reserved' and r.expires_at > now() and r.expires_at < now() + interval '1 day')`;

function boundedInteger(value, fallback, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.trunc(n))) : fallback;
}

export function buildReservationQuery({ status = "active", q = "", bookId = null, userId = null, sort = "newest", limit = 200, offset = 0 } = {}) {
  const params = [];
  const where = [];
  const bind = (value) => { params.push(value); return `$${params.length}`; };
  if (bookId != null) where.push(`r.book_id = ${bind(bookId)}`);
  if (userId != null) {
    // Neon Auth IDs can be UUID or text. Resolve the text filter to the native
    // column type before matching indexed reservations, without casting user input.
    where.push(`r.user_id = (select id from neon_auth."user" where id::text = ${bind(String(userId))}::text)`);
  }
  const selectedStatus = RESERVATION_STATUSES.includes(status) ? status : "active";
  if (selectedStatus === "active") where.push(`(${DISPLAY_STATUS_SQL}) in ('reserved', 'picked_up')`);
  else if (selectedStatus === "attention") where.push(`(${IS_OVERDUE_SQL} or ${IS_EXPIRING_SQL})`);
  else if (selectedStatus === "overdue") where.push(IS_OVERDUE_SQL);
  else if (selectedStatus === "expiring") where.push(IS_EXPIRING_SQL);
  else if (selectedStatus !== "all") where.push(`(${DISPLAY_STATUS_SQL}) = ${bind(selectedStatus)}::text`);
  if (q) {
    const pattern = bind(likePattern(q));
    where.push(`(u.email ilike ${pattern} or u.name ilike ${pattern} or b.title ilike ${pattern})`);
  }
  const order = sort === "priority"
    ? `case when ${IS_OVERDUE_SQL} then 0 when ${IS_EXPIRING_SQL} then 1
         when (${DISPLAY_STATUS_SQL}) in ('reserved', 'picked_up') then 2 else 3 end,
       case when r.status = 'picked_up' then ${DUE_AT_SQL}
         when r.status = 'reserved' and r.expires_at > now() then r.expires_at end asc nulls last,
       r.reserved_at asc, r.id asc`
    : "r.reserved_at desc, r.id desc";
  return {
    text: `select r.id, r.user_id, r.reserved_at, r.expires_at, r.picked_up_at, r.returned_at,
       ${DISPLAY_STATUS_SQL} as status, ${DAYS_LEFT_SQL} as days_left,
       ${DUE_AT_SQL} as due_at, coalesce(${IS_OVERDUE_SQL}, false) as is_overdue,
       case when r.picked_up_at is not null and r.status = 'picked_up'
         then floor(extract(epoch from (now() - r.picked_up_at)) / 86400)::int end as loan_days,
       b.id as book_id, b.title, u.name as user_name, u.email as user_email
     from reservations r
     join books b on b.id = r.book_id
     join neon_auth."user" u on u.id = r.user_id
     ${where.length ? "where " + where.join(" and ") : ""}
     order by ${order}
     limit ${bind(boundedInteger(limit, 200, 50000))} offset ${bind(boundedInteger(offset, 0, 200000))}`,
    params,
  };
}
