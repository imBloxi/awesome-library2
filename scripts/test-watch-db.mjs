// Book watchlist against a THROWAWAY Postgres (truncates its tables):
//   TEST_DATABASE_URL=postgres://... node --import ./scripts/helpers/register-test-db.mjs --test scripts/test-watch-db.mjs
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import { watchlistEnabled, setWatchlistEnabled, addWatchTerm, toggleWatchTerm, deleteWatchTerm, listWatchTerms, listPersonsOfInterest, isBookWatched } from "../src/lib/queries/watch.js";
import { getMemberSignals } from "../src/lib/queries/moderation.js";

const staff = { id: "staff", email: "staff@example.test" };

beforeEach(async () => {
  await pool.query('truncate waitlist, wishlist, admin_events, moderation_actions, reservations, books, watch_terms, app_settings, neon_auth."user" restart identity cascade');
  for (const id of ["m1", "m2", "m3"]) await pool.query(`insert into neon_auth."user" (id, name, email) values ($1, $1, $1 || '@example.test')`, [id]);
  await pool.query(`insert into books (title, author, genre, description) values
    ('The Anarchist Cookbook', 'W. Powell', 'Reference', null),
    ('Gardening for Beginners', 'Ann Green', 'Hobbies', 'Includes a chapter on 100% organic compost_heaps.'),
    ('Moby-Dick', 'Herman Melville', 'Fiction', 'A whale of a tale.')`);
});
after(() => pool.end());

test("the watchlist is off by default and nothing matches until it is switched on", async () => {
  await addWatchTerm("anarchist", "Test term", staff);
  assert.equal(await watchlistEnabled(), false);
  assert.equal(await isBookWatched(1), false);
  await setWatchlistEnabled(true, staff);
  assert.equal(await isBookWatched(1), true);
  await setWatchlistEnabled(false, staff);
  assert.equal(await isBookWatched(1), false);
});

test("terms match title, author, genre or description, case-insensitively and literally", async () => {
  await setWatchlistEnabled(true, staff);
  await addWatchTerm("MELVILLE", "author", staff);
  await addWatchTerm("100% organic", "literal percent", staff);
  await addWatchTerm("_heap", "literal underscore", staff);
  assert.equal(await isBookWatched(3), true, "author match");
  assert.equal(await isBookWatched(2), true, "description match with % and _ taken literally");
  assert.equal(await isBookWatched(1), false);
  const terms = await listWatchTerms();
  assert.deepEqual(terms.map((t) => [t.term, t.matches]).sort(), [["100% organic", 1], ["MELVILLE", 1], ["_heap", 1]]);
  assert.equal(await addWatchTerm("melville", "duplicate", staff), null, "duplicates ignore case");
});

test("paused and removed terms stop matching", async () => {
  await setWatchlistEnabled(true, staff);
  const id = await addWatchTerm("whale", "test", staff);
  assert.equal(await isBookWatched(3), true);
  assert.equal((await toggleWatchTerm(id)).active, false);
  assert.equal(await isBookWatched(3), false);
  await toggleWatchTerm(id);
  assert.equal((await deleteWatchTerm(id)).term, "whale");
  assert.equal(await isBookWatched(3), false);
});

test("reserving, waiting for or saving a watched book makes a person of interest", async () => {
  await setWatchlistEnabled(true, staff);
  await addWatchTerm("anarchist", "test", staff);
  await addWatchTerm("whale", "test", staff);
  await pool.query(`insert into reservations (user_id, book_id, status) values ('m1', 1, 'cancelled')`);
  await pool.query(`insert into wishlist (user_id, book_id) values ('m1', 3), ('m2', 3)`);
  await pool.query(`insert into waitlist (user_id, book_id) values ('m3', 2)`);
  await pool.query(`insert into reservations (user_id, book_id, reserved_at) values ('m3', 1, now() - interval '200 days')`);
  const persons = await listPersonsOfInterest();
  assert.deepEqual(persons.map((p) => [p.user_id, p.books]), [["m1", 2], ["m2", 1]], "old activity and unwatched books don't count");
  const m1 = await getMemberSignals("m1");
  assert.equal(m1.watched_books, 2);
  const signal = m1.assessment.signals.find((s) => s.id === "watched");
  assert.equal(signal.points, 30);
  assert.match(signal.evidence, /2 titles on the library watchlist/);
  await setWatchlistEnabled(false, staff);
  assert.deepEqual(await listPersonsOfInterest(), []);
  assert.equal((await getMemberSignals("m1")).watched_books, 0);
});
