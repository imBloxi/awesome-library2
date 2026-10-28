import { getUser } from "@/lib/dal";
import { toCsv } from "@/lib/csv.mjs";
import { listBooksForExport } from "@/lib/queries/books";
import { listAllReservations } from "@/lib/queries/reservations";

const EXPORTS = {
  books: {
    columns: [
      ["ID", "id"], ["Title", "title"], ["Author", "author"], ["ISBN", "isbn"],
      ["Year", "published_year"], ["Copies", "total_copies"], ["Available", "available"], ["Added", "created_at"],
    ],
    rows: () => listBooksForExport(),
  },
  reservations: {
    columns: [
      ["ID", "id"], ["Book ID", "book_id"], ["Title", "title"], ["User", "user_name"], ["Email", "user_email"],
      ["Status", "status"], ["Reserved", "reserved_at"], ["Expires", "expires_at"],
      ["Picked up", "picked_up_at"], ["Returned", "returned_at"],
    ],
    rows: () => listAllReservations({ status: "all", limit: 50000 }),
  },
};

export async function GET(_request, { params }) {
  const user = await getUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  if (!user.isAdmin) return new Response("Forbidden", { status: 403 });

  const { kind } = await params;
  const spec = Object.hasOwn(EXPORTS, kind) ? EXPORTS[kind] : null;
  if (!spec) return new Response("Not found", { status: 404 });

  const csv = toCsv(spec.columns, await spec.rows());
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
