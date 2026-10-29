# Admin circulation desk

The user approved the proposed circulation improvements and explicitly requested implementation and deployment to `main` on 2026-10-29.

## Intent and scope

Help staff find the next pickup or return that needs attention, reach older reservations, and open a member's exact reservation list. Keep the current Next.js/React/Tailwind stack, server authorization, and reservation mutation rules.

The approved approach extends the existing screens and SQL. A dashboard-only polish would leave older reservations unreachable; a new admin application would add unnecessary complexity. Permission revocation, audit history, catalog controls, and changing lending policy are separate work.

## Behavior

- Overview leads with a **Needs attention** queue: overdue loans first, then live holds expiring within 24 hours. Each group uses its earliest deadline first. Dashboard count links open the corresponding exact filter.
- Reservations adds **Needs attention** and **Expiring within 24h** filters, priority/newest sorting, and ordinary pagination with 20 rows. Preserve search, status, sort, and exact member filters in links and form submissions. Reset to page one when filters change. Use deterministic ID tie breakers.
- Active lists default to priority; completed/history lists default to newest. Priority means overdue first, expiring holds second, then other deadlines. Existing overview/book/export array queries remain compatible.
- Show pickup deadlines and borrowed-book due dates with an explicit UTC time zone. Use one SQL overdue definition for dashboard counts, filtering, ordering, and badges: a loan is overdue strictly after pickup plus 28 days. Do not wait for the next rounded day to display the warning.
- Member active counts link to `status=active&user=<exact user ID>`. Display member context, preserve it while filtering/paging, and offer a clear-member link. Invalid/missing members return an empty result or clear not-found context; malformed IDs never cause UUID casts to fail.
- Existing actions remain server-authorized and retain their concurrency protections. No new dependencies, schema changes, external services, or production credentials are needed.
- The existing CSV export is not expanded in this release. Accurately disclose its 50,000-row limit instead of claiming it includes everything.

## Verification

Exercise actual SQL on disposable PostgreSQL: urgent boundaries, derived expiry before cron, deterministic pagination beyond 200 rows, literal search, exact member matching, every status, invalid inputs, and existing mutation races. Unit-test URL normalization/serialization. Render the actual changed components at mobile and desktop widths and inspect form/link state, deadlines, empty states, and actions. Run the repository unit/database suites, lint, and production build. Review the full diff before pushing a fast-forward update to `main`.
