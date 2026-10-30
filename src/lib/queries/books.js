import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { updateBookSteps, deleteBookSteps } from "./book-sql.mjs";
import { TOP_PICKS_LIMIT } from "@/lib/constants";
import { IS_OVERDUE_SQL, IS_EXPIRING_SQL } from "./reservation-sql.mjs";
import { AVAILABLE_SQL as AVAILABLE, TOP_PICK_ACTIVE_SQL, buildSearchQuery, topPicksQuery, hiddenTopPicksQuery, byAuthorQuery, genresQuery, alsoBorrowedQuery, BOOK_LIST_COLS } from "@/lib/queries/search-sql.mjs";

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

export async function listBooksByAuthor(author, excludeId, limit = 6) {
  const { text, values } = byAuthorQuery(author, excludeId, limit);
  return db().query(text, values);
}

// Current top picks beyond the ones the home page shows, so admin can see which are hidden.
export async function listHiddenTopPicks(limit = TOP_PICKS_LIMIT) {
  const { text, values } = hiddenTopPicksQuery(limit);
  return db().query(text, values);
}

export async function getBook(id) {
  const rows = await db().query(
    `select b.*, (b.total_copies - a.active_count)::int as available,
       coalesce(${TOP_PICK_ACTIVE_SQL}, false) as is_top_pick, a.active_count,
       case when ${TOP_PICK_ACTIVE_SQL} then b.top_pick_at::text end as top_pick_seen
     from books b cross join lateral (
       select count(*)::int as active_count from active_reservations where book_id = b.id
     ) a where b.id = $1 and b.deleted_at is null`,
    [id]
  );
  return rows[0] ?? null;
}

// Cache tag for everything shown about one book except its live availability.
export const bookTag = (id) => `book-${id}`;

// Book page details: title, description, top-pick flag. These only change when an admin
// edits the book, and every admin book action clears this tag, so the book page can be
// prerendered and served from cache. The top-pick badge can lag its 7-day end by up to
// the cache life ("hours"), which is fine for a badge. Availability is never cached.
export async function getBookDetails(id) {
  "use cache";
  cacheTag(bookTag(id));
  cacheLife("hours");
  const rows = await db().query(
    `select b.id, b.title, b.author, b.isbn, b.description, b.published_year, b.total_copies, b.genre,
       coalesce(${TOP_PICK_ACTIVE_SQL}, false) as is_top_pick
     from books b where b.id = $1 and b.deleted_at is null`,
    [id]
  );
  return rows[0] ?? null;
}

// Live free-copy count for one book. React cache: the status row and the reserve box
// share one query per request.
export const getAvailability = cache(async (id) => {
  const rows = await db().query(
    `select b.total_copies, ${AVAILABLE} as available from books b where b.id = $1 and b.deleted_at is null`,
    [id]
  );
  return rows[0] ?? null;
});

// Genres for the catalog filter. Cached; admin book saves clear the "genres" tag.
export async function listGenres() {
  "use cache";
  cacheTag("genres");
  cacheLife("hours");
  return db().query(genresQuery.text, genresQuery.values);
}

export async function listAlsoBorrowed(bookId, limit = 6) {
  const { text, values } = alsoBorrowedQuery(bookId, limit);
  return db().query(text, values);
}

// Wishlist ("Save for later").
export async function isSaved(userId, bookId) {
  const rows = await db().query("select 1 from wishlist where user_id = $1 and book_id = $2", [userId, bookId]);
  return rows.length === 1;
}

// Adds or removes; returns the new saved state, or null if the book doesn't exist.
export async function toggleSaved(userId, bookId, save) {
  if (!save) {
    await db().query("delete from wishlist where user_id = $1 and book_id = $2", [userId, bookId]);
    return false;
  }
  const rows = await db().query(
    `insert into wishlist (user_id, book_id)
     select $1, id from books where id = $2 and deleted_at is null
       and (select count(*) from wishlist where user_id = $1) < 200
     on conflict do nothing returning book_id`,
    [userId, bookId]
  );
  return rows.length === 1 ? true : (await isSaved(userId, bookId)) ? true : null;
}

export async function listSaved(userId) {
  return db().query(
    `select ${BOOK_LIST_COLS} from wishlist w join books b on b.id = w.book_id
     where w.user_id = $1 and b.deleted_at is null order by w.created_at desc limit 200`,
    [userId]
  );
}

export async function createBook(data) {
  const rows = await db().query(
    `insert into books (title, author, isbn, description, published_year, total_copies, top_pick_at, genre)
     values ($1, $2, $3, $4, $5, $6, case when $7 then now() end, $8) returning id`,
    [data.title, data.author, data.isbn, data.description, data.published_year, data.total_copies, data.top_pick, data.genre ?? null]
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
       ${AVAILABLE} as available, b.genre, b.description, b.created_at
     from books b where b.deleted_at is null order by b.title, b.id`
  );
}

export async function getStats() {
  const rows = await db().query(
    `with counts as materialized (
       select book_id, count(*) as active_count,
         count(*) filter (where status = 'reserved') as holds,
         count(*) filter (where status = 'picked_up') as loans,
         count(*) filter (where ${IS_OVERDUE_SQL}) as overdue,
         count(*) filter (where ${IS_EXPIRING_SQL}) as expiring
       from active_reservations r group by book_id
     )
     select b.books, b.out_of_stock, (select count(*)::int from neon_auth."user") as users, r.*
     from (
       select count(*)::int as books,
         count(*) filter (where b.total_copies > 0 and b.total_copies = coalesce(c.active_count, 0))::int as out_of_stock
       from books b left join counts c on c.book_id = b.id where b.deleted_at is null
     ) b cross join (
       select coalesce(sum(overdue), 0)::int as overdue, coalesce(sum(holds), 0)::int as holds,
         coalesce(sum(loans), 0)::int as loans, coalesce(sum(expiring), 0)::int as expiring from counts
     ) r`
  );
  return rows[0];
}
