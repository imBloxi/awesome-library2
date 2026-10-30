# Responsive library, member and admin upgrades, Babel Editions

Constraints from the user: no email, no API keys, no new external services. Everything below runs on what exists today: Next 16 (cacheComponents), Neon Postgres, Neon Auth, server actions, pure `.mjs` modules tested with `node --test`.

## Phase 0: Measure first

- `pnpm install`, then read the Next 16 docs in `node_modules/next/dist/docs/` for `"use cache"`, `cacheTag`, `updateTag`, `refresh` and `useOptimistic` (see `AGENTS.md`).
- Record before numbers: catalog load, book page load, reserve click to confirmation, admin overview. Use the existing Playwright setup. Re-measure after each phase and log results in `docs/superpowers/2026-10-29-validation.md`.

## Phase 1: Responsiveness

1. **Optimistic actions.** `ActionButton` gets an optional optimistic mode with `useOptimistic`: reserve, cancel, return, mark picked up and admin return update the button and counts on click, then roll back with the server's error if refused. The server stays the source of truth.
2. **Cache book details, keep availability live.** Split `getBook` into a cached `getBookDetails(id)` (`"use cache"`, `cacheTag("book:" + id)`) and a tiny uncached `getAvailability(id)` streamed in its own `<Suspense>`. Admin create, update, delete and restore call `updateTag`. The Babel back cover is a pure function of cached data, so it rides along. "More by" gets `cacheTag("author:" + author)`.
3. **Search as you type.** Client wrapper on `SearchForm`: 250ms debounce, `router.replace` inside `startTransition`, old results stay visible with a subtle pending style. Plain GET form keeps working without JavaScript.
4. **Relevance ranking.** When `q` is set, order by `similarity(...) desc, title`, using the same expression as `books_search_trgm`. Test in `test:search-db`.
5. **Instant navigation feel.** Route-level `loading.js` for book, reservations and admin pages that matches the real layout, so prefetched shells appear immediately.
6. **"Available now" filter.** Only rework the per-row count if Phase 0 shows it is slow. At ~200 books it is not.

## Phase 2: Fix known issues (from `docs/changelog.md`)

- Show which top picks are hidden, not just how many.
- Send the shown `top_pick_at` with the edit form so a stale form can't restart a pick.
- Clear `top_pick_at` on delete.
- Use `TOP_PICK_DAYS` in the form label.

## Phase 3: Babel Editions (locally generated e-books)

A readable, coherent, randomly generated imagined edition of any book. It's deterministic per (book, edition number), so links are shareable and pages are cacheable. There are no network calls, keys or database writes.

### Why not Markov chains or the current template approach alone

Markov text loses coherence within a sentence or two. The back-cover generator works because it is 3 paragraphs. Coherence over chapters needs a story plan and state, with templates only for the final wording.

### Generator pipeline (`src/lib/babel-book/*.mjs`, pure, tested)

1. **Seed:** reuse the FNV + mixer from `babel.mjs` on title, description, book id and edition number. Move the PRNG into a shared `babel-random.mjs`.
2. **Story bible:** theme from the existing `BABEL_THEMES` scoring, so the e-book matches the back cover's lens. Cast of 3 to 5 characters, each with a name, role, want, flaw and pronouns. Names come first from proper nouns in the description, then from per-theme name banks. Also generate a setting (places), a central object or secret, and a tone.
3. **Plot skeleton:** pick one of several structures (quest, mystery, homecoming, rivalry, inquiry for instructional books) mapped onto 8 to 12 chapters with beats: setup, inciting event, threshold, complications, midpoint reversal, crisis, resolution or open ending.
4. **Scene planner:** each chapter gets 3 to 5 scenes (arrival, conversation, discovery, conflict, reflection, journey). Each scene type has preconditions and effects on a world state: who is where, who knows what, who holds the object, relationship scores.
5. **Realizer:** a Tracery-style grammar fills slots from state (`{hero}`, `{place}`, `{object}`, pronouns, callbacks like "the letter found at {place}"). Dialogue is drawn from each character's want and flaw. A no-repeat memory blocks reuse of a phrase within the same chapter.
6. **Output:** `{ title, edition, chapters: [{ title, paragraphs[] }] }`. Target 8k to 12k words, generated in well under 50ms.

The main effort is writing good phrase banks per theme, the same way the back-cover copy was reviewed for quality. Expect consistent and readable, somewhat formulaic prose. Quality grows with bank size.

### Pages

- `/books/[id]/read?edition=N&ch=K`: chapter page, cached (pure function of cached book data). It has a table of contents, previous and next links, and an "Imagined edition, not the real book" notice.
- "Read a Babel Edition" button on the book page, and a "Roll another edition" link that picks a random edition number client-side.
- Reader settings (font size, serif or sans, light or dark) and last-read position live in `localStorage`, with try/catch so it works when storage is blocked.
- `/books/[id]/read/download?edition=N`: a single self-contained `.html` file to read offline. EPUB comes later if wanted.
- **Random book:** `/babel/random` invents a whole book (title, author, CSS cover via `BookCover`, back cover from the story bible, full text). This uses the same generator with title and author generators added.

### Rules

- Original text only. Real names are reused only when they come from the catalog description, and nothing quotes the real book.
- React escaping and Unicode handling as in `babel.mjs`.

### Tests (`scripts/test-babel-book.mjs`, added to `test:env`)

- The same seed always produces identical output, and different editions produce different output.
- Every name used was introduced in the bible, and state invariants hold (an object is never held by two characters).
- No phrase repeats within a chapter. Word count stays in range. Generation time stays under budget.
- Unusual metadata is handled: empty or placeholder descriptions, very long titles, non-Latin scripts, instructional books.

## Phase 4: Member features (in-app only, no email)

1. **Waitlist** when no copy is free. New `waitlist` table. Join and leave on the book page, with your position shown. When a copy returns, cancels or a hold lapses, the next person gets a hold in the same transaction. Lapsed holds also promote through the existing cron job. Same advisory-lock and concurrency tests as `reserve-sql.mjs`.
2. **In-app notices** instead of email: a header badge and a banner on `/reservations` for "your hold is ready", "pick up by tomorrow" and "loan overdue", computed from existing data.
3. **Renew** a loan once, only if nobody is waiting.
4. **Wishlist** ("Save for later") with a list on `/reservations`.
5. **Catalog:** sort (title, newest, year, relevance), a genre column plus filter (migration and an admin form field), and "readers also borrowed" from reservation co-occurrence.

## Phase 5: Admin features

1. **Desk mode** `/admin/desk`: one search box for an ISBN, title or member. It shows the member's holds and loans with check-out and check-in buttons (reusing `markPickedUp` and `returnBook`) and is keyboard-first for barcode scanners that type ISBNs.
2. **CSV import** for books, the mirror of the existing export. Preview, validation errors per row, ISBN de-duplication, one transaction.
3. **Audit log**: an `admin_events` table written by every admin action, and an `/admin/activity` page.
4. **Member detail page**: history, active items, waitlists, role.
5. **Stats page**: most borrowed, never borrowed, loans per week (CSS bars, no chart library), plus waitlist demand by book to guide buying more copies.
6. **Babel preview**: admins can open any edition from the book edit page.

## Order and rationale

Phase 0 → 1 → 2 → 3 → 4.1 to 4.2 → 5.1 → the rest.

Phase 1 is what users feel on every click. Phase 2 is cheap and already diagnosed. Phase 3 is the headline feature and touches no reservation logic. The waitlist and desk mode are the most useful functional upgrades but carry the most concurrency risk, so they come after the safer wins.

Each phase ships as its own commit series with tests and a changelog entry.
