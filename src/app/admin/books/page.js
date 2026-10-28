import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { searchBooks } from "@/lib/queries/books";
import { deleteBookAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, Availability, Pagination, buttonClass } from "@/components/ui";

export default function AdminBooksPage({ searchParams }) {
  return (
    <>
      <PageTitle action={<Link href="/admin/books/new" className={buttonClass}>Add book</Link>}>Books</PageTitle>
      <Suspense fallback={<><SearchForm action="/admin/books" /><Skeleton /></>}>
        <BookTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BookTable({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);
  const { books, hasNext } = await searchBooks({ q, page });

  return (
    <>
      <SearchForm action="/admin/books" q={q} />
      {books.length === 0 ? (
        <p className="text-zinc-500">No books found.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {books.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={`/books/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                <p className="text-sm text-zinc-500">{b.author}{b.isbn ? ` · ${b.isbn}` : ""}</p>
              </div>
              <div className="flex items-start gap-3">
                <Availability available={b.available} total={b.total_copies} />
                <Link href={`/admin/books/${b.id}/edit`} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Edit</Link>
                <ActionButton action={deleteBookAction} id={b.id} label="Delete" pendingLabel="Deleting…" variant="danger" confirm={`Delete “${b.title}”?`} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination basePath="/admin/books" params={q ? { q } : {}} page={page} hasNext={hasNext} />
    </>
  );
}
