"use client";

import { useActionState } from "react";
import { inputClass, buttonClass } from "@/components/ui";

export function AuthForm({ action, mode }) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      {isSignUp && (
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required defaultValue={state.name ?? ""} autoComplete="name" className={inputClass} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input name="email" type="email" required defaultValue={state.email ?? ""} autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={isSignUp ? 8 : undefined}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={inputClass}
        />
      </label>
      {state.error && <p className="text-sm text-bad">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
