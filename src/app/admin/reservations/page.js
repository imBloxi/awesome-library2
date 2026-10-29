import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listAllReservations, STATUSES } from "@/lib/queries/reservations";
import { LOAN_DAYS } from "@/lib/constants";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, inputClass, buttonClass } from "@/components/ui";

const STATUS_OPTIONS = {
  active: "Active",
  reserved: "Waiting for pickup",
  picked_up: "Borrowed",
  overdue: `Overdue (over ${LOAN_DAYS} days)`,
  returned: "Returned",
  cancelled: "Cancelled",
  expired: "Expired",
  all: "All",
};

export default function AdminReservationsPage({ searchParams }) {
  return (
    <>
      <PageTitle
        action={
          // A file download, not a page: <Link> would prefetch it as one.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/admin/export/reservations" className={buttonClass}>Export CSV</a>
        }
      >
        Reservations
      </PageTitle>
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
        <p className="text-muted">No reservations found.</p>
      ) : (
        <AdminReservationList rows={rows} />
      )}
      {rows.length === 200 && <p className="mt-4 text-sm text-muted">Showing the 200 most recent. Narrow the search, or export the CSV for everything.</p>}
    </>
  );
}
