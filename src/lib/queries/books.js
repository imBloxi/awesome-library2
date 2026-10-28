import { db } from "@/lib/db";

export const PAGE_SIZE = 20;

// Escape LIKE wildcards so a search for "50%" means the literal text.
function likePattern(q) {
  return `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}

const AVAILABLE = `(b.total_copies - (select count(*) from active_reservations a where a.book_id = b.id))::int`;

// Fetches one extra row to know whether there's a next page.
export async function searchBooks({ q = "", page = 1 }) {
  const offset = (page - 1) * PAGE_SIZE;
  const cols = `b.id, b.title, b.author, b.isbn, b.published_year, b.total_copies, ${AVAILABLE} as available`;
  const rows = q
    ? await db().query(
        `select ${cols} from books b
         where b.deleted_at is null
           and (b.title || ' ' || b.author || ' ' || coalesce(b.isbn, '')) ilike $1
         order by b.title, b.id limit $2 offset $3`,
        [likePattern(q), PAGE_SIZE + 1, offset]
      )
    : await db().query(
        `select ${cols} from books b
         where b.deleted_at is null
         order by b.title, b.id limit $1 offset $2`,
        [PAGE_SIZE + 1, offset]
      );
  return { books: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

export async function getBook(id) {
  const rows = await db().query(
    `select b.*, ${AVAILABLE} as available,
       (select count(*)::int from active_reservations a where a.book_id = b.id) as active_count
     from books b where b.id = $1 and b.deleted_at is null`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createBook(data) {
  const rows = await db().query(
    `insert into books (title, author, isbn, description, published_year, total_copies)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [data.title, data.author, data.isbn, data.description, data.published_year, data.total_copies]
  );
  return rows[0].id;
}

export async function updateBook(id, data) {
  const rows = await db().query(
    `update books set title = $2, author = $3, isbn = $4, description = $5,
       published_year = $6, total_copies = $7, updated_at = now()
     where id = $1 and deleted_at is null returning id`,
    [id, data.title, data.author, data.isbn, data.description, data.published_year, data.total_copies]
  );
  return rows.length === 1;
}

// Soft delete, refused while anyone holds or has borrowed the book.
// Returns false if it was refused.
export async function deleteBook(id) {
  const rows = await db().query(
    `update books set deleted_at = now(), isbn = null, updated_at = now()
     where id = $1 and deleted_at is null
       and not exists (select 1 from active_reservations where book_id = $1)
     returning id`,
    [id]
  );
  return rows.length === 1;
}

export async function getStats() {
  const rows = await db().query(
    `select
       (select count(*)::int from books where deleted_at is null) as books,
       (select count(*)::int from active_reservations where status = 'reserved') as holds,
       (select count(*)::int from active_reservations where status = 'picked_up') as loans,
       (select count(*)::int from active_reservations
          where status = 'reserved' and expires_at < now() + interval '1 day') as expiring`
  );
  return rows[0];
}
