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
  const [s, recent] = await Promise.all([getStats(), listAllReservations({ status: "all", limit: 8 })]);
  const cards = [
    { label: "Books", value: s.books, href: "/admin/books" },
    { label: "Users", value: s.users, href: "/admin/users" },
    { label: "Waiting for pickup", value: s.holds, href: "/admin/reservations?status=reserved" },
    { label: "Borrowed", value: s.loans, href: "/admin/reservations?status=picked_up" },
    { label: "Overdue loans", value: s.overdue, href: "/admin/reservations?status=overdue", warn: s.overdue > 0 },
    { label: "Holds expiring within 24h", value: s.expiring, href: "/admin/reservations?status=reserved" },
    { label: "Books with no copy free", value: s.out_of_stock, href: "/admin/books" },
  ];
  return (
    <>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className={`bevel-out block bg-silver p-3 text-black no-underline hover:bg-paper ${c.warn ? "outline-2 outline-bad" : ""}`}
        >
          <p className={`ui text-3xl font-bold tabular-nums ${c.warn ? "text-bad" : "text-navy"}`}>{c.value}</p>
          <p className="ui text-sm">{c.label}</p>
        </Link>
      ))}
    </div>
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-navy">Recent activity</h2>
        <Link href="/admin/reservations?status=all" className="text-sm underline">All reservations</Link>
      </div>
      {recent.length === 0 ? <p className="text-muted">No reservations yet.</p> : <AdminReservationList rows={recent} />}
    </section>
    </>
  );
}
