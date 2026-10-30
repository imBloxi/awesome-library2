# Bindery: a living redesign of the Library

Status (30 October 2026). Shipped: tokens, Literata, motion levels, living covers, shared-element morphs, page turns, spine shelf and list view, My library slips and stamps, 404, and the ctOS account zone. Not built yet: site-wide dark mode, the reserve stamp and availability ticks on the book page, rolling numbers, the Babel endless shelf and invent-a-book ceremony, reader ribbon and lamplight theme switch, admin counters. Scope change: accounts, sign-in and legal pages are ctOS-branded; the library keeps the Bindery design.

## 1. The idea in one paragraph

The interface is made from the same materials as the books it lends: book cloth, board, gilt foil, paper slips and rubber stamps. Every element moves the way its material would. A cover tilts and hinges open, a spine slides off the shelf, a reservation lands as a date stamp, a hold is wrapped in a paper band, a count rolls like the bands on a date stamper. Motion is how the library explains what just happened; it never competes with reading.

This builds on what already makes the app different: the CSS-drawn clothbound covers (`src/components/book-cover.js`) and the Babel reader. Those become the centre of the design instead of a detail inside a plain white table.

### What "every element is alive" means here

Taken literally (everything moving all the time) it would hurt the app: people come here to search, scan and read, admins process queues, and constant motion causes vestibular problems for some users. So the rule is:

- **Every element has a defined motion behaviour** tied to its material and its job (section 4).
- **Almost all motion answers something the user did** or a state that changed: hover, press, navigate, reserve, return, load.
- **Ambient motion exists in exactly one place**: the Babel shelf (section 6.5). That is the signature moment.
- **Intensity depends on context** (section 4.3): expressive on Babel, lively on the catalogue, calm in admin, still while reading text.

## 2. Current state (what we're redesigning)

- Next 16.4.3, React 19.3, Tailwind 4, `cacheComponents: true`, server components almost everywhere. Client islands: `reader-frame.js`, `reserve-box.js`, `action-button.js`, `search-form.js`.
- Visual language: white, system sans, `#1f4fd1` blue accent, 8px buttons, bordered tables. Only motion: skeleton shimmer, a 0.5px cover lift on hover, a fade on removed rows.
- The covers already have cloth weave, groove, foil border and page block, with a stable colour per book id.
- No dark mode outside the reader. No webfonts. No images.
- Screenshots in `docs/screenshots/home-*`, `book-*`, `search-*` still show the retired 1997 theme.

## 3. Foundations

### 3.1 Colour

The palette is taken from the cover cloths and foil that already exist, so the chrome and the books share one material set. It replaces the generic blue accent.

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#F2F3EF` (cool archival paper) | `#13161D` | page background |
| `board` | `#FFFFFF` | `#1B1F28` | raised surfaces: panels, slips, menus |
| `ink` | `#1B1F2A` (iron-gall blue-black) | `#E8E5DC` | text, primary actions |
| `ink-soft` | `#5A6070` | `#A3A8B5` | secondary text |
| `rule` | `#DADDD6` | `#2C313C` | dividers, field borders |
| `cloth` | `#243C54` (navy binding) | `#7FA3C7` | links, selected state, primary brand |
| `gilt` | `#B08A3E` (decorative) / `#7A5A1C` (text) | `#D6B46A` | focus ring, top picks, foil highlights |
| `stamp` | `#B42318` | `#F0705F` | overdue, errors, destructive |
| `moss` | `#1F6B45` | `#5CC08A` | available, success |

Rules:
- Gilt is the only "precious" colour. It is used for focus, top picks and the moment of success. Never for body text below 18px in light mode (use `#7A5A1C` there for 4.5:1).
- Book cloth colours (`TONES` in `book-cover.js`) stay as they are, so every book keeps its identity.
- Site-wide dark mode ("night stacks") via `prefers-color-scheme` plus a manual toggle, using the same `data-theme` pattern the reader already has.

Before coding, check every text pair against WCAG AA in both themes and record the ratios in `docs/design-system.md`.

### 3.2 Type

- **Literata** (variable: `opsz` 7 to 72, `wght` 200 to 900), self-hosted through `next/font/google` with `subsets: ['latin', 'latin-ext']`. It was designed for long-form e-reading, which suits a library, and latin-ext covers names like "Rūta" that Babel already generates (and Latvian, if the library ever localises).
  - Display: titles at high `opsz` with tight tracking.
  - Book content: Babel reader body, back covers, descriptions.
  - Covers: replaces the Georgia fallback on cover titles.
