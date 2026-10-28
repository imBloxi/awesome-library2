import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getStats } from "@/lib/queries/books";
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
  const s = await getStats();
  const cards = [
    { label: "Books", value: s.books, href: "/admin/books" },
    { label: "Waiting for pickup", value: s.holds, href: "/admin/reservations?status=reserved" },
    { label: "Borrowed", value: s.loans, href: "/admin/reservations?status=picked_up" },
    { label: "Holds expiring within 24h", value: s.expiring, href: "/admin/reservations?status=reserved" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.label} href={c.href} className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950">
          <p className="text-3xl font-semibold tabular-nums">{c.value}</p>
          <p className="text-sm text-zinc-500">{c.label}</p>
        </Link>
      ))}
    </div>
  );
}
