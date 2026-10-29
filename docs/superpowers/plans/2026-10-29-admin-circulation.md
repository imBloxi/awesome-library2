# Admin Circulation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the query work and delegate the independent UI task. Steps use checkbox syntax for tracking.

**Goal:** Give library staff an accurate, navigable circulation work queue.

**Architecture:** Keep server components and actions. Extract reservation list SQL into a pure builder and share overdue/expiry expressions with dashboard aggregation. Add a paged query alongside the compatible array API.

**Tech Stack:** Next.js 16.4.3, React 19, Tailwind 4, Neon/PostgreSQL, node:test; no dependency changes.

**Spec:** `docs/superpowers/specs/2026-10-29-admin-circulation-design.md`

## Global constraints

- Use the existing cloud checkout on `work`; user explicitly authorized implementation and publishing to `main`.
- Keep all privileged route/action checks and book/hold locking rules.
- No production database access, dependency changes, or migrations.
- UTC deadlines; 28-day lending period; 20 rows per reservation page.

## Review focus

- Member IDs may be UUIDs or text; malformed filters cannot produce database cast errors.
- A loan overdue by less than one day must appear overdue everywhere.
- Lapsed holds are expired before cron and never appear in live urgent queues.
- Equal timestamps must not duplicate/omit rows between unchanged-data pages.
- Filtering a zero-result member must keep the member context and a way back.

### Task 1: Reservation query and URL contract

**Files:** Create `src/lib/reservation-params.mjs`, `src/lib/queries/reservation-sql.mjs`, `scripts/test-admin-reservations.mjs`, `scripts/test-reservation-params.mjs`; modify `src/lib/queries/reservations.js`, `src/lib/queries/books.js`, `package.json`.

**Interfaces:**
- `parseReservationParams(sp) -> {q, status, sort, userId, page}` and `reservationParams(options) -> URL params object` without page. URL key `user`; `sort` is `priority` or `newest`.
- Member-state contract: `userId: null` means absent; `userId: ""` means invalid supplied input and must return no rows. Preserve invalid state in forms/links until the member filter is explicitly cleared.
- Statuses: active, attention, expiring, reserved, picked_up, overdue, returned, cancelled, expired, all.
- `listReservationPage(options) -> {rows, hasNext}`; 20 rows, one extra fetched.
- `listAllReservations({status,q,bookId,userId,sort,limit,offset}) -> rows`; default ordering stays newest for existing callers.
- Rows keep current fields and add `user_id`, `due_at`, `is_overdue`. `getReservationMember(userId) -> {id,name,email} | null`.
- Shared SQL exports `DISPLAY_STATUS_SQL`, `IS_OVERDUE_SQL`, `IS_EXPIRING_SQL`, using reservation alias `r`.

- [x] Write real database and URL regression tests; observe new behavior fail before implementation.
- [x] Implement parameter normalization, query builder, paged wrapper, exact member lookup, and shared count predicates.
- [x] Run query/URL suites and existing database regression suites; inspect results.

### Task 2: Circulation screens (independent UI task)

**Files:** Modify `src/app/admin/page.js`, `src/app/admin/reservations/page.js`, `src/app/admin/users/page.js`, `src/components/admin-reservation-list.js`; optionally create `src/lib/circulation-format.mjs` with focused formatting tests.

**Consumes:** Task 1's exact interfaces. Calls `requireAdmin()` before any data lookup; uses UTC timestamps.

- [x] Build the dashboard attention queue, correct filter links, reservation filters/sorting/pagination, member drill-through/context, and date labels.
- [x] Verify actual component rendering at mobile/desktop sizes, filter preservation, empty states, and sub-day overdue badge. No tests that grep source or merely mirror markup.
- [x] Update `docs/admin-guide.md` for the final behavior and truthful CSV limit.

### Task 3: Integrate, review, and publish

- [x] Run unit tests, all disposable PostgreSQL suites, lint, production build, and `git diff --check`.
- [x] Obtain an independent review of the full change; fix material findings with regressions.
- [ ] Record validation here, commit using the public noreply identity, fetch latest main, and push the tested fast-forward result to `main`.
- [ ] Verify the remote SHA. Check deployment status if available; distinguish a verified push from an unverified Vercel rollout.

## Validation record

- Initial admin regression run: 7 expected failures demonstrated missing urgent filters, ignored exact member filters, reverse deadline ordering and absent pagination/member-context APIs. Implemented behavior passes all 11 database tests, including strict clock boundaries, UUID member columns and invalid filters.
- Final unit suite: 43/43 passing. Existing database suites: 20/20 book and hold tests, 11/11 search tests, all 5 reserve-concurrency scenarios passing on a disposable PostgreSQL 17 instance. All suites were rerun after the review fix.
- Full ESLint and production build pass. The build generated all 15 route shells; optional migrations were skipped because this environment has no production database URL. No migrations are introduced by this change.
- Actual source components rendered with SWC/React and fresh Tailwind CSS: six page/empty states at 390px and 1200px pass Chromium checks without horizontal overflow or page errors. Checks cover links/form state, exact member context, UTC timestamps, sub-day overdue badges and available actions. These fixtures exercise UI rendering; live Neon Auth was not available.
- Independent whole-change review found one material issue: invalid/repeated member parameters discarded the selected-member filter. URL and real PostgreSQL regressions reproduced the broadening before the fix; both now pass. Invalid state remains empty, visible and clearable through forms and links. The six prior UI cases and a new invalid-member case were rendered and checked again at both widths.
- The reviewer found no other material issues. Live Auth, actual Vercel rollout and production-scale query timings were not independently verified; permission/audit/catalog changes remain outside this release.
- Priority ties use the oldest reservation then ID; newest sorting uses descending reservation time then ID. This keeps unchanged-data pages deterministic.
- Work takes place in the existing managed cloud checkout on `work`; no additional worktree or dependencies were needed. The user explicitly approved the proposed scope and deployment, so execution continued without another approval checkpoint.
- Publication evidence is reported in the task response after the push; the remote SHA and Vercel outcome cannot be recorded in the commit before it is published.
