"use client";

import { useActionState } from "react";

// A one-button form that calls a server action with a hidden id
// and shows the action's error or message next to it.
export function ActionButton({ action, id, label, pendingLabel, confirm, variant = "secondary" }) {
  const [state, formAction, pending] = useActionState(action, {});
  const styles = { primary: "btn-primary", secondary: "", danger: "btn-danger" };

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex flex-col gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={`btn ${variant === "primary" ? "" : "btn-sm"} ${styles[variant]}`}
      >
        {pending ? pendingLabel ?? "Working…" : label}
      </button>
      {state?.error && <p role="alert" className="ui text-sm text-bad">⚠ {state.error}</p>}
      {state?.message && <p role="status" className="ui text-sm font-bold text-ok">✔ {state.message}</p>}
    </form>
  );
}
