import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { getAuth } from "@/lib/auth/server";
import { accountSessions } from "@/lib/account/service.mjs";
import { canReadBabel } from "@/lib/queries/reading";
import { ProfileForm, PasswordForm, RevokeSessionForm, RevokeOthersForm, ClearReadingData } from "@/components/account-forms";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Account control · ctOS", robots: { index: false, follow: false } };
export default function AccountPage() {
  return <Suspense fallback={<Skeleton rows={8} />}><Account /></Suspense>;
}
const date = (value) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Not supplied";
async function Account() {
  const identity = await getSession();
  if (!identity) redirect("/auth/sign-in");
  const [sessions, canRead] = await Promise.all([accountSessions(getAuth(), identity), canReadBabel(identity.user.id)]);
  return <div className="ctos-account">
    <header className="ctos-console-header">
      <p className="ctos-eyebrow">ctOS Surveillance / Personal control</p>
      <h1>Your identity.<br /><span>Your controls.</span></h1>
      <p>Manage your profile, secure your sessions, and control what this browser remembers.</p>
      <nav aria-label="Account sections" className="ctos-console-nav">
        <a href="#identity">Identity</a><a href="#security">Password</a><a href="#sessions">Sessions</a><a href="#privacy">Local privacy</a>
      </nav>
    </header>
    <aside className="ctos-clearance" aria-labelledby="clearance-heading">
      <div><p className="ctos-eyebrow">Reading authorization</p><h2 id="clearance-heading">{canRead ? "Babel access active" : "Pickup required"}</h2>
      <p>{canRead ? "You have a checked-out loan. Babel is unlocked; catalogue editions require the matching book’s loan." : "Reserve a book and collect it from the library to unlock Babel. Catalogue editions unlock when you collect that specific book."}</p></div>
      <Link className="btn btn-primary" href={canRead ? "/babel" : "/reservations"}>{canRead ? "Enter Babel" : "Open my library"}</Link>
    </aside>
    <div className="ctos-account-grid">
      <section className="ctos-panel" id="identity" aria-labelledby="identity-heading">
        <p className="ctos-eyebrow">01 / Identity record</p><h2 id="identity-heading">Profile</h2>
        <p className="ctos-panel-intro">Your display name appears on your library account.</p>
        <ProfileForm name={identity.user.name ?? ""} />
        <dl className="ctos-record"><dt>Sign-in email</dt><dd>{identity.user.email}</dd></dl>
        <p className="text-sm text-muted">Email changes are unavailable here. This console does not send verification or recovery emails.</p>
      </section>
      <section className="ctos-panel" id="security" aria-labelledby="security-heading">
        <p className="ctos-eyebrow">02 / Credential control</p><h2 id="security-heading">Password</h2>
        <p className="ctos-panel-intro">Confirm your current password to replace it. A successful change signs out your other sessions.</p>
        <PasswordForm />
      </section>
      <section className="ctos-panel ctos-panel-wide" id="sessions" aria-labelledby="sessions-heading">
        <p className="ctos-eyebrow">03 / Connected sessions</p><h2 id="sessions-heading">Where you’re signed in</h2>
        <p className="ctos-panel-intro">Device labels come from browser information and may be approximate. Protected requests check your session with Neon.</p>
        {sessions.error ? <p role="alert" className="text-bad">{sessions.error}</p> : <>
          <ul className="ctos-sessions">{sessions.sessions.map((s) => <li key={s.id}>
            <div><h3>{s.device} {s.current && <span className="ctos-tag">This session</span>}</h3>
            <p>Signed in {date(s.createdAt)}</p><p>Expires {date(s.expiresAt)}</p></div>
            {!s.current && <RevokeSessionForm sessionId={s.id} />}
          </li>)}</ul>
          {sessions.sessions.length === 0 && <p className="text-sm text-muted">No active sessions were returned. Reload to check again.</p>}
          {sessions.sessions.some((s) => !s.current) && <RevokeOthersForm />}
        </>}
      </section>
      <section className="ctos-panel" id="privacy" aria-labelledby="privacy-heading">
        <p className="ctos-eyebrow">04 / Local footprint</p><h2 id="privacy-heading">Browser privacy</h2>
        <p className="ctos-panel-intro">Chapter positions and reader appearance are stored in this browser. Clear them before sharing a device. This does not delete loans or saved books.</p>
        <ClearReadingData />
      </section>
      <section className="ctos-panel" aria-labelledby="access-rules-heading">
        <p className="ctos-eyebrow">05 / Access protocol</p><h2 id="access-rules-heading">How reading access works</h2>
        <ol className="ctos-protocol"><li>Reserve a book from the catalogue.</li><li>Collect it; library staff confirm the pickup.</li><li>Read its imagined editions and explore Babel.</li><li>Return the loan to end its reading access.</li></ol>
        <p className="text-sm text-muted">Reading is online only. Previously downloaded files or text already displayed cannot be recalled.</p>
        <Link href="/reservations" className="link">Manage my loans</Link>
      </section>
    </div>
  </div>;
}
