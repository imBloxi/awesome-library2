import Link from "next/link";
import { inventBook, MAX_INVENTED_SEED } from "@/lib/babel-book/index.mjs";
import { BookCover } from "@/components/book-cover";
import { RandomEditionButton } from "@/components/reader-frame";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Babel: invented books · Library" };

// A fixed shelf so the page is fully static; the button invents a new one on every click.
const SHELF = [7, 42, 108, 256, 1999, 31415];

export default function BabelPage() {
  const books = SHELF.map((seed) => ({ seed, ...inventBook(seed) }));
  return (
    <>
      <PageTitle>The Babel shelf</PageTitle>
      <div className="mb-10 max-w-prose space-y-3 leading-relaxed">
        <p>
          Every number is a book that doesn&apos;t exist: a title, an author, a back cover and ten chapters,
          written on the spot by this library&apos;s own story generator. The same number always opens the same book.
        </p>
        <p className="text-sm text-muted">
          Collect a reserved library book to unlock these stories. Access lasts while you have an active picked-up loan. Catalogue editions require a loan of that specific book.
        </p>
        <div className="pt-2"><RandomEditionButton basePath="/babel" max={MAX_INVENTED_SEED} label="Invent a book" className="btn btn-primary" /></div>
      </div>
      <h2 className="mb-5 text-xl font-semibold tracking-tight">From the shelf</h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-6">
        {books.map((b) => (
          <li key={b.seed} className="min-w-0">
            <Link href={`/babel/${b.seed}`} className="group block" title={b.title}>
              <span className="block transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
                <BookCover book={{ id: b.seed, title: b.title, author: b.author }} />
              </span>
              <span className="mt-3 block truncate text-sm font-medium group-hover:underline">{b.title}</span>
              <span className="block truncate text-sm text-muted">{b.author}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
