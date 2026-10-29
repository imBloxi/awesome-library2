import { db } from "@/lib/db";
import { updateBookSteps, deleteBookSteps } from "./book-sql.mjs";
import { LOAN_DAYS, TOP_PICKS_LIMIT } from "@/lib/constants";
import { AVAILABLE_SQL as AVAILABLE, TOP_PICK_ACTIVE_SQL, buildSearchQuery, topPicksQuery } from "@/lib/queries/search-sql.mjs";

export const PAGE_SIZE = 20;

// Fetches one extra row to know whether there's a next page.
// filters: { available, yearFrom, yearTo } from parseSearchParams.
export async function searchBooks({ q = "", page = 1, filters = {} }) {
  const { text, values } = buildSearchQuery({ q, ...filters, limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE });
  const rows = await db().query(text, values);
  return { books: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

// "This week's top books" for the home page, same columns as searchBooks rows.
export async function listTopPicks(limit = TOP_PICKS_LIMIT) {
  const { text, values } = topPicksQuery(limit);
  return db().query(text, values);
}

// Number of current top picks, so admin can see when more are flagged than the home page shows.
export async function countTopPicks() {
  const rows = await db().query(
    `select count(*)::int as n from books b
     where b.top_pick_at is not null and ${TOP_PICK_ACTIVE_SQL} and b.deleted_at is null`
  );
  return rows[0].n;
}

export async function getBook(id) {
  const rows = await db().query(
    `select b.*, ${AVAILABLE} as available, coalesce(${TOP_PICK_ACTIVE_SQL}, false) as is_top_pick,
       (select count(*)::int from active_reservations a where a.book_id = b.id) as active_count
     from books b where b.id = $1 and b.deleted_at is null`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createBook(data) {
  const rows = await db().query(
    `insert into books (title, author, isbn, description, published_year, total_copies, top_pick_at)
     values ($1, $2, $3, $4, $5, $6, case when $7 then now() end) returning id`,
    [data.title, data.author, data.isbn, data.description, data.published_year, data.total_copies, data.top_pick]
  );
  return rows[0].id;
}

export async function updateBook(id, data) {
  const sql = db();
  const results = await sql.transaction(
    updateBookSteps(id, data).map((s) => sql.query(s.text, s.params)),
    { isolationLevel: "ReadCommitted" }
  );
  const row = results.at(-1)[0];
  if (!row) return { ok: false, error: "This book no longer exists." };
  if (!row.updated) {
    return { ok: false, error: `${row.active_count} copies are reserved or borrowed right now. Copies can't go below that.` };
  }
  return { ok: true };
}

// Soft delete, refused while anyone holds or has borrowed the book.
// Returns false if it was refused.
export async function deleteBook(id) {
  const sql = db();
  const results = await sql.transaction(
    deleteBookSteps(id).map((s) => sql.query(s.text, s.params)),
    { isolationLevel: "ReadCommitted" }
  );
  return results.at(-1).length === 1;
}

export async function listDeletedBooks() {
  return db().query(
    `select id, title, author, total_copies, deleted_at from books
     where deleted_at is not null order by deleted_at desc limit 100`
  );
}

// Undo a soft delete. The ISBN was cleared on delete, so it has to be entered again.
export async function restoreBook(id) {
  const rows = await db().query(
    `update books set deleted_at = null, updated_at = now()
     where id = $1 and deleted_at is not null returning id`,
    [id]
  );
  return rows.length === 1;
}

export async function listBooksForExport() {
  return db().query(
    `select b.id, b.title, b.author, b.isbn, b.published_year, b.total_copies,
       ${AVAILABLE} as available, b.created_at
     from books b where b.deleted_at is null order by b.title, b.id`
  );
}

export async function getStats() {
  const rows = await db().query(
    `select
       (select count(*)::int from books where deleted_at is null) as books,
       (select count(*)::int from neon_auth."user") as users,
       (select count(*)::int from active_reservations
          where status = 'picked_up' and picked_up_at < now() - interval '${LOAN_DAYS} days') as overdue,
       (select count(*)::int from books b where b.deleted_at is null and b.total_copies > 0
          and ${AVAILABLE} = 0) as out_of_stock,
       (select count(*)::int from active_reservations where status = 'reserved') as holds,
       (select count(*)::int from active_reservations where status = 'picked_up') as loans,
       (select count(*)::int from active_reservations
          where status = 'reserved' and expires_at < now() + interval '1 day') as expiring`
  );
  return rows[0];
}
