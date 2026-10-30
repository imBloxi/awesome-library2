import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listMonitoredMembers } from "@/lib/queries/moderation";
import { LevelBadge, ScoreMeter, SignalList, StandingBadge, ScoringRules, LastActivity } from "@/components/monitoring";
import { PageTitle, Skeleton } from "@/components/ui";

export const metadata = { title: "Member monitoring · Library" };

const FILTERS = [["review", "Needs review"], ["watch", "Watch"], ["blocked", "Paused or suspended"], ["all", "All members"]];
const PAGE = 100;

export default function MonitoringPage({ searchParams }) {
  return (
    <>
      <PageTitle>Member monitoring</PageTitle>
      <p className="mb-4 max-w-prose text-muted">
        Every member with circulation history, ranked by signals from their own records: overdue loans, late returns,
        uncollected holds, booking bursts and recent staff action. Scores inform; staff decide.
      </p>
      <ScoringRules />
      <Suspense fallback={<Skeleton rows={8} />}>
        <Members searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Members({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = FILTERS.some(([f]) => f === sp.level) ? sp.level : "review";
  const all = await listMonitoredMembers();
  const counts = {
    review: all.filter((m) => m.assessment.level === "review").length,
    watch: all.filter((m) => m.assessment.level === "watch").length,
    blocked: all.filter((m) => m.suspended || m.restricted).length,
    all: all.length,
  };
  const rows = all.filter((m) =>
    filter === "all" ? true : filter === "blocked" ? m.suspended || m.restricted : m.assessment.level === filter
  ).slice(0, PAGE);

  return (
    <>
      <nav aria-label="Monitoring filters" className="view-toggle my-6">
        {FILTERS.map(([value, label]) => (
          <Link key={value} href={value === "review" ? "/admin/monitoring" : `/admin/monitoring?level=${value}`} aria-current={filter === value ? "true" : undefined} replace scroll={false}>
            {label} <span className="tabular-nums opacity-70">{counts[value]}</span>
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="empty-results">{filter === "review" ? "No member needs review right now." : "No members match this filter."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table monitoring-table">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col" className="w-36">Score</th>
                <th scope="col">Signals</th>
                <th scope="col" className="hidden md:table-cell">Standing</th>
                <th scope="col" className="hidden w-28 lg:table-cell">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.user_id}>
                  <td>
                    <Link href={`/admin/users/${encodeURIComponent(m.user_id)}#moderation`} className="font-medium hover:underline">{m.name || m.email}</Link>
                    <span className="block text-sm text-muted [overflow-wrap:anywhere]">{m.email}</span>
                  </td>
                  <td><ScoreMeter score={m.assessment.score} level={m.assessment.level} /> <span className="sr-only"><LevelBadge assessment={m.assessment} /></span></td>
                  <td><SignalList signals={m.assessment.signals} compact /></td>
                  <td className="hidden md:table-cell"><StandingBadge suspended={m.suspended} restricted={m.restricted} /></td>
                  <td className="hidden lg:table-cell"><LastActivity value={m.last_activity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {counts[filter] > PAGE && <p className="mt-3 text-sm text-muted">Showing the top {PAGE} of {counts[filter]}.</p>}
        </div>
      )}
    </>
  );
}
