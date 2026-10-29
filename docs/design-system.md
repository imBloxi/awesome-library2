# Design system

Plain white and quiet: the books are the focus. System fonts only and no images, so the UI costs nothing extra to load.

> Screenshots in `docs/screenshots/` show the earlier 1997 theme and need re-taking.

## Tokens (`@theme` in `src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `ink` | `#111111` | text, primary buttons |
| `muted` | `#6b6b6b` | secondary text |
| `line` | `#e8e8e8` | borders, dividers |
| `subtle` | `#f7f7f7` | hover, empty states, skeletons |
| `accent` | `#1f4fd1` | links, focus ring, "Top pick" badge |
| `ok` / `bad` | `#15803d` / `#b42318` | available / errors |
| `font-sans` | system UI stack | everything |

## Component classes

| Class | Use |
|---|---|
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm` | buttons and button-like links |
| `.field` | inputs (16px text so phones don't zoom) |
| `.link` | inline text links (global `a` has no underline) |
| `.card` | bordered rounded panel (admin tiles) |
| `.data-table` | lists of records |
| `.eyebrow` | small uppercase label |
| `.loading-bar` | skeleton shimmer, off with reduced motion |

## React components

`PageTitle`, `Skeleton`, `Availability` (`short` variant), `TopPickBadge`, `StatusBadge`, `Pagination` in `ui.js`. `BookCover` (`sm` / `md` / `lg`, pastel colour from the book id) in `book-cover.js`. `BookTable` and `CoverShelf` in `book-table.js`. `SearchForm`, `CatalogFilters`, `ActionButton`.

## Accessibility

Skip link, a 2px accent focus ring, real labels, table headers with `scope`, decorative covers `aria-hidden`, `role="status"`/`role="alert"` on action messages, reduced-motion support.
