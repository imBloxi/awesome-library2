import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { listUserReservations, listUserWaitlist, getMemberNotices } from "@/lib/queries/reservations";
import { listSaved } from "@/lib/queries/books";
import { MAX_ACTIVE } from "@/lib/queries/reserve-sql.mjs";
import { deleteReservationAction, returnAction, renewAction, leaveWaitlistAction, saveBookAction } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { Availability, PageTitle, Skeleton, StatusBadge, formatDate } from "@/components/ui";

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
  const [rows, waiting, saved, notices] = await Promise.all([
    listUserReservations(user.id),
    listUserWaitlist(user.id),
    listSaved(user.id),
    getMemberNotices(user.id),
  ]);
  const active = rows.filter((r) => r.status === "reserved" || r.status === "picked_up").length;

  return (
    <>
      <Notices notices={notices} />
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
                  {r.status === "picked_up" && r.due_at && (
                    <span className={r.is_overdue ? "font-medium text-bad" : ""}>
                      {` · ${r.is_overdue ? "overdue since" : "due"} ${formatDate(r.due_at)}`}
                    </span>
                  )}
                  {r.status === "reserved" && r.from_waitlist && " · from your waitlist"}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <StatusBadge status={r.status} daysLeft={r.days_left} />
                {r.status === "picked_up" ? (
                  <>
                    {r.can_renew && <ActionButton action={renewAction} id={r.id} label="Renew 4 weeks" pendingLabel="Renewing…" doneLabel="Renewed ✓" />}
                    <ActionButton action={returnAction} id={r.id} label="Return" pendingLabel="Returning…" doneLabel="Returned ✓" />
                  </>
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

      {waiting.length > 0 && (
        <section aria-labelledby="waitlist" className="mt-12">
          <h2 id="waitlist" className="mb-1 text-xl font-semibold tracking-tight">Waiting for</h2>
          <p className="mb-3 text-sm text-muted">When a copy comes back, it&apos;s held for you for 7 days and moves up to your reservations.</p>
          <ul className="divide-y divide-line">
            {waiting.map((w) => (
              <li key={w.book_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/books/${w.book_id}`} className="font-semibold">{w.title}</Link>
                  <p className="text-sm text-muted">{w.author} · number {w.position} in the queue</p>
                </div>
                <ActionButton action={leaveWaitlistAction} id={w.book_id} label="Leave" pendingLabel="Leaving…" doneLabel="Left" fadeRow />
              </li>
            ))}
          </ul>
        </section>
      )}

      {saved.length > 0 && (
        <section aria-labelledby="saved" className="mt-12">
          <h2 id="saved" className="mb-3 text-xl font-semibold tracking-tight">Saved for later</h2>
          <ul className="divide-y divide-line">
            {saved.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/books/${b.id}`} className="font-semibold">{b.title}</Link>
                  <p className="text-sm text-muted">{b.author}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Availability available={b.available} total={b.total_copies} />
                  <ActionButton action={saveBookAction} id={b.id} fields={{ save: "0" }} label="Remove" pendingLabel="Removing…" doneLabel="Removed" fadeRow />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Notices({ notices }) {
  const items = [];
  if (notices.overdue > 0) items.push({ tone: "bad", text: `${notices.overdue} ${notices.overdue === 1 ? "loan is" : "loans are"} overdue. Please return ${notices.overdue === 1 ? "it" : "them"} soon.` });
  if (notices.expiring > 0) items.push({ tone: "warn", text: `${notices.expiring} ${notices.expiring === 1 ? "hold ends" : "holds end"} within 24 hours. Pick ${notices.expiring === 1 ? "it" : "them"} up soon.` });
  if (notices.from_waitlist > 0) items.push({ tone: "ok", text: `Good news: ${notices.from_waitlist} ${notices.from_waitlist === 1 ? "book you waited for is" : "books you waited for are"} ready for pickup.` });
  else if (notices.ready > 0) items.push({ tone: "ok", text: `${notices.ready} ${notices.ready === 1 ? "book is" : "books are"} ready for pickup.` });
  if (items.length === 0) return null;
  const tones = { bad: "bg-[#fef3f2] text-bad", warn: "bg-[#fff7e6] text-[#8a5a00]", ok: "bg-[#ecfdf3] text-ok" };
  return (
    <ul className="mb-6 flex flex-col gap-2" aria-label="Notices">
      {items.map((n) => <li key={n.text} className={`rounded-lg px-4 py-3 text-sm ${tones[n.tone]}`}>{n.text}</li>)}
    </ul>
  );
}
