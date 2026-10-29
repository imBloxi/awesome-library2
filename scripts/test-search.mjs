import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchQuery, AVAILABLE_SQL, TOP_PICK_ACTIVE_SQL } from "../src/lib/queries/search-sql.mjs";
import { parseSearchParams, filtersToParams, parsePage } from "../src/lib/search-params.mjs";

const none = { q: "", available: false, yearFrom: null, yearTo: null, limit: 21, offset: 0 };

test("no filters: only limit and offset", () => {
  const { text, values } = buildSearchQuery(none);
  assert.doesNotMatch(text, /ilike/);
  assert.doesNotMatch(text, /published_year >=|published_year <=/);
  assert.deepEqual(values, [21, 0]);
  assert.match(text, /b\.deleted_at is null/);
  assert.match(text, /order by b\.title, b\.id/);
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
  assert.match(text, /limit \$4 offset \$5/);
  assert.deepEqual(values, ["%x%", 1900, 1950, 5, 10]);
  assert.ok(text.includes("b.deleted_at is null"));
});

test("parses a full query string", () => {
  assert.deepEqual(parseSearchParams({ q: "  hi  ", available: "1", from: "1990", to: "2000", page: "2" }), {
    q: "hi",
    page: 2,
    filters: { available: true, yearFrom: 1990, yearTo: 2000 },
  });
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
    filters: { available: false, yearFrom: null, yearTo: null },
  });
  assert.equal(parseSearchParams({ from: "19.5" }).filters.yearFrom, null);
  assert.deepEqual(parseSearchParams({}).filters, { available: false, yearFrom: null, yearTo: null });
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
