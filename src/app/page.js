import { Suspense } from "react";
import { searchBooks, listTopPicks } from "@/lib/queries/books";
import { SearchForm } from "@/components/search-form";
import { CatalogFilters } from "@/components/catalog-filters";
import { parseSearchParams, filtersToParams, hasFilters } from "@/lib/search-params.mjs";
import { BookListItem } from "@/components/book-list-item";
import { PageTitle, Skeleton, Pagination } from "@/components/ui";

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
  // Top picks only on the plain first page, fetched alongside the catalog so it adds no wait.
  const showTop = !filtered && page === 1;
  const [{ books, hasNext }, topPicks] = await Promise.all([
    searchBooks({ q, page, filters }),
    showTop ? listTopPicks() : [],
  ]);

  return (
    <>
      <SearchForm action="/" q={q}>
        <CatalogFilters filters={filters} showClear={filtered} />
      </SearchForm>
      {topPicks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">This week&apos;s top books</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {topPicks.map((b) => <BookListItem key={b.id} book={b} />)}
          </ul>
          <h2 className="mt-8 text-lg font-semibold">All books</h2>
        </section>
      )}
      {books.length === 0 ? (
        <p className="text-zinc-500">{filtered ? "No books match your search." : "No books in the catalog yet."}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {books.map((b) => <BookListItem key={b.id} book={b} showTopPick />)}
        </ul>
      )}
      <Pagination basePath="/" params={filtersToParams({ q, filters })} page={page} hasNext={hasNext} />
    </>
  );
}
