import { Suspense } from "react";
import Link from "next/link";
import { searchBooks, listTopPicks, listGenres } from "@/lib/queries/books";
import { SearchForm } from "@/components/search-form";
import { CatalogFilters } from "@/components/catalog-filters";
import { BookTable, CoverShelf, SpineShelf } from "@/components/book-table";
import { PageTurn } from "@/components/page-turn";
import { parseSearchParams, filtersToParams, hasFilters } from "@/lib/search-params.mjs";
import { transitionNames } from "@/lib/book-shape.mjs";
import { PageTitle, Skeleton, Pagination } from "@/components/ui";

const NO_FILTERS = { available: false, yearFrom: null, yearTo: null, genre: "", sort: "title" };

export default function CatalogPage({ searchParams }) {
  return (
    <PageTurn>
      <PageTitle>Find a book</PageTitle>
      <Suspense fallback={<><SearchForm action="/"><CatalogFilters filters={NO_FILTERS} /></SearchForm><Skeleton rows={8} /></>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </PageTurn>
  );
}

function viewHref({ q, filters, view }) {
  const qs = new URLSearchParams(filtersToParams({ q, filters, view })).toString();
  return qs ? `/?${qs}` : "/";
}

async function Catalog({ searchParams }) {
  const sp = await searchParams;
  const { q, page, filters, view } = parseSearchParams(sp);
  const params = filtersToParams({ q, filters, view });
  const filtered = hasFilters({ q, filters });
  // Top picks only on the plain first page, fetched alongside the catalog so it adds no wait.
  const showTop = !filtered && page === 1;
  const [{ books, hasNext }, topPicks, genres] = await Promise.all([
    searchBooks({ q, page, filters }),
    showTop ? listTopPicks() : [],
    listGenres(),
  ]);
  const [pickNames, bookNames] = transitionNames(topPicks, books);

  return (
    <>
      {/* The form syncs its inputs to `values`, so Back and "Clear filters" update them
          without remounting the field you're typing in. */}
      <SearchForm action="/" q={q} values={params}>
        <CatalogFilters filters={filters} genres={genres} hasQuery={Boolean(q)} showClear={filtered} />
        {params.view && <input type="hidden" name="view" value={params.view} />}
      </SearchForm>
      {topPicks.length > 0 && (
        <section aria-labelledby="top-books" className="mb-14">
          <div className="section-intro">
            <h2 id="top-books" className="section-heading">This week&apos;s top books</h2>
            <p>Picked by our librarians.</p>
          </div>
          <CoverShelf books={topPicks} names={pickNames} />
        </section>
      )}
      <div className="results-head">
        <h2 className="section-heading">{filtered ? "Search results" : "All books"}</h2>
        {books.length > 0 && (
          <nav aria-label="Catalogue layout" className="view-toggle">
            {[["shelf", "Shelf"], ["list", "List"]].map(([value, label]) => (
              <Link key={value} href={viewHref({ q, filters, view: value })} scroll={false} replace aria-current={view === value ? "true" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
      {books.length === 0 ? (
        <div className="empty-results">
          <p>{filtered ? "No books match your search. Try fewer words or clear the filters." : "No books in the catalogue yet."}</p>
          {filtered && <Link href="/" className="btn btn-sm">Clear the search</Link>}
        </div>
      ) : view === "shelf" ? (
        <SpineShelf books={books} names={bookNames} />
      ) : (
        <BookTable books={books} names={bookNames} />
      )}
      <Pagination basePath="/" params={params} page={page} hasNext={hasNext} />
    </>
  );
}
