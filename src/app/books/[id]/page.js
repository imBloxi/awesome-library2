import { Suspense } from "react";
import { babelPassage } from "@/lib/babel.mjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook, listBooksByAuthor } from "@/lib/queries/books";
import { getUser } from "@/lib/dal";
import { reserveAction } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { BookCover } from "@/components/book-cover";
import { CoverShelf } from "@/components/book-table";
import { Availability, Skeleton, TopPickBadge } from "@/components/ui";

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

  const [book, user] = await Promise.all([getBook(bookId), getUser()]);
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
              <CardRow label="Status"><Availability available={book.available} total={book.total_copies} /></CardRow>
          </dl>

          <div className="flex flex-col gap-2">
            {!user ? (
              <p className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <Link href="/auth/sign-in" className="btn btn-primary">Sign in to reserve</Link>
                <span>or <Link href="/auth/sign-up" className="link">create an account</Link></span>
              </p>
            ) : book.available > 0 ? (
              <>
                <div><ActionButton action={reserveAction} id={book.id} label="Reserve this book" pendingLabel="Reserving…" variant="primary" /></div>
                <p className="text-sm text-muted">
                  We hold it for 7 days. <Link href="/reservations" className="link">See your reservations</Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">All copies are out right now. Check back in a few days.</p>
            )}
          </div>

          {book.description && (
            <section>
              <h2 className="eyebrow mb-2">About this book</h2>
              <p className="max-w-prose whitespace-pre-line leading-relaxed">{book.description}</p>
            </section>
          )}
          <details className="groupbox max-w-prose bg-paper">
            <summary className="ui cursor-pointer text-sm font-bold text-navy">Open a Babel page</summary>
            <p className="ui mt-3 text-xs text-muted">
              A little Library of Babel, seeded by this title. Invented text, not an excerpt from the book.
            </p>
            <div className="mt-4 space-y-4 leading-relaxed">
              {babelPassage(book.title).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            </div>
          </details>
        </div>
      </article>

      {/* Streams in after the book itself, so it never delays the main content. */}
      <Suspense fallback={null}>
        <MoreByAuthor book={book} />
      </Suspense>
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
    <section aria-labelledby="more-by" className="mt-16 border-t border-line pt-10">
      <h2 id="more-by" className="mb-6 text-xl font-semibold tracking-tight">More by {book.author}</h2>
      <CoverShelf books={books} />
    </section>
  );
}
