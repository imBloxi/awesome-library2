# Reader Quality Implementation Plan

> **For agentic workers:** Execute focused tasks under the approved creative-freedom scope; delegate independent generator and presentation work. Track checks here.

**Goal:** Make Babel Editions coherent to read and comfortable to navigate.

**Architecture:** Retain server-generated chapters and route wrappers. Strengthen the generator's planned events, extract pure reader-state validation, and refine the existing reader components/CSS and offline file.

**Tech Stack:** Next.js 16.4.3, React 19, Tailwind 4, local ESM generators, node:test, Chromium. No new dependencies or database changes.

**Spec:** `docs/superpowers/specs/2026-10-30-reader-quality-design.md`

## Global constraints

- Base is `b09b14d`; preserve all latest upstream behavior outside the reader/generator.
- Local deterministic original stories, ten chapters, current route formats and HTML download API.
- No API keys, network generation, migrations or dependency changes.
- Scope and implementation choices are delegated by the user's creative freedom; continue without new approval checkpoints.

## Review focus

- Stored reading positions must belong to the correct book and edition.
- A keyboard user operating reader controls must not accidentally change chapters.
- Stolen objects, undiscovered objects and unresolved secrets must not appear in incompatible scenes.
- Long Unicode titles and invalid metadata stay bounded and render without broken characters or overflow.
- Dark/sepia hover, focus, empty storage and offline viewing remain usable.

### Task 1: Causal prose and copy quality

**Files:** `src/lib/babel-book/index.mjs`, `beats.mjs`, `worlds.mjs`, optional focused editorial module; `scripts/test-babel-book.mjs`.

**Interface:** Preserve `generateEdition`, `inventBook`, `buildBible`, `chooseWorld`, `extractNames`, `titleCase` and existing edition/chapter fields. Additional bible slots may be introduced together with their defaults; existing forced bibles/structure/ending tests remain usable.

- [x] Reproduce missing causal beats, pre-discovery references, post-theft possession and grammar failures with focused regressions.
- [x] Keep mandatory beats, condition texture on stage, pair secrets with factual resolutions, and correct grammatical slots and bounded Unicode handling.
- [x] Sample complete editions across worlds and structures; run the generator and unit suites.

### Task 2: Reader state and interactions

**Files:** Create `src/lib/reader-state.mjs`, `scripts/test-reader-state.mjs`; modify `src/components/reader-frame.js`, `package.json`.

**Interface:** Existing ReaderFrame props stay valid. Add `basePath` and `chapterCount` for validated resume; optional `label` for toolbar context. Export `ReaderResume({bookKey,basePath,chapterCount})` from reader-frame for an edition-local Continue button. Existing `ContinueReading({bookKey})` remains for book-detail callers. Shared `readingMinutes(words)` from reader-state returns bounded positive integer minutes at 220 words/minute.

- [x] Test normalization of malformed preferences, canonical book-scoped chapter URLs, resume bounds and keyboard exclusions before implementation.
- [x] Implement safe preferences/progress storage and nonintrusive shortcuts; compact native appearance disclosure with clearly labeled controls.
- [x] Verify real client behavior after reload, navigation and corrupt/blocked storage.

### Task 3: Reader presentation and offline format

**Files:** `src/components/babel-edition.js`, reader-only block of `src/app/globals.css`, `src/lib/babel-book/html.mjs`, `src/lib/babel-book/sources.js`; optional book reader entry panel in `src/app/books/[id]/page.js`.

**Consumes:** ReaderFrame `basePath`, `chapterCount`, optional `label`; ReaderResume and `readingMinutes` from Task 2. No generator shape changes required.

- [x] Refine title page, contents, chapter header/menu, progress and next/previous chapter labels. Show original-edition notice before reading; include covers for catalog and invented books.
- [x] Add responsive book typography and accessible theme-specific hover/focus states without changing other site surfaces.
- [x] Bring offline HTML navigation/typography in line, preserving escaped no-script output.
- [x] Capture actual pages and verify mobile/desktop/themes/zoom/downloads.

### Task 4: Validate and publish

- [x] Run full unit suite, lint, production build and whitespace checks; confirm no generator code enters client chunks.
- [x] Obtain independent whole-change review, fix material issues with regressions, and update user/changelog documentation.
- [ ] Commit, reconcile latest main, publish to the authorized branch, verify remote SHA, and report deployment verification limits honestly.

## Validation and review record

- Pulled latest main `b09b14d` with a clean fast-forward before editing. Initial unit baseline: 62/62 passing.
- Final full unit suite: 81/81 passing, including 23 generator tests, five reader-state tests and three offline-format tests. Regression cases were observed failing before their implementation.
- Generator coverage includes 81 world/structure/ending combinations, 100 invented grammar samples, 60 location/homecoming samples and plural-dialogue sampling. Existing determinism, variety, word count, escaping and speed checks remain passing. Complete editions were read by the implementer and an independent reviewer.
- Independent whole-change review found no Critical or Important issues. Two remaining plural-agreement issues in crossing/dialogue were reproduced in a new failing test, fixed with the existing agreement slots, and verified with the full green suite.
- Full lint, production build and whitespace checks pass. The final build generates all route shells without a production database URL; no migrations or dependencies are added. Client chunks do not contain the generator's distinctive prose/resolutions, and client imports reach only the small state/limits modules.
- Actual Next production-build Babel routes passed Chromium checks at 320, 390, 768 and 1280px with all themes. Additional checks covered all 36 theme/font/size combinations at narrow/wide widths, 200% text scaling, long title/byline stress, hover/muted contrast, touch targets, focused-control shortcuts, chapter navigation, reload/resume, chapter 10, corrupt/blocked localStorage and JavaScript-disabled chapter text/links. Final primary browser checks were rerun on the rebuilt final source.
- The offline route returned an attachment containing safe, self-contained HTML with a named contents landmark and all ten return links. Mobile/desktop previews are saved as `docs/screenshots/reader-mobile.png` and `reader-desktop.png`.
- Browser runs used a local HTTPS signed-out Auth fixture with an explicitly trusted temporary certificate; they did not exercise real Neon Auth or catalog database queries. Both route families share the tested reader components, and catalog source cover wiring was reviewed statically.
- The first baseline build reused stale local CSS artifacts. A clean rebuild restored the reader stylesheet; only fresh final-build screenshots are published. No stale baseline comparison is claimed.
- Original fiction still shares template scenes across editions; metadata extraction is deliberately conservative. Current editions remain deterministic within a generator version. No claim is made that arbitrary descriptions are fully adapted.
- Publication evidence and the remote SHA are reported in the task response after pushing; they cannot be recorded in a commit before it is published.
