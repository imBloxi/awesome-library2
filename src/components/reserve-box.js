"use client";

import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { reserveAction } from "@/app/actions";
import { Availability } from "@/components/ui";

// Live availability and the reserve button. The count drops and the confirmation shows
// the instant you click; if the server refuses, both roll back and the reason shows.
export function ReserveBox({ bookId, available, total, signedIn }) {
  const [optimistic, setOptimistic] = useOptimistic({ available, reserved: false });
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    setOptimistic((s) => ({ available: s.available - 1, reserved: true }));
    return reserveAction(prev, formData);
  }, {});
  const reserved = optimistic.reserved || Boolean(state?.message);

  return (
    <div className="flex flex-col gap-3">
      <div><Availability available={optimistic.available} total={total} /></div>
      {!signedIn ? (
        <p className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <Link href="/auth/sign-in" className="btn btn-primary">Sign in to reserve</Link>
          <span>or <Link href="/auth/sign-up" className="link">create an account</Link></span>
        </p>
      ) : reserved ? (
        <p role="status" className="text-sm text-ok">
          Reserved. Pick it up at the library within 7 days.{" "}
          <Link href="/reservations" className="link">See your reservations</Link>
        </p>
      ) : available > 0 ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={bookId} />
          <div><button type="submit" disabled={pending} className="btn btn-primary">Reserve this book</button></div>
          <p className="text-sm text-muted">
            We hold it for 7 days. <Link href="/reservations" className="link">See your reservations</Link>
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted">All copies are out right now. Check back in a few days.</p>
      )}
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
    </div>
  );
}
