# Database optimization and Babel validation

Merged `origin/main` at `7439a1e`, retaining weekly top picks, catalog filters and page-number clamping. The book update transaction includes the new top-pick timestamp behavior, with a regression check covering activation, preservation, expiry and clearing.

## Verified

- 25 unit tests: environment, CSV, search parsing/building and Babel generation.
- 11 PostgreSQL book tests: both reservation/admin lock orders, rejected copy reductions/deletion, missing/concurrently deleted book feedback, ISBN conflicts, empty and mixed-status counts, top-pick behavior and query plans.
- 10 existing PostgreSQL search/top-pick tests.
- Five existing reservation scenarios: user cap, copy cap, duplicate holds, expired holds and loan/return semantics.
- ESLint and `git diff --check`.
- Both migrations applied on a disposable PostgreSQL 17 database, then migration rerun reported up to date.

SQL tests use a minimal local test-only `neon_auth."user"` table and a pg-backed adapter for the app's query/transaction interface. They execute the application query functions. They do not test remote Neon HTTP transport or authentication.

## Local query measurements

5,000 books, 50,000 reservation rows, 1,000 users; live/expired holds, loans, returned and cancelled rows. After ANALYZE, median of seven warm `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` executions, before versus after:

| Query | Execution before | Execution after | Reservation scan loops before → after | Shared buffer hits before → after |
| --- | ---: | ---: | ---: | ---: |
| Book details | 0.041 ms | 0.029 ms | 2 → 1 | 27 → 15 |
| Dashboard | 65.35 ms | 13.33 ms | 5,004 → 1 | 42,540 → 667 |

These are local SQL measurements, not end-to-end production latency. No indexes, schema migrations, dependencies or stale availability caches were added. Admin edits now use one HTTP transaction instead of separate read/update requests.

## Review

An independent read-only reviewer found no critical or important database issue. A Unicode tokenization finding was reproduced with a failing Hindi-title test and fixed by preserving combining marks. The full unit suite passed afterward.

Execution choices: kept the progress ledger outside the checkout; combined guarded update and failure-count feedback in one CTE after obtaining the book lock. The former has no product impact; the latter is covered by real concurrent database tests.

## Limits

`pnpm build` still fails because the cloud network denies `fonts.googleapis.com` and `fonts.gstatic.com`, used by the existing Geist fonts. This denial predates these changes. No fonts, source checks or TLS verification were bypassed.

Vercel credentials remain in Vercel. Live Neon authentication, browser presentation and deployed latency have not been verified here. Existing pickup/extension behavior near expiry, restore concurrency and failure-message races outside these changes were not expanded in this pass. No claim of zero bugs, deployment or production migration is made.
