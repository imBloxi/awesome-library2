// A single self-contained HTML file of one edition, for reading offline.
// Every piece of text is escaped; the file has no scripts and no external requests.

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function editionToHtml({ edition, byline = "", backCover = [] }) {
  const chapters = edition.chapters
    .map((c, i) => `<section id="ch${i + 1}"><h2><small>Chapter ${i + 1}</small>${escape(c.title)}</h2>\n${c.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("\n")}</section>`)
    .join("\n");
  const contents = edition.chapters.map((c, i) => `<li><a href="#ch${i + 1}">${escape(c.title)}</a></li>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(edition.title)} (Babel Edition No. ${edition.edition})</title>
<style>
:root { color-scheme: light dark; --bg: #fbf8f1; --ink: #222; --muted: #6b6b6b; }
@media (prefers-color-scheme: dark) { :root { --bg: #181614; --ink: #e8e2d6; --muted: #9a9286; } }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1.125rem/1.7 Georgia, "Times New Roman", serif; }
main { max-width: 36rem; margin: 0 auto; padding: 3rem 1rem 6rem; }
h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0; }
h2 { margin: 4rem 0 1.5rem; font-size: 1.5rem; }
h2 small { display: block; color: var(--muted); font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; }
.meta, .note { color: var(--muted); font-size: 0.95rem; }
p { margin: 0 0 1.1em; }
a { color: inherit; }
</style>
</head>
<body>
<main>
<p class="meta">Babel Edition No. ${edition.edition}</p>
<h1>${escape(edition.title)}</h1>
${byline ? `<p class="meta">${escape(byline)}</p>` : ""}
<p><em>${escape(edition.dedication)}</em></p>
${backCover.length ? `<blockquote>${backCover.map((p) => `<p>${escape(p)}</p>`).join("")}</blockquote>` : ""}
<ol>${contents}</ol>
${chapters}
<p class="note">An imagined edition generated from a catalog title and description. Original text, not the real book.</p>
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
