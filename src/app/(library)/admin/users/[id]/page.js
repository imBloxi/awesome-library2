import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getMember, listMemberWaitlist } from "@/lib/queries/admin";
import { listAllReservations } from "@/lib/queries/reservations";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { PageTitle, Skeleton, formatDate } from "@/components/ui";
import { getStanding, listModeration, getMemberSignals } from "@/lib/queries/moderation";
import { LevelBadge, ScoreMeter, SignalList, StandingBadge } from "@/components/monitoring";
import { ModerationForm, LiftForm } from "@/components/moderation-forms";

export default function MemberPage({ params }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted"><Link href="/admin/users" className="hover:text-ink">← Users</Link></nav>
      <Suspense fallback={<Skeleton rows={6} />}>
        <Member params={params} />
      </Suspense>
    </>
  );
}

async function Member({ params }) {
  const me = await requireAdmin();
  const { id: raw } = await params;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {}
  id = id.slice(0, 200);
  const member = await getMember(id);
  if (!member) notFound();
  const [active, waiting, recent, standing, history, signals] = await Promise.all([
    listAllReservations({ status: "active", userId: member.id, sort: "priority", limit: 50 }),
    listMemberWaitlist(member.id),
    listAllReservations({ status: "all", userId: member.id, limit: 10 }),
    getStanding(member.id),
    listModeration(member.id),
    getMemberSignals(member.id),
  ]);
  const self = String(me.id) === String(member.id);
  const isAdmin = String(member.role ?? "").split(",").map((r) => r.trim()).includes("admin");
  return (
    <>
      <PageTitle>{member.name || member.email}</PageTitle>
      <dl className="mb-10 grid max-w-md grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-[15px] [overflow-wrap:anywhere]">
        <dt className="text-muted">Email</dt><dd>{member.email}</dd>
        <dt className="text-muted">Role</dt><dd>{isAdmin ? "Admin" : "Member"}</dd>
        <dt className="text-muted">Reservations</dt><dd>{member.total_reservations} in total, {member.total_loans} picked up</dd>
        <dt className="text-muted">Standing</dt><dd><StandingBadge block={standing.block} /></dd>
      </dl>

      <section id="moderation" aria-labelledby="moderation-heading" className="moderation-panel mb-10">
        <div className="moderation-col">
          <h2 id="moderation-heading" className="section-heading mb-3">Monitoring</h2>
          {signals && (
            <>
              <p className="mb-3 flex flex-wrap items-center gap-3">
                <ScoreMeter score={signals.assessment.score} level={signals.assessment.level} />
                <LevelBadge assessment={signals.assessment} />
              </p>
              <SignalList signals={signals.assessment.signals} />
            </>
          )}
          {standing.block && (
            <div className="slip slip-bad mt-5">
              <strong>{standing.block.kind === "suspend" ? "Suspended" : "Borrowing paused"}</strong>
              {standing.block.ends_at ? ` until ${formatDate(standing.block.ends_at)}` : " until lifted"}: {standing.block.reason}
            </div>
          )}
        </div>
        <div className="moderation-col">
          <h2 className="section-heading mb-3">Moderate</h2>
          {self ? (
            <p className="text-sm text-muted">You can&apos;t moderate your own account.</p>
          ) : (
            <>
              <ModerationForm userId={String(member.id)} />
              {standing.block && <div className="mt-6 border-t border-line pt-5"><LiftForm userId={String(member.id)} /></div>}
            </>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section aria-labelledby="moderation-history" className="mb-10">
          <h2 id="moderation-history" className="mb-3 text-lg font-semibold">Moderation history</h2>
          <ol className="moderation-history">
            {history.map((h) => (
              <li key={h.id}>
                <span className={`badge ${h.kind === "note" ? "badge-done" : h.kind === "warning" ? "badge-ready" : "badge-late"}`}>
                  {{ note: "Note", warning: "Warning", restrict: "Borrowing paused", suspend: "Suspended" }[h.kind]}
                </span>
                <div className="min-w-0">
                  <p className="[overflow-wrap:anywhere]">{h.reason}</p>
                  <p className="text-sm text-muted">
                    {formatDate(h.created_at)} by {h.actor_email ?? "staff"}
                    {h.ends_at && `, until ${formatDate(h.ends_at)}`}
                    {h.lifted_at && `. Lifted ${formatDate(h.lifted_at)}${h.lift_reason ? `: ${h.lift_reason}` : ""}`}
                    {h.active && ". Active"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Active holds and loans</h2>
        {active.length === 0 ? <p className="text-muted">Nothing active.</p> : <AdminReservationList rows={active} />}
      </section>
      {waiting.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">On the waitlist for</h2>
          <ul className="divide-y divide-line text-sm">
            {waiting.map((w) => (
              <li key={w.book_id} className="py-2"><Link href={`/books/${w.book_id}`} className="link">{w.title}</Link> · number {w.position} · since {formatDate(w.created_at)}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent history</h2>
        {recent.length === 0 ? <p className="text-muted">No reservations yet.</p> : (
          <>
            <ul className="divide-y divide-line text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <Link href={`/books/${r.book_id}`} className="link">{r.title}</Link>
                  <span className="text-muted">{r.status.replace("_", " ")} · {formatDate(r.reserved_at)}</span>
                </li>
              ))}
            </ul>
            <Link href={{ pathname: "/admin/reservations", query: { status: "all", user: String(member.id) } }} className="mt-3 inline-block text-sm link">Full history</Link>
          </>
        )}
      </section>
    </>
  );
}
