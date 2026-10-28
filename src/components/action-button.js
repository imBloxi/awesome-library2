"use client";

import { useActionState } from "react";

// A one-button form that calls a server action with a hidden id
// and shows the action's error or message next to it.
export function ActionButton({ action, id, label, pendingLabel, confirm, variant = "secondary" }) {
  const [state, formAction, pending] = useActionState(action, {});
  const styles = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
    secondary: "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
    danger: "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
  };

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
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]}`}
      >
        {pending ? pendingLabel ?? "Working…" : label}
      </button>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.message && <p className="text-sm text-green-700 dark:text-green-400">{state.message}</p>}
    </form>
  );
}
