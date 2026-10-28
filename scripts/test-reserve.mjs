// Concurrency check for the reserve SQL. Run against a THROWAWAY database only:
//   DATABASE_URL=postgres://... node scripts/test-reserve.mjs
// It creates test users/books and deletes them afterwards.
import assert from "node:assert/strict";
import pg from "pg";
import { reserveSteps, MAX_ACTIVE } from "../src/lib/queries/reserve-sql.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 25 });
const tag = `test-${Date.now()}`;

async function reserve(userId, bookId) {
  const client = await pool.connect();
  try {
    await client.query("begin isolation level read committed");
    let rows = [];
    for (const step of reserveSteps(userId, bookId)) ({ rows } = await client.query(step.text, step.params));
    await client.query("commit");
    return rows.length === 1;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

async function addBook(copies) {
  const { rows } = await pool.query(
    "insert into books (title, author, total_copies) values ($1, 'Test', $2) returning id",
    [`${tag} book`, copies]
  );
  return rows[0].id;
}

async function addUser(n) {
  const id = `${tag}-u${n}`;
  await pool.query(`insert into neon_auth."user" (id, name, email) values ($1, $1, $1 || '@test.local')`, [id]);
  return id;
}

const count = (results) => results.filter(Boolean).length;

try {
  // 1. One user fires 15 parallel reserves on 15 different books: exactly 10 succeed.
  const user = await addUser(1);
  const books = await Promise.all(Array.from({ length: 15 }, () => addBook(5)));
  const r1 = await Promise.all(books.map((b) => reserve(user, b)));
  assert.equal(count(r1), MAX_ACTIVE);
  console.log(`ok  user limit: ${count(r1)}/15 succeeded`);

  // 2. 8 users race for a book with 5 copies: exactly 5 succeed.
  const scarce = await addBook(5);
  const users = await Promise.all(Array.from({ length: 8 }, (_, i) => addUser(i + 10)));
  const r2 = await Promise.all(users.map((u) => reserve(u, scarce)));
  assert.equal(count(r2), 5);
  console.log(`ok  copies: ${count(r2)}/8 succeeded for 5 copies`);

  // 3. Same user, same book, in parallel: only one succeeds.
  const dupUser = await addUser(30);
  const dupBook = await addBook(3);
  const r3 = await Promise.all([1, 2, 3].map(() => reserve(dupUser, dupBook)));
  assert.equal(count(r3), 1);
  console.log("ok  no duplicate holds");

  // 4. An expired hold frees the copy and the user's slot.
  const oneCopy = await addBook(1);
  const a = await addUser(40);
  const b = await addUser(41);
  assert.equal(await reserve(a, oneCopy), true);
  assert.equal(await reserve(b, oneCopy), false);
  await pool.query("update reservations set expires_at = now() - interval '1 minute' where user_id = $1", [a]);
  assert.equal(await reserve(b, oneCopy), true);
  console.log("ok  expired hold no longer counts");

  // 5. Picked-up books still count; returned ones don't.
  const c = await addUser(50);
  const loanBook = await addBook(1);
  assert.equal(await reserve(c, loanBook), true);
  await pool.query("update reservations set status = 'picked_up', expires_at = now() - interval '30 days' where user_id = $1", [c]);
  assert.equal(await reserve(b, loanBook), false);
  await pool.query("update reservations set status = 'returned' where user_id = $1", [c]);
  assert.equal(await reserve(b, loanBook), true);
  console.log("ok  picked-up counts, returned frees the copy");

  console.log("all reserve checks passed");
} finally {
  await pool.query(`delete from neon_auth."user" where id like $1`, [`${tag}%`]);
  await pool.query(`delete from books where title like $1`, [`${tag}%`]).catch(() => {});
  await pool.end();
}
