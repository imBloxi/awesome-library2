# Architecture

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack) | `cacheComponents` and `partialPrefetching` on, see `next.config.mjs` |
| UI | React 19, Tailwind CSS 4 | Plain JavaScript, no TypeScript |
| Database | Neon Postgres | HTTP driver `@neondatabase/serverless` at runtime; `pg` for migrations and tests |
| Auth | Neon Auth (Better Auth) | Users live in `neon_auth."user"` |
| Validation | zod 4 | In server actions |
| Hosting | Vercel, region `fra1` | Next to the Neon project in AWS eu-central-1 |

> **This Next.js has breaking changes compared to older versions.** Read the guide in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

## Folder map

```
db/migrations/           SQL schema, applied in order by scripts/migrate.mjs
db/seed.mjs              ~200 sample books
scripts/                 migrate + test scripts (node --test)
src/proxy.js             early redirect for logged-out visitors (not the security boundary)
src/lib/
  env.mjs                reads and validates env vars (never logs values)
  db.js                  db(): one lazy Neon HTTP client
  dal.js                 getUser / requireUser / requireAdmin, the real access checks
  constants.js           LOAN_DAYS, TOP_PICKS_LIMIT
  search-params.mjs      parse/serialise catalogue URL params (pure, tested)
  csv.mjs                CSV writer with formula-injection escaping (pure, tested)
  queries/
    search-sql.mjs       catalogue, top-pick and author SQL (pure strings, tested on Postgres)
    reserve-sql.mjs      reserve transaction SQL (pure strings, concurrency-tested)
    books.js             book queries, run through db()
    reservations.js      reservation queries
    users.js             user/role queries
src/app/
  layout.js              Win95 window frame, toolbar, footer
  page.js                catalogue
  books/[id]/page.js     book page
  reservations/          member's reservations
  auth/                  sign-in, sign-up
  admin/                 overview, books, reservations, users, CSV export route
  api/cron/expire/       daily hold expiry (Vercel Cron)
  actions.js             member server actions
  admin/actions.js       admin server actions
  not-found.js           retro 404 dialog
src/components/          UI pieces (see design-system.md)
```

## Rule: SQL lives in `.mjs` files when it carries logic

SQL that encodes rules goes in plain `.mjs` modules with no Next or driver imports. Examples are the filter builder, the top-pick date rules and the reserve transaction. Test scripts can import those modules and run the **exact same SQL** against a real Postgres. `books.js` and friends are thin wrappers that pass that SQL to `db()`.

## Request flow: catalogue page

```
GET /?q=river&available=1
 │
 ├─ static shell (prerendered at build): window frame, "Find a book", search form, loading box
 │
 └─ <Suspense> streams <Catalog>:
      parseSearchParams(searchParams)        → { q, page, filters }   (junk ignored, page clamped)
      Promise.all([
        searchBooks({ q, page, filters }),   → buildSearchQuery → db().query
        showTop ? listTopPicks() : []        → only on the plain first page
      ])
      render: SearchForm (keyed on query) · CoverShelf · BookTable · Pagination
```

The book page works the same way. The book and the session load in parallel, and **More by this author** sits in its own `<Suspense>`, so it can never delay the main content.

## Auth and access control

1. `src/proxy.js` redirects logged-out visitors away from `/reservations` and `/admin` early. This is a convenience only.
2. **`src/lib/dal.js` is the security boundary.** Every private page and every server action calls `requireUser()` or `requireAdmin()`. `getUser()` is cached per request with React `cache()`, so several components reading it cost one session lookup.
3. `getUser()` awaits `connection()` first, so the session isn't read during prerender or prefetch.
4. Admin role changes take effect at the user's next sign-in, because the role is read from the session.

## Why it's fast

- **Partial prerendering:** each page's frame is static HTML from the CDN. Only the data parts stream.
- **No web fonts, no images:** system fonts, CSS-drawn covers and CSS bevels. Removing Geist saved a font download per visit.
- **Indexed queries:**
  - Trigram index for search.
  - Partial index for top picks.
  - Author index for "More by".
  - Partial indexes on active reservations.
- **Parallel fetching:** the top picks and the catalogue page come from one `Promise.all`. Filtered and searched pages skip the top-picks query entirely.
- **One extra row instead of `count(*)`:** pagination fetches 21 rows to know whether there's a next page.
- **No caching of live data:** availability must be exact, so no `"use cache"` on catalogue data. The queries are cheap enough not to need it.

## Correctness of reservations

`reserve-sql.mjs` runs three statements in one transaction:

1. A per-user advisory lock.
2. `FOR UPDATE` on the book row.
3. An `INSERT ... SELECT` that only inserts if all of these hold:
   - the user has fewer than 10 active reservations,
   - a copy is free,
   - they don't already hold that book.

Parallel clicks can't beat the limits. `scripts/test-reserve.mjs` proves it against a real database.

"Active" is a view (`active_reservations`): borrowed books, plus holds whose 7-day window hasn't passed. Lapsed holds stop counting the moment they lapse, with no job needed.