- **System UI sans** stays for interface text, labels, tables and forms. That keeps the "costs nothing to load" principle for everything except one font file.
- Figures: tabular lining numerals for dates, counts and due dates (`font-variant-numeric: tabular-nums`).
- Scale (1.25 ratio, 16px base): 12.8 / 14 / 16 / 20 / 25 / 31 / 39 / 49.
- **Type as motion.** Literata's axes animate. Headings settle from `wght 350, opsz 72` to `wght 520` as they enter (like ink soaking into paper). This is cheap, needs no layout change, and is unique to a variable serif.

Tradeoff: one woff2 file of roughly 60 to 90 KB (subset, variable) is added to a site that loads zero fonts today. `next/font` self-hosts it with `font-display: swap` and a size-adjusted fallback, so there is no layout shift and no third-party request.

Dropped from the current UI: all-caps tracked eyebrows (`.eyebrow`). Section labels become sentence case in `ink-soft`, or are removed where the heading already says it.

### 3.3 Shape and depth

Radius encodes what kind of object something is, instead of one radius on everything:

| Object | Radius | Depth |
|---|---|---|
| Book (cover, spine) | 2px / 3px (already) | real shadow, 3 layers |
| Paper slip (notice, hold band, due card, toast) | 0 with one torn/perforated edge (CSS mask) | 1 soft shadow |
| Control (button, field, chip) | 6px | none; inset on press |
| Panel (reader page, admin card) | 4px | hairline + faint shadow |

### 3.4 Motion tokens

Defined once in `globals.css`:

```css
:root {
  --dur-tap: 90ms;      /* press feedback */
  --dur-quick: 160ms;   /* hover, small state */
  --dur-settle: 260ms;  /* panels, chips, list moves */
  --dur-travel: 420ms;  /* page and shared-element moves */
  --dur-ceremony: 700ms;/* stamp, invent-a-book; max 1 per action */
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-in: cubic-bezier(.55, 0, 1, .45);
  --ease-spring: linear(0, .38 9%, .88 19%, 1.06 27%, 1.03 35%, .99 46%, 1);
  --ease-thunk: linear(0, .9 40%, 1.04 55%, .98 70%, 1); /* stamp landing */
}
```

Rules:
- Animate only `transform`, `opacity`, `filter`, `clip-path` and font axes. Never width, height, top or left (except `interpolate-size` on disclosures, which the browser handles).
- Exits are faster than entrances (`--dur-quick` out, `--dur-settle` in), as in the Next view-transitions guide.
- One `--dur-ceremony` animation per user action at most.

### 3.5 Motion preference: Full, Calm, Off

