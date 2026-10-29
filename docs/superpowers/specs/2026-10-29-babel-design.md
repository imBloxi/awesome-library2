# Babel passages

Generate strange, readable prose from each book's title. The user chose readable prose over original-style random characters. The alternative of remote AI generation adds credentials, cost, latency and nondeterminism; use a small local generator instead.

Add a collapsed "Open a Babel page" section below the existing book details. Opening it reveals a short passage and a note that it is invented text inspired by the book, not an excerpt. The same normalized title and book id always produce the same passage. Render the passage on the server with native HTML details/summary: no client bundle, external calls, database writes or extra packages.

Keep generation bounded to a few short paragraphs. Handle empty, long and Unicode titles; React escapes all output. Test repeatability, different titles, Unicode, bounds, and absence of external effects. Existing reservation controls and descriptions stay intact.

The user requested more logical prose, then flagged that the three fixed plots repeated across books. Build each narrative from compatible parts: a stable reader and source, an artifact with a matching purpose/action/result, an obstacle with its solution, and a mystery with its confirmation/resolution. Vary sentence structures and investigations as well as those narrative facts. Use the full title as a book, rather than sampling isolated title words. Keep one understandable magical premise per story.

Seed from the normalized title plus optional book id so duplicate-title editions can differ. The book-page caller supplies its id. Preserve repeatability, safe Unicode bounds and the local generator architecture. Verify variety with a catalog-sized sample after removing title/reader substitutions; do not count renamed characters as different plots.

This small feature is separate from the database optimization. Approved in chat and implemented; see the implementation plan and validation report.
