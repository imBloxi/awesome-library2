// Run with TEST_DATABASE_URL pointing at a disposable, migrated database.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { pool, lastQuery } from "./helpers/test-db.mjs";
import { deleteBook, updateBook, getBook, getStats } from "../src/lib/queries/books.js";
import { reserveBook, markPickedUp, extendHold, countActive, listAllReservations } from "../src/lib/queries/reservations.js";
import { listUsers } from "../src/lib/queries/users.js";
import { reserveSteps } from "../src/lib/queries/reserve-sql.mjs";
import { liveHoldSteps } from "../src/lib/queries/hold-sql.mjs";

// This suite intentionally resets its fixture tables: never use a real development/production DB.
beforeEach(async () => {
  await pool.query('truncate reservations, books, neon_auth."user" restart identity cascade');
  await pool.query(`insert into neon_auth."user" (id, name, email) values ('test-user', 'Test', 'test@example.test')`);
});
after(() => pool.end());

const bookData = (copies) => ({ title: "Test", author: "Author", isbn: null, description: null, published_year: null, total_copies: copies, top_pick: false });

async function addBook(copies = 1) {
  const { rows } = await pool.query("insert into books (title, author, total_copies) values ('Test', 'Author', $1) returning id", [copies]);
  return rows[0].id;
}

async function transaction(fn) {
  const client = await pool.connect();
  await client.query("begin isolation level read committed");
  try {
    await fn(client);
  } finally {
    await client.query("rollback"); // harmless after an explicit commit
    client.release();
  }
}

async function waitForBlocked(client) {
  const { rows: [{ pid }] } = await client.query("select pg_backend_pid() as pid");
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const { rows } = await pool.query("select 1 from pg_stat_activity where $1 = any(pg_blocking_pids(pid))", [pid]);
    if (rows.length) return;
    await setTimeout(10);
  }
  assert.fail("Expected a competing mutation to wait for the book lock");
}

async function reserveOn(client, id) {
  for (const { text, params } of reserveSteps("test-user", id)) await client.query(text, params);
}

test("a copy reduction waits for a reservation and rejects a newly occupied copy", async () => {
  const id = await addBook();
  await transaction(async (client) => {
    await reserveOn(client, id);
    const update = updateBook(id, bookData(0));
    await waitForBlocked(client);
    await client.query("commit");
    assert.deepEqual(await update, { ok: false, error: "1 copies are reserved or borrowed right now. Copies can't go below that." });
  });
  const { rows: [book] } = await pool.query("select total_copies from books where id = $1", [id]);
  assert.equal(book.total_copies, 1);
});

test("deletion waits for a reservation and refuses its newly occupied book", async () => {
  const id = await addBook();
  await transaction(async (client) => {
    await reserveOn(client, id);
    const deletion = deleteBook(id);
    await waitForBlocked(client);
    await client.query("commit");
    assert.equal(await deletion, false);
  });
  const { rows: [book] } = await pool.query("select deleted_at from books where id = $1", [id]);
  assert.equal(book.deleted_at, null);
});

test("a reservation waiting behind a copy reduction sees the new capacity", async () => {
  const id = await addBook();
  await transaction(async (client) => {
    await client.query("update books set total_copies = 0 where id = $1", [id]);
    const reservation = reserveBook("test-user", id);
    await waitForBlocked(client);
    await client.query("commit");
    assert.deepEqual(await reservation, { ok: false, error: "No copies are available right now." });
  });
});

test("a reservation waiting behind deletion cannot reserve the deleted book", async () => {
  const id = await addBook();
  await transaction(async (client) => {
    await client.query("update books set deleted_at = now() where id = $1", [id]);
    const reservation = reserveBook("test-user", id);
    await waitForBlocked(client);
    await client.query("commit");
    assert.deepEqual(await reservation, { ok: false, error: "This book no longer exists." });
  });
});

test("editing missing and concurrently deleted books returns not-found feedback", async () => {
  const error = { ok: false, error: "This book no longer exists." };
  assert.deepEqual(await updateBook(999, bookData(1)), error);
  const id = await addBook();
  await transaction(async (client) => {
    await client.query("update books set deleted_at = now() where id = $1", [id]);
    const update = updateBook(id, bookData(2));
    await waitForBlocked(client);
    await client.query("commit");
    assert.deepEqual(await update, error);
  });
});

test("an allowed edit updates the book and preserves ISBN conflict errors", async () => {
  const id = await addBook();
  assert.deepEqual(await updateBook(id, { ...bookData(3), isbn: "unique" }), { ok: true });
  const other = await addBook();
  await assert.rejects(updateBook(other, { ...bookData(1), isbn: "unique" }), { code: "23505" });
  assert.equal(await deleteBook(id), true);
  assert.equal(await deleteBook(id), false);
});

