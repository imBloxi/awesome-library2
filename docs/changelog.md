# Changelog

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
| `/admin/reservations` can fail with *"could not determine data type of parameter $2"* (seen in production before the redesign) | Some admin reservation filters error | Cast the status parameter in `listAllReservations` (`$n::text`) and add a DB test |
| Admin sees how many top picks are hidden, not which ones | Admin can't tell which picks are off the home page | Return pick ids in order and mark the ones after the 6th |
| `/admin/users?page=<huge>` returns a 500 | Junk URL only | Use `parseSearchParams` there too |
| A stale edit form can restart an expired top pick | A pick can run 7 more days unintentionally | Send the shown `top_pick_at` with the form |
| Restoring a deleted book within 7 days revives its pick | Surprise top pick | Clear `top_pick_at` on delete |
| "7 days" is hard-coded in the book form label | Label goes wrong if `TOP_PICK_DAYS` changes | Use the constant |
