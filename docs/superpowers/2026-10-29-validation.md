# Database optimization and Babel validation

Merged `origin/main` through `da0fc82`, retaining weekly top picks, catalog filters, page-number clamping, the clean white design and author recommendations. The book update transaction includes the new top-pick timestamp behavior, with a regression check covering activation, preservation, expiry and clearing. Babel uses the current border/subtle-background styles and leaves the author-recommendation streaming boundary intact.

## Verified

- 26 unit tests: environment, CSV, shared page parsing/search building and Babel generation.
- 20 PostgreSQL book/admin tests: both reservation/admin lock orders, rejected copy reductions/deletion, missing/concurrently deleted book feedback, ISBN conflicts, empty and mixed-status counts, top-pick behavior, query plans, pickup/extension expiry races, batched-protocol wall-clock expiry, user-page overflow and literal wildcard searches.
- 11 existing PostgreSQL search/top-pick/author tests.
- Five existing reservation scenarios: user cap, copy cap, duplicate holds, expired holds and loan/return semantics.
- ESLint and `git diff --check`.
- All three migrations applied on a disposable PostgreSQL 17 database, then migration rerun reported up to date.
- Production build: compiled successfully and generated all 15 route shells.
- Production server: unauthenticated cron request returned exactly HTTP 401 / `Unauthorized`; favicon returned HTTP 200 with a nonempty body.

SQL tests use a minimal local test-only `neon_auth."user"` table and a pg-backed adapter for the app's query/transaction interface. They execute the application query functions. They do not test remote Neon HTTP transport or authentication.

## Local query measurements

5,000 books, 50,000 reservation rows, 1,000 users; live/expired holds, loans, returned and cancelled rows. After ANALYZE, median of seven warm `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` executions, before versus after:

| Query | Execution before | Execution after | Reservation scan loops before → after | Shared buffer hits before → after |
| --- | ---: | ---: | ---: | ---: |
| Book details | 0.041 ms | 0.029 ms | 2 → 1 | 27 → 15 |
| Dashboard | 65.35 ms | 13.33 ms | 5,004 → 1 | 42,540 → 667 |

These are local SQL measurements, not end-to-end production latency. No indexes, schema migrations, dependencies or stale availability caches were added. Admin edits now use one HTTP transaction instead of separate read/update requests.

## Review

An independent read-only reviewer found no critical or important database issue. A Unicode tokenization finding was reproduced with a failing Hindi-title test and fixed by preserving combining marks. The full unit suite passed afterward. The subsequent upstream design/author merge was checked for preservation of both features, then the full test suites, lint and production build were rerun.

The continuation reproduced pickup/extension races that could revive a hold after expiry while another reservation reused its copy or user slot. Both operations now obtain the same user/book locks as reservation creation and lock the reservation before rechecking expiry. A separate batched-protocol regression demonstrated that `statement_timestamp()` can stay fixed at message start; `clock_timestamp()` after all locks removes that transport assumption. Independent review found no other defects in the continuation changes. Admin user pagination now shares the catalog's bounds, and duplicated LIKE escaping was removed.

Execution choices: kept the progress ledger outside the checkout; combined guarded update and failure-count feedback in one CTE after obtaining the book lock. The former has no product impact; the latter is covered by real concurrent database tests.

## Limits

The earlier build was blocked by Google Fonts network policy. Latest main replaced the downloaded fonts with system fonts; the merged production build now passes. No source checks or TLS verification were bypassed.

Vercel credentials remain in Vercel. Live Neon authentication, browser presentation and deployed latency have not been verified here. Arbitrary external SQL, reservation ownership reassignment, restore concurrency and reservation failure-message races outside these changes were not expanded in this pass. No claim of zero bugs, deployment or production migration is made.
