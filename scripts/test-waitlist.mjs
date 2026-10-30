// Waitlist, renewal and wishlist rules against a THROWAWAY Postgres (truncates its tables):
//   TEST_DATABASE_URL=postgres://... node --import ./scripts/helpers/register-test-db.mjs --test scripts/test-waitlist.mjs
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import {
  reserveBook, returnBook, cancelHold, deleteUserReservation, markPickedUp, promoteWaitlist,
  joinBookWaitlist, leaveBookWaitlist, getWaitlistPosition, expireStaleHolds, renewLoan, listUserReservations,
} from "../src/lib/queries/reservations.js";
import { MAX_ACTIVE } from "../src/lib/queries/reserve-sql.mjs";
import { toggleSaved, listSaved, isSaved, listAlsoBorrowed, searchBooks } from "../src/lib/queries/books.js";
import { getMemberBookState, getMemberNotices, listUserWaitlist } from "../src/lib/queries/reservations.js";
import { genresQuery } from "../src/lib/queries/search-sql.mjs";

const USERS = ["u1", "u2", "u3", "u4"];

beforeEach(async () => {
  await pool.query('truncate waitlist, wishlist, admin_events, reservations, books, neon_auth."user" restart identity cascade');
  for (const id of USERS) await pool.query(`insert into neon_auth."user" (id, name, email) values ($1, $1, $1 || '@example.test')`, [id]);
});
after(() => pool.end());

async function addBook(copies = 1) {
  const { rows } = await pool.query("insert into books (title, author, total_copies) values ('Queue', 'Author', $1) returning id", [copies]);
  return rows[0].id;
}

async function holds(bookId) {
  const { rows } = await pool.query(
    `select r.user_id, r.from_waitlist from reservations r
     where r.book_id = $1 and r.id in (select id from active_reservations) order by r.user_id`, [bookId]);
  return rows;
}

async function queue(bookId) {
  const { rows } = await pool.query("select user_id from waitlist where book_id = $1 order by created_at, id", [bookId]);
  return rows.map((r) => r.user_id);
}

async function borrow(userId, bookId) {
  assert.deepEqual(await reserveBook(userId, bookId), { ok: true });
  const { rows: [r] } = await pool.query("select id from reservations where user_id = $1 and book_id = $2 and status = 'reserved'", [userId, bookId]);
  assert.equal(await markPickedUp(r.id), true);
  return r.id;
}

test("joining: only when you don't hold it, once, with a real position", async () => {
  const id = await addBook(1);
  await borrow("u1", id);
  assert.equal(await joinBookWaitlist("u1", id), false, "the holder can't queue");
  assert.equal(await joinBookWaitlist("u2", id), true);
  assert.equal(await joinBookWaitlist("u2", id), false, "no duplicates");
  assert.equal(await joinBookWaitlist("u3", id), true);
  assert.deepEqual(await getWaitlistPosition("u3", id), { position: 2, length: 2 });
  assert.equal(await leaveBookWaitlist("u2", id), true);
  assert.deepEqual(await getWaitlistPosition("u3", id), { position: 1, length: 1 });
  assert.equal(await getWaitlistPosition("u2", id), null);
});

test("a return hands the copy to the front of the queue as a normal hold", async () => {
  const id = await addBook(1);
  const loan = await borrow("u1", id);
  await joinBookWaitlist("u2", id);
  await joinBookWaitlist("u3", id);
  assert.equal(await returnBook(loan, "u1"), true);
  assert.deepEqual(await holds(id), [{ user_id: "u2", from_waitlist: true }]);
  assert.deepEqual(await queue(id), ["u3"]);
});

test("cancelling a hold, by member or admin, serves the queue", async () => {
  const id = await addBook(1);
  await reserveBook("u1", id);
  await joinBookWaitlist("u2", id);
  await joinBookWaitlist("u3", id);
  const { rows: [r1] } = await pool.query("select id from reservations where user_id = 'u1'");
  assert.equal(await deleteUserReservation("u1", r1.id), true);
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u2"]);
  const { rows: [r2] } = await pool.query("select id from reservations where user_id = 'u2'");
  assert.equal(await cancelHold(r2.id), true);
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u3"]);
  assert.deepEqual(await queue(id), []);
});

