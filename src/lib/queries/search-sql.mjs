// Plain SQL for book search and top picks. No Next or driver imports, so the
// test scripts can run these exact fragments against Postgres.

// How long a book stays in "This week's top books" after an admin flags it.
export const TOP_PICK_DAYS = 7;

// True while books row `b` is a current top pick.
export const TOP_PICK_ACTIVE_SQL = `(b.top_pick_at > now() - interval '${TOP_PICK_DAYS} days')`;

// SET expression for top_pick_at from a boolean parameter, e.g. topPickAtSql("$8", "$9").
// seenParam is the top_pick_at (as text) the edit form showed ticked, or null.
// Ticked and unchanged since the form loaded: keep the date, even if the pick has since
// expired, so saving a stale form can't restart it. Ticked and still current: keep the
// date. Ticked otherwise: now. Unticked: null.
export function topPickAtSql(param, seenParam = null) {
  const ticked = `coalesce(case when ${TOP_PICK_ACTIVE_SQL} then b.top_pick_at end, now())`;
  if (!seenParam) return `case when ${param} then ${ticked} end`;
  return `case when ${param} then case
    when b.top_pick_at = ${seenParam}::timestamptz then b.top_pick_at else ${ticked} end end`;
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
  // With a query, best matches first: exact title, then title prefix, then closest
  // title/author word match. Scoring only runs on rows the filter already matched.
  let order = "b.title, b.id";
  if (q) {
    const term = param(q);
    order = `lower(b.title) = lower(${term}) desc,
      b.title ilike ${param(likePattern(q).slice(1))} desc,
      greatest(word_similarity(${term}, b.title), word_similarity(${term}, b.author)) desc,
      b.title, b.id`;
  }
  const text = `select ${BOOK_LIST_COLS} from books b
    where ${where.join(" and ")}
    order by ${order} limit ${param(limit)} offset ${param(offset)}`;
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

// Current top picks the home page doesn't show: everything after the newest `limit`.
// Same order as topPicksQuery.
export function hiddenTopPicksQuery(limit) {
  return {
    text: `select b.id, b.title from books b
      where b.top_pick_at is not null and b.deleted_at is null and ${TOP_PICK_ACTIVE_SQL}
      order by b.top_pick_at desc, b.id offset $1 limit 100`,
    values: [limit],
  };
}

// "More by this author" on a book page.
export function byAuthorQuery(author, excludeId, limit) {
  return {
    text: `select ${BOOK_LIST_COLS} from books b
      where b.author = $1 and b.id <> $2 and b.deleted_at is null
      order by b.title, b.id limit $3`,
    values: [author, excludeId, limit],
  };
}
