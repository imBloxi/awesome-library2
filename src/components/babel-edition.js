import Link from "next/link";
import { ReaderFrame, RandomEditionButton } from "@/components/reader-frame";
import { BookCover } from "@/components/book-cover";

// Title page and contents for one generated edition. basePath is the edition's URL,
// e.g. /books/12/read/3 or /babel/42; chapters live at `${basePath}/${n}`.
export function EditionContents({ basePath, bookKey, edition, byline, backCover, rollPath, downloadHref, cover }) {
  return (
    <ReaderFrame bookKey={bookKey}>
      {cover && <div className="mx-auto mb-8 w-40"><BookCover book={cover} /></div>}
      <header className="reader-title">
        <p className="eyebrow">Babel Edition No. {edition.edition}</p>
        <h1>{edition.title}</h1>
        {byline && <p className="reader-byline">{byline}</p>}
        <p className="reader-dedication">{edition.dedication}</p>
      </header>
      {backCover && (
        <section aria-labelledby="back-cover" className="reader-back-cover">
          <h2 id="back-cover" className="eyebrow mb-2">From the back cover</h2>
          {backCover.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )}
      <nav aria-labelledby="contents">
        <h2 id="contents" className="eyebrow mb-3">Contents</h2>
        <ol className="reader-contents">
          {edition.chapters.map((c, i) => (
            <li key={i}><Link href={`${basePath}/${i + 1}`}><span>{i + 1}</span>{c.title}</Link></li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href={`${basePath}/1`} className="btn btn-primary">Start reading</Link>
        {rollPath && <RandomEditionButton basePath={rollPath} />}
        {/* A plain link: this is a file download, and <Link> would prefetch it as a page. */}
        {downloadHref && <a href={downloadHref} className="btn" download>Download for offline</a>}
      </div>
      <p className="reader-note">
        An imagined edition, generated on this server from the book&apos;s title and description. It is
        original text, not the real book, and the same edition number always reads the same.
        About {Math.round(edition.words / 100) * 100} words.
      </p>
    </ReaderFrame>
  );
}

// One chapter, with previous/next links (and ←/→ keys).
export function EditionChapter({ basePath, bookKey, edition, index, bookTitle }) {
  const chapter = edition.chapters[index];
  const prevHref = index > 0 ? `${basePath}/${index}` : basePath;
  const nextHref = index < edition.chapters.length - 1 ? `${basePath}/${index + 2}` : null;
  const position = { href: `${basePath}/${index + 1}`, edition: edition.edition, chapter: index + 1 };
  return (
    <ReaderFrame bookKey={bookKey} position={position} prevHref={prevHref} nextHref={nextHref}>
      <p className="eyebrow"><Link href={basePath} className="hover:underline">{bookTitle} · Edition {edition.edition}</Link></p>
      <article className="reader-chapter">
        <h1><span className="reader-chapter-number">Chapter {index + 1}</span>{chapter.title}</h1>
        {chapter.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </article>
      <nav aria-label="Chapters" className="reader-pager">
        <Link href={prevHref} rel="prev" className="btn btn-sm">← {index > 0 ? "Previous" : "Contents"}</Link>
        <span>{index + 1} / {edition.chapters.length}</span>
        {nextHref ? <Link href={nextHref} rel="next" className="btn btn-sm">Next →</Link> : <Link href={basePath} className="btn btn-sm">Contents</Link>}
      </nav>
      {!nextHref && <p className="reader-end">The end.</p>}
    </ReaderFrame>
  );
}
