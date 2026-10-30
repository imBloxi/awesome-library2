"use client";

import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { reserveAction, joinWaitlistAction, leaveWaitlistAction, saveBookAction } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { Availability } from "@/components/ui";

const HOLD_DAYS = 7; // matches the reservations.expires_at default

// One small block per copy: free copies are bound in green cloth, the rest stay grey.
// Reserving turns one grey the moment you click.
function CopyTicks({ available, total }) {
  const count = Math.min(Math.max(0, total), 12);
  if (count < 1) return null;
  return (
    <span className="copy-ticks" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i} data-free={i < available ? "" : undefined} />)}
    </span>
  );
}

// The date stamp that lands when a reservation goes through.
function ReservedStamp({ due }) {
  if (!due) return null;
  return (
    <span className="reserve-stamp" aria-hidden="true">
      <span>Reserved</span>
      <small>Pick up by {due}</small>
    </span>
  );
}

// Live availability and what the member can do with this book: reserve it, join or leave
// its waitlist, or save it for later. Reserve updates the count the instant you click;
// if the server refuses, both roll back and the reason shows.
// member: null when signed out, else { holding, saved, position, queueLength, paused }.
export function ReserveBox({ bookId, available, total, member }) {
  const [optimistic, setOptimistic] = useOptimistic({ available, reserved: false, due: null });
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    // The pickup deadline is fixed at the moment of the click, for the stamp.
    const due = new Date(Date.now() + HOLD_DAYS * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    setOptimistic((s) => ({ available: s.available - 1, reserved: true, due }));
    const result = await reserveAction(prev, formData);
    return result?.error ? result : { ...result, due };
  }, {});
  const reserved = optimistic.reserved || Boolean(state?.message);
  const holding = member?.holding;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <CopyTicks available={optimistic.available} total={total} />
        <Availability available={optimistic.available} total={total} />
      </div>
      {!member ? (
        <p className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <Link href="/auth/sign-in" className="btn btn-primary">Sign in to reserve</Link>
          <span>or <Link href="/auth/sign-up" className="link">create an account</Link></span>
        </p>
      ) : reserved || holding ? (
        <>
        {reserved && !holding && <ReservedStamp due={optimistic.due ?? state?.due} />}
        <p role="status" className="text-sm text-ok">
          {holding === "picked_up" ? "You're borrowing this book." : "Reserved. Pick it up at the library within 7 days."}{" "}
          <Link href="/reservations" className="link">See your reservations</Link>
        </p>
        </>
      ) : member.paused ? (
        <p className="slip slip-bad">
          {member.paused.kind === "suspend" ? "Your account is suspended" : "Borrowing is paused on your account"}
          {member.paused.until ? ` until ${member.paused.until}` : ""}. You can still return books.{" "}
          <Link href="/account#standing" className="link">See why</Link>
        </p>
      ) : available > 0 ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={bookId} />
          <div><button type="submit" disabled={pending} className="btn btn-primary">Reserve this book</button></div>
          <p className="text-sm text-muted">
            We hold it for 7 days. <Link href="/reservations" className="link">See your reservations</Link>
          </p>
        </form>
      ) : member.position ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>
            You&apos;re <strong>number {member.position}</strong> of {member.queueLength} on the waitlist.
            When a copy comes back, it&apos;s held for you for 7 days.
          </p>
          <div><ActionButton action={leaveWaitlistAction} id={bookId} label="Leave the waitlist" pendingLabel="Leaving…" doneLabel="Left" /></div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm text-muted">
          <p>All copies are out right now. Join the waitlist and the next free copy is held for you.</p>
          <div><ActionButton action={joinWaitlistAction} id={bookId} label="Join the waitlist" pendingLabel="Joining…" doneLabel="Joined ✓" variant="primary" /></div>
        </div>
      )}
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {member && (
        <div>
          <ActionButton
            key={String(member.saved)}
            action={saveBookAction}
            id={bookId}
            fields={{ save: member.saved ? "0" : "1" }}
            label={member.saved ? "Saved ✓ Remove" : "Save for later"}
            pendingLabel="Saving…"
            doneLabel={member.saved ? "Removed" : "Saved ✓"}
          />
        </div>
      )}
    </div>
  );
}