test("empty dashboard and unoccupied book return numeric counts", async () => {
  assert.deepEqual(await getStats(), { books: 0, users: 1, overdue: 0, out_of_stock: 0, holds: 0, loans: 0, expiring: 0 });
  const id = await addBook(3);
  const book = await getBook(id);
  assert.equal(book.active_count, 0);
  assert.equal(book.available, 3);
  assert.equal(await getBook(999), null);
});

async function seedStatuses() {
  const id = await addBook(3);
  const empty = await addBook(0);
  const deleted = await addBook(1);
  await pool.query("update books set deleted_at = now() where id = $1", [deleted]);
  // Two live holds (only one expiring soon), two loans (only one overdue),
  // and inactive rows that must not inflate availability or dashboard counts.
  await pool.query(`insert into reservations (user_id, book_id, status, expires_at, picked_up_at) values
    ('test-user', $1, 'reserved', now() + interval '1 hour', null),
    ('test-user', $1, 'reserved', now() - interval '1 hour', null),
    ('test-user', $1, 'picked_up', now() - interval '30 days', now() - interval '30 days'),
    ('test-user', $1, 'picked_up', now() - interval '1 day', now() - interval '1 day'),
    ('test-user', $1, 'returned', now() + interval '1 day', now() - interval '30 days'),
    ('test-user', $1, 'cancelled', now() + interval '1 day', null),
    ('test-user', $1, 'expired', now() - interval '1 day', null),
    ('test-user', $2, 'reserved', now() + interval '2 days', null)`, [id, deleted]);
  return { id, empty, deleted };
}

test("counts distinguish live holds, expired holds, overdue loans, and deleted books", async () => {
  const { id, empty, deleted } = await seedStatuses();
  assert.equal((await getBook(id)).active_count, 3);
  assert.equal((await getBook(id)).available, 0);
  assert.equal((await getBook(empty)).available, 0);
  assert.equal(await getBook(deleted), null);
  assert.deepEqual(await getStats(), { books: 2, users: 1, overdue: 1, out_of_stock: 1, holds: 2, loans: 2, expiring: 1 });
  assert.equal((await updateBook(id, bookData(2))).ok, false);
  assert.deepEqual(await updateBook(id, bookData(3)), { ok: true });
  assert.equal(await deleteBook(id), false);
});

function reservationScans(plan) {
  return Number(plan["Relation Name"] === "reservations") + (plan.Plans ?? []).reduce((sum, child) => sum + reservationScans(child), 0);
}

async function explainLast() {
  const { text, params } = lastQuery;
  const { rows } = await pool.query(`explain (analyze, buffers, format json) ${text}`, params);
  return rows[0]["QUERY PLAN"][0];
}

test("book details count reservations once", async () => {
  const id = await addBook();
  await getBook(id);
  const plan = await explainLast();
  assert.equal(reservationScans(plan.Plan), 1);
});

test("dashboard aggregates avoid repeated reservation scans", async () => {
  await seedStatuses();
  await getStats();
  const plan = await explainLast();
  assert.ok(reservationScans(plan.Plan) <= 2, `Expected at most two reservation scans; got ${reservationScans(plan.Plan)}`);
});

test("transactional book edits retain latest-main top-pick behavior", async () => {
  const id = await addBook();
  assert.deepEqual(await updateBook(id, { ...bookData(2), top_pick: true }), { ok: true });
  const first = await getBook(id);
  assert.equal(first.is_top_pick, true);
  assert.deepEqual(await updateBook(id, { ...bookData(2), top_pick: true }), { ok: true });
  assert.deepEqual((await getBook(id)).top_pick_at, first.top_pick_at);
  await pool.query("update books set top_pick_at = now() - interval '8 days' where id = $1", [id]);
  assert.equal((await getBook(id)).is_top_pick, false);
  await updateBook(id, { ...bookData(2), top_pick: true });
  assert.equal((await getBook(id)).is_top_pick, true);
  await updateBook(id, bookData(2));
  assert.equal((await getBook(id)).top_pick_at, null);
});

async function addHold(bookId, status = "reserved") {
  const { rows } = await pool.query(
    "insert into reservations (user_id, book_id, status) values ('test-user', $1, $2) returning id",
    [bookId, status]
  );
  return rows[0].id;
}

async function waitForExpiry(id) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const { rows: [row] } = await pool.query("select expires_at <= clock_timestamp() as expired from reservations where id = $1", [id]);
    if (row.expired) return;
    await setTimeout(10);
  }
  assert.fail("Fixture hold did not expire");
}

