import { Suspense } from "react";
import { babelPassage } from "@/lib/babel.mjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookDetails, getAvailability, listBooksByAuthor } from "@/lib/queries/books";
import { getUser } from "@/lib/dal";
import { BookCover } from "@/components/book-cover";
import { CoverShelf } from "@/components/book-table";
import { ReserveBox } from "@/components/reserve-box";
import { ContinueReading, RandomEditionButton } from "@/components/reader-frame";
import { Skeleton, TopPickBadge } from "@/components/ui";

export default function BookPage({ params }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
        <Link href="/" className="hover:text-ink">← Back to catalog</Link>
      </nav>
      <Suspense fallback={<Skeleton rows={8} />}>
        <BookDetails params={params} />
      </Suspense>
    </>
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
        <div className="self-center sm:self-start"><BookCover book={book} size="lg" /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header>
            {book.is_top_pick && <div className="mb-3"><TopPickBadge /></div>}
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{book.title}</h1>
            <p className="mt-2 text-lg text-muted">
              by <Link href={`/?q=${encodeURIComponent(book.author)}`} className="text-ink hover:underline">{book.author}</Link>
            </p>
          </header>

          <dl className="grid max-w-md grid-cols-[7rem_1fr] gap-x-4 gap-y-2.5 border-y border-line py-4 text-[15px]">
              <CardRow label="Author">{book.author}</CardRow>
              {book.published_year && <CardRow label="Published">{book.published_year}</CardRow>}
              {book.isbn && <CardRow label="ISBN"><span className="tabular-nums">{book.isbn}</span></CardRow>}
              <CardRow label="Copies">{book.total_copies}</CardRow>
          </dl>

          {/* Live: the session and today's free copies are read per request. */}
          <Suspense fallback={<div className="loading-bar h-20 max-w-md rounded-lg bg-subtle" />}>
            <ReservePanel book={book} />
          </Suspense>

          {book.description && (
            <section>
              <h2 className="eyebrow mb-2">About this book</h2>
              <p className="max-w-prose whitespace-pre-line leading-relaxed">{book.description}</p>
            </section>
          )}
          <details className="max-w-prose rounded-lg border border-line bg-subtle p-4">
            <summary className="cursor-pointer text-sm font-medium">Read the Babel back cover</summary>
            <p className="mt-3 text-xs text-muted">
              An imagined back-cover blurb inspired by this book’s title and description.
            </p>
            <div className="mt-4 space-y-4 leading-relaxed [overflow-wrap:anywhere]">
              {babelPassage(book.title, book.id, book.description).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            </div>
          </details>
          <section aria-labelledby="babel-editions" className="max-w-prose rounded-lg border border-line p-4">
            <h2 id="babel-editions" className="text-sm font-medium">Babel Editions</h2>
            <p className="mt-1 text-sm text-muted">
              Imagined versions of this book, ten short chapters each, written by our story generator. Every edition is different.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/books/${book.id}/read/1`} className="btn btn-sm">Read a Babel Edition</Link>
              <RandomEditionButton basePath={`/books/${book.id}/read`} label="Roll a random edition" className="btn btn-sm" />
              <ContinueReading bookKey={`book-${book.id}`} />
            </div>
          </section>
        </div>
      </article>

      {/* Streams in after the book itself, so it never delays the main content. */}
      <Suspense fallback={null}>
        <MoreByAuthor book={book} />
      </Suspense>
    </>
  );
}

async function ReservePanel({ book }) {
  const [user, live] = await Promise.all([getUser(), getAvailability(book.id)]);
  if (!live) return null;
  return <ReserveBox bookId={book.id} available={live.available} total={live.total_copies} signedIn={Boolean(user)} />;
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
    <section aria-labelledby="more-by" className="mt-16 border-t border-line pt-10">
      <h2 id="more-by" className="mb-6 text-xl font-semibold tracking-tight">More by {book.author}</h2>
      <CoverShelf books={books} />
    </section>
  );
}
