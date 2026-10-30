import Link from "next/link";
import { BookCover, BookSpine } from "@/components/book-cover";
import { Availability, TopPickBadge } from "@/components/ui";
import { FORWARD } from "@/components/page-turn";

const authorHref = (author) => `/?q=${encodeURIComponent(author)}`;
const NO_NAMES = new Map();

// Catalogue results as index-card rows. On phones the author and year fold under the title.
// names: Map of book id → shared-element name, from transitionNames().
export function BookTable({ books, names = NO_NAMES }) {
  return (
    <table className="data-table catalog-table">
      <thead>
        <tr>
          <th scope="col" className="w-14"><span className="sr-only">Cover</span></th>
          <th scope="col">Title</th>
          <th scope="col" className="hidden sm:table-cell">Author</th>
          <th scope="col" className="hidden w-20 md:table-cell">Year</th>
          <th scope="col" className="w-40">Availability</th>
        </tr>
      </thead>
      <tbody>
        {books.map((b) => (
          <tr key={b.id} className="group">
            <td>
              <Link href={`/books/${b.id}`} transitionTypes={FORWARD} className="cover-link block" tabIndex={-1} aria-hidden="true">
                <BookCover book={b} size="sm" vtName={names.get(String(b.id))} />
              </Link>
            </td>
            <td>
              <Link href={`/books/${b.id}`} transitionTypes={FORWARD} className="catalog-title">{b.title}</Link>
              {b.is_top_pick && <span className="ml-2"><TopPickBadge /></span>}
              <span className="mt-0.5 block text-sm text-muted sm:hidden">
                {b.author}{b.published_year ? `, ${b.published_year}` : ""}
              </span>
            </td>
            <td className="hidden text-muted sm:table-cell">
              <Link href={authorHref(b.author)} className="hover:text-ink hover:underline" title={`More by ${b.author}`}>{b.author}</Link>
            </td>
            <td className="hidden tabular-nums text-muted md:table-cell">{b.published_year ?? "–"}</td>
            <td><Availability available={b.available} total={b.total_copies} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Covers standing on a shelf: top picks and related books.
export function CoverShelf({ books, names = NO_NAMES, showAvailability = true }) {
  return (
    <ul className="cover-shelf">
      {books.map((b) => (
        <li key={b.id} className="cover-shelf-item">
          <Link href={`/books/${b.id}`} transitionTypes={FORWARD} className="cover-link group block" title={b.title}>
            <span className="cover-stand"><BookCover book={b} vtName={names.get(String(b.id))} /></span>
            <span className="cover-shelf-title">{b.title}</span>
            <span className="cover-shelf-author">{b.author}</span>
          </Link>
          {showAvailability && b.available != null && (
            <span className="mt-1 block"><Availability available={b.available} total={b.total_copies} short /></span>
          )}
        </li>
      ))}
    </ul>
  );
}

function availabilityText(b) {
  const n = Math.max(0, b.available ?? 0);
  return n > 0 ? `${n} of ${b.total_copies} available` : "none available";
}

// The catalogue as spines on shelves. Pointing at a spine pulls it out and shows its
// catalogue card under the shelf; the link's own text carries the same information.
export function SpineShelf({ books, names = NO_NAMES }) {
  return (
    <div className="spine-shelf-wrap">
      <ul className="spine-shelf">
        {books.map((b) => (
          <li key={b.id}>
            <Link href={`/books/${b.id}`} transitionTypes={FORWARD} className="spine-link">
              <BookSpine book={b} available={b.available} vtName={names.get(String(b.id))} />
              <span className="sr-only">
                {b.title}, by {b.author}{b.published_year ? `, ${b.published_year}` : ""}. {availabilityText(b)}.
              </span>
            </Link>
            <span className="spine-card" aria-hidden="true">
              <span className="spine-card-title">{b.title}</span>
              <span className="spine-card-meta">
                {b.author}{b.published_year ? `, ${b.published_year}` : ""}
              </span>
              <span className="spine-card-meta">
                {b.is_top_pick ? "Top pick this week. " : ""}{availabilityText(b).replace(/^./, (c) => c.toUpperCase())}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="spine-shelf-hint" aria-hidden="true">Point at a spine to read its card.</p>
    </div>
  );
}
