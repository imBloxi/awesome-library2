// Resets fixture tables. TEST_DATABASE_URL must point at a disposable database.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import * as reservations from "../src/lib/queries/reservations.js";
import { getStats } from "../src/lib/queries/books.js";
import { buildReservationQuery } from "../src/lib/queries/reservation-sql.mjs";

beforeEach(async () => {
  await pool.query('truncate reservations, books, neon_auth."user" restart identity cascade');
  await pool.query(`insert into neon_auth."user" (id, name, email) values
    ('member-a', 'Ada Reader', 'ada@example.test'),
    ('member-b', null, 'ada+other@example.test')`);
  await pool.query("insert into books (title, author, total_copies) values ('River 100%', 'Author', 1000)");
});
after(() => pool.end());

async function add(status = "reserved", { member = "member-a", expires = "2 days", pickedUp = null, age = "0 days" } = {}) {
  const { rows: [row] } = await pool.query(`insert into reservations
    (user_id, book_id, status, expires_at, picked_up_at, reserved_at)
    values ($1, 1, $2::reservation_status, now() + $3::interval,
      case when $4::interval is not null then now() - $4::interval end, now() - $5::interval)
    returning id`, [member, status, expires, pickedUp, age]);
  return row.id;
}
const ids = (rows) => rows.map((row) => row.id);

test("expiring filter includes only live holds in the next 24 hours", async () => {
  const soon = await add("reserved", { expires: "1 hour" });
  await add("reserved", { expires: "-1 second" });
  await add("reserved", { expires: "2 days" });
  await add("picked_up", { expires: "1 hour", pickedUp: "1 day" });
  await add("cancelled", { expires: "1 hour" });
  assert.deepEqual(ids(await reservations.listAllReservations({ status: "expiring" })), [soon]);
  assert.equal((await getStats()).expiring, 1);
});

test("attention queue orders oldest overdue loans before soonest live pickup deadlines", async () => {
  const soon = await add("reserved", { expires: "2 hours" });
  const justOverdue = await add("picked_up", { pickedUp: "28 days 1 hour" });
  const oldest = await add("picked_up", { pickedUp: "40 days", age: "50 days" });
  const sooner = await add("reserved", { expires: "1 hour" });
  await add("reserved", { expires: "-1 hour" });
  await add("picked_up", { pickedUp: "2 days" });
  const rows = await reservations.listAllReservations({ status: "attention", sort: "priority" });
  assert.deepEqual(ids(rows), [oldest, justOverdue, sooner, soon]);
  assert.deepEqual(rows.map((r) => r.is_overdue), [true, true, false, false]);
  assert.equal((await getStats()).overdue, 2);
});

test("borrowed rows expose exact due dates and flag sub-day overdue loans", async () => {
  const late = await add("picked_up", { pickedUp: "28 days 1 hour" });
  const fresh = await add("picked_up", { pickedUp: "27 days 23 hours" });
  const rows = await reservations.listAllReservations({ status: "picked_up", sort: "priority" });
  assert.deepEqual(ids(rows), [late, fresh]);
  assert.equal(rows[0].is_overdue, true);
  assert.equal(rows[1].is_overdue, false);
  assert.equal(new Date(rows[0].due_at) - new Date(rows[0].picked_up_at), 28 * 86400000);
});

test("member filter matches an exact identity and combines with status and literal search", async () => {
  const mine = await add();
  await add("reserved", { member: "member-b" });
  await add("returned");
  const options = { status: "active", userId: "member-a", q: "100%" };
  assert.deepEqual(ids(await reservations.listAllReservations(options)), [mine]);
  assert.deepEqual(await reservations.listAllReservations({ ...options, q: "100_" }), []);
  assert.deepEqual(await reservations.listAllReservations({ ...options, userId: "not-a-uuid' OR true--" }), []);
  assert.deepEqual(ids(await reservations.listAllReservations({ status: "active", q: "Ada Reader", userId: "member-a" })), [mine]);
});

test("paged reservation history reaches past 200 with deterministic ties and no overlap", async () => {
  await pool.query(`insert into reservations (user_id, book_id, status, reserved_at)
    select 'member-a', 1, 'returned', '2026-01-01T12:00:00Z'::timestamptz from generate_series(1,205)`);
  const seen = [];
  for (let page = 1; page <= 11; page++) {
    const result = await reservations.listReservationPage({ status: "all", sort: "newest", page });
    assert.equal(result.rows.length, page === 11 ? 5 : 20);
    assert.equal(result.hasNext, page < 11);
    seen.push(...ids(result.rows));
  }
  assert.equal(new Set(seen).size, 205);
  assert.deepEqual(seen, Array.from({ length: 205 }, (_, i) => String(205 - i)));
  const empty = await reservations.listReservationPage({ status: "all", page: 12 });
  assert.deepEqual(empty, { rows: [], hasNext: false });
});

