import { Suspense } from "react";
import Link from "next/link";
import { searchBooks } from "@/lib/queries/books";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, Availability, Pagination } from "@/components/ui";

export default function CatalogPage({ searchParams }) {
  return (
    <>
      <PageTitle>Find a book</PageTitle>
      <Suspense fallback={<><SearchForm action="/" /><Skeleton rows={8} /></>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalog({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);
  const { books, hasNext } = await searchBooks({ q, page });

  return (
    <>
      <SearchForm action="/" q={q} />
      {books.length === 0 ? (
        <p className="text-zinc-500">{q ? `No books match “${q}”.` : "No books in the catalog yet."}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/books/${b.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-950">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {b.author}
                    {b.published_year ? ` · ${b.published_year}` : ""}
                  </p>
                </div>
                <Availability available={b.available} total={b.total_copies} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination basePath="/" params={q ? { q } : {}} page={page} hasNext={hasNext} />
    </>
  );
}
