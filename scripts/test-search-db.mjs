// Top-pick and search SQL against Postgres. Run against a THROWAWAY database only:
//   DATABASE_URL=postgres://... node --test scripts/test-search-db.mjs
// It creates test books and deletes them afterwards.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { TOP_PICK_ACTIVE_SQL, topPickAtSql } from "../src/lib/queries/search-sql.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const tag = `test-${Date.now()}`;

after(async () => {
  await pool.query("delete from books where title like $1", [`${tag}%`]);
  await pool.end();
});

async function addBook(topPickAt = null) {
  const { rows } = await pool.query(
    "insert into books (title, author, top_pick_at) values ($1, 'Test', $2) returning id",
    [`${tag} book`, topPickAt]
  );
  return rows[0].id;
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

// Same SET expression updateBook uses.
async function saveTopPick(id, ticked) {
  const { rows } = await pool.query(
    `update books b set top_pick_at = ${topPickAtSql("$2")} where b.id = $1 returning top_pick_at`,
    [id, ticked]
  );
  return rows[0].top_pick_at;
}

async function isActive(id) {
  const { rows } = await pool.query(`select ${TOP_PICK_ACTIVE_SQL} as active from books b where b.id = $1`, [id]);
  return rows[0].active === true;
}

test("new books are not top picks", async () => {
  const id = await addBook();
  assert.equal(await isActive(id), false);
});

test("ticking a never-flagged book sets top_pick_at to now", async () => {
  const id = await addBook();
  const at = await saveTopPick(id, true);
  assert.ok(Math.abs(at - Date.now()) < 60000);
  assert.equal(await isActive(id), true);
});

test("re-saving a current top pick keeps its date", async () => {
  const set = daysAgo(2);
  const id = await addBook(set);
  const at = await saveTopPick(id, true);
  assert.equal(at.getTime(), set.getTime());
});

test("ticking an expired top pick restarts it", async () => {
  const id = await addBook(daysAgo(8));
  assert.equal(await isActive(id), false);
  const at = await saveTopPick(id, true);
  assert.ok(Math.abs(at - Date.now()) < 60000);
});

test("unticking clears top_pick_at", async () => {
  const id = await addBook(daysAgo(1));
  assert.equal(await saveTopPick(id, false), null);
  assert.equal(await isActive(id), false);
});

test("a pick stays active for 7 days", async () => {
  assert.equal(await isActive(await addBook(daysAgo(6.9))), true);
  assert.equal(await isActive(await addBook(daysAgo(7.1))), false);
});
