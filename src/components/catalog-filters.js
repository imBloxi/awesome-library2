import Link from "next/link";

// Extra inputs for the catalog SearchForm. Plain GET fields, so they end up in the URL.
export function CatalogFilters({ filters, showClear = false }) {
  return (
    <fieldset className="order-last flex w-full flex-wrap items-center gap-x-6 gap-y-3 text-sm">
      <legend className="sr-only">Filters</legend>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" name="available" value="1" defaultChecked={filters.available} className="size-4 accent-ink" />
        Available now
      </label>
      <span className="flex items-center gap-2 text-muted">
        Published
        <input
          type="number" name="from" min={0} max={2100} placeholder="From" aria-label="Published from year"
          defaultValue={filters.yearFrom ?? ""} className="field w-24 py-1.5"
        />
        <span aria-hidden="true">–</span>
        <input
          type="number" name="to" min={0} max={2100} placeholder="To" aria-label="Published up to year"
          defaultValue={filters.yearTo ?? ""} className="field w-24 py-1.5"
        />
      </span>
      {showClear && <Link href="/" className="link ml-auto">Clear filters</Link>}
    </fieldset>
  );
}
