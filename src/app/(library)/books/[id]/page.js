import { Suspense } from "react";
import { babelPassage } from "@/lib/babel.mjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookDetails, getAvailability, listBooksByAuthor, listAlsoBorrowed } from "@/lib/queries/books";
import { getMemberBookState } from "@/lib/queries/reservations";
import { canReadCatalogBook } from "@/lib/queries/reading";
import { getUser } from "@/lib/dal";
import { BookCover } from "@/components/book-cover";
import { CoverShelf } from "@/components/book-table";
import { ReserveBox } from "@/components/reserve-box";
import { ContinueReading, RandomEditionButton } from "@/components/reader-frame";
import { Skeleton, TopPickBadge, formatDate } from "@/components/ui";
import { getStanding } from "@/lib/queries/moderation";
import { isBookWatched } from "@/lib/queries/watch";
import { PageTurn, BACK, FORWARD } from "@/components/page-turn";
import { transitionNames } from "@/lib/book-shape.mjs";

export default function BookPage({ params }) {
  return (
    <PageTurn>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/" transitionTypes={BACK}>← Back to catalogue</Link>
      </nav>
      <Suspense fallback={<Skeleton rows={8} />}>
        <BookDetails params={params} />
      </Suspense>
    </PageTurn>
  );
}

async function BookDetails({ params }) {
  const { id } = await params;
  const bookId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(bookId) || bookId <= 0) notFound();

  // Cached: everything here except the reserve box is part of the prerendered page.
  const book = await getBookDetails(bookId);
  if (!book) notFound();

  return (
    <>
      <article className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
        <div className="book-hero-cover"><BookCover book={book} size="lg" vtName={`book-${book.id}`} /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header>
            {book.is_top_pick && <div className="mb-3"><TopPickBadge /></div>}
            <h1 className="page-heading">{book.title}</h1>
            <p className="mt-2 text-lg text-muted">
              by <Link href={`/?q=${encodeURIComponent(book.author)}`} className="text-ink hover:underline">{book.author}</Link>
            </p>
          </header>

          <dl className="catalog-card">
              <CardRow label="Author">{book.author}</CardRow>
              {book.published_year && <CardRow label="Published">{book.published_year}</CardRow>}
              {book.isbn && <CardRow label="ISBN"><span className="tabular-nums">{book.isbn}</span></CardRow>}
              {book.genre && <CardRow label="Genre"><Link href={`/?genre=${encodeURIComponent(book.genre)}`} className="hover:underline">{book.genre}</Link></CardRow>}
              <CardRow label="Copies">{book.total_copies}</CardRow>
          </dl>

          {/* Live: the session and today's free copies are read per request. */}
          <Suspense fallback={<div className="skeleton-page h-20 max-w-md" />}>
            <ReservePanel book={book} />
          </Suspense>

          {book.description && (
            <section>
              <h2 className="eyebrow mb-2">About this book</h2>
              <p className="max-w-prose whitespace-pre-line leading-relaxed">{book.description}</p>
            </section>
          )}
          <details className="book-aside">
            <summary className="cursor-pointer text-sm font-medium">Read the Babel back cover</summary>
            <p className="mt-3 text-xs text-muted">
              An imagined back-cover blurb inspired by this book’s title and description.
            </p>
            <div className="mt-4 space-y-4 leading-relaxed [overflow-wrap:anywhere]">
              {babelPassage(book.title, book.id, book.description).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            </div>
          </details>
          <section aria-labelledby="babel-editions" className="book-aside">
            <h2 id="babel-editions" className="text-sm font-medium">Read a Babel Edition</h2>
            <p className="mt-1 text-sm text-muted">
              An original story inspired by this book’s title and description, in ten short chapters.
              This is imagined fiction, not the published book’s text.
            </p>
            <Suspense fallback={<p className="mt-3 text-sm text-muted">Checking reading access…</p>}>
              <ReadingAccess bookId={book.id} />
            </Suspense>
          </section>
        </div>
      </article>

      {/* Streams in after the book itself, so it never delays the main content. */}
      <Suspense fallback={null}>
        <MoreByAuthor book={book} />
      </Suspense>
      <Suspense fallback={null}>
        <AlsoBorrowed book={book} />
      </Suspense>
    </>
  );
}

async function ReservePanel({ book }) {
  const [user, live, watched] = await Promise.all([getUser(), getAvailability(book.id), isBookWatched(book.id)]);
  if (!live) return null;
  const [member, standing] = user ? await Promise.all([getMemberBookState(user.id, book.id), getStanding(user.id)]) : [null, null];
  const paused = standing?.block ? { kind: standing.block.kind, until: standing.block.ends_at ? formatDate(standing.block.ends_at) : null } : null;
  return (
    <>
      {watched && (
        <p className="slip slip-warn">
          <strong>On the library watchlist.</strong> Reserving, borrowing, waiting for or saving this title flags your account to staff as a person of interest.{" "}
          <Link href="/legal/privacy#record" className="link">What this means</Link>
        </p>
      )}
      <ReserveBox bookId={book.id} available={live.available} total={live.total_copies} member={member && { ...member, paused }} />
    </>
  );
}

function CardRow({ label, children }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

async function MoreByAuthor({ book }) {
  const books = await listBooksByAuthor(book.author, book.id);
  if (books.length === 0) return null;
  return (
    <section aria-labelledby="more-by" className="related-shelf">
      <h2 id="more-by" className="section-heading">More by {book.author}</h2>
      <CoverShelf books={books} names={transitionNames(books)[0]} />
    </section>
  );
}

async function AlsoBorrowed({ book }) {
  const books = await listAlsoBorrowed(book.id);
  if (books.length === 0) return null;
  return (
    <section aria-labelledby="also-borrowed" className="related-shelf">
      <h2 id="also-borrowed" className="section-heading">Readers also borrowed</h2>
      {/* No morph names here: a book could also be in "More by", and names must be unique. */}
      <CoverShelf books={books} />
    </section>
  );
}

async function ReadingAccess({ bookId }) {
  const user = await getUser();
  const allowed = user && await canReadCatalogBook(user.id, bookId);
  if (!allowed) return <p className="mt-3 text-sm text-muted">{user ? "Reserve and collect this book to unlock reading. A reservation alone does not grant access." : <><Link href="/auth/sign-in" className="link">Sign in</Link>, then reserve and collect this book to unlock reading.</>}</p>;
  return <div className="mt-3 flex flex-wrap items-center gap-3">
    <Link href={`/books/${bookId}/read/1`} transitionTypes={FORWARD} className="btn btn-sm" prefetch={false}>Open the reader</Link>
    <RandomEditionButton basePath={`/books/${bookId}/read`} label="Roll a random edition" className="btn btn-sm" />
    <ContinueReading bookKey={`book-${bookId}`} />
    <p className="w-full text-xs text-muted">Access is active until this loan is returned. Online reading only.</p>
  </div>;
}
