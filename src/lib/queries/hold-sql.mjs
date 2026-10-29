// Keep the same user → book lock order as reserveSteps. Lock the reservation
// too, then check expiry after every possible lock wait. Use wall time even if
// the transport batches statements into one PostgreSQL protocol message.
export function liveHoldSteps(id, pickedUp) {
  return [
    {
      text: "select pg_advisory_xact_lock(hashtext(user_id::text)) from reservations where id = $1",
      params: [id],
    },
    {
      text: `select r.id from reservations r join books b on b.id = r.book_id
        where r.id = $1 and b.deleted_at is null for update of b, r`,
      params: [id],
    },
    {
      text: `update reservations r set ${pickedUp
        ? "status = 'picked_up', picked_up_at = clock_timestamp()"
        : "expires_at = clock_timestamp() + interval '7 days'"}
        from books b where r.id = $1 and b.id = r.book_id and b.deleted_at is null
          and r.status = 'reserved' and r.expires_at > clock_timestamp()
        returning r.id`,
      params: [id],
    },
  ];
}
