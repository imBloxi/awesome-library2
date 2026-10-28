import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { createBookAction } from "@/app/admin/actions";
import { BookForm } from "@/components/book-form";
import { PageTitle, Skeleton } from "@/components/ui";

export default function NewBookPage() {
  return (
    <>
      <PageTitle>Add a book</PageTitle>
      <Suspense fallback={<Skeleton rows={4} />}>
        <NewBook />
      </Suspense>
    </>
  );
}

async function NewBook() {
  await requireAdmin();
  return <BookForm action={createBookAction} submitLabel="Add book" />;
}
