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
              {book.genre && <CardRow label="Genre"><Link href={`/?genre=${encodeURIComponent(book.genre)}`} className="hover:underline">{book.genre}</Link></CardRow>}
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
  const [user, live] = await Promise.all([getUser(), getAvailability(book.id)]);
  if (!live) return null;
  const member = user ? await getMemberBookState(user.id, book.id) : null;
  return <ReserveBox bookId={book.id} available={live.available} total={live.total_copies} member={member} />;
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

async function AlsoBorrowed({ book }) {
  const books = await listAlsoBorrowed(book.id);
  if (books.length === 0) return null;
  return (
    <section aria-labelledby="also-borrowed" className="mt-16 border-t border-line pt-10">
      <h2 id="also-borrowed" className="mb-6 text-xl font-semibold tracking-tight">Readers also borrowed</h2>
      <CoverShelf books={books} />
    </section>
  );
}

async function ReadingAccess({ bookId }) {
  const user = await getUser();
  const allowed = user && await canReadCatalogBook(user.id, bookId);
  if (!allowed) return <p className="mt-3 text-sm text-muted">{user ? "Reserve and collect this book to unlock reading. A reservation alone does not grant access." : <><Link href="/auth/sign-in" className="link">Sign in</Link>, then reserve and collect this book to unlock reading.</>}</p>;
  return <div className="mt-3 flex flex-wrap items-center gap-3">
    <Link href={`/books/${bookId}/read/1`} className="btn btn-sm" prefetch={false}>Open the reader</Link>
    <RandomEditionButton basePath={`/books/${bookId}/read`} label="Roll a random edition" className="btn btn-sm" />
    <ContinueReading bookKey={`book-${bookId}`} />
    <p className="w-full text-xs text-muted">Access is active until this loan is returned. Online reading only.</p>
  </div>;
}