test("a member at the reservation limit keeps their place and is skipped", async () => {
  const id = await addBook(1);
  const loan = await borrow("u1", id);
  await joinBookWaitlist("u2", id);
  await joinBookWaitlist("u3", id);
  for (let i = 0; i < MAX_ACTIVE; i++) assert.deepEqual(await reserveBook("u2", await addBook(1)), { ok: true });
  await returnBook(loan);
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u3"]);
  assert.deepEqual(await queue(id), ["u2"]);
});

test("a walk-in can't take a copy freed by a lapsed hold while others wait", async () => {
  const id = await addBook(1);
  await reserveBook("u1", id);
  await joinBookWaitlist("u2", id);
  await pool.query("update reservations set expires_at = now() - interval '1 minute' where user_id = 'u1'");
  const result = await reserveBook("u3", id);
  assert.equal(result.ok, false);
  assert.match(result.error, /No copies/);
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u2"]);
});

test("added copies serve several waiters at once, in order", async () => {
  const id = await addBook(1);
  await borrow("u1", id);
  for (const u of ["u2", "u3", "u4"]) await joinBookWaitlist(u, id);
  await pool.query("update books set total_copies = 3 where id = $1", [id]);
  assert.equal(await promoteWaitlist(id), 2);
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u1", "u2", "u3"]);
  assert.deepEqual(await queue(id), ["u4"]);
});

test("parallel promotions never hand out more copies than exist", async () => {
  const id = await addBook(2);
  await borrow("u1", id);
  await borrow("u2", id);
  await joinBookWaitlist("u3", id);
  await joinBookWaitlist("u4", id);
  await pool.query("update books set total_copies = 3 where id = $1", [id]);
  const results = await Promise.all(Array.from({ length: 6 }, () => promoteWaitlist(id)));
  assert.equal(results.reduce((a, b) => a + b, 0), 1);
  assert.equal((await holds(id)).length, 3);
});

test("overlapping queues on two books promote in parallel without deadlock", async () => {
  const a = await addBook(1);
  const b = await addBook(1);
  const loanA = await borrow("u1", a);
  const loanB = await borrow("u2", b);
  for (const u of ["u3", "u4"]) {
    await joinBookWaitlist(u, a);
    await joinBookWaitlist(u, b);
  }
  await Promise.all([returnBook(loanA), returnBook(loanB), reserveBook("u3", a), reserveBook("u4", b)]);
  const total = (await holds(a)).length + (await holds(b)).length;
  assert.equal(total, 2);
});

test("the daily job expires lapsed holds and then serves queues", async () => {
  const id = await addBook(1);
  await reserveBook("u1", id);
  await joinBookWaitlist("u2", id);
  await pool.query("update reservations set expires_at = now() - interval '1 minute'");
  assert.deepEqual(await expireStaleHolds(), { expired: 1, promoted: 1 });
  assert.deepEqual((await holds(id)).map((h) => h.user_id), ["u2"]);
});

test("returns: members only their own loans, admins any loan", async () => {
  const id = await addBook(2);
  const loan1 = await borrow("u1", id);
  const loan2 = await borrow("u2", id);
  assert.equal(await returnBook(loan1, "u2"), false, "someone else's loan");
  assert.equal(await returnBook(loan1, "u1"), true);
  assert.equal(await returnBook(loan2), true, "admin return");
  assert.equal(await returnBook(loan2), false, "already returned");
});

