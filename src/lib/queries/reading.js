import { db } from "@/lib/db";
import { suspendedSql } from "@/lib/queries/moderation-sql.mjs";

// Intentionally uncached: a returned loan must not authorize the next request.
// Existence checks have no list/pagination cap and never trust browser state.
export async function canReadCatalogBook(userId, bookId) {
  const [row] = await db().query(
    `select exists (
       select 1 from reservations r join books b on b.id = r.book_id
       where r.user_id = $1 and r.book_id = $2 and r.status = 'picked_up'
         and r.picked_up_at is not null and r.returned_at is null and b.deleted_at is null
     ) and not ${suspendedSql("$1")} as allowed`, [userId, bookId]);
  return row?.allowed === true;
}

export async function canReadBabel(userId) {
  const [row] = await db().query(
    `select exists (
       select 1 from reservations r join books b on b.id = r.book_id
       where r.user_id = $1 and r.status = 'picked_up'
         and r.picked_up_at is not null and r.returned_at is null and b.deleted_at is null
     ) and not ${suspendedSql("$1")} as allowed`, [userId]);
  return row?.allowed === true;
}
