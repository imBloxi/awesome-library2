// Plain SQL for book search and top picks. No Next or driver imports, so the
// test scripts can run these exact fragments against Postgres.

// How long a book stays in "This week's top books" after an admin flags it.
export const TOP_PICK_DAYS = 7;

// True while books row `b` is a current top pick.
export const TOP_PICK_ACTIVE_SQL = `(b.top_pick_at > now() - interval '${TOP_PICK_DAYS} days')`;

// SET expression for top_pick_at from a boolean parameter, e.g. topPickAtSql("$8").
// Ticked and still current: keep the date. Ticked otherwise: now. Unticked: null.
export function topPickAtSql(param) {
  return `case when ${param} then coalesce(case when ${TOP_PICK_ACTIVE_SQL} then b.top_pick_at end, now()) end`;
}

// Free copies of books row `b`: holds that lapsed without pickup don't count.
export const AVAILABLE_SQL = `(b.total_copies - (select count(*) from active_reservations a where a.book_id = b.id))::int`;

export const BOOK_LIST_COLS = `b.id, b.title, b.author, b.isbn, b.published_year, b.total_copies,
  coalesce(${TOP_PICK_ACTIVE_SQL}, false) as is_top_pick, ${AVAILABLE_SQL} as available`;

// Escape LIKE wildcards so a search for "50%" means the literal text.
export function likePattern(q) {
  return `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}

// Catalog search. All user input goes through placeholders.
export function buildSearchQuery({ q = "", available = false, yearFrom = null, yearTo = null, limit, offset }) {
  const where = ["b.deleted_at is null"];
  const values = [];
  const param = (v) => {
    values.push(v);
    return `$${values.length}`;
  };
  // Same expression as the books_search_trgm index, so the index is used.
  if (q) where.push(`(b.title || ' ' || b.author || ' ' || coalesce(b.isbn, '')) ilike ${param(likePattern(q))}`);
  if (yearFrom != null) where.push(`b.published_year >= ${param(yearFrom)}`);
  if (yearTo != null) where.push(`b.published_year <= ${param(yearTo)}`);
  if (available) where.push(`${AVAILABLE_SQL} > 0`);
  const text = `select ${BOOK_LIST_COLS} from books b
    where ${where.join(" and ")}
    order by b.title, b.id limit ${param(limit)} offset ${param(offset)}`;
  return { text, values };
}

// "This week's top books", newest pick first. The where clause matches the
// books_top_pick partial index.
export function topPicksQuery(limit) {
  return {
    text: `select ${BOOK_LIST_COLS} from books b
      where b.top_pick_at is not null and b.deleted_at is null and ${TOP_PICK_ACTIVE_SQL}
      order by b.top_pick_at desc, b.id limit $1`,
    values: [limit],
  };
}
