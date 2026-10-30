import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditionContents, EditionChapter } from "@/components/babel-edition";
import { Skeleton } from "@/components/ui";
import { parseRouteInt } from "@/lib/babel-book/limits.mjs";

// Route bodies shared by /books/[id]/read/... and /babel/...: `load` turns the route params
// into an edition (or null). Params are awaited inside Suspense, so each URL can be
// resolved behind a fresh session and loan check before any story is generated.
export function ContentsRoute({ params, load }) {
  return (
    <Suspense fallback={<Skeleton rows={10} />}>
      <Contents params={params} load={load} />
    </Suspense>
  );
}

async function Contents({ params, load }) {
  const data = await load(await params);
  if (!data) notFound();
  if (data.locked) return <ReadingLocked {...data} />;
  return (
    <>
      <BackLink {...data.backLink} />
      <EditionContents
        basePath={data.basePath}
        bookKey={data.bookKey}
        edition={data.edition}
        byline={data.byline}
        backCover={data.backCover}
        rollPath={data.rollPath}

        cover={data.cover}
      />
    </>
  );
}

export function ChapterRoute({ params, load }) {
  return (
    <Suspense fallback={<Skeleton rows={12} />}>
      <Chapter params={params} load={load} />
    </Suspense>
  );
}

async function Chapter({ params, load }) {
  const p = await params;
  const data = await load(p);
  if (data?.locked) return <ReadingLocked {...data} />;
  const index = parseRouteInt(p.chapter, data?.edition.chapters.length ?? 0);
  if (!data || !index) notFound();
  return (
    <>
      <BackLink {...data.backLink} />
      <EditionChapter basePath={data.basePath} bookKey={data.bookKey} edition={data.edition} index={index - 1} bookTitle={data.edition.title} />
    </>
  );
}

function BackLink({ href, label }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
      <Link href={href} className="hover:text-ink">{label}</Link>
    </nav>
  );
}

export function ReadingLocked({ signedIn, bookId }) {
  return (
    <section className="reading-locked" aria-labelledby="reader-access-heading">
      <div className="reading-locked-slip" aria-hidden="true">
        <span>Date due</span><span>Borrower</span>
        <span className="reading-locked-stamp">On loan only</span>
      </div>
      <h1 id="reader-access-heading" className="page-heading">Borrow it to read it</h1>
      <p>{signedIn
        ? bookId ? "Reserve this book and collect it from the library to unlock its editions. Access lasts while your loan is checked out." : "Collect a reserved book from the library to unlock Babel. Access lasts while you have at least one checked-out loan."
        : "Sign in to check your reading access. A confirmed library pickup is required to unlock the reader."}</p>
      <div className="reading-locked-actions">
        <Link className="btn btn-primary" href={signedIn ? bookId ? `/books/${bookId}` : "/reservations" : "/auth/sign-in"}>
          {signedIn ? bookId ? "View book and reserve" : "Open my library" : "Sign in"}
        </Link>
        <Link className="btn" href="/">Browse the catalogue</Link>
      </div>
    </section>
  );
}
