// Waitlist SQL. No Next or driver imports, so tests run these exact statements on Postgres.
//
// Promotion gives free copies to the front of a book's queue as ordinary 7-day holds.
// It runs inside the same READ COMMITTED transaction as whatever freed the copy (a return,
// a cancelled hold, more copies), or on its own before a reserve and from the daily job.
//
// Lock order matches reserveSteps and liveHoldSteps: member advisory locks first, then the
// book row. Several member locks are always taken in hashtext order, so two promotions with
// overlapping queues can't deadlock. Holding each waiter's lock keeps the 10-reservation
// limit exact, just as it is for a member reserving directly.
import { MAX_ACTIVE } from "./reserve-sql.mjs";
import { borrowBlockedSql } from "./moderation-sql.mjs";

// How far down a queue one promotion looks. More free copies than this at once is unusual.
export const PROMOTE_SCAN = 50;

// `book` is an SQL expression for the book id, e.g. "$1" or "(select book_id from reservations where id = $1)".
export function promotionLockSteps(book, params) {
  return [
    {
      text: `select pg_advisory_xact_lock(k) from (
        select distinct hashtext(q.user_id::text) as k from (
          select user_id from waitlist where book_id = ${book} order by created_at, id limit ${PROMOTE_SCAN}
        ) q order by k
      ) locks`,
      params,
    },
    { text: `select id from books where id = ${book} and deleted_at is null for update`, params },
  ];
}

// Returns one row per member who got a hold. Members at the 10-reservation limit, and members
// whose borrowing is paused by staff, keep their place and are skipped this time; anyone who already holds the book leaves the queue.
export function promoteStep(book, params) {
  return {
    text: `with target as (select (${book})::bigint as book_id),
      free as (
        select greatest(b.total_copies - (select count(*) from active_reservations a where a.book_id = b.id), 0)::int as n
        from books b, target t where b.id = t.book_id and b.deleted_at is null
      ),
      queue as (
        select w.id, w.user_id, row_number() over (order by w.created_at, w.id) as pos
        from (select waitlist.* from waitlist, target t where waitlist.book_id = t.book_id order by created_at, id limit ${PROMOTE_SCAN}) w
        where (select count(*) from active_reservations a where a.user_id = w.user_id) < ${MAX_ACTIVE}
          and not exists (select 1 from active_reservations a where a.user_id = w.user_id and a.book_id = w.book_id)
          and not ${borrowBlockedSql("w.user_id")}
      ),
      chosen as (select q.id, q.user_id from queue q, free f where q.pos <= f.n),
      held as (
        insert into reservations (user_id, book_id, from_waitlist)
        select c.user_id, t.book_id, true from chosen c, target t
        returning user_id
      ),
      cleared as (
        delete from waitlist w using target t
        where w.book_id = t.book_id and (
          w.id in (select id from chosen)
          or exists (select 1 from active_reservations a where a.user_id = w.user_id and a.book_id = w.book_id)
        )
        returning w.id
      )
      select user_id, (select count(*) from cleared)::int as cleared from held`,
    params,
  };
}

export const WAITLIST_LIMIT = 20;

// Join the queue for a book that exists, isn't deleted and isn't already yours.
// Returns the queue row id, or nothing if refused.
export const joinWaitlist = {
  text: `insert into waitlist (user_id, book_id)
    select $1, b.id from books b
    where b.id = $2 and b.deleted_at is null
      and not exists (select 1 from active_reservations a where a.user_id = $1 and a.book_id = b.id)
      and (select count(*) from waitlist where user_id = $1) < ${WAITLIST_LIMIT}
      and not ${borrowBlockedSql("$1")}
    on conflict (user_id, book_id) do nothing
    returning id`,
};

export const leaveWaitlist = {
  text: "delete from waitlist where user_id = $1 and book_id = $2 returning id",
};

// 1-based place in the queue, and the queue length, or no row if not queued.
export const waitlistPosition = {
  text: `select
      (select count(*)::int from waitlist w2 where w2.book_id = w.book_id
         and (w2.created_at, w2.id) <= (w.created_at, w.id)) as position,
      (select count(*)::int from waitlist w3 where w3.book_id = w.book_id) as length
    from waitlist w where w.user_id = $1 and w.book_id = $2`,
};
