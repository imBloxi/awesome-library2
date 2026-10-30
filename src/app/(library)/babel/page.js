import Link from "next/link";
import { inventBook, MAX_INVENTED_SEED } from "@/lib/babel-book/index.mjs";
import { BookCover } from "@/components/book-cover";
import { RandomEditionButton } from "@/components/reader-frame";
import { PageTitle } from "@/components/ui";
import { PageTurn, FORWARD } from "@/components/page-turn";
import { BabelDrift } from "@/components/babel-drift";
import { DRIFT_SEEDS } from "@/lib/babel-shelf.mjs";

export const metadata = { title: "Babel: invented books · Library" };

// A fixed shelf so the page is fully static; the button invents a new one on every click.
const SHELF = [7, 42, 108, 256, 1999, 31415];

export default function BabelPage() {
  const books = SHELF.map((seed) => ({ seed, ...inventBook(seed) }));
  const drifting = DRIFT_SEEDS.map((seed) => {
    const { title, author } = inventBook(seed);
    return { seed, title, author };
  });
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
      <section aria-labelledby="endless-shelf" className="mb-14">
        <div className="section-intro">
          <h2 id="endless-shelf" className="section-heading">The endless shelf</h2>
          <p>Every spine is written in the library&apos;s 25 symbols. Point at one to read its title.</p>
        </div>
        <BabelDrift books={drifting} />
      </section>
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
