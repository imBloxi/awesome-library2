import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getCirculationStats } from "@/lib/queries/admin";
import { PageTitle, Skeleton, formatDate } from "@/components/ui";

export default function StatsPage() {
  return (
    <>
      <PageTitle>Stats</PageTitle>
      <Suspense fallback={<Skeleton rows={6} />}>
        <Stats />
      </Suspense>
    </>
  );
}

async function Stats() {
  await requireAdmin();
  const { popular, never, neverTotal, weekly, demand } = await getCirculationStats();
  const peak = Math.max(1, ...weekly.map((w) => w.loans));
  const total = weekly.reduce((sum, w) => sum + w.loans, 0);
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <section className="lg:col-span-2">
        <h2 className="mb-1 text-lg font-semibold">Loans per week</h2>
        <p className="mb-4 text-sm text-muted">Books picked up each week, last 12 weeks: {total} in total.</p>
        <ol className="flex h-40 items-end gap-1.5 border-b border-line" aria-label="Loans per week">
          {weekly.map((w) => (
            <li key={w.week} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${formatDate(w.week)}: ${w.loans}`}>
              <span className="mb-1 text-center text-xs tabular-nums text-muted">{w.loans || ""}</span>
              <span className="block rounded-t bg-accent/80" style={{ height: `${(w.loans / peak) * 100}%`, minHeight: w.loans ? 2 : 0 }} />
              <span className="sr-only">Week of {formatDate(w.week)}: {w.loans} loans</span>
            </li>
          ))}
        </ol>
        <div className="mt-1 flex justify-between text-xs text-muted"><span>{formatDate(weekly[0]?.week)}</span><span>this week</span></div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Most borrowed</h2>
        {popular.length === 0 ? <p className="text-sm text-muted">No loans yet.</p> : (
          <ol className="divide-y divide-line text-sm">
            {popular.map((b, i) => (
              <li key={b.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0 truncate"><span className="mr-2 tabular-nums text-muted">{i + 1}.</span><Link href={`/books/${b.id}`} className="hover:underline">{b.title}</Link></span>
                <span className="tabular-nums text-muted">{b.loans}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Waitlist demand</h2>
        <p className="mb-3 text-sm text-muted">Books people are queuing for. Good candidates for extra copies.</p>
        {demand.length === 0 ? <p className="text-sm text-muted">Nobody is waiting for anything.</p> : (
          <ul className="divide-y divide-line text-sm">
            {demand.map((b) => (
              <li key={b.id} className="flex justify-between gap-3 py-2">
                <Link href={`/admin/books/${b.id}/edit`} className="min-w-0 truncate hover:underline">{b.title}</Link>
                <span className="whitespace-nowrap tabular-nums text-muted">{b.waiting} waiting · {b.total_copies} {b.total_copies === 1 ? "copy" : "copies"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lg:col-span-2">
        <h2 className="mb-1 text-lg font-semibold">Never borrowed</h2>
        <p className="mb-3 text-sm text-muted">{neverTotal} {neverTotal === 1 ? "book has" : "books have"} never been picked up. Oldest in the catalog first.</p>
        {never.length > 0 && (
          <ul className="divide-y divide-line text-sm">
            {never.map((b) => (
              <li key={b.id} className="flex justify-between gap-3 py-2">
                <Link href={`/books/${b.id}`} className="min-w-0 truncate hover:underline">{b.title}</Link>
                <span className="whitespace-nowrap text-muted">added {formatDate(b.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
