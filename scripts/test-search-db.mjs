// Top-pick and search SQL against Postgres. Run against a THROWAWAY database only:
//   DATABASE_URL=postgres://... node --test scripts/test-search-db.mjs
// It creates test books and deletes them afterwards.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { TOP_PICK_ACTIVE_SQL, topPickAtSql, buildSearchQuery, topPicksQuery, byAuthorQuery } from "../src/lib/queries/search-sql.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const tag = `test-${Date.now()}`;

after(async () => {
  await pool.query("delete from books where title like $1", [`${tag}%`]);
  await pool.end();
});

async function addBook(topPickAt = null, { title = "book", year = null, copies = 1 } = {}) {
  const { rows } = await pool.query(
    "insert into books (title, author, top_pick_at, published_year, total_copies) values ($1, 'Test', $2, $3, $4) returning id",
    [`${tag} ${title}`, topPickAt, year, copies]
  );
  return rows[0].id;
}

async function search(filters) {
  const { text, values } = buildSearchQuery({ available: false, yearFrom: null, yearTo: null, limit: 50, offset: 0, ...filters });
  const { rows } = await pool.query(text, values);
  return rows.map((r) => r.title.slice(tag.length + 1));
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

test("search filters combine on real data", async () => {
  await addBook(null, { title: "river old", year: 1900, copies: 1 });
  await addBook(null, { title: "river new", year: 2000, copies: 1 });
  await addBook(null, { title: "river gone", year: 1950, copies: 0 });
  await addBook(null, { title: "river 100%", year: 1950, copies: 2 });
  const q = `${tag} river`;
  assert.deepEqual(await search({ q }), ["river 100%", "river gone", "river new", "river old"]);
  assert.deepEqual(await search({ q, available: true }), ["river 100%", "river new", "river old"]);
  assert.deepEqual(await search({ q, yearFrom: 1925, yearTo: 1975 }), ["river 100%", "river gone"]);
  assert.deepEqual(await search({ q, yearFrom: 1925, available: true }), ["river 100%", "river new"]);
  assert.deepEqual(await search({ q: `${q} 100%` }), ["river 100%"]);
  assert.deepEqual(await search({ q: `${q} 1_0` }), []);
});

test("deleted books never show in search", async () => {
  const id = await addBook(null, { title: "deleted one" });
  await pool.query("update books set deleted_at = now() where id = $1", [id]);
  assert.deepEqual(await search({ q: `${tag} deleted` }), []);
});

async function topPicks(limit) {
  const { text, values } = topPicksQuery(limit);
  const { rows } = await pool.query(text, values);
  return rows;
}

test("top picks: current only, newest first, no deleted books", async () => {
  await addBook(daysAgo(3), { title: "pick older" });
  await addBook(daysAgo(1), { title: "pick newer" });
  await addBook(daysAgo(9), { title: "pick expired" });
  const gone = await addBook(daysAgo(0.5), { title: "pick deleted" });
  await pool.query("update books set deleted_at = now() where id = $1", [gone]);
  const mine = (await topPicks(1000)).map((r) => r.title).filter((t) => t.startsWith(`${tag} pick`));
  assert.deepEqual(mine, [`${tag} pick newer`, `${tag} pick older`]);
});

test("top picks: respects the limit and carries list columns", async () => {
  await addBook(daysAgo(0.1), { title: "pick a" });
  await addBook(daysAgo(0.2), { title: "pick b" });
  const rows = await topPicks(1);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].is_top_pick, true);
  assert.equal(typeof rows[0].available, "number");
});

test("more by author: same author only, excludes this book and deleted ones", async () => {
  const author = `${tag} Author`;
  const add = async (title, deleted = false) => {
    const { rows } = await pool.query(
      "insert into books (title, author, deleted_at) values ($1, $2, $3) returning id",
      [`${tag} ${title}`, author, deleted ? new Date() : null]
    );
    return rows[0].id;
  };
  const self = await add("b self");
  await add("a other");
  await add("c gone", true);
  await addBook(null, { title: "someone else" });
  const { text, values } = byAuthorQuery(author, self, 10);
  const { rows } = await pool.query(text, values);
  assert.deepEqual(rows.map((r) => r.title), [`${tag} a other`]);
  assert.equal(typeof rows[0].available, "number");
});
