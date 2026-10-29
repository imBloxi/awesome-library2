import Link from "next/link";
import { markPickedUpAction, adminReturnAction, cancelHoldAction, extendHoldAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { StatusBadge } from "@/components/ui";
import { utcTimestamp } from "@/lib/circulation-format.mjs";

function Timestamp({ value }) {
  const timestamp = utcTimestamp(value);
  return timestamp ? <time dateTime={timestamp.dateTime}>{timestamp.text}</time> : <span>Unavailable</span>;
}

// Shared by the reservations page and a book's edit page.
export function AdminReservationList({ rows, showBook = true }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => {
        const overdue = r.status === "picked_up" && r.is_overdue === true;
        return (
          <li key={r.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {showBook ? (
                <Link href={`/books/${r.book_id}`} className="font-semibold">{r.title}</Link>
              ) : (
                <p className="font-medium">{r.user_name || r.user_email}</p>
              )}
              <p className="text-sm text-muted">
                {showBook && r.user_name ? `${r.user_name} (${r.user_email})` : r.user_email}
              </p>
              {(r.status === "reserved" || r.status === "picked_up") && (
                <p className={`mt-2 text-sm font-medium ${overdue ? "text-bad" : "text-ink"}`}>
                  {r.status === "reserved" ? "Pickup by" : "Due"}{" "}
                  <Timestamp value={r.status === "reserved" ? r.expires_at : r.due_at} />
                </p>
              )}
              <dl className="mt-2 space-y-1 text-sm text-muted">
                <div><dt className="inline">Reserved: </dt><dd className="inline"><Timestamp value={r.reserved_at} /></dd></div>
                {r.picked_up_at && <div><dt className="inline">Picked up: </dt><dd className="inline"><Timestamp value={r.picked_up_at} /></dd></div>}
                {r.returned_at && <div><dt className="inline">Returned: </dt><dd className="inline"><Timestamp value={r.returned_at} /></dd></div>}
              </dl>
            </div>
            <div className="flex flex-wrap items-start gap-2 sm:max-w-xs sm:justify-end">
              <StatusBadge status={r.status} />
              {overdue && (
                <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Overdue
                </span>
              )}
              {r.status === "reserved" && (
                <>
                  <ActionButton action={markPickedUpAction} id={r.id} label="Mark picked up" pendingLabel="Saving…" />
                  <ActionButton action={extendHoldAction} id={r.id} label="Extend 7 days" pendingLabel="Saving…" />
                  <ActionButton action={cancelHoldAction} id={r.id} label="Cancel hold" pendingLabel="Cancelling…" variant="danger" confirm="Cancel this hold?" />
                </>
              )}
              {r.status === "picked_up" && (
                <ActionButton action={adminReturnAction} id={r.id} label="Mark returned" pendingLabel="Saving…" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
