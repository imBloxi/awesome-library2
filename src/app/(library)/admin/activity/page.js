import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listAdminEvents } from "@/lib/queries/admin";
import { parsePage } from "@/lib/search-params.mjs";
import { utcTimestamp } from "@/lib/circulation-format.mjs";
import { PageTitle, Skeleton, Pagination } from "@/components/ui";

const LABELS = {
  "book.create": "added a book",
  "book.update": "edited a book",
  "book.delete": "deleted a book",
  "book.restore": "restored a book",
  "book.import": "imported books",
  "loan.pickup": "marked a pickup",
  "loan.return": "marked a return",
  "hold.cancel": "cancelled a hold",
  "hold.extend": "extended a hold",
  "user.role": "changed a role",
  "member.note": "added a note on a member",
  "member.warning": "warned a member",
  "member.restrict": "paused a member's borrowing",
  "member.suspend": "suspended a member",
  "member.lift": "lifted a restriction",
  "watch.switch": "switched the watchlist",
  "watch.add": "added a watchlist keyword",
  "watch.toggle": "toggled a watchlist keyword",
  "watch.remove": "removed a watchlist keyword",
};

export default function ActivityPage({ searchParams }) {
  return (
    <>
      <PageTitle>Activity</PageTitle>
      <Suspense fallback={<Skeleton />}>
        <Activity searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Activity({ searchParams }) {
  await requireAdmin();
  const page = parsePage((await searchParams).page);
  const { rows, hasNext } = await listAdminEvents(page);
  if (rows.length === 0) return <p className="text-muted">No admin activity yet.</p>;
  return (
    <>
      <ul className="divide-y divide-line">
        {rows.map((e) => {
          const at = utcTimestamp(e.created_at);
          return (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm [overflow-wrap:anywhere]">
              <p>
                <span className="font-medium">{e.actor_email ?? "An admin"}</span> {LABELS[e.action] ?? e.action}
                {e.book_id && <> · <Link href={`/books/${e.book_id}`} className="link">{e.book_title ?? `book ${e.book_id}`}</Link></>}
                {e.target_user && <> · <Link href={`/admin/users/${encodeURIComponent(e.target_user)}`} className="link">member</Link></>}
                {e.reservation_id && <span className="text-muted"> · reservation {e.reservation_id}</span>}
                {e.detail && <span className="text-muted"> · {e.detail}</span>}
              </p>
              {at && <time dateTime={at.dateTime} className="text-muted">{at.text}</time>}
            </li>
          );
        })}
      </ul>
      <Pagination basePath="/admin/activity" params={{}} page={page} hasNext={hasNext} />
    </>
  );
}
