import Link from "next/link";

// Extra inputs for the catalog SearchForm. Plain GET fields, so they end up in the URL.
export function CatalogFilters({ filters, showClear = false }) {
  return (
    <fieldset className="groupbox order-last flex w-full flex-wrap items-center gap-x-5 gap-y-2">
      <legend>Narrow your search</legend>
      <label className="ui flex items-center gap-2 text-sm">
        <input type="checkbox" name="available" value="1" defaultChecked={filters.available} className="size-4" />
        On the shelf now
      </label>
      <span className="ui flex items-center gap-2 text-sm">
        Published
        <input
          type="number" name="from" min={0} max={2100} placeholder="from" aria-label="Published from year"
          defaultValue={filters.yearFrom ?? ""} className="field w-24"
        />
        –
        <input
          type="number" name="to" min={0} max={2100} placeholder="to" aria-label="Published up to year"
          defaultValue={filters.yearTo ?? ""} className="field w-24"
        />
      </span>
      {showClear && <Link href="/" className="ui ml-auto text-sm">Clear all filters</Link>}
    </fieldset>
  );
}
