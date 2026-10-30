import { db } from "@/lib/db";

// Everything the circulation tables hold about one member, aggregated in one round trip.
// Includes rows the member removed from their own view (hidden_by_user): they are retained.
export async function getSubjectFile(userId) {
  const [row] = await db().query(
    `with mine as (
       select r.*, b.author, b.genre from reservations r join books b on b.id = r.book_id where r.user_id = $1
     )
     select
       (select count(*)::int from mine) as reservations,
       (select count(*)::int from mine where picked_up_at is not null) as loans,
       (select count(*)::int from mine where returned_at is not null) as returned,
       (select count(*)::int from mine where hidden_by_user) as hidden,
       (select min(reserved_at) from mine) as first_reserved,
       (select max(greatest(reserved_at, coalesce(picked_up_at, reserved_at), coalesce(returned_at, reserved_at))) from mine) as last_activity,
       (select extract(hour from reserved_at at time zone 'UTC')::int from mine group by 1 order by count(*) desc, 1 limit 1) as peak_hour,
       (select trim(to_char(reserved_at at time zone 'UTC', 'Day')) from mine
          group by extract(isodow from reserved_at at time zone 'UTC'), 1 order by count(*) desc, extract(isodow from reserved_at at time zone 'UTC') limit 1) as peak_day,
       (select count(*)::int from waitlist where user_id = $1) as waiting,
       (select count(*)::int from wishlist where user_id = $1) as saved,
       (select coalesce(json_agg(a), '[]'::json) from (
          select author, count(*)::int as n from mine group by author order by n desc, author limit 3) a) as top_authors,
       (select coalesce(json_agg(g), '[]'::json) from (
          select genre, count(*)::int as n from mine where coalesce(genre, '') <> '' group by genre order by n desc, genre limit 3) g) as top_genres`,
    [userId]
  );
  return row;
}

// Staff actions that touched this member: on their account, or on one of their reservations.
// The acting staff member is not shown to members.
export async function listStaffActions(userId, limit = 8) {
  return db().query(
    `select e.id, e.action, e.created_at, b.title as book_title
     from admin_events e left join books b on b.id = e.book_id
     where e.target_user = $2::text
        or e.reservation_id in (select id from reservations where user_id = $1)
     order by e.created_at desc, e.id desc
     limit $3`,
    [userId, String(userId), limit]
  );
}
