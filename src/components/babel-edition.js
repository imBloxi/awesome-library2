import { ReaderFrame, ReaderResume, RandomEditionButton } from "@/components/reader-frame";
import { BookCover } from "@/components/book-cover";
import { readingMinutes } from "@/lib/reader-state.mjs";
import { MAX_EDITION, MAX_INVENTED_SEED } from "@/lib/babel-book/limits.mjs";

const chapterMinutes = (chapter) => readingMinutes(chapter.paragraphs.join(" ").trim().split(/\s+/u).length);

function ContentsList({ basePath, chapters, currentIndex }) {
  return (
    <ol className="reader-contents">
      {chapters.map((chapter, index) => (
        <li key={index}>
          <a href={`${basePath}/${index + 1}`} aria-current={currentIndex === index ? "page" : undefined}>
            <span className="reader-contents-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="reader-contents-title">{chapter.title}</span>
            <span className="reader-contents-time">{chapterMinutes(chapter)} min</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

// Shared title page for catalog editions and wholly invented books.
// Chapter text is rendered on the server and remains readable without JavaScript.
export function EditionContents({ basePath, bookKey, edition, byline, backCover, rollPath, downloadHref, cover }) {
  const invented = basePath.startsWith("/babel/");
  const chapterCount = edition.chapters.length;
  return (
    <ReaderFrame bookKey={bookKey} basePath={basePath} chapterCount={chapterCount} label="Babel Editions">
      <div className="reader-frontmatter">
        <header className="reader-jacket">
          {cover && <div className="reader-cover"><BookCover book={cover} vtName={`${invented ? "babel" : "book"}-${cover.id}`} /></div>}
          <div className="reader-title">
            <p className="eyebrow">Babel Edition No. {edition.edition}</p>
            <h1>{edition.title}</h1>
            {byline && <p className="reader-byline">{byline}</p>}
            <p className="reader-book-meta">
              {chapterCount} chapters <span aria-hidden="true">·</span> About {readingMinutes(edition.words)} min
              <span aria-hidden="true"> · </span>{(Math.round(edition.words / 100) * 100).toLocaleString("en-US")} words
            </p>
          </div>
        </header>

        <p className="reader-original-note">
          <span className="reader-note-label">An original imagined story</span>
          {invented
            ? "This book and its author are invented. Enjoy ten short chapters of original fiction."
            : "A new story inspired by this book’s title and description. This is original fiction, not the published book’s text."}
        </p>

        <div className="reader-start-actions">
          <ReaderResume bookKey={bookKey} basePath={basePath} chapterCount={chapterCount} />
          <a href={`${basePath}/1`} className="btn btn-primary">Start from chapter 1 <span aria-hidden="true">→</span></a>
        </div>

        <p className="reader-dedication">{edition.dedication}</p>

        {backCover?.length > 0 && (
          <section aria-labelledby="back-cover" className="reader-back-cover">
            <h2 id="back-cover" className="eyebrow">The story within</h2>
            {backCover.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
        )}

        <details className="reader-contents-disclosure">
          <summary><span>Contents</span><span className="reader-summary-meta">{chapterCount} chapters</span></summary>
          <nav aria-label="Table of contents">
            <ContentsList basePath={basePath} chapters={edition.chapters} />
          </nav>
        </details>

        <div className="reader-edition-actions">
          {/* A file download uses a plain link, so Next does not prefetch it as a page. */}
          {downloadHref && <a href={downloadHref} className="btn" download>Download for offline</a>}
          {rollPath && (
            <RandomEditionButton
              basePath={rollPath}
              max={invented ? MAX_INVENTED_SEED : MAX_EDITION}
              label={invented ? "Find another imagined book" : "Try another edition"}
            />
          )}
        </div>
        <p className="reader-note">A little time, another world. Read online while your library loan is checked out.</p>
      </div>
    </ReaderFrame>
  );
}

// A chapter with ordinary links plus optional keyboard navigation from ReaderFrame.
export function EditionChapter({ basePath, bookKey, edition, index, bookTitle }) {
  const chapterCount = edition.chapters.length;
  const chapter = edition.chapters[index];
  const previous = edition.chapters[index - 1];
  const next = edition.chapters[index + 1];
  const prevHref = previous ? `${basePath}/${index}` : basePath;
  const nextHref = next ? `${basePath}/${index + 2}` : null;
  const position = { href: `${basePath}/${index + 1}`, edition: edition.edition, chapter: index + 1 };
  return (
    <ReaderFrame bookKey={bookKey} basePath={basePath} chapterCount={chapterCount} position={position} prevHref={prevHref} nextHref={nextHref} label={`Edition ${edition.edition}`}>
      <div className="reader-chapter-top">
        <a href={basePath} className="reader-book-link">{bookTitle}</a>
        <details className="reader-contents-disclosure reader-chapter-menu">
          <summary>Contents</summary>
          <nav aria-label="Table of contents">
            <ContentsList basePath={basePath} chapters={edition.chapters} currentIndex={index} />
          </nav>
        </details>
      </div>

      <div className="reader-progress">
        <p><span>Chapter {index + 1} of {chapterCount}</span><span>About {chapterMinutes(chapter)} min</span></p>
        <progress value={index + 1} max={chapterCount} aria-label={`Chapter position: ${index + 1} of ${chapterCount}`} />
      </div>

      <article className="reader-chapter" aria-labelledby="chapter-title">
        <h1 id="chapter-title"><span className="reader-chapter-number">Chapter {String(index + 1).padStart(2, "0")}</span>{chapter.title}</h1>
        {chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      </article>

      {!next && <p className="reader-end">The end.</p>}
      <nav aria-label="Chapter navigation" className="reader-pager">
        <a href={prevHref} rel={previous ? "prev" : undefined} className="reader-page-link">
          <span className="reader-page-direction">← {previous ? "Previous chapter" : "Back to contents"}</span>
          <span>{previous?.title ?? bookTitle}</span>
        </a>
        <a href={nextHref ?? basePath} rel={next ? "next" : undefined} className="reader-page-link reader-page-link-next">
          <span className="reader-page-direction">{next ? "Next chapter" : "Return to contents"} →</span>
          <span>{next?.title ?? bookTitle}</span>
        </a>
      </nav>
    </ReaderFrame>
  );
}
