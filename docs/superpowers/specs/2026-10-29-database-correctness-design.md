# Database correctness and latency

The user selected correctness and database latency as the first optimization scope. Preserve the existing UI, authorization checks, reservation limit, expiry rules, and Neon deployment. Leave Vercel credentials in Vercel.

## Approaches

- Selected: repair database invariants and reduce duplicated query work. This addresses reservation correctness and backend work without changing user flows.
- Deferred: a full rendering and bundle pass. It broadens the change and does not resolve concurrent database mutations.
- Avoid speculative caching: availability and permissions must remain current; introducing stale results would work against correctness.

## Proposed change

Book edits currently read active reservations before a separate update. A new reservation can commit between those requests, allowing copies to fall below active loans/holds. Move the validation into a transaction that locks the book first and reads active reservations in a subsequent READ COMMITTED statement. Coordinate edits and deletion with the book lock already used by reservation creation. Recheck deletion after obtaining the lock; do not assume a single statement's snapshot becomes current after a lock wait. Preserve not-found and insufficient-copies feedback, including concurrent deletion.

Fetch a book's active reservation count once and derive availability from it. Aggregate reservation dashboard counts together instead of scanning active reservations separately for each metric. Keep parameterized queries, response shapes, ordering, and expiry semantics. Use query plans to decide whether an index helps; do not add speculative indexes or edit existing migrations.

Consolidate repeated search escaping or validation only where the change reduces code while preserving behavior. This is secondary to the database changes; no broad component or action rewrite is intended.

## Validation

Use a disposable local Postgres instance and a minimal test-only Neon Auth user table. Run the actual repository migrations and existing reservation checks there. Add focused regression cases for competing reservations and copy reductions/deletion, covering both lock acquisition orders. Verify book and dashboard results for no reservations, live and expired holds, picked-up and returned loans, and deleted books. Compare representative query plans and timings; local measurements are not production latency claims.

Run existing environment/CSV tests and lint. Retry build only if Google Fonts access is available. Do not use production database credentials or mutate production data. Report unverified Neon HTTP transport/auth behavior separately from PostgreSQL SQL validation. Do not claim zero bugs or production latency improvements without evidence.

## Boundaries

No UI redesign, auth replacement, dependency upgrades, deployment, or production migrations. Any new index requires evidence and a new additive migration. If local database tooling cannot be installed with verification intact, record the blocker rather than weakening concurrency validation.

This design awaits user approval before implementation.
