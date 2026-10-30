import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchQuery, AVAILABLE_SQL, TOP_PICK_ACTIVE_SQL } from "../src/lib/queries/search-sql.mjs";
import { parseSearchParams, filtersToParams, parsePage, hasFilters, defaultView } from "../src/lib/search-params.mjs";

const none = { q: "", available: false, yearFrom: null, yearTo: null, limit: 21, offset: 0 };

test("no filters: only limit and offset", () => {
  const { text, values } = buildSearchQuery(none);
  assert.doesNotMatch(text, /ilike/);
  assert.doesNotMatch(text, /published_year >=|published_year <=/);
  assert.deepEqual(values, [21, 0]);
  assert.match(text, /b\.deleted_at is null/);
  assert.match(text, /order by b\.title, b\.id/);
});

test("a search ranks exact, then prefix, then closest title or author first", () => {
  const { text, values } = buildSearchQuery({ ...none, q: "dune" });
  assert.match(text, /order by lower\(b\.title\) = lower\(\$2\) desc/);
  assert.match(text, /b\.title ilike \$3 desc/);
  assert.match(text, /word_similarity\(\$2, b\.title\)/);
  assert.deepEqual(values, ["%dune%", "dune", "dune%", 21, 0]);
});

test("rows carry availability and the top-pick flag", () => {
  const { text } = buildSearchQuery(none);
  assert.ok(text.includes(`${AVAILABLE_SQL} as available`));
  assert.ok(text.includes(`${TOP_PICK_ACTIVE_SQL}, false) as is_top_pick`));
});

test("search text escapes LIKE wildcards and is never inlined", () => {
  const { text, values } = buildSearchQuery({ ...none, q: "50%_" });
  assert.match(text, /ilike \$1/);
  assert.equal(values[0], "%50\\%\\_%");
  assert.ok(!text.includes("50%_"));
  assert.deepEqual(values.slice(-2), [21, 0]);
});

test("available-only filters on free copies", () => {
  const { text, values } = buildSearchQuery({ ...none, available: true });
  assert.ok(text.includes(`${AVAILABLE_SQL} > 0`));
  assert.deepEqual(values, [21, 0]);
});

test("year bounds are placeholders", () => {
  const { text, values } = buildSearchQuery({ ...none, q: "x", yearFrom: 1900, yearTo: 1950, limit: 5, offset: 10 });
  assert.match(text, /b\.published_year >= \$2/);
  assert.match(text, /b\.published_year <= \$3/);
  assert.match(text, /limit \$6 offset \$7/);
  assert.deepEqual(values, ["%x%", 1900, 1950, "x", "x%", 5, 10]);
  assert.ok(text.includes("b.deleted_at is null"));
});

test("parses a full query string", () => {
  assert.deepEqual(parseSearchParams({ q: "  hi  ", available: "1", from: "1990", to: "2000", page: "2" }), {
    q: "hi",
    page: 2,
    filters: { available: true, yearFrom: 1990, yearTo: 2000, genre: "", sort: "relevance" },
    view: "list",
  });
});

test("genre and sort: parsed, defaulted and round-tripped", () => {
  const parsed = parseSearchParams({ genre: "  Poetry ", sort: "newest" });
  assert.equal(parsed.filters.genre, "Poetry");
  assert.equal(parsed.filters.sort, "newest");
  assert.deepEqual(filtersToParams(parsed), { genre: "Poetry", sort: "newest" });
  assert.equal(parseSearchParams({ sort: "relevance" }).filters.sort, "title", "relevance needs a query");
  assert.equal(parseSearchParams({ q: "x", sort: "bogus" }).filters.sort, "relevance");
  assert.deepEqual(filtersToParams(parseSearchParams({ q: "x" })), { q: "x" }, "default sort stays out of the URL");
  assert.equal(hasFilters(parseSearchParams({ sort: "year" })), false, "sorting alone keeps top picks");
  assert.equal(hasFilters(parseSearchParams({ genre: "Poetry" })), true);
});

