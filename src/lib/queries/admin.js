import { db } from "@/lib/db";
import { LOAN_DAYS } from "@/lib/constants";

// Insert validated rows from parseBookCsv in one statement. Books whose ISBN is already
// in the catalog are skipped, not overwritten. Returns { inserted, skipped }.
export async function importBooks(rows) {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };
  const col = (key) => rows.map((r) => r[key]);
  const inserted = await db().query(
    `insert into books (title, author, isbn, published_year, total_copies, description, genre)
     select * from unnest($1::text[], $2::text[], $3::text[], $4::int[], $5::int[], $6::text[], $7::text[])
     on conflict (isbn) do nothing
     returning id`,
    [col("title"), col("author"), col("isbn"), col("published_year"), col("total_copies"), col("description"), col("genre")]
  );
  return { inserted: inserted.length, skipped: rows.length - inserted.length };
}

// Activity log. Never throws into the action that called it: a failed log line must not
// undo or hide an admin's successful change.
export async function logAdminEvent(actor, action, { bookId = null, reservationId = null, targetUser = null, detail = null } = {}) {
  try {
    await db().query(
      `insert into admin_events (actor_id, actor_email, action, book_id, reservation_id, target_user, detail)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [String(actor.id), actor.email ?? null, action, bookId, reservationId, targetUser, detail ? String(detail).slice(0, 500) : null]
    );
  } catch (err) {
    console.error("admin_events insert failed", err?.code ?? err?.message);
  }
}

export const ACTIVITY_PAGE_SIZE = 50;

export async function listAdminEvents(page = 1) {
  const rows = await db().query(
    `select e.id, e.actor_email, e.action, e.detail, e.created_at, e.target_user,
       e.book_id, b.title as book_title, e.reservation_id
     from admin_events e left join books b on b.id = e.book_id
     order by e.created_at desc, e.id desc
     limit $1 offset $2`,
    [ACTIVITY_PAGE_SIZE + 1, (page - 1) * ACTIVITY_PAGE_SIZE]
  );
  return { rows: rows.slice(0, ACTIVITY_PAGE_SIZE), hasNext: rows.length > ACTIVITY_PAGE_SIZE };
}

// Desk: a scanned or typed ISBN (hyphens and spaces ignored) to a live book id.
export async function findBookByIsbn(text) {
  const isbn = String(text).replace(/[\s-]/g, "");
  if (!/^[0-9Xx]{8,20}$/.test(isbn)) return null;
  const [row] = await db().query(
    "select id, title, author from books where replace(isbn, '-', '') = $1 and deleted_at is null",
    [isbn]
  );
  return row ?? null;
}

export async function getMember(id) {
  const [row] = await db().query(
    `select u.id, u.name, u.email, u.role,
       (select count(*)::int from reservations r where r.user_id = u.id) as total_reservations,
       (select count(*)::int from reservations r where r.user_id = u.id and r.picked_up_at is not null) as total_loans
     from neon_auth."user" u where u.id::text = $1::text`,
    [String(id)]
  );
  return row ?? null;
}

export async function listMemberWaitlist(userId) {
  return db().query(
    `select w.book_id, w.created_at, b.title,
       (select count(*)::int from waitlist w2 where w2.book_id = w.book_id
          and (w2.created_at, w2.id) <= (w.created_at, w.id)) as position
     from waitlist w join books b on b.id = w.book_id
     where w.user_id = (select id from neon_auth."user" where id::text = $1::text)
     order by w.created_at`,
    [String(userId)]
  );
}

// Circulation numbers for the stats page. One round trip per panel, all run in parallel.
export async function getCirculationStats() {
  const [popular, never, weekly, demand] = await Promise.all([
    db().query(
      `select b.id, b.title, b.author, count(*)::int as loans
       from reservations r join books b on b.id = r.book_id
       where r.picked_up_at is not null and b.deleted_at is null
       group by b.id order by loans desc, b.title limit 10`
    ),
    db().query(
      `select count(*) over ()::int as total, b.id, b.title, b.author, b.created_at
       from books b
       where b.deleted_at is null
         and not exists (select 1 from reservations r where r.book_id = b.id and r.picked_up_at is not null)
       order by b.created_at, b.id limit 10`
    ),
    db().query(
      `select to_char(w.week, 'YYYY-MM-DD') as week, count(r.id)::int as loans
       from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') w(week)
       left join reservations r on r.picked_up_at >= w.week and r.picked_up_at < w.week + interval '1 week'
       group by w.week order by w.week`
    ),
    db().query(
      `select b.id, b.title, b.total_copies, count(w.id)::int as waiting
       from waitlist w join books b on b.id = w.book_id
       where b.deleted_at is null
       group by b.id order by waiting desc, b.title limit 10`
    ),
  ]);
  return { popular, never, neverTotal: never[0]?.total ?? 0, weekly, demand, loanDays: LOAN_DAYS };
}