test("a loan renews once, not when overdue, and not while someone waits", async () => {
  const id = await addBook(1);
  const loan = await borrow("u1", id);
  assert.deepEqual(await renewLoan("u2", loan), { ok: false, error: "Only books you have borrowed can be renewed." });
  assert.equal((await listUserReservations("u1"))[0].can_renew, true);
  assert.deepEqual(await renewLoan("u1", loan), { ok: true });
  assert.deepEqual(await renewLoan("u1", loan), { ok: false, error: "This loan has already been renewed." });
  const [row] = await listUserReservations("u1");
  assert.equal(Math.round((new Date(row.due_at) - new Date(row.picked_up_at)) / 86400000), 56);
  assert.equal(row.can_renew, false);

  const queued = await addBook(1);
  const loan2 = await borrow("u1", queued);
  await joinBookWaitlist("u2", queued);
  assert.match((await renewLoan("u1", loan2)).error, /Someone is waiting/);

  const late = await addBook(1);
  const loan3 = await borrow("u1", late);
  await pool.query("update reservations set picked_up_at = now() - interval '30 days' where id = $1", [loan3]);
  assert.match((await renewLoan("u1", loan3)).error, /overdue/);
});

test("a renewed loan is only overdue after the extended due date", async () => {
  const id = await addBook(1);
  const loan = await borrow("u1", id);
  await pool.query("update reservations set picked_up_at = now() - interval '30 days', renewals = 1 where id = $1", [loan]);
  const [row] = await listUserReservations("u1");
  assert.equal(row.is_overdue, false);
  await pool.query("update reservations set picked_up_at = now() - interval '57 days' where id = $1", [loan]);
  assert.equal((await listUserReservations("u1"))[0].is_overdue, true);
});

test("saving for later: add, list, remove; deleted books can't be saved", async () => {
  const id = await addBook(1);
  assert.equal(await toggleSaved("u1", id, true), true);
  assert.equal(await toggleSaved("u1", id, true), true, "saving twice is fine");
  assert.deepEqual((await listSaved("u1")).map((b) => b.id), [id]);
  assert.equal(await toggleSaved("u1", id, false), false);
  assert.equal(await isSaved("u1", id), false);
  await pool.query("update books set deleted_at = now() where id = $1", [id]);
  assert.equal(await toggleSaved("u1", id, true), null);
});

test("member state and notices reflect holds, queues and loans", async () => {
  const id = await addBook(1);
  await reserveBook("u1", id);
  await joinBookWaitlist("u2", id);
  await toggleSaved("u2", id, true);
  assert.equal((await getMemberBookState("u1", id)).holding, "reserved");
  const u2 = await getMemberBookState("u2", id);
  assert.deepEqual({ holding: u2.holding, saved: u2.saved, position: u2.position, queueLength: u2.queueLength }, { holding: null, saved: true, position: 1, queueLength: 1 });
  assert.deepEqual((await listUserWaitlist("u2")).map((w) => w.position), [1]);
  assert.equal((await getMemberNotices("u1")).ready, 1);
  const { rows: [r] } = await pool.query("select id from reservations where user_id = 'u1'");
  await deleteUserReservation("u1", r.id);
  assert.deepEqual(await getMemberNotices("u2"), { ready: 1, from_waitlist: 1, expiring: 0, overdue: 0 });
});

test("readers also borrowed counts picked-up books by the same readers", async () => {
  const [a, b, c, d] = [await addBook(3), await addBook(3), await addBook(3), await addBook(3)];
  for (const u of ["u1", "u2"]) { await borrow(u, a); await borrow(u, b); }
  await borrow("u3", a); await borrow("u3", c);
  await reserveBook("u4", a); await reserveBook("u4", d); // holds only: not reading
  assert.deepEqual((await listAlsoBorrowed(a)).map((x) => x.id), [b, c]);
});

test("genres: filter is case-insensitive and the list counts books", async () => {
  const p = await addBook(1);
  const q = await addBook(1);
  await pool.query("update books set genre = 'Poetry' where id = $1", [p]);
  await pool.query("update books set genre = 'Crime' where id = $1", [q]);
  assert.deepEqual((await searchBooks({ filters: { genre: "poetry" } })).books.map((x) => x.id), [p]);
  assert.deepEqual((await pool.query(genresQuery.text)).rows.map((g) => g.genre).sort(), ["Crime", "Poetry"]);
});
