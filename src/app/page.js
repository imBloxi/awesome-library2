import { Suspense } from "react";
import { searchBooks, listTopPicks } from "@/lib/queries/books";
import { SearchForm } from "@/components/search-form";
import { CatalogFilters } from "@/components/catalog-filters";
import { BookTable, CoverShelf } from "@/components/book-table";
import { parseSearchParams, filtersToParams, hasFilters } from "@/lib/search-params.mjs";
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
  const params = filtersToParams({ q, filters });
  const filtered = hasFilters({ q, filters });
  // Top picks only on the plain first page, fetched alongside the catalog so it adds no wait.
  const showTop = !filtered && page === 1;
  const [{ books, hasNext }, topPicks] = await Promise.all([
    searchBooks({ q, page, filters }),
    showTop ? listTopPicks() : [],
  ]);

  return (
    <>
      {/* The form syncs its inputs to `values`, so Back and "Clear filters" update them
          without remounting the field you're typing in. */}
      <SearchForm action="/" q={q} values={params}>
        <CatalogFilters filters={filters} showClear={filtered} />
      </SearchForm>
      {topPicks.length > 0 && (
        <section aria-labelledby="top-books" className="mb-12">
          <p className="eyebrow mb-1">Picked by our librarians</p>
          <h2 id="top-books" className="mb-5 text-xl font-semibold tracking-tight">This week&apos;s top books</h2>
          <CoverShelf books={topPicks} />
        </section>
      )}
      <h2 className="mb-3 text-xl font-semibold tracking-tight">
        {filtered ? "Search results" : "All books"}
      </h2>
      {books.length === 0 ? (
        <p className="rounded-lg bg-subtle px-4 py-6 text-center text-sm text-muted">
          {filtered ? "No books match your search. Try fewer words or clear the filters." : "No books in the catalog yet."}
        </p>
      ) : (
        <BookTable books={books} />
      )}
      <Pagination basePath="/" params={params} page={page} hasNext={hasNext} />
    </>
  );
}
