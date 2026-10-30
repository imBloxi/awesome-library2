"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, changePasswordAction, revokeSessionAction, revokeOtherSessionsAction } from "@/app/account/actions";

function Feedback({ state }) {
  return <div aria-live="polite" aria-atomic="true">{state.error ? <p className="text-sm text-bad" role="alert">{state.error}</p> : state.message ? <p className="text-sm text-ok">{state.message}</p> : null}</div>;
}
export function ProfileForm({ name }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return <form action={action} className="ctos-form">
    <label htmlFor="profile-name">Display name</label>
    <input id="profile-name" name="name" autoComplete="name" defaultValue={name} required maxLength={100} className="field" />
    <Feedback state={state} />
    <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save display name"}</button>
  </form>;
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return <form action={action} className="ctos-form">
    <label htmlFor="current-password">Current password</label>
    <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className="field" />
    <label htmlFor="new-password">New password</label>
    <input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-guidance" className="field" />
    <p id="password-guidance" className="text-sm text-muted">Use 12–128 characters. A long, unique passphrase works well. Password managers and paste are welcome.</p>
    <label htmlFor="confirm-password">Confirm new password</label>
    <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="field" />
    <Feedback state={state} />
    <button className="btn btn-primary" disabled={pending}>{pending ? "Updating…" : "Change password & sign out others"}</button>
  </form>;
}
export function RevokeSessionForm({ sessionId }) {
  const [state, action, pending] = useActionState(revokeSessionAction, {});
  return <form action={action} className="ctos-form">
    <input type="hidden" name="sessionId" value={sessionId} />
    <button className="btn" disabled={pending}>{pending ? "Signing out…" : "Sign out this session"}</button>
    <Feedback state={state} />
  </form>;
}
export function RevokeOthersForm() {
  const [state, action, pending] = useActionState(revokeOtherSessionsAction, {});
  return <form action={action} className="ctos-form" onSubmit={(event) => { if (!window.confirm("Sign out all other listed sessions? This browser will stay signed in.")) event.preventDefault(); }}>
    <button className="btn" disabled={pending}>{pending ? "Signing out…" : "Sign out other sessions"}</button>
    <Feedback state={state} />
  </form>;
}
export function ClearReadingData() {
  const [message, setMessage] = useState("");
  function clear() {
    if (!window.confirm("Clear reading positions and appearance settings in this browser? Your loans and saved books will stay in your account.")) return;
    try {
      const keys = Object.keys(localStorage).filter((key) => key === "babel:prefs" || key.startsWith("babel:last:"));
      for (const key of keys) localStorage.removeItem(key);
      setMessage("Reading positions and appearance settings cleared in this browser.");
    } catch { setMessage("Browser storage could not be cleared. Check your browser’s site-data settings."); }
  }
  return <div className="ctos-form"><button type="button" className="btn" onClick={clear}>Clear this browser’s reading data</button><p role="status" className="text-sm text-muted">{message}</p></div>;
}
