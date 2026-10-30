import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { watchlistEnabled, listWatchTerms, listPersonsOfInterest } from "@/lib/queries/watch";
import { WATCH_WINDOW_DAYS } from "@/lib/queries/watch-sql.mjs";
import { WatchSwitch, AddTermForm, TermActions } from "@/components/watch-forms";
import { PageTitle, Skeleton, formatDate } from "@/components/ui";

export const metadata = { title: "Book watchlist · Library" };

export default function WatchlistPage() {
  return (
    <>
      <PageTitle>Book watchlist</PageTitle>
      <p className="mb-6 max-w-prose text-muted">
        Keywords that mark books as watched when they appear in a title, author, genre or description. Members who reserve,
        borrow, wait for or save a watched book within {WATCH_WINDOW_DAYS} days become persons of interest and get a
        monitoring signal. Nothing is blocked automatically. Members are told: watched books say so on their page, and
        flagged members see the flag in their account console.
      </p>
      <Suspense fallback={<Skeleton rows={6} />}>
        <Watchlist />
      </Suspense>
    </>
  );
}

async function Watchlist() {
  await requireAdmin();
  const [enabled, terms, persons] = await Promise.all([watchlistEnabled(), listWatchTerms(), listPersonsOfInterest()]);
  return (
    <>
      <WatchSwitch enabled={enabled} />

      <section aria-labelledby="terms-heading" className="mt-10">
        <h2 id="terms-heading" className="section-heading mb-4">Keywords</h2>
        <AddTermForm />
        {terms.length === 0 ? (
          <p className="empty-results mt-6">No keywords yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Keyword</th>
                  <th scope="col">Reason</th>
                  <th scope="col" className="w-24">Books</th>
                  <th scope="col" className="hidden md:table-cell">Added</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {terms.map((t) => (
                  <tr key={t.id} className={t.active ? "" : "opacity-60"}>
                    <td><span className="font-medium">{t.term}</span>{!t.active && <span className="badge badge-done ml-2">Paused</span>}</td>
                    <td className="text-sm [overflow-wrap:anywhere]">{t.reason}</td>
                    <td className="tabular-nums">
                      <Link href={`/?q=${encodeURIComponent(t.term)}&view=list`} className="link">{t.matches}</Link>
                    </td>
                    <td className="hidden text-sm text-muted md:table-cell">{formatDate(t.created_at)} by {t.created_by}</td>
                    <td><TermActions id={t.id} active={t.active} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">Book counts match titles, authors, genres and descriptions. The catalogue link searches titles, authors and ISBNs only.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="poi-heading" className="mt-12">
        <h2 id="poi-heading" className="section-heading mb-1">Persons of interest</h2>
        <p className="mb-4 text-sm text-muted">{enabled ? `Members with watched activity in the last ${WATCH_WINDOW_DAYS} days, most watched titles first.` : "The watchlist is off, so nobody is flagged."}</p>
        {persons.length === 0 ? (
          <p className="empty-results">{enabled ? "No member has touched a watched book." : "Switch the watchlist on to start flagging."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col" className="w-24">Titles</th>
                  <th scope="col">Watched books</th>
                  <th scope="col" className="hidden w-28 md:table-cell">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {persons.map((p) => (
                  <tr key={p.user_id}>
                    <td>
                      <Link href={`/admin/users/${encodeURIComponent(p.user_id)}#moderation`} className="font-medium hover:underline">{p.name || p.email}</Link>
                      <span className="block text-sm text-muted [overflow-wrap:anywhere]">{p.email}</span>
                    </td>
                    <td className="tabular-nums">{p.books}</td>
                    <td className="text-sm">{(p.titles ?? []).join(", ")}{p.books > (p.titles?.length ?? 0) ? "…" : ""}</td>
                    <td className="hidden text-sm text-muted md:table-cell">{p.last_seen ? formatDate(p.last_seen) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
