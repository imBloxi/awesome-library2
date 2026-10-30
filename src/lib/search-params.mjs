// Catalog URL params: ?q=&available=1&from=&to=&genre=&sort=&view=&page=
// Anything malformed is ignored rather than turned into an error.

// Beyond this the SQL offset would overflow; nobody pages through 200k books.
const MAX_PAGE = 10000;

const str = (v) => (typeof v === "string" ? v : "");

export function parsePage(value) {
  const page = typeof value === "number" ? Math.trunc(value) : Number.parseInt(str(value), 10);
  return Math.min(MAX_PAGE, Math.max(1, page || 1));
}

function year(v) {
  const s = str(v).trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n <= 2100 ? n : null;
}

export const SORTS = ["relevance", "title", "newest", "year"];
export const VIEWS = ["shelf", "list"];

// Browsing shows spines on shelves; a search or filter shows scannable rows.
export function defaultView({ q, filters }) {
  return hasFilters({ q, filters }) ? "list" : "shelf";
}

export function parseSearchParams(sp) {
  const q = str(sp.q).trim().slice(0, 100);
  const genre = str(sp.genre).trim().slice(0, 60);
  // Relevance only means something with a query; without one, title order.
  const sort = SORTS.includes(sp.sort) && (sp.sort !== "relevance" || q) ? sp.sort : q ? "relevance" : "title";
  const page = parsePage(sp.page);
  let yearFrom = year(sp.from);
  let yearTo = year(sp.to);
  if (yearFrom != null && yearTo != null && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];
  const filters = { available: str(sp.available) === "1", yearFrom, yearTo, genre, sort };
  const view = VIEWS.includes(sp.view) ? sp.view : defaultView({ q, filters });
  return { q, page, filters, view };
}

// Inverse of parseSearchParams, minus the page: for pagination links.
// The view only appears when it differs from what the other params would choose.
export function filtersToParams({ q, filters, view }) {
  const params = {};
  if (q) params.q = q;
  if (filters.available) params.available = "1";
  if (filters.yearFrom != null) params.from = String(filters.yearFrom);
  if (filters.yearTo != null) params.to = String(filters.yearTo);
  if (filters.genre) params.genre = filters.genre;
  // Default sorts stay out of the URL.
  if (filters.sort && filters.sort !== (q ? "relevance" : "title")) params.sort = filters.sort;
  if (VIEWS.includes(view) && view !== defaultView({ q, filters })) params.view = view;
  return params;
}

// Sorting and the view aren't filters: the top picks still belong on a re-sorted first page.
export function hasFilters({ q, filters }) {
  return Object.keys(filtersToParams({ q, filters })).some((key) => key !== "sort" && key !== "view");
}
