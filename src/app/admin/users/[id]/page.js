import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getMember, listMemberWaitlist } from "@/lib/queries/admin";
import { listAllReservations } from "@/lib/queries/reservations";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { PageTitle, Skeleton, formatDate } from "@/components/ui";

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
  await requireAdmin();
  const { id: raw } = await params;
  const id = decodeURIComponent(raw).slice(0, 200);
  const member = await getMember(id);
  if (!member) notFound();
  const [active, waiting, recent] = await Promise.all([
    listAllReservations({ status: "active", userId: member.id, sort: "priority", limit: 50 }),
    listMemberWaitlist(member.id),
    listAllReservations({ status: "all", userId: member.id, limit: 10 }),
  ]);
  const isAdmin = String(member.role ?? "").split(",").map((r) => r.trim()).includes("admin");
  return (
    <>
      <PageTitle>{member.name || member.email}</PageTitle>
      <dl className="mb-10 grid max-w-md grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-[15px] [overflow-wrap:anywhere]">
        <dt className="text-muted">Email</dt><dd>{member.email}</dd>
        <dt className="text-muted">Role</dt><dd>{isAdmin ? "Admin" : "Member"}</dd>
        <dt className="text-muted">Reservations</dt><dd>{member.total_reservations} in total, {member.total_loans} picked up</dd>
      </dl>
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