test("genre filter and sorts are placeholders and stable", () => {
  const g = buildSearchQuery({ ...none, genre: "Poetry", sort: "newest" });
  assert.match(g.text, /lower\(b\.genre\) = lower\(\$1\)/);
  assert.match(g.text, /order by b\.created_at desc, b\.id desc/);
  assert.equal(g.values[0], "Poetry");
  assert.match(buildSearchQuery({ ...none, sort: "year" }).text, /order by b\.published_year desc nulls last, b\.title, b\.id/);
  assert.match(buildSearchQuery({ ...none, q: "x", sort: "title" }).text, /order by b\.title, b\.id/);
});

test("swaps a reversed year range", () => {
  const { filters } = parseSearchParams({ from: "2000", to: "1990" });
  assert.equal(filters.yearFrom, 1990);
  assert.equal(filters.yearTo, 2000);
});

test("ignores junk params", () => {
  assert.deepEqual(parseSearchParams({ available: "banana", from: "abc", to: "99999", page: "-3" }), {
    q: "",
    page: 1,
    filters: { available: false, yearFrom: null, yearTo: null, genre: "", sort: "title" },
    view: "shelf",
  });
  assert.equal(parseSearchParams({ from: "19.5" }).filters.yearFrom, null);
  assert.deepEqual(parseSearchParams({}).filters, { available: false, yearFrom: null, yearTo: null, genre: "", sort: "title" });
});

test("cuts long search text and ignores repeated params", () => {
  assert.equal(parseSearchParams({ q: "a".repeat(150) }).q.length, 100);
  assert.equal(parseSearchParams({ q: ["a", "b"] }).q, "");
});

test("filtersToParams keeps only active values", () => {
  assert.deepEqual(filtersToParams({ q: "x", filters: { available: true, yearFrom: null, yearTo: 1950 } }), {
    q: "x",
    available: "1",
    to: "1950",
  });
  assert.deepEqual(filtersToParams({ q: "", filters: { available: false, yearFrom: null, yearTo: null } }), {});
});

test("clamps huge page numbers so the SQL offset stays valid", () => {
  assert.equal(parseSearchParams({ page: "1000000000000000000" }).page, 10000);
  assert.equal(parseSearchParams({ page: "99999999999999999999999" }).page, 10000);
  assert.equal(parseSearchParams({ page: "10000" }).page, 10000);
});

test("shared page parsing bounds query numbers and malformed URL values", () => {
  for (const page of [1e100, Infinity, "9".repeat(400)]) assert.equal(parsePage(page), 10000);
  for (const page of [NaN, -Infinity, -1, null, undefined, ["2", "3"], "junk"]) assert.equal(parsePage(page), 1);
  assert.equal(parsePage(2.8), 2);
  assert.equal(parsePage("3"), 3);
});

test("view: shelf for browsing, list for searching, explicit choices kept", () => {
  assert.equal(parseSearchParams({}).view, "shelf");
  assert.equal(parseSearchParams({ sort: "year" }).view, "shelf", "sorting is still browsing");
  assert.equal(parseSearchParams({ q: "dune" }).view, "list");
  assert.equal(parseSearchParams({ genre: "Poetry" }).view, "list");
  assert.equal(parseSearchParams({ q: "dune", view: "shelf" }).view, "shelf");
  assert.equal(parseSearchParams({ view: "list" }).view, "list");
  assert.equal(parseSearchParams({ view: "grid" }).view, "shelf", "unknown views fall back");
  assert.equal(parseSearchParams({ view: ["list", "shelf"] }).view, "shelf");
  assert.equal(defaultView(parseSearchParams({ available: "1" })), "list");
});

test("view only reaches the URL when it isn't the default, and is not a filter", () => {
  assert.deepEqual(filtersToParams(parseSearchParams({ view: "shelf" })), {});
  assert.deepEqual(filtersToParams(parseSearchParams({ view: "list" })), { view: "list" });
  assert.deepEqual(filtersToParams(parseSearchParams({ q: "x", view: "list" })), { q: "x" });
  assert.deepEqual(filtersToParams(parseSearchParams({ q: "x", view: "shelf" })), { q: "x", view: "shelf" });
  assert.equal(hasFilters(parseSearchParams({ view: "list" })), false, "top picks stay on a list view");
  assert.deepEqual(filtersToParams({ q: "", filters: { available: false, yearFrom: null, yearTo: null } }), {}, "callers without a view still work");
});
