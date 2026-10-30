import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { BookImportForm } from "@/components/book-import-form";
import { PageTitle, Skeleton } from "@/components/ui";

export default function ImportBooksPage() {
  return (
    <>
      <PageTitle>Import books</PageTitle>
      <Suspense fallback={<Skeleton rows={4} />}>
        <Gate />
      </Suspense>
    </>
  );
}

async function Gate() {
  await requireAdmin();
  return <BookImportForm />;
}
