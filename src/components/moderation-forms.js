"use client";

import { useActionState, useState } from "react";
import { moderateAction, liftModerationAction } from "@/app/(library)/admin/actions";

const KINDS = [
  ["warning", "Warn", "The member sees the warning and its reason."],
  ["restrict", "Pause borrowing", "No new reservations, waitlists or renewals. Returns and reading still work."],
  ["suspend", "Suspend account", "Borrowing paused and reading access closed. Returns still work."],
  ["note", "Staff note", "Visible to staff only. The member sees that a note was added, not its text."],
];

function Feedback({ state }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state.message && <p className="text-sm text-ok">{state.message}</p>}
    </div>
  );
}

export function ModerationForm({ userId }) {
  const [kind, setKind] = useState("warning");
  const [state, action, pending] = useActionState(moderateAction, {});
  const blocking = kind === "restrict" || kind === "suspend";
  const hint = KINDS.find(([k]) => k === kind)[2];
  return (
    <form action={action} className="moderation-form" key={state.message ? `done-${state.message}` : "form"}>
      <input type="hidden" name="id" value={userId} />
      <fieldset className="moderation-kinds">
        <legend className="text-sm font-medium">Action</legend>
        {KINDS.map(([value, label]) => (
          <label key={value} className="filter-chip filter-toggle" data-kind={value}>
            <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-muted">{hint}</p>
      {blocking && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          How long
          <select name="duration" defaultValue="7" className="field w-auto">
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="indefinite">Until lifted</option>
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Reason {kind === "note" ? "(staff only)" : "(shown to the member)"}
        <textarea name="reason" required minLength={3} maxLength={1000} rows={3} className="field" placeholder={kind === "note" ? "What staff should know" : "Explain what happened and what the member should do"} />
      </label>
      <Feedback state={state} />
      <div>
        <button type="submit" disabled={pending} className={`btn ${blocking ? "btn-danger" : "btn-primary"}`}>
          {pending ? "Saving…" : KINDS.find(([k]) => k === kind)[1]}
        </button>
      </div>
    </form>
  );
}

export function LiftForm({ userId }) {
  const [state, action, pending] = useActionState(liftModerationAction, {});
  return (
    <form action={action} className="moderation-form">
      <input type="hidden" name="id" value={userId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Why it&apos;s being lifted
        <input name="reason" required minLength={3} maxLength={1000} className="field" placeholder="e.g. Books returned, talked at the desk" />
      </label>
      <Feedback state={state} />
      <div><button type="submit" disabled={pending} className="btn">{pending ? "Lifting…" : "Lift restriction"}</button></div>
    </form>
  );
}
