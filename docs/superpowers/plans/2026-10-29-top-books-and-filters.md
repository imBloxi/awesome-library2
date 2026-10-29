# This Week's Top Books + Catalog Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can flag books as "top picks" in the database; the home page shows them as "This week's top books", and the catalog search gains availability and year filters.

**Architecture:** One new boolean column `books.top_pick` (migration `002`), set from the existing admin book form. Search SQL and URL-param parsing move into two pure `.mjs` modules so they are unit-testable with `node --test` (the repo's existing pattern for `csv.mjs` / `reserve-sql.mjs`). The home page runs the top-picks query in parallel with the search query, only on an unfiltered first page.

**Tech Stack:** Next.js 16.4.3 (`cacheComponents: true`), React 19, Neon Postgres via `@neondatabase/serverless`, zod 4, Tailwind 4, `node --test`.

**Spec:** The user's request in this session ("database flag, This weeks top books, and filter search in main page"); no separate spec file. Assumptions are listed under Global Constraints.

## Global Constraints

- Speed must not regress: no new query on the filtered/search path, top-picks query uses a partial index, no `select *` on list pages, top-picks and search queries run in parallel (`Promise.all`).
- `AGENTS.md`: this Next.js has breaking changes and `node_modules` is not installed in this checkout. Before Task 3, run `pnpm install` and read the relevant guide under `node_modules/next/dist/docs/` (forms/`next/form`, `cacheComponents`/Suspense rules). Do not add `"use cache"` to the top-picks section: availability counts must stay live.
- Assumption (confirm): "top books" is **admin-curated** via a flag, not computed from reservation counts. "This week's" is a label; the admin un-flags manually.
- Assumption: filters are **available-only**, **year from**, **year to**. No sort options, no author facet.
- Page size stays `PAGE_SIZE = 20`. Top picks cap: `TOP_PICKS_LIMIT = 6` in `src/lib/constants.js`.
- Soft-deleted books (`deleted_at is not null`) never appear in either list.
- Migrations are additive and idempotent (`if not exists`), matching `001_init.sql`.
- Style: plain JS (no TypeScript), `@/` alias in app code, relative imports in `.mjs` modules that `scripts/` tests import, Tailwind classes from `src/components/ui.js` (`inputClass`, `buttonClass`).
- Out of scope: the "fix existing bugs" half of the request. Do a separate audit pass (`/securitymaxxing:audit`, `/code-review`) and plan it afterwards.

## Review Focus

- Search text containing `%` or `_` combined with filters: still literal match (pinned in Task 2).
- `from` > `to` (e.g. 2000 vs 1990): swap rather than return an empty list (Task 2).
- Non-numeric or out-of-range year / `available=banana` / `page=-3` in the URL: ignored or clamped, never a 500 (Task 2).
- Filtered or searched page 1 must not show the top-picks section; unfiltered page 2 must not either (Task 4).
- Deleted book that is still flagged must not appear in top picks (Task 3).
- Pagination links keep the active filters (Task 2, `filtersToParams`).

## File Structure

| File | Responsibility |
|---|---|
| `db/migrations/002_top_pick.sql` (new) | `top_pick` column + partial index |
| `src/lib/queries/search-sql.mjs` (new) | `buildSearchQuery`, `AVAILABLE_SQL`; pure, no imports from `@/` |
| `src/lib/search-params.mjs` (new) | `parseSearchParams`, `filtersToParams`; pure |
| `scripts/test-search.mjs` (new) | `node --test` for both modules |
| `src/lib/queries/books.js` | use builder in `searchBooks`; add `listTopPicks`; `top_pick` in create/update |
| `src/lib/constants.js` | `TOP_PICKS_LIMIT` |
| `src/app/admin/actions.js`, `src/components/book-form.js`, `src/app/admin/books/page.js` | admin sets/sees the flag |
| `src/components/catalog-filters.js` (new) | filter inputs rendered inside `SearchForm` |
| `src/app/page.js` | parse params, render top picks + filters |

---

### Task 1: `top_pick` column and admin control

**Files:**
- Create: `db/migrations/002_top_pick.sql`
- Modify: `src/lib/queries/books.js` (`createBook`, `updateBook`), `src/app/admin/actions.js` (`bookSchema`, `parseBook`), `src/components/book-form.js`, `src/app/admin/books/page.js` (badge)

**Interfaces:**
- Produces: `books.top_pick boolean not null default false`; `createBook(data)` / `updateBook(id, data)` accept `data.top_pick: boolean`; `getBook(id)` already returns it via `b.*`.

- [ ] **Step 1: Write the migration.** `alter table books add column if not exists top_pick boolean not null default false;` and `create index if not exists books_top_pick on books (title, id) where top_pick and deleted_at is null;`
- [ ] **Step 2: Apply it twice against a throwaway database.** Run: `pnpm db:migrate` then again. Expected: first prints `applied 002_top_pick.sql`, second prints only `migrations up to date`.
- [ ] **Step 3: Update `createBook` / `updateBook`** to write `top_pick` (append as the last parameter; keep column order stable).
- [ ] **Step 4: In `bookSchema` add `top_pick: z.boolean()`.** In `parseBook`, build `raw.top_pick = formData.get("top_pick") === "on"` (a checkbox is absent when unchecked, so it cannot go through the existing `?? ""` key list).
- [ ] **Step 5: In `BookForm`, add a `top_pick` checkbox** labelled "Show in This week's top books", `defaultChecked={v.top_pick}`, and add `top_pick: book.top_pick ?? false` to the fallback `v` object.
- [ ] **Step 6: In the admin books list, show a small "Top pick" badge** next to the title when `b.top_pick`. This needs `b.top_pick` in `searchBooks`'s column list; add it to `cols` in Task 3 (note it there).
- [ ] **Step 7: Verify by hand.** `pnpm dev`, edit a book, tick the box, save, reopen: box is still ticked; untick, save: cleared. Run `pnpm lint`. Expected: no errors.
- [ ] **Step 8: Commit** `feat: top_pick flag on books with admin checkbox`.

### Task 2: Pure search modules (TDD)

**Files:**
- Create: `src/lib/queries/search-sql.mjs`, `src/lib/search-params.mjs`, `scripts/test-search.mjs`
- Modify: `package.json` (`test:env` script gains `scripts/test-search.mjs`)

**Interfaces:**
- Produces:
  - `AVAILABLE_SQL: string`: the existing expression `(b.total_copies - (select count(*) from active_reservations a where a.book_id = b.id))::int`, moved verbatim from `books.js`.
  - `buildSearchQuery({ q: string, available: boolean, yearFrom: number|null, yearTo: number|null, limit: number, offset: number }) -> { text: string, values: unknown[] }` where `text` selects `b.id, b.title, b.author, b.isbn, b.published_year, b.total_copies, b.top_pick, <AVAILABLE_SQL> as available` from `books b`, always filters `b.deleted_at is null`, orders by `b.title, b.id`, and uses only `$n` placeholders.
  - `parseSearchParams(sp: Record<string, unknown>) -> { q: string, page: number, filters: { available: boolean, yearFrom: number|null, yearTo: number|null } }`. Param names: `q`, `page`, `available` (`"1"` means on), `from`, `to`.
  - `filtersToParams({ q, filters }) -> Record<string, string>`: only non-default values, for `Pagination`'s `params`.

- [ ] **Step 1: Write failing tests** in `scripts/test-search.mjs` (import with relative paths, like `test-csv.mjs`):
  - `buildSearchQuery` with only `limit: 21, offset: 0` has no `ilike`, no `published_year`, and `values` equals `[21, 0]`.
  - `q: "50%_"` yields a value `"%50\\%\\_%"` (wildcards escaped) and `text` contains `ilike`.
  - `available: true` adds `> 0` on `AVAILABLE_SQL`; `yearFrom: 1900, yearTo: 1950` adds both bounds as placeholders with values `1900`, `1950`.
  - Every case: `text` contains `b.deleted_at is null` and contains no literal user input (assert `text` does not include `"50%_"`).
  - `parseSearchParams({ q: "  hi  ", available: "1", from: "1990", to: "2000", page: "2" })` returns `q "hi"`, `available true`, years `1990`/`2000`, `page 2`.
  - `from: "2000", to: "1990"` returns `yearFrom 1990, yearTo 2000` (swapped).
  - Junk: `{ available: "banana", from: "abc", to: "99999", page: "-3" }` returns `available false`, `yearFrom null`, `yearTo null` (out of 0..2100 → null), `page 1`.
  - `q` longer than 100 chars is cut to 100; array-valued params (`?q=a&q=b`) yield `q ""`.
  - `filtersToParams({ q: "x", filters: { available: true, yearFrom: null, yearTo: 1950 } })` equals `{ q: "x", available: "1", to: "1950" }`.
- [ ] **Step 2: Run** `node --test scripts/test-search.mjs`. Expected: FAIL (modules not found).
- [ ] **Step 3: Implement `search-sql.mjs`.** Build the `where` fragments and `values` incrementally, numbering placeholders from `values.length`; `limit`/`offset` are the last two placeholders. The `likePattern` escape moves here from `books.js`, unchanged. Search expression stays `(b.title || ' ' || b.author || ' ' || coalesce(b.isbn, ''))` so the trigram index `books_search_trgm` is still used.
- [ ] **Step 4: Implement `search-params.mjs`.** Year: integer in 0..2100 else `null`. Page: `Math.max(1, parseInt) || 1`. Non-string values are treated as absent.
- [ ] **Step 5: Run** `node --test scripts/test-search.mjs`. Expected: all PASS.
- [ ] **Step 6: Add the file to `test:env`** and run `pnpm test:env`. Expected: PASS, existing tests unaffected.
- [ ] **Step 7: Commit** `feat: pure search query builder and param parser`.

### Task 3: Wire filters into search and the home page

**Files:**
- Modify: `src/lib/queries/books.js`, `src/app/page.js`
- Create: `src/components/catalog-filters.js`

**Interfaces:**
- Consumes: `buildSearchQuery`, `AVAILABLE_SQL` (Task 2); `parseSearchParams`, `filtersToParams` (Task 2).
- Produces: `searchBooks({ q = "", page = 1, filters = {} }) -> { books, hasNext }` (existing callers in `admin/books/page.js` keep working with no `filters`); `CatalogFilters({ filters })` server component.

- [ ] **Step 1: Read the Next docs** per Global Constraints (`next/form` with extra inputs; `cacheComponents` Suspense rule for `searchParams`).
- [ ] **Step 2: Refactor `searchBooks`** to call `buildSearchQuery` with `limit: PAGE_SIZE + 1`, `offset`, keeping the slice/`hasNext` logic. Import `AVAILABLE_SQL` in place of the local `AVAILABLE` constant (used by `getBook`, `listBooksForExport`, `getStats`). Delete the now-duplicated `likePattern` and the two inline queries.
- [ ] **Step 3: Create `CatalogFilters`**: a checkbox `name="available" value="1"` "Available now" (`defaultChecked={filters.available}`), and two `type="number"` inputs `name="from"` / `name="to"` (min 0, max 2100, placeholders "Year from" / "Year to", `defaultValue` from filters). Use `inputClass`; keep the row wrapping on narrow screens.
- [ ] **Step 4: In `page.js`**, replace the inline parsing with `parseSearchParams(sp)`, pass `filters` to `searchBooks`, render `<SearchForm action="/" q={q}><CatalogFilters filters={filters} /></SearchForm>` (also in the Suspense fallback), and pass `filtersToParams({ q, filters })` as `Pagination`'s `params`. Empty-state text: "No books match your search." when any of `q` or a filter is active.
- [ ] **Step 5: Verify against a seeded throwaway DB** (`pnpm db:seed`, `pnpm dev`): `/?available=1` hides fully reserved books; `/?from=1900&to=1950` shows only that range; `/?q=river&available=1&from=1900` combines; `/?from=2000&to=1990` behaves like `1990..2000`; page 2 links keep the filters; `/admin/books` search still works. Run `pnpm lint`.
- [ ] **Step 6: Commit** `feat: availability and year filters on the catalog`.

### Task 4: "This week's top books" section

**Files:**
- Modify: `src/lib/constants.js`, `src/lib/queries/books.js`, `src/app/page.js`
- Create: `src/components/book-list-item.js` (extract the existing `<li>` row from `page.js` so both lists share it)

**Interfaces:**
- Consumes: `searchBooks` (Task 3), `parseSearchParams` (Task 2).
- Produces: `TOP_PICKS_LIMIT = 6`; `listTopPicks(limit = TOP_PICKS_LIMIT) -> Promise<Book[]>` with the same columns as `searchBooks` rows, ordered `b.title, b.id`, filtered `b.top_pick and b.deleted_at is null`; `BookListItem({ book })`.

- [ ] **Step 1: Extract `BookListItem`** from the markup in `page.js` (no behavior change); confirm the home page renders identically.
- [ ] **Step 2: Implement `listTopPicks`** in `books.js` using `AVAILABLE_SQL`; the where clause must match the partial index predicate from Task 1 so the index is used.
- [ ] **Step 3: In `Catalog`, compute `showTop = !q && !filters.available && filters.yearFrom == null && filters.yearTo == null && page === 1`.** Fetch with `Promise.all([searchBooks(...), showTop ? listTopPicks() : []])`.
- [ ] **Step 4: Render the section above the search form's results** only when `showTop && topPicks.length > 0`: `<h2>This week's top books</h2>` plus a `ul` of `BookListItem`, with a small gap before the main list headed "All books". Nothing renders when no book is flagged.
- [ ] **Step 5: Verify by hand.** Flag two books in admin: they appear on `/`; not on `/?q=x`, `/?available=1`, `/?page=2`. Unflag: section disappears. Delete a flagged book in admin: it disappears from the section. Reserve every copy of a flagged book: badge shows "None available".
- [ ] **Step 6: Speed check.** In the Neon SQL editor run `explain analyze` on the `listTopPicks` query; expected: index scan on `books_top_pick`, sub-millisecond on the seed data. Compare home page response before/after with `pnpm build && pnpm start` (should be within noise).
- [ ] **Step 7: Update `README.md`** (users/admin bullets: top picks flag and filters). Run `pnpm lint` and `pnpm test:env`. Expected: clean.
- [ ] **Step 8: Commit** `feat: this week's top books on the home page`.

---

## Self-review

- Coverage: DB flag (Task 1), top books section (Task 4), filter search (Tasks 2-3). Bug fixing is explicitly deferred.
- Types: `buildSearchQuery`, `parseSearchParams`, `filtersToParams`, `searchBooks`, `listTopPicks`, `BookListItem`, `CatalogFilters` have one signature each across tasks. `top_pick` is added to the `cols` list in Task 2 (builder), which Task 1 step 6 depends on; execute Task 2 before Task 1 step 6 if doing it out of order.
- Verification limits: DB-backed behavior is checked by hand against a throwaway database because the repo has no DB test harness besides `scripts/test-reserve.mjs`.
