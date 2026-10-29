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
      <nav aria-label="Breadcrumb" className="ui mb-5 text-sm">
        <Link href="/">Catalog</Link> <span className="text-muted">»</span> <span className="text-muted">Book details</span>
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
      <article className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="self-center sm:self-start"><BookCover book={book} size="lg" /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header>
            <h1 className="text-3xl font-bold leading-tight text-navy">
              {book.title} {book.is_top_pick && <TopPickBadge />}
            </h1>
            <p className="mt-1 text-lg italic">
              by <Link href={`/?q=${encodeURIComponent(book.author)}`}>{book.author}</Link>
            </p>
          </header>

          <table className="retro-table bevel-in max-w-md text-[15px]">
            <caption className="ui pb-1 text-left text-xs font-bold uppercase tracking-wide text-muted">Library card</caption>
            <tbody>
              <CardRow label="Author">{book.author}</CardRow>
              {book.published_year && <CardRow label="Published">{book.published_year}</CardRow>}
              {book.isbn && <CardRow label="ISBN"><span className="font-mono text-sm">{book.isbn}</span></CardRow>}
              <CardRow label="Copies">{book.total_copies}</CardRow>
              <CardRow label="Status"><Availability available={book.available} total={book.total_copies} /></CardRow>
            </tbody>
          </table>

          <div className="groupbox flex flex-col gap-2">
            {!user ? (
              <p className="ui text-sm">
                <Link href="/auth/sign-in" className="btn btn-primary mr-2">Sign in to reserve</Link>
                or <Link href="/auth/sign-up">register for a library card</Link>.
              </p>
            ) : book.available > 0 ? (
              <>
                <div><ActionButton action={reserveAction} id={book.id} label="📖 Reserve this book" pendingLabel="Reserving…" variant="primary" /></div>
                <p className="ui text-xs text-muted">
                  We hold it for 7 days. <Link href="/reservations">See your reservations</Link>
                </p>
              </>
            ) : (
              <p className="ui text-sm">All copies are out right now. Check back in a few days.</p>
            )}
          </div>

          {book.description && (
            <section>
              <h2 className="mb-1 text-xl font-bold text-navy">About this book</h2>
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
    <tr>
      <th scope="row" className="w-28">{label}</th>
      <td>{children}</td>
    </tr>
  );
}

async function MoreByAuthor({ book }) {
  const books = await listBooksByAuthor(book.author, book.id);
  if (books.length === 0) return null;
  return (
    <section aria-labelledby="more-by" className="mt-10">
      <hr className="mb-4" />
      <h2 id="more-by" className="mb-4 text-xl font-bold text-navy">More by {book.author}</h2>
      <CoverShelf books={books} />
    </section>
  );
}
