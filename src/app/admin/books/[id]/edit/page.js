import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getBook } from "@/lib/queries/books";
import { updateBookAction } from "@/app/admin/actions";
import { BookForm } from "@/components/book-form";
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
  return <BookForm action={updateBookAction.bind(null, book.id)} book={book} submitLabel="Save changes" />;
}
