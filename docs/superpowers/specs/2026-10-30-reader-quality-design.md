# Babel reading quality and interface

The user asked to pull the latest branch and improve the Read book feature and UI, granting creative freedom. Work starts from latest `main`, `b09b14d`. Design choices below are implementation decisions under that authorization; no new service, key, dependency or database change is needed.

## Direction

Improve the existing deterministic Babel Editions rather than replacing the reading feature. Keep the ten-chapter format, shareable routes, local generation, offline HTML and familiar light/sepia/dark settings. A visual-only polish would leave broken story events; introducing an external writing service conflicts with the existing local feature. The chosen direction improves both causal storytelling and the reading experience.

## Story quality

- Core events must always appear in order. Do not randomly delete the discovery, injury, reveal or confrontation.
- Supporting scenes respect discovery, possession, location and aftermath. The hero discovers the object, loses it once, and explicitly recovers it before the ending.
- Secrets have an actual factual payoff, paired with their question, that stays consistent through revelation and confrontation.
- Fix object plurality, indefinite articles, sensory phrase framing and season titles. Keep weather and time-of-day detail within compatible scenes.
- Preserve useful metadata names without pretending arbitrary descriptions can be fully adapted. Descriptions guide an original imagined story; the reader must see that distinction before starting.
- Keep the existing output shape, edition variety, bounded metadata, escaping and speed. Different deployment versions may improve prose at the same route; generation within a version remains deterministic.

## Reading experience

- Give the title page a book-jacket composition, clear Start/Continue action, reading time, compact contents, and an upfront original-edition note.
- Use a restrained paper surface and a comfortable text column. On chapters, offer a compact contents menu and progress, with previous/next chapter context at the end.
- Collapse appearance controls behind a clearly labeled native disclosure. Keep controls at least 44px tall and theme-specific hover/focus contrast. All three themes work with both fonts and every size at narrow widths and zoom.
- Validate stored preferences and saved positions. Resume only canonical chapter URLs belonging to the supplied book/edition, not arbitrary local URLs. Keep blocked or corrupt storage nonfatal.
- Resume is available from both catalog and invented contents pages. Persist chapter position and show completion accurately; do not claim unimplemented paragraph-level progress.
- Chapter arrow shortcuts work on the reading surface, but do not hijack controls, edited text, selection, modifiers, composition or events already handled by another control. Prevent default only when navigating.
- Keep all text server-rendered and the generator out of the browser bundle. Reading and ordinary chapter links remain usable without JavaScript.
- Offline HTML retains safe escaping and no scripts/network requests, while matching the reader's typography and adding explicit contents navigation.

## Verification

Capture current actual database-free Babel routes before editing. Add focused failing regressions for causal events/grammar and storage/shortcut behavior, then implement. Sample complete stories across worlds, structures and endings; inspect text rather than relying only on word counts. Test the actual Next reader in Chromium at mobile/desktop widths, every appearance mode, keyboard use, reload/resume, damaged/blocked storage, chapter boundaries and downloaded HTML. Run units, lint and build; obtain independent review before publishing. Preserve unrelated upstream admin, waitlist, catalog and database changes.
