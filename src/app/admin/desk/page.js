import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listAllReservations } from "@/lib/queries/reservations";
import { findBookByIsbn } from "@/lib/queries/admin";
import { AdminReservationList } from "@/components/admin-reservation-list";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton } from "@/components/ui";

// The circulation desk: one box for an ISBN, a title or a member. Barcode scanners type the
// ISBN and press Enter, so the box is focused on load and an exact ISBN wins.
export default function DeskPage({ searchParams }) {
  return (
    <>
      <PageTitle>Circulation desk</PageTitle>
      <Suspense fallback={<><SearchForm action="/admin/desk" placeholder="Scan an ISBN, or type a title, name or email" /><Skeleton /></>}>
        <Desk searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Desk({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const book = q ? await findBookByIsbn(q) : null;
  const rows = !q ? [] : book
    ? await listAllReservations({ status: "active", bookId: book.id, sort: "priority", limit: 50 })
    : await listAllReservations({ status: "active", q, sort: "priority", limit: 50 });

  return (
    <>
      <SearchForm action="/admin/desk" q={q} autoFocus placeholder="Scan an ISBN, or type a title, name or email" />
      {!q ? (
        <p className="text-muted">Holds waiting for pickup and books out on loan show here. Mark pickups and returns straight from the list.</p>
      ) : (
        <>
          {book && (
            <p className="mb-4 text-sm">
              ISBN match: <Link href={`/admin/books/${book.id}/edit`} className="link">{book.title}</Link> by {book.author}
            </p>
          )}
          {rows.length === 0
            ? <p className="text-muted">No active holds or loans match “{q}”.</p>
            : <AdminReservationList rows={rows} />}
        </>
      )}
    </>
  );
}