async function waitForReservation(promise) {
  let finished = false;
  promise.then(() => { finished = true; }, () => { finished = true; });
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    // Old code lets the new reservation finish; fixed code makes it wait
    // behind the pending hold mutation. Observe either before releasing it.
    const { rows: [row] } = await pool.query(`select count(*)::int as n from pg_stat_activity
      where application_name = 'library-book-tests' and cardinality(pg_blocking_pids(pid)) > 0`);
    if (finished || row.n >= 2) return;
    await setTimeout(10);
  }
  assert.fail("Competing reservation neither completed nor waited on a lock");
}

for (const [name, mutate] of [["pickup", markPickedUp], ["extension", extendHold]]) {
  for (const sameUser of [false, true]) {
    test(`${name} cannot revive a hold after its ${sameUser ? "user slot" : "copy"} was reused during a lock wait`, async () => {
      const id = await addBook();
      const hold = await addHold(id);
      await pool.query(`insert into neon_auth."user" (id, name, email) values ('other-user', 'Other', 'other@example.test')`);
      if (sameUser) {
        const { rows } = await pool.query("insert into books (title, author) select 'Extra', 'Author' from generate_series(1,9) returning id");
        for (const book of rows) await addHold(book.id);
      }
      const target = sameUser ? await addBook() : id;
      await pool.query("update reservations set expires_at = clock_timestamp() + interval '500 milliseconds' where id = $1", [hold]);
      await transaction(async (client) => {
        await client.query("select id from reservations where id = $1 for update", [hold]);
        const mutation = mutate(hold);
        await waitForBlocked(client);
        await waitForExpiry(hold);
        const reservation = reserveBook(sameUser ? "test-user" : "other-user", target);
        await waitForReservation(reservation);
        await client.query("commit");
        const [changed, reserved] = await Promise.all([mutation, reservation]);
        assert.equal(reserved.ok, true);
        assert.equal(changed, false, "A hold that expired during the wait must remain expired");
      });
      assert.equal(await countActive("test-user"), sameUser ? 10 : 0);
      assert.equal((await getBook(id)).active_count, sameUser ? 0 : 1);
    });
  }

  test(`${name} only changes live holds on existing books`, async () => {
    assert.equal(await mutate(999), false);
    const id = await addBook();
    for (const status of ["picked_up", "returned", "cancelled", "expired"]) {
      assert.equal(await mutate(await addHold(id, status)), false);
    }
    const hold = await addHold(id);
    assert.equal(await mutate(hold), true);
    const { rows: [row] } = await pool.query("select status, picked_up_at, expires_at > now() + interval '6 days' as extended from reservations where id = $1", [hold]);
    assert.equal(row.status, name === "pickup" ? "picked_up" : "reserved");
    if (name === "pickup") assert.ok(row.picked_up_at);
    else assert.equal(row.extended, true);
    const gone = await addBook();
    const goneHold = await addHold(gone);
    await pool.query("update books set deleted_at = now() where id = $1", [gone]);
    assert.equal(await mutate(goneHold), false);
  });
}

test("admin user queries bound oversized and malformed page numbers", async () => {
  for (const page of [1e100, Infinity, -1, NaN, 1.5]) {
    const result = await listUsers({ page });
    assert.equal(Number.isSafeInteger(lastQuery.params.at(-1)), true);
    assert.ok(lastQuery.params.at(-1) >= 0 && lastQuery.params.at(-1) <= 199980);
    assert.equal(typeof result.hasNext, "boolean");
  }
});

test("admin searches treat LIKE wildcards literally", async () => {
  const id = await addBook(2);
  await pool.query("update books set title = '50%_\\rare' where id = $1", [id]);
  await pool.query('update neon_auth."user" set name = $1, email = $2 where id = $3', ["50%_\\reader", "50%_\\reader@example.test", "test-user"]);
  await addHold(id);
  const match = "50%_\\";
  assert.equal((await listUsers({ q: match })).users.length, 1);
  assert.equal((await listAllReservations({ q: match })).length, 1);
  assert.equal((await listUsers({ q: "50X" })).users.length, 0);
  assert.equal((await listAllReservations({ q: "50X" })).length, 0);
});

test("hold expiry uses wall time even when commands share one protocol message", async () => {
  const id = await addHold(await addBook());
  // IDs come from the local identity column, never user input. Batching here
  // checks PostgreSQL timing semantics independently of the HTTP transport.
  assert.match(id, /^\d+$/);
  const statements = liveHoldSteps(id, true).map((s) => s.text.replaceAll("$1", id));
  const client = await pool.connect();
  try {
    const results = await client.query(`begin;
      update reservations set expires_at = clock_timestamp() + interval '100 milliseconds' where id = ${id};
      ${statements[0]}; ${statements[1]}; select pg_sleep(0.15); ${statements[2]}; commit`);
    assert.equal(results.at(-2).rows.length, 0, "Batch protocol must not freeze the expiry check at message start");
  } finally {
    await client.query("rollback");
    client.release();
  }
});
