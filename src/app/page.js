import { Suspense } from "react";
import Link from "next/link";
import { searchBooks } from "@/lib/queries/books";
import { SearchForm } from "@/components/search-form";
import { CatalogFilters } from "@/components/catalog-filters";
import { parseSearchParams, filtersToParams, hasFilters } from "@/lib/search-params.mjs";
import { PageTitle, Skeleton, Availability, Pagination } from "@/components/ui";

const NO_FILTERS = { available: false, yearFrom: null, yearTo: null };

export default function CatalogPage({ searchParams }) {
  return (
    <>
      <PageTitle>Find a book</PageTitle>
      <Suspense fallback={<><SearchForm action="/"><CatalogFilters filters={NO_FILTERS} /></SearchForm><Skeleton rows={8} /></>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalog({ searchParams }) {
  const sp = await searchParams;
  const { q, page, filters } = parseSearchParams(sp);
  const filtered = hasFilters({ q, filters });
  const { books, hasNext } = await searchBooks({ q, page, filters });

  return (
    <>
      <SearchForm action="/" q={q}>
        <CatalogFilters filters={filters} showClear={filtered} />
      </SearchForm>
      {books.length === 0 ? (
        <p className="text-zinc-500">{filtered ? "No books match your search." : "No books in the catalog yet."}</p>
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
      <Pagination basePath="/" params={filtersToParams({ q, filters })} page={page} hasNext={hasNext} />
    </>
  );
}
