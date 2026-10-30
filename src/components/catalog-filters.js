import Link from "next/link";

// Extra inputs for the catalog SearchForm, set out as tabs along the drawer front.
// Plain GET fields, so they end up in the URL.
// genres: [{ genre, n }] for the select; the current genre stays selectable even if empty now.
export function CatalogFilters({ filters, genres = [], hasQuery = false, showClear = false }) {
  const genreOptions = genres.map((g) => g.genre);
  if (filters.genre && !genreOptions.includes(filters.genre)) genreOptions.unshift(filters.genre);
  return (
    <fieldset className="catalog-filters">
      <legend className="sr-only">Filters</legend>
      <label className="filter-chip filter-toggle">
        <input type="checkbox" name="available" value="1" defaultChecked={filters.available} />
        <span>Available now</span>
      </label>
      <span className="filter-chip">
        <span aria-hidden="true">Published</span>
        <input
          type="number" name="from" min={0} max={2100} placeholder="from" aria-label="Published from year"
          defaultValue={filters.yearFrom ?? ""} className="filter-year"
        />
        <span aria-hidden="true">to</span>
        <input
          type="number" name="to" min={0} max={2100} placeholder="year" aria-label="Published up to year"
          defaultValue={filters.yearTo ?? ""} className="filter-year"
        />
      </span>
      {genreOptions.length > 0 && (
        <label className="filter-chip">
          <span>Genre</span>
          <select name="genre" defaultValue={filters.genre ?? ""}>
            <option value="">Any</option>
            {genreOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
      )}
      <label className="filter-chip">
        <span>Sort</span>
        <select name="sort" defaultValue={filters.sort ?? ""}>
          {hasQuery && <option value="relevance">Best match</option>}
          <option value="title">Title</option>
          <option value="newest">Newest in library</option>
          <option value="year">Publication year</option>
        </select>
      </label>
      {showClear && <Link href="/" className="link filter-clear">Clear filters</Link>}
    </fieldset>
  );
}
