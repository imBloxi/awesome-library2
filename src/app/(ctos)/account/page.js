import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { getAuth } from "@/lib/auth/server";
import { accountSessions, deviceLabel } from "@/lib/account/service.mjs";
import { canReadBabel } from "@/lib/queries/reading";
import { getSubjectFile, listStaffActions } from "@/lib/queries/profile";
import { getStanding, getMemberSignals, listModeration } from "@/lib/queries/moderation";
import { circulationRecord, readingPatterns, requestAddress, staffActionLabel, cleanAddress } from "@/lib/ctos/profile.mjs";
import { ProfileForm, PasswordForm, RevokeSessionForm, RevokeOthersForm, ClearReadingData } from "@/components/account-forms";

export const metadata = { title: "Account console" };

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="ctos-panel"><p className="ctos-pending">Retrieving subject file…</p></div>}>
      <Account />
    </Suspense>
  );
}

const stamp = (value) => {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? new Date(ms).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Not recorded";
};
const day = (value) => {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? new Date(ms).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) : "Not recorded";
};

function Readout({ rows }) {
  return (
    <dl className="ctos-readout">
      {rows.map(([label, value], i) => (
        <div key={label} className="ctos-readout-row" style={{ "--i": i }}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function Account() {
  const identity = await getSession();
  if (!identity) redirect("/auth/sign-in");
  const { user, session } = identity;
  const request = await headers();
  const [sessions, canRead, file, staff, standing, signals, moderation] = await Promise.all([
    accountSessions(getAuth(), identity),
    canReadBabel(user.id),
    getSubjectFile(user.id),
    listStaffActions(user.id),
    getStanding(user.id),
    getMemberSignals(user.id),
    listModeration(user.id, 20),
  ]);
  const role = String(user.role ?? "").split(",").map((r) => r.trim()).includes("admin") ? "Library staff (admin)" : "Member";
  const patterns = readingPatterns(file);

  return (
    <div className="ctos-account">
      <header className="ctos-console-header">
        <p className="ctos-label">Subject file</p>
        <h1 className="ctos-title">{user.name || user.email}</h1>
        <Readout rows={[
          ["Account ID", <code key="id">{user.id}</code>],
          ["Email", user.email],
          ["Email verified", user.emailVerified ? "Yes" : "No"],
          ["Classification", role],
          ["File opened", day(user.createdAt)],
        ]} />
        <nav aria-label="Account sections" className="ctos-console-nav">
          <a href="#standing">Standing</a><a href="#observed">This request</a><a href="#record">Circulation</a><a href="#staff">Staff actions</a>
          <a href="#identity">Identity</a><a href="#security">Password</a><a href="#sessions">Sessions</a><a href="#privacy">Local data</a>
        </nav>
      </header>

      <div className="ctos-account-grid">
        <Standing standing={standing} signals={signals} moderation={moderation} />

        <section className="ctos-panel" id="observed" aria-labelledby="observed-heading">
          <p className="ctos-label">Live</p>
          <h2 id="observed-heading" className="ctos-panel-title">This request</h2>
          <Readout rows={[
            ["Network address", requestAddress(request) ?? "Not reported by the host"],
            ["Device", deviceLabel(request.get("user-agent") ?? "")],
            ["Observed at", stamp(new Date())],
            ["Session opened", stamp(session.createdAt)],
            ["Session expires", stamp(session.expiresAt)],
            ["Address recorded at sign-in", cleanAddress(session.ipAddress) ?? "Not recorded"],
          ]} />
        </section>

        <section className="ctos-panel" id="record" aria-labelledby="record-heading">
          <p className="ctos-label">Circulation record</p>
          <h2 id="record-heading" className="ctos-panel-title">What you have borrowed</h2>
          <Readout rows={circulationRecord(file, day)} />
          {patterns.length > 0 ? (
            <>
              <h3 className="ctos-subtitle">Patterns</h3>
              <Readout rows={patterns} />
            </>
          ) : (
            <p className="ctos-fine">No patterns yet. They are computed from your reservation history once you have one.</p>
          )}
        </section>

        <section className="ctos-panel ctos-panel-wide" id="staff" aria-labelledby="staff-heading">
          <p className="ctos-label">Audit trail</p>
          <h2 id="staff-heading" className="ctos-panel-title">Staff actions on your record</h2>
          {staff.length === 0 ? (
            <p className="ctos-fine">No staff actions have touched your account or reservations.</p>
          ) : (
            <ol className="ctos-log">
              {staff.map((e) => (
                <li key={e.id}>
                  <time dateTime={new Date(e.created_at).toISOString()}>{stamp(e.created_at)}</time>
                  <span>{staffActionLabel(e.action)}{e.book_title ? `: ${e.book_title}` : ""}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="ctos-fine">Library staff can see your name, email, reservations and this log. Each staff change is recorded with the staff member who made it.</p>
        </section>

        <aside className="ctos-panel ctos-panel-wide ctos-clearance" aria-labelledby="clearance-heading">
          <div>
            <p className="ctos-label">Reading authorization</p>
            <h2 id="clearance-heading" className="ctos-panel-title">{canRead ? "Babel access active" : "Pickup required"}</h2>
            <p className="ctos-fine">{canRead ? "You have a checked-out loan. Babel is unlocked; catalogue editions require the matching book’s loan." : "Reserve a book and collect it from the library to unlock Babel. Catalogue editions unlock when you collect that specific book."}</p>
          </div>
          <Link className="ctos-button" href={canRead ? "/babel" : "/reservations"}>{canRead ? "Enter Babel" : "Open my library"}</Link>
        </aside>

        <section className="ctos-panel" id="identity" aria-labelledby="identity-heading">
          <p className="ctos-label">Identity record</p>
          <h2 id="identity-heading" className="ctos-panel-title">Display name</h2>
          <p className="ctos-fine">Shown on your library account and to library staff.</p>
          <ProfileForm name={user.name ?? ""} />
          <p className="ctos-fine">Email changes are unavailable here. This console does not send verification or recovery emails.</p>
        </section>

        <section className="ctos-panel" id="security" aria-labelledby="security-heading">
          <p className="ctos-label">Credential control</p>
          <h2 id="security-heading" className="ctos-panel-title">Password</h2>
          <p className="ctos-fine">Confirm your current password to replace it. A successful change signs out your other sessions.</p>
          <PasswordForm />
        </section>

        <section className="ctos-panel ctos-panel-wide" id="sessions" aria-labelledby="sessions-heading">
          <p className="ctos-label">Connected sessions</p>
          <h2 id="sessions-heading" className="ctos-panel-title">Where you’re signed in</h2>
          <p className="ctos-fine">Device labels come from the browser’s user agent. Addresses are the ones recorded when each session started.</p>
          {sessions.error ? <p role="alert" className="ctos-alert">{sessions.error}</p> : <>
            <ul className="ctos-sessions">{sessions.sessions.map((s) => <li key={s.id}>
              <div>
                <h3>{s.device} {s.current && <span className="ctos-flag">This session</span>}</h3>
                <p>Address {s.address ?? "not recorded"}</p>
                <p>Signed in {stamp(s.createdAt)}. Expires {stamp(s.expiresAt)}.</p>
              </div>
              {!s.current && <RevokeSessionForm sessionId={s.id} />}
            </li>)}</ul>
            {sessions.sessions.length === 0 && <p className="ctos-fine">No active sessions were returned. Reload to check again.</p>}
            {sessions.sessions.some((s) => !s.current) && <RevokeOthersForm />}
          </>}
        </section>

        <section className="ctos-panel" id="privacy" aria-labelledby="privacy-heading">
          <p className="ctos-label">Local footprint</p>
          <h2 id="privacy-heading" className="ctos-panel-title">This browser</h2>
          <p className="ctos-fine">Chapter positions, reader appearance and your motion setting are stored in this browser only. Clear reading data before sharing a device. This does not delete loans or saved books.</p>
          <ClearReadingData />
        </section>

        <section className="ctos-panel" aria-labelledby="rights-heading">
          <p className="ctos-label">Your rights</p>
          <h2 id="rights-heading" className="ctos-panel-title">Copies, corrections, deletion</h2>
          <p className="ctos-fine">You can ask for a copy of your file, a correction, or for your account and records to be deleted. The privacy policy explains how and what happens next.</p>
          <Link href="/legal/privacy#rights" className="ctos-link">Read the privacy policy</Link>
        </section>
      </div>
    </div>
  );
}

const KIND_LABEL = { note: "Staff note", warning: "Warning", restrict: "Borrowing paused", suspend: "Suspended" };

// Standing: staff restrictions, and the same monitoring score staff see, with its evidence.
function Standing({ standing, signals, moderation }) {
  const { block, warning } = standing;
  const assessment = signals?.assessment;
  const status = block
    ? `${block.kind === "suspend" ? "Suspended" : "Borrowing paused"}${block.ends_at ? ` until ${day(block.ends_at)}` : " until lifted by staff"}`
    : warning ? "Warned in the last 30 days" : "Good standing";
  return (
    <section className={`ctos-panel ctos-panel-wide ${block ? "ctos-panel-alert" : ""}`} id="standing" aria-labelledby="standing-heading">
      <p className="ctos-label">Standing and monitoring</p>
      <h2 id="standing-heading" className="ctos-panel-title">{status}</h2>
      {block && <p className="ctos-alert">Reason: {block.reason}. You can still return books{block.kind === "restrict" ? " and keep reading current loans" : ""}.</p>}
      {warning && <p className="ctos-fine">Latest warning ({day(warning.created_at)}): {warning.reason}</p>}
      {assessment && (
        <>
          <div className="ctos-score" data-level={assessment.level}>
            <span className="ctos-score-value">{assessment.score}</span>
            <span className="ctos-score-bar" aria-hidden="true"><span style={{ "--score": `${assessment.score}%` }} /></span>
            <span className="ctos-flag">{assessment.levelLabel}</span>
          </div>
          {assessment.signals.length === 0 ? (
            <p className="ctos-fine">No monitoring signals. Nothing in your record stands out.</p>
          ) : (
            <Readout rows={assessment.signals.map((sig) => [`${sig.label} +${sig.points}`, sig.evidence])} />
          )}
          <p className="ctos-fine">Library staff see this same score and evidence. It is recalculated from your records on every visit and never restricts you by itself; only staff can, and they must give a reason.</p>
        </>
      )}
      {moderation.length > 0 && (
        <>
          <h3 className="ctos-subtitle">Moderation history</h3>
          <ol className="ctos-log">
            {moderation.map((m) => (
              <li key={m.id}>
                <time dateTime={new Date(m.created_at).toISOString()}>{stamp(m.created_at)}</time>
                <span>
                  {KIND_LABEL[m.kind]}{m.kind === "note" ? ". Contents available on request." : `: ${m.reason}`}
                  {m.ends_at ? ` Until ${day(m.ends_at)}.` : ""}
                  {m.lifted_at ? ` Lifted ${day(m.lifted_at)}${m.lift_reason ? `: ${m.lift_reason}` : ""}.` : ""}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
