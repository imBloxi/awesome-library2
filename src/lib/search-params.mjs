// Catalog URL params: ?q=&available=1&from=&to=&page=
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

export function parseSearchParams(sp) {
  const q = str(sp.q).trim().slice(0, 100);
  const page = parsePage(sp.page);
  let yearFrom = year(sp.from);
  let yearTo = year(sp.to);
  if (yearFrom != null && yearTo != null && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];
  return { q, page, filters: { available: str(sp.available) === "1", yearFrom, yearTo } };
}

// Inverse of parseSearchParams, minus the page: for pagination links.
export function filtersToParams({ q, filters }) {
  const params = {};
  if (q) params.q = q;
  if (filters.available) params.available = "1";
  if (filters.yearFrom != null) params.from = String(filters.yearFrom);
  if (filters.yearTo != null) params.to = String(filters.yearTo);
  return params;
}

export function hasFilters({ q, filters }) {
  return Object.keys(filtersToParams({ q, filters })).length > 0;
}
