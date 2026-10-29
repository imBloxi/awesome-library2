# Database optimization and Babel validation

Merged `origin/main` through `c95952c`, retaining weekly top picks, catalog filters, page-number clamping, the library-card design and author recommendations. The book update transaction includes the new top-pick timestamp behavior, with a regression check covering activation, preservation, expiry and clearing. Babel uses the upstream paper/groupbox styles and leaves the author-recommendation streaming boundary intact.

## Verified

- 25 unit tests: environment, CSV, search parsing/building and Babel generation.
- 11 PostgreSQL book tests: both reservation/admin lock orders, rejected copy reductions/deletion, missing/concurrently deleted book feedback, ISBN conflicts, empty and mixed-status counts, top-pick behavior and query plans.
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

Execution choices: kept the progress ledger outside the checkout; combined guarded update and failure-count feedback in one CTE after obtaining the book lock. The former has no product impact; the latter is covered by real concurrent database tests.

## Limits

The earlier build was blocked by Google Fonts network policy. Latest main replaced the downloaded fonts with system fonts; the merged production build now passes. No source checks or TLS verification were bypassed.

Vercel credentials remain in Vercel. Live Neon authentication, browser presentation and deployed latency have not been verified here. Existing pickup/extension behavior near expiry, restore concurrency and failure-message races outside these changes were not expanded in this pass. No claim of zero bugs, deployment or production migration is made.
