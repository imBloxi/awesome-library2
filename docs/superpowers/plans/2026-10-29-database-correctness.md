# Database correctness implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prevent competing book mutations from violating reservation invariants and reduce repeated database reads.

**Architecture:** Use the existing Neon HTTP transaction API with explicit READ COMMITTED book locks followed by a fresh validation/update statement. Keep plain SQL builders testable with PostgreSQL and preserve result shapes at query boundaries.

**Tech Stack:** Next.js 16.4.3, Node 24, pnpm 12.8.1, Neon serverless, PostgreSQL, Node test runner.

**Spec:** ../specs/2026-10-29-database-correctness-design.md (approved in chat).

## Global Constraints

- Preserve the existing UI, authorization checks, reservation limit, expiry rules, and Neon deployment.
- Leave Vercel credentials in Vercel.
- No production migrations, dependency upgrades, stale availability caches, or UI redesign.
- Use a disposable local PostgreSQL database; keep SQL validation separate from unverified remote Neon behavior.
- Reuse the existing isolated cloud checkout; no additional worktree.

## Review Focus

- Reservation commits during a copy edit: copies must remain at least the active count.
- Reservation waits behind deletion: it must not create a hold on a deleted book.
- Missing or concurrently deleted book: the edit must return the existing not-found feedback.
- Expired holds versus picked-up loans: aggregate counts must retain their different semantics.
- An empty database: dashboard metrics and availability must remain numeric and zero where appropriate.

---

### Task 1: Serialize administrative book mutations

**Files:** `src/lib/queries/books.js`, new `src/lib/queries/book-sql.mjs`, `src/app/admin/actions.js`, new `scripts/test-books.mjs`, `package.json`.

**Interfaces:** Plain SQL builders `updateBookSteps(id, data)` and `deleteBookSteps(id)` produce ordered `{text, params}` statements. `updateBook(id, data)` returns `{ok: true}` or `{ok: false, error}`; delete keeps its boolean result. A read-only count statement within the edit transaction provides precise failure feedback.

- [x] Add a PostgreSQL test loader so tests import and execute actual query functions with a local pg-backed implementation of the Neon query/transaction boundary.
- [x] Add deterministic two-client regression tests for reservation/edit and reservation/delete in both lock orders, plus edit missing/deleted/insufficient-copy feedback. Confirm failures against existing code, using observed PostgreSQL lock waits instead of timing guesses.
- [x] Implement the lock-then-write SQL builders and use one Neon transaction per mutation. Return copy-count and missing-book errors from results of that same transaction. Remove the separate getBook call from updateBookAction.
- [x] Run `pnpm test:books` and the existing `pnpm test:reserve` on the disposable DB. Expect all concurrency and state assertions to pass.
- [x] Commit the mutation fix and record validation.

### Task 2: Eliminate repeated availability and dashboard scans

**Files:** `src/lib/queries/books.js`, `scripts/test-books.mjs`.

**Interfaces:** Keep `getBook(id)` and `getStats()` return shapes unchanged; getBook computes one active_count and derives available; stats returns books/users/overdue/out_of_stock/holds/loans/expiring as integers.

- [x] Add result-equivalence fixtures for empty, live/expired holds, picked-up/returned loans, deleted books and zero-copy books.
- [x] Compare old query plans with EXPLAIN ANALYZE; verify duplicate getBook reservation subplans and repeated dashboard reservation scans exist before changing them.
- [x] Derive available from a single counted subquery and use filtered reservation aggregates for dashboard metrics. Keep out-of-stock semantics unchanged.
- [x] Run all DB fixtures and existing tests; compare plans on representative fixtures and record reduced scan counts without extrapolating local timings to production.
- [x] Commit query optimization and update README test instructions.

### Task 3: Validate and review

**Files:** documentation and any review fixes.

- [x] Run environment/CSV tests, book integration tests, existing reservation checks and lint; exercise migrations twice for repeatability.
- [x] Run build if Google Fonts is allowed; otherwise report the known network blocker without changing application fonts or verification.
- [x] Review the complete diff with a fresh reviewer and fix important findings with failing regression tests first.
- [x] Record test results and limitations. Leave only intended commits and stop only containers started for this work.
