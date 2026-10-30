import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import { getSubjectFile, listStaffActions } from "../src/lib/queries/profile.js";

beforeEach(async () => {
  await pool.query('truncate waitlist, wishlist, admin_events, reservations, books, neon_auth."user" restart identity cascade');
  await pool.query(`insert into neon_auth."user" (id, name, email) values ('reader', 'Reader', 'r@example.test'), ('other', 'Other', 'o@example.test')`);
  await pool.query(`insert into books (title, author, genre) values ('One', 'Ann', 'Poetry'), ('Two', 'Ann', 'Poetry'), ('Three', 'Bo', 'Crime'), ('Four', 'Cy', null)`);
});
after(() => pool.end());

test("an empty record has zero counts and no patterns", async () => {
  const s = await getSubjectFile("reader");
  assert.equal(s.reservations, 0);
  assert.equal(s.hidden, 0);
  assert.equal(s.peak_hour, null);
  assert.equal(s.peak_day, null);
  assert.deepEqual(s.top_authors, []);
  assert.deepEqual(s.top_genres, []);
});

test("counts, hidden rows, patterns and favourites come from this member's rows only", async () => {
  await pool.query(`insert into reservations (user_id, book_id, status, reserved_at, picked_up_at, returned_at, hidden_by_user) values
    ('reader', 1, 'returned', '2026-10-05 22:15+00', '2026-10-06 10:00+00', '2026-10-20 10:00+00', true),
    ('reader', 2, 'picked_up', '2026-10-12 22:40+00', '2026-10-13 09:00+00', null, false),
    ('reader', 3, 'reserved', '2026-10-14 08:00+00', null, null, false),
    ('other', 4, 'reserved', '2026-10-14 03:00+00', null, null, false)`);
  await pool.query(`insert into waitlist (user_id, book_id) values ('reader', 4)`);
  await pool.query(`insert into wishlist (user_id, book_id) values ('reader', 3), ('reader', 4)`);
  const s = await getSubjectFile("reader");
  assert.equal(s.reservations, 3);
  assert.equal(s.loans, 2);
  assert.equal(s.returned, 1);
  assert.equal(s.hidden, 1, "rows hidden from My library are still counted");
  assert.equal(s.waiting, 1);
  assert.equal(s.saved, 2);
  assert.equal(s.peak_hour, 22);
  assert.equal(s.peak_day, "Monday");
  assert.deepEqual(s.top_authors, [{ author: "Ann", n: 2 }, { author: "Bo", n: 1 }]);
  assert.deepEqual(s.top_genres, [{ genre: "Poetry", n: 2 }, { genre: "Crime", n: 1 }]);
  assert.equal(new Date(s.first_reserved).toISOString(), "2026-10-05T22:15:00.000Z");
  assert.equal(new Date(s.last_activity).toISOString(), "2026-10-20T10:00:00.000Z");
});

test("staff actions include account and reservation events for this member only", async () => {
  await pool.query(`insert into reservations (user_id, book_id) values ('reader', 1), ('other', 2)`);
  await pool.query(`insert into admin_events (actor_id, actor_email, action, book_id, reservation_id, target_user, created_at) values
    ('staff', 'staff@example.test', 'loan.pickup', 1, 1, null, '2026-10-01'),
    ('staff', 'staff@example.test', 'user.role', null, null, 'reader', '2026-10-02'),
    ('staff', 'staff@example.test', 'loan.pickup', 2, 2, null, '2026-10-03'),
    ('staff', 'staff@example.test', 'book.update', 1, null, null, '2026-10-04')`);
  const rows = await listStaffActions("reader");
  assert.deepEqual(rows.map((r) => r.action), ["user.role", "loan.pickup"]);
  assert.equal(rows[1].book_title, "One");
  assert.ok(!("actor_email" in rows[0]), "staff identity is not exposed");
});
