# Changelog

## 2026-10-29: Admin circulation desk

- Overview now leads with overdue loans and holds expiring within 24 hours, ordered by urgency and deadline. Count tiles open the matching circulation filters.
- Reservations adds attention/expiring filters, priority/newest sorting, exact member filters, and 20-row pagination that preserves filters.
- Pickup and loan deadlines display exact UTC times. Overdue badges, filters and counts share the same 28-day rule, including loans less than one day overdue.
- Member active counts open that person's reservation list, including useful context and a clear-filter link when there are no results.
- Reservation CSV copy now discloses the existing 50,000-record limit.
- New PostgreSQL regressions cover deadline boundaries, text/UUID member IDs, literal searches and older history; URL and date formatting checks run with the unit suite.

## 2026-10-29: Clean white redesign

- Replaced the 1997 theme with a plain white design: system sans-serif, thin grey dividers, a dark primary button and a single blue accent.
- Flat pastel book covers; clean table for results; cover grids for top picks and "More by this author".
- Book page: details as a definition list, a clear reserve call-to-action, "← Back to catalog".
- "Top pick" pill instead of the blinking NEW!; shimmer skeletons instead of the progress dialog; simple 404.
- Screenshots in `docs/screenshots/` still show the old theme.

## 2026-10-29: 1997 redesign and catalogue UX

- **New look:** a Windows 95 window on a teal desktop.
  - Title bar, toolbar buttons and bevelled controls.
  - Times New Roman text with classic link colours.
  - A status-bar footer.
  - System fonts only; the Geist web-font download is gone.
- **Catalogue:**
  - Results in a table with CSS-drawn book covers.
  - Author names link to a search by that author.
  - Top picks shown as a cover shelf; filters grouped in "Narrow your search".
  - Clearer empty states.
- **Book page:**
  - Large cover, "Library card" details table and a reserve box with clear next steps.
  - **More by this author** shelf, streamed separately so it never slows the page (new index: `003_books_author.sql`).
- **Fixed:** filter inputs kept stale values after "Clear all filters" or the Back button.
- **Accessibility:** skip link, dotted focus outlines, reduced-motion support for blinking and animations, `role="alert"` and `role="status"` on action messages.
- Retro 404 dialog.
- Full documentation in `docs/`.

## 2026-10-29: Top picks and catalogue filters (PR #6)

- **This week's top books:**
  - Admins tick "Top pick this week"; the book shows for 7 days, newest 6 first.
  - It appears only on the plain first page of the catalogue.
  - Migration `002_top_pick.sql`.
- **Filters:** on the shelf now, published year range. Pagination keeps filters.
- **Robust URL handling:** junk parameters are ignored, reversed year ranges are swapped, and huge page numbers are clamped (they used to cause a 500).
- Search SQL moved into tested pure modules (`search-sql.mjs`, `search-params.mjs`). New `pnpm test:search-db`.

## Earlier

- Admin: users and roles, cancel or extend holds, overdue loans, restore books, CSV export.
- Migrations applied during the Vercel build.
- Initial app: catalogue, reservations, admin.

## Known issues

| Issue | Impact | Fix |
|---|---|---|
| Admin sees how many top picks are hidden, not which ones | Admin can't tell which picks are off the home page | Return pick ids in order and mark the ones after the 6th |
| A stale edit form can restart an expired top pick | A pick can run 7 more days unintentionally | Send the shown `top_pick_at` with the form |
| Restoring a deleted book within 7 days revives its pick | Surprise top pick | Clear `top_pick_at` on delete |
| "7 days" is hard-coded in the book form label | Label goes wrong if `TOP_PICK_DAYS` changes | Use the constant |
