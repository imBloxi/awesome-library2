import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { searchBooks, listDeletedBooks, countTopPicks } from "@/lib/queries/books";
import { TOP_PICKS_LIMIT } from "@/lib/constants";
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
            <a href="/admin/export/books" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Export CSV</a>
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
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);
  const [{ books, hasNext }, topPicks] = await Promise.all([searchBooks({ q, page }), countTopPicks()]);

  return (
    <>
      <Tabs current="active" />
      <SearchForm action="/admin/books" q={q} />
      {topPicks > TOP_PICKS_LIMIT && (
        <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
          {topPicks} top picks, only the {TOP_PICKS_LIMIT} newest show on the home page.
        </p>
      )}
      {books.length === 0 ? (
        <p className="text-zinc-500">No books found.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {books.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={`/books/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                {b.is_top_pick && <span className="ml-2"><TopPickBadge /></span>}
                <p className="text-sm text-zinc-500">{b.author}{b.isbn ? ` · ${b.isbn}` : ""}</p>
              </div>
              <div className="flex items-start gap-3">
                <Availability available={b.available} total={b.total_copies} />
                <Link href={`/admin/books/${b.id}/edit`} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Edit</Link>
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
    <Link href={href} className={current === key ? "font-medium underline" : "text-zinc-500 hover:underline"}>{label}</Link>
  );
  return <div className="mb-4 flex gap-4 text-sm">{tab("active", "Catalog", "/admin/books")}{tab("deleted", "Deleted", "/admin/books?show=deleted")}</div>;
}

async function DeletedBooks() {
  const books = await listDeletedBooks();
  return (
    <>
      <Tabs current="deleted" />
      {books.length === 0 ? (
        <p className="text-zinc-500">No deleted books.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-500">Restoring a book brings it back to the catalog. Its ISBN was cleared when it was deleted, so add it again from Edit.</p>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {books.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-zinc-500">{b.author} · deleted {formatDate(b.deleted_at)}</p>
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
