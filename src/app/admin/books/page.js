import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { searchBooks, listDeletedBooks, countTopPicks } from "@/lib/queries/books";
import { TOP_PICKS_LIMIT } from "@/lib/constants";
import { parseSearchParams } from "@/lib/search-params.mjs";
import { deleteBookAction, restoreBookAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, Availability, Pagination, TopPickBadge, buttonClass, formatDate } from "@/components/ui";

export default function AdminBooksPage({ searchParams }) {
  return (
    <>
      <PageTitle
        action={
          <div className="flex gap-2">
            {/* A file download, not a page: <Link> would prefetch it as one. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/export/books" className="btn">Export CSV</a>
            <Link href="/admin/books/new" className={buttonClass}>Add book</Link>
          </div>
        }
      >
        Books
      </PageTitle>
      <Suspense fallback={<><SearchForm action="/admin/books" /><Skeleton /></>}>
        <BookTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BookTable({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  if (sp.show === "deleted") return <DeletedBooks />;
  const { q, page } = parseSearchParams(sp);
  const [{ books, hasNext }, topPicks] = await Promise.all([searchBooks({ q, page }), countTopPicks()]);

  return (
    <>
      <Tabs current="active" />
      <SearchForm action="/admin/books" q={q} />
      {topPicks > TOP_PICKS_LIMIT && (
        <p className="mb-3 text-sm ui bevel-in bg-paper p-2 text-black">
          {topPicks} top picks, only the {TOP_PICKS_LIMIT} newest show on the home page.
        </p>
      )}
      {books.length === 0 ? (
        <p className="text-muted">No books found.</p>
      ) : (
        <ul className="divide-y divide-silver">
          {books.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={`/books/${b.id}`} className="font-bold">{b.title}</Link>
                {b.is_top_pick && <span className="ml-2"><TopPickBadge /></span>}
                <p className="text-sm text-muted">{b.author}{b.isbn ? ` · ${b.isbn}` : ""}</p>
              </div>
              <div className="flex items-start gap-3">
                <Availability available={b.available} total={b.total_copies} />
                <Link href={`/admin/books/${b.id}/edit`} className="btn btn-sm">Edit</Link>
                <ActionButton action={deleteBookAction} id={b.id} label="Delete" pendingLabel="Deleting…" variant="danger" confirm={`Delete “${b.title}”?`} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination basePath="/admin/books" params={q ? { q } : {}} page={page} hasNext={hasNext} />
    </>
  );
}

function Tabs({ current }) {
  const tab = (key, label, href) => (
    <Link href={href} className={current === key ? "font-medium underline" : "text-muted hover:underline"}>{label}</Link>
  );
  return <div className="mb-4 flex gap-4 text-sm">{tab("active", "Catalog", "/admin/books")}{tab("deleted", "Deleted", "/admin/books?show=deleted")}</div>;
}

async function DeletedBooks() {
  const books = await listDeletedBooks();
  return (
    <>
      <Tabs current="deleted" />
      {books.length === 0 ? (
        <p className="text-muted">No deleted books.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">Restoring a book brings it back to the catalog. Its ISBN was cleared when it was deleted, so add it again from Edit.</p>
          <ul className="divide-y divide-silver">
            {books.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-muted">{b.author} · deleted {formatDate(b.deleted_at)}</p>
                </div>
                <ActionButton action={restoreBookAction} id={b.id} label="Restore" pendingLabel="Restoring…" />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
