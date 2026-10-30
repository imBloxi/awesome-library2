import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditionContents, EditionChapter } from "@/components/babel-edition";
import { Skeleton } from "@/components/ui";
import { parseRouteInt } from "@/lib/babel-book/limits.mjs";

// Route bodies shared by /books/[id]/read/... and /babel/...: `load` turns the route params
// into an edition (or null). Params are awaited inside Suspense, so each URL can be
// prerendered on first visit and served from the cache after that.
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
        downloadHref={`${data.basePath}/download`}
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