A small control in the footer (and in the reader's Appearance panel) sets `data-motion` on `<html>`:

- **Full**: everything in this spec.
- **Calm**: feedback only (press, state change, page direction as a crossfade). No tilt, no decode, no ambient shelf. Default for admin routes.
- **Off**: no animation. Default when `prefers-reduced-motion: reduce` is set.

Stored in `localStorage` like the reader prefs, read in an inline script before paint to avoid a flash. The normalising function lives in `src/lib/motion-prefs.mjs` with a unit test, following `reader-state.mjs`.

## 4. Motion grammar

### 4.1 Every element, its material and its verb

| Element | Material | Motion | Trigger | Reduced/Off |
|---|---|---|---|---|
| Book cover | cloth board | tilts toward pointer (max 6°), foil catches light (gradient follows pointer) | hover / pointer move | static |
| Book cover to detail | same object | shared-element morph from shelf or row to the detail hero | navigate | instant |
| Book spine (shelf view) | spine on shelf | slides out 12px and rotates 2° on hover; neighbours lean | hover / focus | outline only |
| Spine to cover | same object | spine rotates 90° on Y into the cover, then morphs to detail | click | instant |
| Search field | card-catalogue drawer | drawer face lifts on focus; results "flip" in like index cards (staggered 30ms, max 8) | focus / results change | instant |
| Filter chips | paper tabs | slide into place; active chip gets a gilt underline that travels between chips | toggle | instant |
| Result count | date-stamp bands | digits roll to the new number | results change | swap |
| Result rows | index cards | reorder with list view transitions; removed rows slide out left | sort / filter | instant |
| Availability | page block | one tick per copy; reserving removes a tick with a small drop | reserve / return | number only |
| Reserve button | rubber stamp | press dips the button (`--dur-tap`); success lands a "Reserved, pick up by 6 Nov" stamp with `--ease-thunk` and a faint ink spread | submit success | stamp appears, no motion |
| Waitlist position | queue ticket | ticket prints out from below; number rolls when it changes | join / update | static |
| Save for later | ribbon bookmark | ribbon drops down from the cover's top edge | toggle | static |
| Notices | slip tucked in a book | slides out from behind the header line, settles with a spring | page load with notices | static |
| Toast / action messages | paper slip | slides up from the button, auto-tucks after 4s | action result | static, stays |
| Hold (My library) | hold band | paper band with member name and date wraps the cover; on pickup it tears away | load / pickup | static |
| Loan due card | date-due slip in pocket | slip peeks from the cover pocket; overdue slips get a red stamp | load | static |
| Return | book leaves shelf | cover slides off the shelf right, shelf closes the gap | return success | removed |
| Nav badge (My library) | punched card count | count rolls; pulses once when it increases | change | number only |
| Header nav | spines | the current section's spine is pulled out from the logo stack | navigate | static marker |
| Disclosures (`details`) | flap | open with `interpolate-size` + `::details-content` height transition | toggle | instant |
| Skeletons | page edges | thin lines that riffle like a fanned page block (replaces shimmer) | loading | static lines |
| Suspense reveals | page | skeleton exits down fast, content enters up (Next guide pattern) | data arrives | instant |
| Page navigation | page turn | forward slides left, back slides right, with `transitionTypes` | navigate | crossfade (Calm) / none |
| Pagination | page edge | next page curls from the right edge (clip-path) | click | instant |
| Focus ring | gilt foil line | draws around the element in `--dur-quick` | keyboard focus | appears instantly |
| Buttons | board | press scales to .97 and darkens; release springs back | press | colour only |
| Headings | ink | variable-font settle (`wght`, `opsz`) on enter | route enter | final weight |
| Admin counters | date-stamp bands | roll on change | data change | swap |
| Admin rows | ledger lines | processed row slides out, the rest close the gap | action success | removed |
| Babel titles | Borges' 25 symbols | random characters resolve into the title | hover / invent | final text |
| Reader chapters | page | chapter turn left/right (keys and links) | navigate | none |
| Reader theme switch | lamplight | new theme spreads as a circle from the Appearance button | change theme | instant |
| Reader progress | ribbon | ribbon bookmark moves down the margin as you scroll (scroll-driven, no JS) | scroll | hidden |
| 404 | fallen book | one book lies on its side on an empty shelf; tilts upright on hover | hover | static |
| Empty states | bookends | an empty shelf with bookends; the leaning book straightens on hover | hover | static |

### 4.2 Navigation direction map

`transitionTypes` on `<Link>` (Next 16.2+, verified in `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`):

- `nav-forward`: catalogue to book, book to edition, edition to chapter, next chapter, admin list to detail.
- `nav-back`: every "Back to catalog" or breadcrumb, previous chapter.
- No type (crossfade or nothing): header nav between top-level sections, pagination (has its own curl), filter changes (rows animate instead).

### 4.3 Intensity map

| Area | Default level | Why |
|---|---|---|
| Babel shelf, invent a book | Full + ambient | playful, exploratory, the signature |
| Catalogue, book detail | Full | browsing benefits from object continuity |
| My library | Full, ceremony on success only | feedback matters, nothing ambient |
| Admin | Calm | staff do repetitive work; motion must never slow a queue |
| Reader text | Still | reading; only chapter turns and the ribbon move |

## 5. Technical approach

No animation library. Everything is native platform features plus small client islands.

1. **CSS** for hover, press, focus, disclosures (`interpolate-size: allow-keywords`, `::details-content`), entrances of popovers and slips (`@starting-style`), the reader ribbon (`animation-timeline: scroll()`), and the stamp (`@keyframes`).
2. **React `<ViewTransition>`** (React 19.3, no config needed per `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) for:
   - shared-element morphs (`name={`book-${id}`}` with `share="morph" default="none"`),
   - Suspense reveals (`exit="slide-down"` on fallbacks, `enter="slide-up"` on content),
   - directional page turns (`enter`/`exit` maps keyed by `nav-forward` / `nav-back`),
   - list reorder and removal (named rows inside a transition: filter submit, `useOptimistic` actions).
3. **Client islands** (all small, all optional):
   - `PointerTilt`: one delegated `pointermove` listener on the document that writes `--tilt-x`, `--tilt-y`, `--glint` to the hovered `.book-cover`. One listener for the whole page, `requestAnimationFrame` throttled, disabled for `pointer: coarse` and Calm/Off.
   - `RollingNumber`: renders digits as stacked columns and translates them. Server-renders the final number, so it works without JS.
   - `DecodeText`: Babel character resolve. Server-renders the real title; the effect is `aria-hidden` and the real text is always in the accessibility tree.
   - `MotionPreference`: the footer control.

Constraints and how they're handled:

- **Duplicate view-transition names.** A book can be in top picks and in the table on the same page; duplicate names break the transition. Fix: the page computes which ids already have a named instance and passes `vtName={null}` to later duplicates. Covered by a pure helper with a unit test.
- **Morph needs the destination in the same commit.** The Next guide says the morph only plays if the destination renders without suspending (prefetched or cached). `getBookDetails` is already cached and the reserve box is the only live part, so the cover should be in the prerendered shell. Verify in phase 1; if it fails, the cover falls back to its enter animation, which is acceptable.
- **Name budget.** 20 rows per page (`PAGE_SIZE`), 6 top picks, 6 related books. Name only visible, clickable covers; at most about 32 named elements per page.
- **Browser support.** Chromium 125+ gets everything. Safari and Firefox get partial or no view transitions; the app works the same, just without the animation. No polyfill.
- **Server-first stays.** No page becomes a client component. Islands receive plain props.
- **Performance budget.** Added JS under 12 KB gzipped total. CLS stays 0. INP under 200ms on a mid-range phone. Font file under 90 KB. Checked with a production build and Lighthouse on home, book, My library and a Babel chapter.

## 6. Screens

### 6.1 Global frame

```
+--------------------------------------------------------------+
| [|||] Library        Catalogue  Babel   My library (2)  Admin |  <- logo is 3 spines; current section's spine is pulled out
+--------------------------------------------------------------+
|                                                              |
|  page content (max 72rem, left aligned)                      |
|                                                              |
+--------------------------------------------------------------+
| Holds last 7 days. Up to 10 books at a time.   Motion: Full v  Theme: Auto v |
+--------------------------------------------------------------+
```

Left aligned throughout. Centred only for the reader column and the Babel title page.

### 6.2 Catalogue (home)

The top picks become an actual shelf, which is the first thing you see. Search sits above it as a card-catalogue drawer.

```
Find a book
+--[ drawer ]-----------------------------------------------+
| Search by title, author or ISBN                    [Find] |
| (Available now) (1900 to 1950) (Genre v) (Sort v)          |  <- chips; gilt underline travels
+-----------------------------------------------------------+

This week's top books, picked by our librarians
  _______ _______ _______ _______ _______ _______
 |cover  |cover  |cover  |cover  |cover  |cover  |    <- tilt on hover, morph on click
 |_______|_______|_______|_______|_______|_______|
=================================================== shelf edge (shadow)

All books   248 results             [Shelf | List]
 ||| |  || ||| | ||  |||  | || ||| |  ||  ||| |      <- Shelf view: spines, varied heights
=================================================== 
   or
 [c] The Bridge Memory     Leo Tolstoy   1907   ▮▮ 2 of 2   <- List view: index-card rows
```

- **Shelf view** is the default for unfiltered browsing; **List view** is the default for search results (scanning). Chosen via `?view=shelf|list` in the URL, parsed in `src/lib/search-params.mjs` (extend its tests), so it works without JS and survives Back.
- Spine height and thickness come from a hash of the book id (stable per book, like cloth colour). Title runs vertically in Literata; author at the foot.
- Mobile: shelf wraps into rows of spines; list rows fold author and year under the title (as now).

### 6.3 Book detail

```
<- Back to catalogue

 +---------+    The Harbor Garden                 (heading settles in)
 |  cover  |    by Chimamanda Ngozi Adichie
 |  (lg)   |
 |  tilts  |    [ ▮▮▮▯ 3 of 4 on the shelf ]
 +---------+    [ Reserve this book ]  [ribbon] Save for later
                 -> on success:  ╔ RESERVED  pick up by 6 Nov ╗ (stamp)

 About this book .................................
 Read the Babel back cover  (+)   <- flap opens with height transition
 Read a Babel Edition  [Start reading] [Roll an edition]

 More by this author   [cover][cover][cover]...  (shelf)
```

The cover morphs in from wherever it was clicked. The detail list (`dl`) becomes a library catalogue card: ruled lines, a punched hole at the top left, call-number style.

### 6.4 My library

Each section is a shelf with its own physical treatment:

```
My library                         4 of 10 in use  (rolling)

 Ready for pickup
  [cover w/ hold band: "Held for you until Thu 5 Nov"]  [Cancel]

 On your bookshelf
  [cover w/ due slip peeking: "Due 27 Nov"]   [Renew 4 weeks] [Return]
  [cover w/ due slip + red OVERDUE stamp]

 Waiting for
  ticket  #3 of 5   The Salt Summer          [Leave]

 Saved for later
  [cover w/ ribbon]  ...

 Reservation history (+)
```

- Return: the cover slides off the shelf right, the shelf closes the gap, the "in use" count rolls down.
- Pickup (admin-side) tears the band; members see the band gone next visit.
- Notices are slips that slide out from under the page title.

### 6.5 Babel (the signature)

The one place with ambient motion.

```
The Babel shelf
Every number is a book that doesn't exist.

 ~ |xq.lv| |t,mz | |aobr | |p .k| |...  ~   <- endless shelf drifting slowly left;
 ~ |     | |     | |     | |    | |     ~      spine titles in Borges' 25 symbols

        [ Invent a book ]
```

- Spines drift slowly (one full cycle per 90s). Hovering or focusing a spine pauses the shelf and its gibberish title resolves into the real invented title (`DecodeText`).
- **Invent a book** is the ceremony: the shelf speeds up briefly, one spine is pulled out, rotates to its cover, the title resolves, and it morphs into the edition page. About 900ms in Full; a plain navigation in Calm/Off.
- Pauses automatically when off-screen (`IntersectionObserver`) and when the tab is hidden.
- Built with CSS `@keyframes` on a duplicated track (no JS for the drift).

### 6.6 Reader

The reader stays still while you read. Motion lives only at the edges:

- Chapter turns slide left/right with `nav-forward` / `nav-back`, including the existing arrow-key navigation (`router.push` inside `startTransition` with `addTransitionType`).
- A ribbon bookmark in the margin tracks position in the chapter via `animation-timeline: scroll()`. No JS.
- Theme change (light, sepia, dark) spreads as a circle from the Appearance button using a view transition with `clip-path`.
- The Appearance panel opens as a flap (`@starting-style`).

### 6.7 Admin (Calm by default)

- Overview counters use `RollingNumber`; overdue and expiring counts get the stamp colour, no pulsing.
- Processing a row (pickup, return, extend, cancel) slides it out and closes the gap; the counter rolls.
- Tables stay dense. No tilt, no shelf view, no decode. Admins can switch to Full in the footer if they want.

### 6.8 Auth, 404, empty states

- Sign in / register: the form is a library card being filled in; the submit stamps "Member" on success before redirecting (Full only).
- 404: an empty shelf with one fallen book; hover sets it upright. Copy: "This page isn't on the shelf. Search the catalogue or go back."
- Empty shelves use bookends and say what to do next (existing copy is good; keep it).

## 7. Accessibility

- All motion respects `prefers-reduced-motion` (forces Off) and the footer preference.
- `::view-transition-*` animations are disabled under Off with one global rule.
- Decorative layers (bands, slips, stamps, ribbons, tilt glints) are `aria-hidden`. The meaning always exists as text: "Held until 5 Nov", "Overdue since 20 Oct".
- Status changes keep `role="status"` / `role="alert"`; motion never replaces them.
- Focus is never moved by an animation. Focus ring stays visible during view transitions.
- Spine view: every spine is a real link with the full title as its accessible name; the shelf is a list.
- Touch targets stay at least 44px. Tilt is disabled on coarse pointers.
- Nothing flashes more than 3 times per second. No parallax on scroll.

## 8. Delivery plan

Each phase ships on its own, keeps all existing tests green, and updates `docs/design-system.md`. Read the relevant guide in `node_modules/next/dist/docs/` before each phase (per `AGENTS.md`).

### Phase 0: Foundations (about 2 days)
- Tokens in `globals.css` (`@theme`): colour light/dark, radius by object, motion tokens.
- Literata through `next/font` in `src/app/layout.js` with CSS variable; type scale.
- Site-wide dark mode and the theme toggle.
- `src/lib/motion-prefs.mjs` + test; `MotionPreference` footer island; pre-paint inline script.
- Global view-transition CSS recipes (`slide-up`, `slide-down`, `nav-forward`, `nav-back`, `morph`) and the global Off rule.
- Restyle `.btn`, `.field`, `.link`, `.card`, `.data-table`, focus ring. Remove all-caps eyebrows.
- **Done when:** every page renders in the new palette in both themes, contrast ratios are recorded, Off mode produces zero animations (checked with Playwright and `prefers-reduced-motion`).

### Phase 1: The book as an object (about 2 days)
- `BookCover` v2: pointer tilt and glint (`PointerTilt`), `spine` variant, `vtName` prop.
- Shared-element morph: shelf/table/related to detail; dedupe helper + test.
- `transitionTypes` on catalogue, book, back links; directional page turns.
- Suspense reveals on book detail and catalogue.
- **Done when:** clicking a cover in Chromium morphs it into the detail hero (prefetched case), Back reverses it, Safari degrades to normal navigation, no duplicate-name console errors.

### Phase 2: Catalogue (about 3 days)
- Card-catalogue search drawer and filter chips with travelling underline.
- Shelf view (spines) and List view, `?view=` param + tests in `scripts/test-search.mjs`.
- Result count `RollingNumber`; row reorder and exit transitions on filter/sort.
- Page-edge pagination curl. Riffle skeletons replace shimmer.
- **Done when:** 390 / 768 / 1280px have no horizontal overflow, shelf view is keyboard navigable, filters still work with JS disabled.

### Phase 3: Circulation feedback (about 3 days)
- Reserve stamp, availability ticks, waitlist ticket, save ribbon in `reserve-box.js`.
- `ActionButton` press, success slip, row exit via view transitions (replaces `data-fade`).
- My library: hold bands, due slips, overdue stamp, return slide-off, rolling "in use" count, notice slips.
- Header badge roll.
- **Done when:** optimistic updates still roll back cleanly on server refusal (existing tests in `scripts/test-reserve.mjs`, `test-waitlist.mjs` pass), and the animation rolls back too.

### Phase 4: Babel and the reader (about 3 days)
- Babel endless shelf, `DecodeText`, invent-a-book ceremony.
- Reader: chapter turns (links and arrow keys), scroll ribbon, lamplight theme switch, Appearance flap, motion option in the panel.
- Offline download HTML (`src/lib/babel-book/html.mjs`) gets the new typography only, still no scripts (the existing `test-reader-html.mjs` guards this).
- **Done when:** the shelf pauses off-screen and on hover/focus, reading a chapter has no motion besides the ribbon, decode never hides the real title from screen readers.

### Phase 5: Admin desk (about 2 days)
- Calm default on `/admin/*`. Rolling counters. Row exits on circulation actions. Ledger styling for tables.
- **Done when:** processing 10 desk actions in a row has no animation that delays the next click (each under `--dur-settle`).

### Phase 6: Polish and proof (about 2 days)
- 404, empty states, auth card.
- Lighthouse and Playwright pass at 390 / 768 / 1280, light/dark, Full/Calm/Off.
- Replace the stale screenshots in `docs/screenshots/`; update `docs/design-system.md`, `docs/user-guide.md` (motion setting), `docs/changelog.md`.

Total: roughly 17 working days for one developer. Phases 1 and 2 give the biggest visible change; if time is short, ship 0 to 3 and treat Babel and admin as follow-ups.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Morph doesn't play on non-prefetched detail pages | lose the hero moment on cold clicks | cover in the cached shell; enter animation as fallback |
| Too much motion in practice | app feels slow or busy | intensity map, Calm default for admin, durations capped, review each phase with motion on and off |
| Webfont adds weight | slower first paint on slow connections | one variable file, subset, swap with size-adjusted fallback, preload |
| Safari/Firefox view-transition gaps | uneven experience | progressive enhancement; nothing depends on the animation |
| Shelf view hides information (year, availability) | worse scanning | shelf for browsing, list for search; availability shown on hover/focus and in the accessible name |
| Pointer tilt costs CPU on long pages | jank | one delegated listener, rAF throttle, only the hovered cover updates |

## 10. Open questions

1. Is adding one webfont (Literata) acceptable, given the current "system fonts only" principle? The plan depends on it for display type and variable-axis motion. Fallback if not: keep Georgia for covers and drop the weight-settle effect.
2. Should Shelf view be the default for unfiltered browsing, or should List stay the default everywhere with Shelf as an option?
