import Link from "next/link";
import { inputClass } from "@/components/ui";

// Extra inputs for the catalog SearchForm. Plain GET fields, so they end up in the URL.
export function CatalogFilters({ filters, showClear = false }) {
  return (
    <div className="order-last flex w-full flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="available" value="1" defaultChecked={filters.available} />
        Available now
      </label>
      <input
        type="number" name="from" min={0} max={2100} placeholder="Year from" aria-label="Published from year"
        defaultValue={filters.yearFrom ?? ""} className={`${inputClass} w-28`}
      />
      <input
        type="number" name="to" min={0} max={2100} placeholder="Year to" aria-label="Published up to year"
        defaultValue={filters.yearTo ?? ""} className={`${inputClass} w-28`}
      />
      {showClear && <Link href="/" className="text-zinc-500 underline">Clear filters</Link>}
    </div>
  );
}
