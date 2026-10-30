import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { listUserReservations } from "@/lib/queries/reservations";
import { MAX_ACTIVE } from "@/lib/queries/reserve-sql.mjs";
import { deleteReservationAction, returnAction } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { PageTitle, Skeleton, StatusBadge, formatDate } from "@/components/ui";

export default function ReservationsPage() {
  return (
    <>
      <PageTitle>My reservations</PageTitle>
      <Suspense fallback={<Skeleton />}>
        <Reservations />
      </Suspense>
    </>
  );
}

async function Reservations() {
  const user = await requireUser();
  const rows = await listUserReservations(user.id);
  const active = rows.filter((r) => r.status === "reserved" || r.status === "picked_up").length;

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        {active} of {MAX_ACTIVE} reservations in use. Holds expire if not picked up within 7 days.
      </p>
      {rows.length === 0 ? (
        <p className="text-muted">
          No reservations yet. <Link href="/" className="link">Find a book</Link>
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={`/books/${r.book_id}`} className="font-semibold">{r.title}</Link>
                <p className="text-sm text-muted">
                  {r.author} · reserved {formatDate(r.reserved_at)}
                  {r.status === "reserved" && ` · pick up by ${formatDate(r.expires_at)}`}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge status={r.status} daysLeft={r.days_left} />
                {r.status === "picked_up" ? (
                  <ActionButton action={returnAction} id={r.id} label="Return" pendingLabel="Returning…" doneLabel="Returned ✓" />
                ) : (
                  <ActionButton
                    action={deleteReservationAction}
                    id={r.id}
                    label={r.status === "reserved" ? "Cancel" : "Delete"}
                    pendingLabel="Deleting…"
                    doneLabel={r.status === "reserved" ? "Cancelled" : "Deleted"}
                    fadeRow
                    variant="danger"
                    confirm={r.status === "reserved" ? "Cancel this reservation?" : undefined}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
