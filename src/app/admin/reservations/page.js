import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listAllReservations, STATUSES } from "@/lib/queries/reservations";
import { markPickedUpAction, adminReturnAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, StatusBadge, formatDate, inputClass } from "@/components/ui";

const STATUS_OPTIONS = {
  active: "Active",
  reserved: "Waiting for pickup",
  picked_up: "Borrowed",
  returned: "Returned",
  cancelled: "Cancelled",
  expired: "Expired",
  all: "All",
};

export default function AdminReservationsPage({ searchParams }) {
  return (
    <>
      <PageTitle>Reservations</PageTitle>
      <Suspense fallback={<Skeleton />}>
        <ReservationTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReservationTable({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = STATUSES.includes(sp.status) ? sp.status : "active";
  const rows = await listAllReservations({ status, q });

  return (
    <>
      <SearchForm action="/admin/reservations" q={q} placeholder="Search by user email or book title">
        <select name="status" defaultValue={status} className={`${inputClass} w-auto`} aria-label="Status">
          {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </SearchForm>
      {rows.length === 0 ? (
        <p className="text-zinc-500">No reservations found.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={`/books/${r.book_id}`} className="font-medium hover:underline">{r.title}</Link>
                <p className="text-sm text-zinc-500">
                  {r.user_name} ({r.user_email}) · reserved {formatDate(r.reserved_at)}
                  {r.picked_up_at && ` · picked up ${formatDate(r.picked_up_at)}`}
                  {r.returned_at && ` · returned ${formatDate(r.returned_at)}`}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge status={r.status} daysLeft={r.days_left} />
                {r.status === "reserved" && (
                  <ActionButton action={markPickedUpAction} id={r.id} label="Mark picked up" pendingLabel="Saving…" />
                )}
                {r.status === "picked_up" && (
                  <ActionButton action={adminReturnAction} id={r.id} label="Mark returned" pendingLabel="Saving…" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {rows.length === 200 && <p className="mt-4 text-sm text-zinc-500">Showing the 200 most recent. Narrow the search to see more.</p>}
    </>
  );
}
