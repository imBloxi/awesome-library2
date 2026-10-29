import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { requireAdmin } from "@/lib/dal";
import { listReservationPage, getReservationMember } from "@/lib/queries/reservations";
import { parseReservationParams, reservationParams } from "@/lib/reservation-params.mjs";
import { LOAN_DAYS } from "@/lib/constants";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { PageTitle, Skeleton, Pagination, inputClass, buttonClass } from "@/components/ui";

const STATUS_OPTIONS = {
  active: "Active",
  attention: "Needs attention",
  expiring: "Expiring within 24h",
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
  const options = parseReservationParams(await searchParams);
  const { q, status, sort, userId, page } = options;
  const [{ rows, hasNext }, member] = await Promise.all([
    listReservationPage(options),
    userId ? getReservationMember(userId) : Promise.resolve(null),
  ]);

  return (
    <>
      {userId && (
        <section aria-label="Selected member" className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <p className="text-sm text-muted">Reservations for</p>
            {member ? (
              <>
                <p className="font-semibold">{member.name || member.email}</p>
                {member.name && <p className="text-sm text-muted">{member.email}</p>}
              </>
            ) : (
              <p className="font-medium">Member not found.</p>
            )}
          </div>
          <Link href={{ pathname: "/admin/reservations", query: reservationParams({ ...options, userId: "" }) }} className="link text-sm">Clear member filter</Link>
        </section>
      )}
      <Form
        key={JSON.stringify([q, status, sort, userId])}
        action="/admin/reservations"
        role="search"
        className="mb-6 grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
      >
        <label className="min-w-0 text-sm">
          <span className="mb-1 block">Search</span>
          <input name="q" type="search" defaultValue={q} placeholder="Member name, email or book title" className={inputClass} />
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1 block">Status</span>
          <select name="status" defaultValue={status} className={inputClass}>
            {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1 block">Sort</span>
          <select name="sort" defaultValue={sort} className={inputClass}>
            <option value="priority">Priority</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
        {userId && <input type="hidden" name="user" value={userId} />}
        <button type="submit" className={`${buttonClass} py-[0.6rem]`}>Apply filters</button>
      </Form>
      <p className="mb-4 text-sm text-muted">
        {sort === "priority" ? "Priority puts overdue loans first, then expiring holds, then other deadlines." : "Newest reservations first."} All times are UTC. Up to 20 reservations per page.
      </p>
      {rows.length === 0 ? (
        <p className="text-muted">{userId && !member ? "No reservations found for this member." : "No reservations match these filters."}</p>
      ) : (
        <AdminReservationList rows={rows} />
      )}
      <Pagination basePath="/admin/reservations" params={reservationParams(options)} page={page} hasNext={hasNext} />
      <p className="mt-8 text-sm text-muted">CSV export includes up to 50,000 reservations across all members and statuses, regardless of these filters.</p>
    </>
  );
}
