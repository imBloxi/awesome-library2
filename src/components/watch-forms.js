"use client";

import { useActionState } from "react";
import { setWatchlistAction, addWatchTermAction, toggleWatchTermAction, deleteWatchTermAction } from "@/app/(library)/admin/actions";

function Feedback({ state }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state.message && <p className="text-sm text-ok">{state.message}</p>}
    </div>
  );
}

export function WatchSwitch({ enabled }) {
  const [state, action, pending] = useActionState(setWatchlistAction, {});
  return (
    <form action={action} className="watch-switch" data-on={enabled ? "" : undefined}>
      <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
      <div>
        <p className="font-semibold">{enabled ? "Watchlist is on" : "Watchlist is off"}</p>
        <p className="text-sm text-muted">
          {enabled
            ? "Matching books are marked on their pages, and members who reserve, borrow, wait for or save them are flagged."
            : "Keywords are kept but nothing is matched or flagged."}
        </p>
        <Feedback state={state} />
      </div>
      <button type="submit" disabled={pending} role="switch" aria-checked={enabled} className={`btn ${enabled ? "btn-danger" : "btn-primary"}`}>
        {pending ? "Saving…" : enabled ? "Switch off" : "Switch on"}
      </button>
    </form>
  );
}

export function AddTermForm() {
  const [state, action, pending] = useActionState(addWatchTermAction, {});
  return (
    <form action={action} className="watch-add" key={state.message ?? "form"}>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Keyword
        <input name="term" required minLength={2} maxLength={80} className="field" placeholder="e.g. a title, author or subject" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Why it&apos;s watched
        <input name="reason" required minLength={3} maxLength={500} className="field" placeholder="Shown to staff" />
      </label>
      <div className="self-end"><button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Adding…" : "Add keyword"}</button></div>
      <div className="watch-add-feedback"><Feedback state={state} /></div>
    </form>
  );
}

export function TermActions({ id, active }) {
  const [toggleState, toggle, toggling] = useActionState(toggleWatchTermAction, {});
  const [deleteState, remove, removing] = useActionState(deleteWatchTermAction, {});
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggle}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={toggling} role="switch" aria-checked={active} className="btn btn-sm">{active ? "Pause" : "Resume"}</button>
      </form>
      <form action={remove} onSubmit={(e) => { if (!window.confirm("Remove this keyword from the watchlist?")) e.preventDefault(); }}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={removing} className="btn btn-sm btn-danger">Remove</button>
      </form>
      <Feedback state={toggleState.error ? toggleState : deleteState} />
    </div>
  );
}
