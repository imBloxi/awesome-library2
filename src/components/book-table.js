import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { Availability, TopPickBadge } from "@/components/ui";

const authorHref = (author) => `/?q=${encodeURIComponent(author)}`;

// Catalog results. On phones the author and year fold under the title.
export function BookTable({ books }) {
  return (
    <table className="data-table">
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
            <td><BookCover book={b} size="sm" /></td>
            <td>
              <Link href={`/books/${b.id}`} className="font-medium group-hover:underline">{b.title}</Link>
              {b.is_top_pick && <span className="ml-2"><TopPickBadge /></span>}
              <span className="mt-0.5 block text-sm text-muted sm:hidden">
                {b.author}{b.published_year ? ` · ${b.published_year}` : ""}
              </span>
            </td>
            <td className="hidden text-muted sm:table-cell">
              <Link href={authorHref(b.author)} className="hover:text-ink hover:underline" title={`More by ${b.author}`}>{b.author}</Link>
            </td>
            <td className="hidden tabular-nums text-muted md:table-cell">{b.published_year ?? "—"}</td>
            <td><Availability available={b.available} total={b.total_copies} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// A grid of covers, used for top picks and "More by this author".
export function CoverShelf({ books }) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-6">
      {books.map((b) => (
        <li key={b.id} className="min-w-0">
          <Link href={`/books/${b.id}`} className="group block" title={b.title}>
            <span className="block transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              <BookCover book={b} />
            </span>
            <span className="mt-3 block truncate text-sm font-medium group-hover:underline">{b.title}</span>
            <span className="block truncate text-sm text-muted">{b.author}</span>
          </Link>
          <span className="mt-1 block"><Availability available={b.available} total={b.total_copies} short /></span>
        </li>
      ))}
    </ul>
  );
}
