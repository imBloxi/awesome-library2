"use client";

import { useActionState, useOptimistic } from "react";

// A one-button form that calls a server action with a hidden id
// and shows the action's error or message next to it.
// doneLabel: shown the instant the button is clicked, until the server answers.
// If the server refuses, the button goes back and the error shows.
// fadeRow: also dim the surrounding list row, for actions that move it out of the list.
export function ActionButton({ action, id, label, pendingLabel, doneLabel, fadeRow = false, confirm, variant = "secondary", fields }) {
  const [done, setDone] = useOptimistic(false);
  // Set inside the action, so the optimistic label lasts until the server answers.
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    if (doneLabel) setDone(true);
    return action(prev, formData);
  }, {});
  const styles = { primary: "btn-primary", secondary: "", danger: "btn-danger" };

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      data-done={done ? "" : undefined}
      data-fade={fadeRow ? "" : undefined}
      className="inline-flex flex-col gap-1"
    >
      <input type="hidden" name="id" value={id} />
      {fields && Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button
        type="submit"
        disabled={pending}
        className={`btn ${variant === "primary" ? "" : "btn-sm"} ${styles[variant]}`}
      >
        {done ? doneLabel : pending ? pendingLabel ?? "Working…" : label}
      </button>
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-ok">{state.message}</p>}
    </form>
  );
}
