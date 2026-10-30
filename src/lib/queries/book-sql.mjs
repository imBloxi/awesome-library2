import { topPickAtSql } from "./search-sql.mjs";

// Use separate statements in READ COMMITTED: checks after the lock must see
// reservations committed while this transaction was waiting for that lock.
const lockBook = (id) => ({
  text: "select id from books where id = $1 and deleted_at is null for update",
  params: [id],
});

export function updateBookSteps(id, data) {
  return [
    lockBook(id),
    {
      text: `with state as materialized (
        select id, (select count(*)::int from active_reservations where book_id = $1) as active_count
        from books where id = $1 and deleted_at is null
      ), updated as (
        update books b set title = $2, author = $3, isbn = $4, description = $5,
          published_year = $6, total_copies = $7, top_pick_at = ${topPickAtSql("$8", "$9")}, genre = $10, updated_at = now()
        from state s where b.id = s.id and s.active_count <= $7 returning b.id
      )
      select active_count, exists (select 1 from updated) as updated from state`,
      params: [id, data.title, data.author, data.isbn, data.description, data.published_year, data.total_copies, data.top_pick, data.top_pick_seen ?? null, data.genre ?? null],
    },
  ];
}

export function deleteBookSteps(id) {
  return [
    lockBook(id),
    {
      text: `update books set deleted_at = now(), isbn = null, top_pick_at = null, updated_at = now()
        where id = $1 and deleted_at is null
          and not exists (select 1 from active_reservations where book_id = $1)
        returning id`,
      params: [id],
    },
  ];
}
