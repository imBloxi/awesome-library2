# Babel passages

Generate strange, readable prose from each book's title. The user chose readable prose over original-style random characters. The alternative of remote AI generation adds credentials, cost, latency and nondeterminism; use a small local generator instead.

Add a collapsed "Open a Babel page" section below the existing book details. Opening it reveals a short passage and a note that it is invented text inspired by the title, not an excerpt from the book. The same normalized title always produces the same passage; title words appear among surreal sentences selected by a seeded generator. Render the passage on the server with native HTML details/summary: no client bundle, external calls, database writes or extra packages.

Keep generation bounded to a few short paragraphs. Handle empty, long and Unicode titles; React escapes all output. Test repeatability, different titles, Unicode, bounds, and absence of external effects. Existing reservation controls and descriptions stay intact.

This small feature is separate from the approved database optimization. It awaits design approval before product code changes.
