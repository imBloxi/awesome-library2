// Plain SQL for the reserve flow. No Next or driver imports, so the
// concurrency test script can run these exact statements against Postgres.

export const MAX_ACTIVE = 10;

// Run these in order inside ONE transaction (READ COMMITTED).
// 1. Per-user lock: two parallel reserves by the same user wait for each other,
//    so the 10-limit count can't be read twice before either insert lands.
// 2. Book row lock: parallel reserves of the same book wait for each other,
//    so two people can't both take the last copy.
// 3. Insert only if every rule passes. Each statement gets a fresh snapshot
//    in READ COMMITTED, so it sees rows committed by whoever held the locks before.
export function reserveSteps(userId, bookId) {
  return [
    { text: "select pg_advisory_xact_lock(hashtext($1))", params: [userId] },
    {
      text: "select id from books where id = $1 and deleted_at is null for update",
      params: [bookId],
    },
    {
      text: `insert into reservations (user_id, book_id)
        select $1, b.id from books b
        where b.id = $2
          and b.deleted_at is null
          and (select count(*) from active_reservations where user_id = $1) < ${MAX_ACTIVE}
          and (select count(*) from active_reservations where book_id = b.id) < b.total_copies
          and not exists (
            select 1 from active_reservations where user_id = $1 and book_id = b.id
          )
        returning id`,
      params: [userId, bookId],
    },
  ];
}

// Only runs when the insert returned nothing, to tell the user why.
export const reserveFailureReason = {
  text: `select
      (select deleted_at is null from books where id = $2) as book_exists,
      (select count(*)::int from active_reservations where user_id = $1) as user_active,
      exists (select 1 from active_reservations where user_id = $1 and book_id = $2) as already,
      (select total_copies - (select count(*) from active_reservations where book_id = $2)
         from books where id = $2)::int as available`,
};

export function explainFailure(row) {
  if (!row || !row.book_exists) return "This book no longer exists.";
  if (row.already) return "You already have this book reserved.";
  if (row.user_active >= MAX_ACTIVE)
    return `You can have at most ${MAX_ACTIVE} reservations at a time.`;
  if (row.available <= 0) return "No copies are available right now.";
  return "Could not reserve this book. Please try again.";
}
