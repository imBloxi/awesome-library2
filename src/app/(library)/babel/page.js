import Link from "next/link";
import { inventBook, MAX_INVENTED_SEED } from "@/lib/babel-book/index.mjs";
import { BookCover } from "@/components/book-cover";
import { RandomEditionButton } from "@/components/reader-frame";
import { PageTitle } from "@/components/ui";
import { PageTurn, FORWARD } from "@/components/page-turn";

export const metadata = { title: "Babel: invented books · Library" };

// A fixed shelf so the page is fully static; the button invents a new one on every click.
const SHELF = [7, 42, 108, 256, 1999, 31415];

export default function BabelPage() {
  const books = SHELF.map((seed) => ({ seed, ...inventBook(seed) }));
  return (
    <PageTurn>
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
      <h2 className="section-heading mb-6">From the shelf</h2>
      <ul className="cover-shelf">
        {books.map((b) => (
          <li key={b.seed} className="cover-shelf-item">
            <Link href={`/babel/${b.seed}`} transitionTypes={FORWARD} className="cover-link group block" title={b.title}>
              <span className="cover-stand"><BookCover book={{ id: b.seed, title: b.title, author: b.author }} vtName={`babel-${b.seed}`} /></span>
              <span className="cover-shelf-title">{b.title}</span>
              <span className="cover-shelf-author">{b.author}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageTurn>
  );
}
