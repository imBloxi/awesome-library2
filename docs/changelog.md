# Changelog

## 2026-10-30: Bindery redesign and ctOS accounts

**Library (Bindery)**
- New design built from book materials: paper, navy cloth actions, gilt focus and top picks, stamp red for overdue. Literata (variable serif, self-hosted) for titles, covers and reading; system sans for interface text.
- The catalogue browses as spines on shelves (pull one out to read its catalogue card), with a list view for searches. Top picks stand on a shelf.
- Covers lean toward the pointer and catch the light; clicking one carries it into the book page (view transitions). Pages slide forward and back; the header ribbon follows the current section; content rises in as it loads.
- My library: covers on every row, hold bands, date-due slips, an overdue stamp, a capacity meter and notice slips. Locked editions show the book's stamped date-due slip.
- Footer motion setting: Auto, Full, Calm or Off. Admin pages are calm by default.
- Book page: one small block per copy; reserving greys one out at once and lands a "Reserved, pick up by …" stamp.
- Babel: an endless shelf of invented books drifts past, spines written in Borges' 25 symbols. Point at or Tab to a spine and its real title resolves; the shelf pauses while you read. It stands still (and scrolls by hand) unless motion is Full.

**ctOS (accounts)**
- Sign-in, registration, the account console and the legal pages run in ctOS, a separate dark interface with its own mono type.
- Registration requires accepting the new Terms of service and Privacy policy (checked on the server).
- The account console opens with a subject file built only from real records: account details, this request's address and device, the full circulation record (including records hidden from My library), reservation patterns, and staff actions on the account. Sessions list the address recorded at sign-in.
- Sign-in and register pages show what the browser reveals and which items are stored.

## 2026-10-30: Better Babel writing and reading

- Mandatory discoveries, injuries, revelations and recoveries now stay in order. Supporting scenes respect the current location and whether the object has been discovered or stolen.
- Added 36 factual mystery resolutions, improved articles/plural agreement, varied compatible atmosphere, initial-name extraction and safe Unicode clipping.
- Reworked the reader with a book-jacket title page, reading estimates, upfront original-story notice, compact appearance/contents controls, chapter-position indicator and title-aware navigation.
- Resume links now work on catalog and invented edition contents. Saved settings and chapter URLs are validated; shortcuts no longer hijack reader controls or selected text.
- Paper, sepia and dark themes have readable hover/focus states and larger touch targets. Offline files include a named contents navigation and return links without adding scripts or network requests.

## 2026-10-30: Instant UI, Babel Editions, waitlists and admin tools

**Faster**
- Search updates as you type and keeps the old results (dimmed) until the new ones arrive. Typing never loses focus; Back and "Clear filters" still reset the inputs.
- Searches put the best matches first: exact title, then titles that start with the words, then the closest title or author.
- Reserve, cancel, return, renew and the admin circulation buttons respond the moment you click. If the server refuses, the button rolls back and says why.
- Book pages are prerendered and cached per book. Only the reserve box (availability, your hold or queue place) is fetched live. Admin edits clear the cache immediately.

**Babel Editions** (no AI service, no keys)
- Every book can be read as an imagined "Babel Edition": ten short chapters, about 2,500 words, written by the library's own story generator. Each edition number is a different story; the same number always reads the same.
- Reader with contents, chapter pages, ←/→ keys, text size, serif/sans and light/sepia/dark, remembered on your device, plus "Continue reading" and an offline HTML download.
- `/babel` invents entire books (title, author, cover, back cover and text) from a number.

**Members**
- Waitlist when every copy is out. When a copy comes back (return, cancelled hold, extra copies, or a lapsed hold), the next person in line gets a normal 7-day hold.
- Renew a loan once for another 4 weeks, unless it's overdue or someone is waiting.
- Save books for later; genres and a genre filter; sort by best match, title, newest or year; "Readers also borrowed".
- In-app notices instead of email: a badge on **My reservations** and banners for books ready to collect, holds ending within 24 hours, overdue loans and waitlist holds.

**Admins**
- **Desk**: one box for a scanned ISBN, a title, a name or an email, with pickup/return buttons right there.
- **Import CSV** for books, with a preview and per-line errors. The books export (now with genre and description) imports as-is.
- **Activity** log of every admin action; **member pages** with active items, waitlists and history; **Stats** for loans per week, most borrowed, never borrowed and waitlist demand.
- Top picks: the Books page names the hidden picks; a stale edit form can't restart an expired pick; deleting a book clears its pick; the form label follows `TOP_PICK_DAYS`.

**Fixed**
- Returning a book failed in Postgres with "could not determine data type of parameter $2", for members and admins. Covered by a regression test now.

**Database**: migration `004_waitlist_wishlist_genres.sql` (waitlist, wishlist, admin_events, `reservations.from_waitlist` and `renewals`, `books.genre`, indexes, and a re-created `active_reservations` view).

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
| A copy freed only by a lapsed hold reaches the waitlist at the next reserve attempt, return or cancellation for that book, or the daily job | A queued member can wait up to a day for a lapsed copy | Run promotion from a more frequent job if that matters |
| The cached "Top pick" badge on a book page can outlast the 7 days by up to an hour | Cosmetic | Shorter cache life on book details |
| Babel Editions are template-based | Prose is consistent but can feel formulaic across many editions | Grow the phrase banks in `src/lib/babel-book/` |
