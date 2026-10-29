// Run with TEST_DATABASE_URL pointing at a disposable, migrated database.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { pool } from "./helpers/test-db.mjs";
import { deleteBook, updateBook } from "../src/lib/queries/books.js";
import { reserveBook } from "../src/lib/queries/reservations.js";
import { reserveSteps } from "../src/lib/queries/reserve-sql.mjs";

// This suite intentionally resets its fixture tables: never use a real development/production DB.
beforeEach(async () => {
  await pool.query('truncate reservations, books, neon_auth."user" restart identity cascade');
  await pool.query(`insert into neon_auth."user" (id, name, email) values ('test-user', 'Test', 'test@example.test')`);
});
after(() => pool.end());

const bookData = (copies) => ({ title: "Test", author: "Author", isbn: null, description: null, published_year: null, total_copies: copies });

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
