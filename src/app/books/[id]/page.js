import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/queries/books";
import { getUser } from "@/lib/dal";
import { reserveAction } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { Availability, Skeleton } from "@/components/ui";

export default function BookPage({ params }) {
  return (
    <>
      <Link href="/" className="mb-6 inline-block text-sm text-zinc-500 hover:underline">← Back to catalog</Link>
      <Suspense fallback={<Skeleton rows={3} />}>
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
    <article className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
        <p className="text-zinc-500">
          {book.author}
          {book.published_year ? ` · ${book.published_year}` : ""}
          {book.isbn ? ` · ISBN ${book.isbn}` : ""}
        </p>
      </div>
      <div><Availability available={book.available} total={book.total_copies} /></div>
      {book.description && <p className="max-w-prose whitespace-pre-line leading-relaxed">{book.description}</p>}
      <div className="pt-2">
        {!user ? (
          <Link href="/auth/sign-in" className="underline">Sign in to reserve this book</Link>
        ) : book.available > 0 ? (
          <ActionButton action={reserveAction} id={book.id} label="Reserve" pendingLabel="Reserving…" variant="primary" />
        ) : (
          <p className="text-sm text-zinc-500">All copies are taken. Check back later.</p>
        )}
      </div>
      {user && (
        <p className="text-sm text-zinc-500">
          Holds last 7 days. <Link href="/reservations" className="underline">See your reservations</Link>
        </p>
      )}
    </article>
  );
}
