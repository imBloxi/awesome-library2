import Link from "next/link";
import { markPickedUpAction, adminReturnAction, cancelHoldAction, extendHoldAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { StatusBadge, formatDate } from "@/components/ui";
import { LOAN_DAYS } from "@/lib/constants";

// Shared by the reservations page and a book's edit page.
export function AdminReservationList({ rows, showBook = true }) {
  return (
    <ul className="divide-y divide-silver">
      {rows.map((r) => {
        const overdue = r.status === "picked_up" && r.loan_days > LOAN_DAYS;
        return (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              {showBook ? (
                <Link href={`/books/${r.book_id}`} className="font-bold">{r.title}</Link>
              ) : (
                <p className="font-medium">{r.user_name}</p>
              )}
              <p className="text-sm text-muted">
                {showBook ? `${r.user_name} (${r.user_email})` : r.user_email} · reserved {formatDate(r.reserved_at)}
                {r.picked_up_at && ` · picked up ${formatDate(r.picked_up_at)}`}
                {r.returned_at && ` · returned ${formatDate(r.returned_at)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <StatusBadge status={r.status} daysLeft={r.days_left} />
              {overdue && (
                <span className="whitespace-nowrap bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Overdue · {r.loan_days - LOAN_DAYS}d
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
