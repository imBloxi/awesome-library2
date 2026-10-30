import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getBook } from "@/lib/queries/books";
import { listAllReservations } from "@/lib/queries/reservations";
import { updateBookAction } from "@/app/(library)/admin/actions";
import { BookForm } from "@/components/book-form";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { PageTitle, Skeleton } from "@/components/ui";

export default function EditBookPage({ params }) {
  return (
    <>
      <PageTitle>Edit book</PageTitle>
      <Suspense fallback={<Skeleton rows={4} />}>
        <EditBook params={params} />
      </Suspense>
    </>
  );
}

async function EditBook({ params }) {
  await requireAdmin();
  const { id } = await params;
  const bookId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(bookId) || bookId <= 0) notFound();
  const book = await getBook(bookId);
  if (!book) notFound();
  const holders = await listAllReservations({ status: "active", bookId: book.id });
  return (
    <>
      <BookForm action={updateBookAction.bind(null, book.id)} book={book} submitLabel="Save changes" />
      <p className="mt-6 text-sm text-muted">
        Preview: <Link href={`/books/${book.id}`} className="link">book page</Link> ·{" "}
        <Link href={`/books/${book.id}/read/1`} className="link">Babel Edition No. 1</Link>
      </p>
      <section className="mt-12">
        <h2 className="mb-3 text-lg font-semibold">Reserved or borrowed now</h2>
        {holders.length === 0 ? (
          <p className="text-muted">Nobody has this book right now.</p>
        ) : (
          <AdminReservationList rows={holders} showBook={false} />
        )}
      </section>
    </>
  );
}
