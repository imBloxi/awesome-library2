# Reservation correctness follow-up implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Continue the approved correctness/database pass by preventing expired hold revival, fixing admin user pagination overflow, and preserving the latest upstream design.

**Architecture:** Coordinate pickup/extension with the existing per-user and book locks, then lock the reservation before checking expiry using actual database wall time. Reuse existing URL parsing and LIKE escaping instead of duplicating it.

**Tech Stack:** Node 24, Next.js 16, Neon HTTP transactions and disposable PostgreSQL 17 tests.

**Spec:** ../specs/2026-10-29-database-correctness-design.md; user requested continuing the optimization pass.

## Global Constraints

- Keep user flows, reservation limits, expiry windows and Vercel credentials unchanged.
- No new packages, schema changes or stale availability cache.
- Retain latest main and the title-seeded Babel feature in its current theme.
- Use the existing isolated cloud checkout and a disposable local database.

## Review Focus

- A hold expires while pickup/extension waits: do not revive it or overbook a copy.
- The expired hold's user fills their last slot elsewhere: do not exceed ten active reservations.
- Missing, deleted, cancelled, returned and picked-up rows cannot be processed as live holds.
- Huge, repeated and malformed page params must not overflow user-list SQL offsets.
- Admin text searches must treat literal LIKE wildcard characters consistently.

### Task 1: Serialize hold pickup and extension

**Files:** new `src/lib/queries/hold-sql.mjs`, `src/lib/queries/reservations.js`, `scripts/test-books.mjs`.

**Interface:** `liveHoldSteps(id, pickedUp)` returns ordered SQL descriptors. Pickup and extension retain their boolean results, using one explicit READ COMMITTED Neon transaction each.

- [x] Add real-database expiry-wait regressions for pickup/extension with another user taking a copy and the same user taking their tenth slot. Observe lock waits and actual expiry; confirm failures before implementation.
- [x] Lock the reservation's user, then its book and reservation rows, then recheck live status, nondeleted book and expiry with `clock_timestamp()` in a separate final mutation statement. A failing batched-protocol regression showed why statement time was insufficient.
- [x] Cover normal pickup/extension, invalid statuses, missing/deleted books, and concurrent admin mutations. Run the book suite and existing reservation scenarios; commit.

### Task 2: Reuse parsing and search helpers

**Files:** `src/lib/search-params.mjs`, `src/app/admin/users/page.js`, `src/lib/queries/users.js`, `src/lib/queries/reservations.js`, `scripts/test-search.mjs`, `scripts/test-books.mjs`.

**Interface:** export `parsePage(value)` with the existing 1..10000 bounds. Reuse it in URL parsing and user queries; reuse `likePattern(q)` for admin users/reservations.

- [x] Reproduce huge/invalid numeric user-page offsets against PostgreSQL and add parser cases. Add literal-wildcard search fixtures.
- [x] Reuse helper functions and retain query result shapes and pagination links. Run affected suites; commit.

### Task 3: Verify the merged result

- [x] Replace obsolete Babel theme classes with current design tokens; preserve native details behavior.
- [x] Run unit and PostgreSQL suites, lint, migration repeatability and production build.
- [x] Request one read-only whole-change review, fix confirmed important issues with failing tests first, and document limits.
