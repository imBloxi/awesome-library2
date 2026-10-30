// Import, activity log, desk lookup, member page and stats against a THROWAWAY Postgres.
//   TEST_DATABASE_URL=postgres://... pnpm test:admin-tools
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import { importBooks, logAdminEvent, listAdminEvents, findBookByIsbn, getMember, listMemberWaitlist, getCirculationStats } from "../src/lib/queries/admin.js";
import { parseBookCsv } from "../src/lib/book-import.mjs";
import { reserveBook, markPickedUp, joinBookWaitlist } from "../src/lib/queries/reservations.js";

beforeEach(async () => {
  await pool.query('truncate waitlist, wishlist, admin_events, reservations, books, neon_auth."user" restart identity cascade');
  await pool.query(`insert into neon_auth."user" (id, name, email, role) values ('a1', 'Admin', 'a@example.test', 'admin'), ('m1', 'Member', 'm@example.test', null)`);
});
after(() => pool.end());

test("import adds valid rows and skips ISBNs already in the catalog", async () => {
  await pool.query("insert into books (title, author, isbn) values ('Existing', 'X', '111')");
  const { rows } = parseBookCsv("Title,Author,ISBN,Copies,Genre\nNew,Ann,222,2,Poetry\nAgain,Bob,111,,\nNo ISBN,Cy,,,");
  assert.deepEqual(await importBooks(rows), { inserted: 2, skipped: 1 });
  const { rows: books } = await pool.query("select title, total_copies, genre from books order by id");
  assert.deepEqual(books.map((b) => b.title), ["Existing", "New", "No ISBN"]);
  assert.equal(books[1].total_copies, 2);
  assert.equal(books[1].genre, "Poetry");
  assert.deepEqual(await importBooks([]), { inserted: 0, skipped: 0 });
});

test("the activity log records and pages newest first, and never throws", async () => {
  const { rows: [b] } = await pool.query("insert into books (title, author) values ('Logged', 'X') returning id");
  const admin = { id: "a1", email: "a@example.test" };
  await logAdminEvent(admin, "book.create", { bookId: b.id, detail: "Logged" });
  await logAdminEvent(admin, "user.role", { targetUser: "m1", detail: "admin" });
  await logAdminEvent(admin, "book.update", { bookId: 999999 }); // FK violation: logged to console, not thrown
  const { rows, hasNext } = await listAdminEvents(1);
  assert.equal(hasNext, false);
  assert.deepEqual(rows.map((r) => r.action), ["user.role", "book.create"]);
  assert.equal(rows[1].book_title, "Logged");
});

test("desk ISBN lookup ignores hyphens and spaces and skips deleted books", async () => {
  await pool.query("insert into books (title, author, isbn) values ('Scanned', 'X', '978-0-306-40615-7')");
  assert.equal((await findBookByIsbn("9780306406157")).title, "Scanned");
  assert.equal((await findBookByIsbn(" 978 0306 40615 7 ")).title, "Scanned");
  assert.equal(await findBookByIsbn("river"), null);
  await pool.query("update books set deleted_at = now()");
  assert.equal(await findBookByIsbn("9780306406157"), null);
});

test("member page data and circulation stats", async () => {
  const { rows: [a] } = await pool.query("insert into books (title, author, total_copies) values ('Popular', 'X', 1) returning id");
  const { rows: [n] } = await pool.query("insert into books (title, author, total_copies) values ('Unread', 'X', 1) returning id");
  await reserveBook("m1", a.id);
  const { rows: [r] } = await pool.query("select id from reservations");
  await markPickedUp(r.id);
  await joinBookWaitlist("a1", a.id);
  const member = await getMember("m1");
  assert.deepEqual({ total: member.total_reservations, loans: member.total_loans }, { total: 1, loans: 1 });
  assert.equal(await getMember("nobody"), null);
  assert.deepEqual((await listMemberWaitlist("a1")).map((w) => w.position), [1]);
  const stats = await getCirculationStats();
  assert.deepEqual(stats.popular.map((p) => [p.title, p.loans]), [["Popular", 1]]);
  assert.deepEqual(stats.never.map((p) => p.id), [n.id]);
  assert.equal(stats.neverTotal, 1);
  assert.equal(stats.weekly.length, 12);
  assert.equal(stats.weekly.at(-1).loans, 1);
  assert.deepEqual(stats.demand.map((d) => [d.title, d.waiting]), [["Popular", 1]]);
});
