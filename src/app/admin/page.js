import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getStats } from "@/lib/queries/books";
import { listAllReservations } from "@/lib/queries/reservations";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { PageTitle, Skeleton } from "@/components/ui";

export default function AdminPage() {
  return (
    <>
      <PageTitle>Admin</PageTitle>
      <Suspense fallback={<Skeleton rows={2} />}>
        <Stats />
      </Suspense>
    </>
  );
}

async function Stats() {
  await requireAdmin();
  const [s, attention] = await Promise.all([
    getStats(),
    listAllReservations({ status: "attention", sort: "priority", limit: 8 }),
  ]);
  const cards = [
    { label: "Books", value: s.books, href: "/admin/books" },
    { label: "Users", value: s.users, href: "/admin/users" },
    { label: "Waiting for pickup", value: s.holds, href: "/admin/reservations?status=reserved" },
    { label: "Borrowed", value: s.loans, href: "/admin/reservations?status=picked_up" },
    { label: "Overdue loans", value: s.overdue, href: "/admin/reservations?status=overdue", warn: s.overdue > 0 },
    { label: "Holds expiring within 24h", value: s.expiring, href: "/admin/reservations?status=expiring", warn: s.expiring > 0 },
    { label: "Books with no copy free", value: s.out_of_stock, href: "/admin/books" },
  ];
  return (
    <>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className={`card block p-4 transition-colors hover:bg-subtle ${c.warn ? "border-bad/40" : ""}`}
        >
          <p className={`text-3xl font-semibold tabular-nums ${c.warn ? "text-bad" : "text-ink"}`}>{c.value}</p>
          <p className="mt-1 text-sm text-muted">{c.label}</p>
        </Link>
      ))}
    </div>
    <section className="mt-10">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Needs attention</h2>
        <Link href="/admin/reservations?status=attention" className="text-sm link">View attention queue</Link>
      </div>
      <p className="mb-4 text-sm text-muted">Overdue loans first, then holds expiring within 24 hours. Earliest deadlines first in each group.</p>
      {attention.length === 0 ? <p className="text-muted">No reservations need attention right now.</p> : <AdminReservationList rows={attention} />}
      <Link href="/admin/reservations" className="mt-4 inline-block text-sm link">All active reservations</Link>
    </section>
    </>
  );
}
