# Design system

Two worlds share one app:

- **Bindery** (the library: catalogue, books, Babel, My library, admin). The interface is made from the same materials as the books: cloth, board, gilt foil, paper slips and rubber stamps. Every element moves the way its material would.
- **ctOS** (accounts: sign-in, register, account console, legal pages). A cold, observant system laid over the library, with its own type, colour and motion.

Each lives in its own route group with its own layout: `src/app/(library)` and `src/app/(ctos)`. ctOS styles load only on ctOS routes. The full plan is in [`superpowers/specs/2026-10-30-bindery-redesign-design.md`](superpowers/specs/2026-10-30-bindery-redesign-design.md).

> Screenshots: `bindery-shelf.png`, `bindery-babel-shelf.png`, `bindery-404.png` and `ctos-register-desktop.png` show the current design. Older full-page screenshots in `docs/screenshots/` show earlier themes.

## Bindery tokens (`@theme` in `src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `paper` | `#f2f3ef` | page background |
| `board` | `#ffffff` | raised surfaces: drawer, panels, slips |
| `ink` | `#1b1f2a` | text |
| `muted` | `#5a6070` | secondary text (5.5:1 on paper) |
| `line` / `subtle` | `#dadcd5` / `#e8eae4` | rules, hover, empty states |
| `cloth` (`accent`) | `#243c54` | primary buttons, links, selected states |
| `gilt` / `gilt-ink` | `#b08a3e` / `#7a5a1c` | decoration (ribbon, top picks) / gilt text |
| `ok` / `bad` / `warn` | `#1f6b45` / `#b42318` / `#8a5a00` | available / overdue, errors / expiring |
| `--focus-ring` | `#8c6a28` | focus outline (3:1+ on paper and board) |
| `font-serif` | Literata (variable, `opsz` axis, latin + latin-ext) via `next/font` | headings, covers, spines, reader |
| `font-sans` | system UI stack | interface text |

Radius follows the object: books 2 to 3px, controls 6px, panels 4px, slips square with a coloured edge.

## Motion

Tokens in `:root`: `--dur-tap` 90ms, `--dur-quick` 160ms, `--dur-settle` 260ms, `--dur-travel` 420ms, `--dur-ceremony` 700ms; `--ease-out`, `--ease-in`, `--ease-spring`, `--ease-thunk` (stamps).

Levels, written to `<html data-fx>` by `src/lib/motion-prefs.mjs` (pre-paint script) and `MotionController`:

| Level | What moves |
|---|---|
| `full` | everything below |
| `calm` | feedback only: no tilt, no leaning spines, pages cross-fade instead of sliding. Default on `/admin` |
| `off` | nothing. Default when the system asks for reduced motion |

The footer **Motion** switch stores `auto` / `full` / `calm` / `off` in `localStorage` (`library:motion`). Under `off` all duration tokens become 0 and view-transition animations are disabled.

| Element | Motion |
|---|---|
| Cover | tilts toward the pointer and its foil catches the light (`PointerTilt`, one delegated listener); lifts on hover |
| Cover or spine to book page | shared-element morph (`<ViewTransition name="book-{id}" share="morph">`). Names are deduplicated per page by `transitionNames()` |
| Page navigation | `nav-forward` slides left, `nav-back` slides right (`PageTurn` in each page, `transitionTypes` on links); the header stays anchored |
| Header | gilt bookmark ribbon under the current section, moved by a shared view-transition name |
| Spine shelf | pulled spine rises, neighbours lean, the catalogue card appears under the shelf |
| Headings | variable-weight "ink settle" on enter |
| Search drawer | lifts while focused; old results dim while new ones load |
| Notices | slips slide out from under the title |
| Overdue | stamp lands with `--ease-thunk` |
| Reserve | copy blocks grey out as you reserve; a "Reserved" date stamp lands |
| Babel endless shelf | spines drift (90s loop, Full only), pause on hover or focus; titles decode from Borges' 25 symbols (`src/lib/babel-shelf.mjs`, `BabelDrift`) |
| Saved books | ribbon drops from the cover |
| Skeletons | fanned page edges that riffle |
| Disclosures | open to auto height (`interpolate-size`, `::details-content`) where supported |
| Reader | full-page chapter links keep fresh loan checks and turn with cross-document view transitions |

Browsers without view transitions navigate normally; nothing depends on an animation.

## Component classes (Bindery)

| Class | Use |
|---|---|
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm` | buttons and button-like links (press scales to 0.97) |
| `.field` | inputs (16px text so phones don't zoom) |
| `.link` | inline text links |
| `.card`, `.data-table` | admin panels and record tables |
| `.page-heading`, `.section-heading`, `.eyebrow` | Literata headings; sentence-case labels |
| `.badge` + `-gilt` / `-ready` / `-loan` / `-done` / `-late` | status labels |
| `.slip` + `-ok` / `-warn` / `-bad` | notices |
| `.hold-band`, `.due-slip`, `.overdue-stamp`, `.queue-ticket` | circulation details |
| `.catalog-drawer`, `.filter-chip`, `.view-toggle` | catalogue search |
| `.cover-shelf`, `.cover-stand`, `.spine-shelf`, `.book-spine`, `.catalog-card` | books |

## React components

`PageTitle`, `Skeleton`, `Availability`, `TopPickBadge`, `StatusBadge`, `Pagination` in `ui.js`. `BookCover` (`sm` / `md` / `lg`, optional `vtName`) and `BookSpine` in `book-cover.js`; colour and spine size from `src/lib/book-shape.mjs`. `BookTable`, `CoverShelf`, `SpineShelf` in `book-table.js`. `PageTurn`, `RevealSuspense`, `FORWARD`, `BACK` in `page-turn.js`. `MotionController`, `MotionSwitch`, `PointerTilt` in `motion.js`. `LibraryFrame` in `library-chrome.js`; `NavLink` in `nav.js`.

## ctOS (`src/app/(ctos)/ctos.css`)

Graphite `#0c1213` to `#152022`, one signal colour lime `#c7ef6b`, alert `#ff7a66`, dim text `#93a69d` (7:1). IBM Plex Mono (self-hosted, ctOS routes only) for labels and readouts; system sans, heavy and tight, for titles.

- Panels are framed targets with lime corner ticks. Readouts (`.ctos-readout`) are key/value lines that resolve one after another.
- Fields get targeting brackets that close in on focus. Buttons are clipped plates; a lime bar runs along a working button; a denied request flinches once.
- One boot sequence types in on the gate pages. A faint scan line drifts down the screen in Full motion only.
- Everything shown is real: the observation panel reads the browser live and marks what the session stores; the subject file is built from the database, the session and the current request. Nothing is invented.

## Accessibility

Skip link on both layouts, visible focus rings (gilt, lime in ctOS), real labels, table headers with `scope`, decorative covers, spines, slips and stamps `aria-hidden` with their meaning in text, `role="status"` / `role="alert"` on action messages, 44px targets in the reader and ctOS, motion levels as above. Checked with Playwright at 390 and 1280px: no horizontal overflow.

## Babel reading surface

The reader uses a restrained paper surface and a Literata text column up to 37rem wide. Reader colours are scoped through `--reader-*` tokens for paper, sepia and dark. Saved preferences never inject arbitrary token values. Chapter links are full page loads so every chapter rechecks the loan.
