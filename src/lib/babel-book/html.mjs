// A single self-contained HTML file of one edition, for reading offline.
// Every piece of text is escaped; the file has no scripts and no external requests.

import { readingMinutes } from "../reader-state.mjs";

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function editionToHtml({ edition, byline = "", backCover = [] }) {
  const editionNumber = escape(edition.edition);
  const chapters = edition.chapters
    .map((c, i) => `<section id="ch${i + 1}" aria-labelledby="chapter-${i + 1}-title">
<h2 id="chapter-${i + 1}-title"><small>Chapter ${i + 1} of ${edition.chapters.length}</small>${escape(c.title)}</h2>
${c.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("\n")}
<a class="back-to-contents" href="#contents">Back to contents ↑</a>
</section>`)
    .join("\n");
  const contents = edition.chapters.map((c, i) => `<li><a href="#ch${i + 1}"><span>${i + 1}</span>${escape(c.title)}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(edition.title)} (Babel Edition No. ${editionNumber})</title>
<style>
:root { color-scheme: light dark; --bg: #fbf9f4; --ink: #29251f; --muted: #70675b; --line: #ded8cc; --hover: #eee9dd; --focus: #65533b; }
@media (prefers-color-scheme: dark) { :root { --bg: #1d1c19; --ink: #eee9df; --muted: #b5ab9b; --line: #484237; --hover: #302c25; --focus: #e7c98c; } }
* { box-sizing: border-box; }
html { scroll-padding-top: 2rem; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1.125rem/1.8 Georgia, "Iowan Old Style", "Times New Roman", serif; }
main { max-width: 41rem; margin: 0 auto; padding: clamp(2rem, 8vw, 5rem) clamp(1.25rem, 5vw, 2.5rem) 5rem; overflow-wrap: anywhere; }
header { text-align: center; margin-bottom: 2.5rem; }
h1 { font-size: clamp(2rem, 7vw, 3rem); font-weight: 500; line-height: 1.15; letter-spacing: -0.035em; margin: 0.6rem 0 1rem; text-wrap: balance; }
h2 { margin: 0 0 2rem; font-size: clamp(1.7rem, 5vw, 2.2rem); font-weight: 500; line-height: 1.25; }
h2 small { display: block; color: var(--muted); margin-bottom: 0.75rem; font: 0.75rem/1.5 system-ui, sans-serif; letter-spacing: 0.1em; text-transform: uppercase; }
.meta, .note, .back-to-contents { color: var(--muted); font: 0.875rem/1.6 system-ui, sans-serif; }
.eyebrow { letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.7rem; }
.dedication { font-style: italic; margin-top: 1.5rem; color: var(--muted); }
.note { padding: 1rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.note strong { color: var(--ink); font-weight: 600; }
blockquote { margin: 2rem 0; padding-left: 1.25rem; border-left: 2px solid var(--line); }
nav { margin: 2.5rem 0 4rem; }
nav h2 { margin-bottom: 0.5rem; }
ol { list-style: none; margin: 0; padding: 0; }
ol a { display: flex; align-items: center; gap: 1rem; min-height: 44px; padding: 0.65rem 0.5rem; border-bottom: 1px solid var(--line); line-height: 1.5; text-decoration: none; }
ol a span { color: var(--muted); font: 0.75rem/1.5 system-ui, sans-serif; min-width: 1.25rem; font-variant-numeric: tabular-nums; }
ol a:hover, .back-to-contents:hover { background: var(--hover); color: var(--ink); }
section { border-top: 1px solid var(--line); padding-top: 3rem; margin-top: 3rem; }
p { margin: 0 0 1.1em; }
section p + p { text-indent: 1.5em; }
a { color: inherit; }
a:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; border-radius: 2px; }
.back-to-contents { display: inline-flex; align-items: center; min-height: 44px; margin-top: 1.25rem; padding: 0.5rem; }
.end { margin: 3rem 0; text-align: center; font-style: italic; }
@media print { :root { --bg: #fff; --ink: #222; --muted: #555; } main { max-width: none; padding: 0; } section { break-before: page; } a { text-decoration: none; } .back-to-contents { display: none; } }
</style>
</head>
<body>
<main>
<header>
<p class="meta eyebrow">Babel Edition No. ${editionNumber}</p>
<h1>${escape(edition.title)}</h1>
${byline ? `<p class="meta">${escape(byline)}</p>` : ""}
<p class="meta">${edition.chapters.length} chapters · About ${readingMinutes(edition.words)} minutes</p>
<p class="dedication">${escape(edition.dedication)}</p>
</header>
<p class="note"><strong>Original story.</strong> An imagined Babel Edition inspired by a title and description. This is original generated fiction, not the text of a published book.</p>
${backCover.length ? `<blockquote>${backCover.map((p) => `<p>${escape(p)}</p>`).join("")}</blockquote>` : ""}
<nav id="contents" aria-labelledby="contents-title">
<h2 id="contents-title" class="meta eyebrow">Contents</h2>
<ol>${contents}</ol>
</nav>
${chapters}
<p class="end">The end.</p>
</main>
</body>
</html>
`;
}

// Safe ASCII file name for Content-Disposition.
export function editionFileName(title, edition) {
  const slug = String(title).normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60).toLowerCase() || "book";
  return `${slug}-babel-edition-${edition}.html`;
}
