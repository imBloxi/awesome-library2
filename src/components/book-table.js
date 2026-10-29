import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { Availability, TopPickBadge } from "@/components/ui";

const authorHref = (author) => `/?q=${encodeURIComponent(author)}`;

// Catalog results. On phones the author and year fold under the title.
export function BookTable({ books }) {
  return (
    <table className="retro-table bevel-in">
      <thead>
        <tr>
          <th scope="col" className="w-12"><span className="sr-only">Cover</span></th>
          <th scope="col">Title</th>
          <th scope="col" className="hidden sm:table-cell">Author</th>
          <th scope="col" className="hidden w-16 md:table-cell">Year</th>
          <th scope="col" className="w-40">Status</th>
        </tr>
      </thead>
      <tbody>
        {books.map((b) => (
          <tr key={b.id}>
            <td><BookCover book={b} size="sm" /></td>
            <td>
              <Link href={`/books/${b.id}`} className="font-bold">{b.title}</Link>
              {b.is_top_pick && <> <TopPickBadge /></>}
              <span className="block text-sm text-muted sm:hidden">
                {b.author}{b.published_year ? `, ${b.published_year}` : ""}
              </span>
            </td>
            <td className="hidden sm:table-cell">
              <Link href={authorHref(b.author)} title={`Search for ${b.author}`}>{b.author}</Link>
            </td>
            <td className="hidden md:table-cell">{b.published_year ?? "—"}</td>
            <td><Availability available={b.available} total={b.total_copies} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// "This week's top books" as a shelf of covers.
export function CoverShelf({ books }) {
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6">
      {books.map((b) => (
        <li key={b.id} className="min-w-0">
          <Link href={`/books/${b.id}`} className="group block no-underline" title={b.title}>
            <span className="block transition-transform group-hover:-translate-y-1 motion-reduce:transition-none">
              <BookCover book={b} />
            </span>
            <span className="mt-2 block truncate text-sm font-bold underline">{b.title}</span>
          </Link>
          <Availability available={b.available} total={b.total_copies} short />
        </li>
      ))}
    </ul>
  );
}