test("priority pagination preserves exact member/status/search filters", async () => {
  await pool.query(`insert into reservations (user_id, book_id, expires_at)
    select 'member-a', 1, '2099-01-01T12:00:00Z'::timestamptz from generate_series(1,25)`);
  await add("reserved", { member: "member-b", expires: "1 hour" });
  const result = await reservations.listReservationPage({ userId: "member-a", status: "reserved", q: "River", sort: "priority", page: 2 });
  assert.deepEqual(ids(result.rows), ["21", "22", "23", "24", "25"]);
  assert.equal(result.hasNext, false);
});

test("member context exists without reservations and safely handles missing identities", async () => {
  assert.deepEqual(await reservations.getReservationMember("member-a"), { id: "member-a", name: "Ada Reader", email: "ada@example.test" });
  assert.equal(await reservations.getReservationMember("bad uuid value"), null);
  assert.deepEqual(await reservations.listReservationPage({ userId: "missing" }), { rows: [], hasNext: false });
});

test("every existing reservation filter handles combined parameters and derives expired holds", async () => {
  for (const status of ["reserved", "picked_up", "returned", "cancelled", "expired"]) await add(status, { pickedUp: status === "picked_up" ? "2 days" : null });
  const lapsed = await add("reserved", { expires: "-1 hour" });
  const expired = await reservations.listAllReservations({ status: "expired", bookId: 1, userId: "member-a", q: "100%" });
  assert.equal(expired.length, 2);
  assert.ok(ids(expired).includes(lapsed));
  for (const status of ["reserved", "picked_up", "returned", "cancelled"]) {
    const rows = await reservations.listAllReservations({ status, bookId: 1, userId: "member-a", q: "100%" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, status);
  }
});

test("pickup and loan boundaries use the same statement clock and strict deadlines", async () => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`insert into reservations (user_id, book_id, status, expires_at, picked_up_at) values
      ('member-a', 1, 'picked_up', now(), now() - interval '28 days 1 second'),
      ('member-a', 1, 'picked_up', now(), now() - interval '28 days'),
      ('member-a', 1, 'picked_up', now(), now() - interval '27 days 23 hours 59 minutes 59 seconds'),
      ('member-a', 1, 'reserved', now(), null),
      ('member-a', 1, 'reserved', now() + interval '1 day', null),
      ('member-a', 1, 'reserved', now() + interval '23 hours 59 minutes 59 seconds', null)`);
    const query = async (status) => {
      const { text, params } = buildReservationQuery({ status, sort: "priority" });
      return (await client.query(text, params)).rows;
    };
    assert.deepEqual(ids(await query("overdue")), ["1"]);
    assert.deepEqual(ids(await query("expiring")), ["6"]);
    assert.deepEqual(ids(await query("attention")), ["1", "6"]);
    assert.deepEqual(ids(await query("expired")), ["4"]);
    const loans = await query("picked_up");
    assert.deepEqual(loans.map((r) => r.is_overdue), [true, false, false]);
  } finally {
    await client.query("rollback");
    client.release();
  }
});

test("native UUID member columns accept exact and malformed text filters safely", async () => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Bind the same query to temporary fixture tables with UUID identities.
    // Only the auth table name changes; filter expressions and parameters are unchanged.
    await client.query('create temp table uuid_members (id uuid primary key, name text, email text)');
    await client.query('create temp table reservations (like public.reservations including defaults)');
    await client.query('alter table pg_temp.reservations alter column user_id type uuid using user_id::uuid');
    const member = "d4471468-4ebc-47db-bf1c-0e091a248090";
    await client.query("insert into uuid_members values ($1, 'UUID Member', 'uuid@example.test')", [member]);
    await client.query("insert into pg_temp.reservations (id, user_id, book_id) values (1,$1,1)", [member]);
    const run = async (userId) => {
      const { text, params } = buildReservationQuery({ userId });
      return (await client.query(text.replaceAll('neon_auth."user"', 'pg_temp.uuid_members'), params)).rows;
    };
    assert.deepEqual(ids(await run(member)), ["1"]);
    assert.deepEqual(await run("bad UUID' OR true--"), []);
    assert.deepEqual(await run("d4471468-4ebc-47db-bf1c-0e091a248091"), []);
  } finally {
    await client.query("rollback");
    client.release();
  }
});
