# Design system

Plain white and quiet: the books are the focus. System fonts only and no images, so the UI costs nothing extra to load.

> Older full-page screenshots in `docs/screenshots/` show the earlier 1997 theme. The `hardcover-*` screenshots show a standalone cover fixture. The `reader-*` screenshots show the current production-build Babel reader at mobile and desktop widths.

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

`PageTitle`, `Skeleton`, `Availability` (`short` variant), `TopPickBadge`, `StatusBadge`, `Pagination` in `ui.js`. `BookCover` (`sm` / `md` / `lg`, cloth colour from the book id) in `book-cover.js`. `BookTable` and `CoverShelf` in `book-table.js`. `SearchForm`, `CatalogFilters`, `ActionButton`.

### Hardcover treatment

Book covers use a cloth-like CSS weave, a shaded binding groove, an inset foil border and an ivory page block with a thin back board. Titles and authors use local Georgia/Times serif fonts; the rest of the interface retains the system sans-serif stack. Palette and cover identity stay stable per book id.

Shelf and detail covers retain the 2:3 aspect ratio and their existing responsive widths. Compact table covers remain 36 × 48 px, with an initial and the same binding treatment. Cover text is clamped inside the board, while the real title and author remain accessible beside/below it. Covers remain decorative (`aria-hidden`). No image requests, downloaded fonts, added animation or client JavaScript are needed.

Verified the rendered component in Chromium at 390, 768 and 1200 px, including long titles, unbroken words and Unicode. Preview fixture labels use the same truncation behavior as the shelf; browser validation does not exercise Neon authentication or live database pages. Lint, the 29 existing unit tests and production build pass.

## Accessibility

Skip link, a 2px accent focus ring, real labels, table headers with `scope`, decorative covers `aria-hidden`, `role="status"`/`role="alert"` on action messages, reduced-motion support.

## Babel reading surface

The reader uses a restrained paper surface and a serif text column up to 37rem wide. The title page combines the existing CSS hardcover, byline, reading estimate and a visible original-story notice. Appearance and contents use native disclosures; chapter links and text remain server-rendered and usable without JavaScript.

Reader colors are scoped through `--reader-*` tokens for paper, sepia and dark. Theme hover selectors override the global button hover rules; focus uses a theme-specific outline. Controls target at least 44px, and the reader inherits `overflow-wrap: anywhere` for unusual titles and names. Saved preferences never inject arbitrary token values.

The chapter position is a position in the book, not a claim about how much text has been read. Progress is stored at chapter granularity on this device. The offline HTML follows the same typography and navigation conventions with no client scripts or network resources.
