"use client";

import Link from "next/link";
import { useActionState } from "react";

// ctOS identity forms. Each field gets targeting brackets that close in on focus.
function Field({ label, children }) {
  return (
    <label className="ctos-field">
      <span className="ctos-field-label">{label}</span>
      <span className="ctos-field-box">{children}</span>
    </label>
  );
}

export function AuthForm({ action, mode }) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="ctos-form" data-state={state.error ? "denied" : pending ? "working" : undefined}>
      {isSignUp && (
        <Field label="Full name">
          <input name="name" required maxLength={100} defaultValue={state.name ?? ""} autoComplete="name" />
        </Field>
      )}
      <Field label="Email">
        <input name="email" type="email" required defaultValue={state.email ?? ""} autoComplete="email" spellCheck={false} />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          minLength={isSignUp ? 8 : undefined}
          maxLength={128}
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
      </Field>
      {isSignUp && (
        <label className="ctos-consent">
          <input type="checkbox" name="terms" required />
          <span>
            I accept the <Link href="/legal/terms" target="_blank">Terms of service</Link> and have read
            the <Link href="/legal/privacy" target="_blank">Privacy policy</Link>, including what ctOS records about my account.
          </span>
        </label>
      )}
      <div aria-live="polite" aria-atomic="true">
        {state.error && <p className="ctos-alert" role="alert"><span aria-hidden="true">Access denied. </span>{state.error}</p>}
      </div>
      <button type="submit" disabled={pending} className="ctos-button">
        {pending ? (isSignUp ? "Creating profile…" : "Verifying identity…") : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
