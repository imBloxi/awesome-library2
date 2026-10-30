// Moderation enforcement and monitoring signals against a THROWAWAY Postgres (truncates its tables):
//   TEST_DATABASE_URL=postgres://... node --import ./scripts/helpers/register-test-db.mjs --test scripts/test-moderation-db.mjs
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { pool } from "./helpers/test-db.mjs";
import { reserveBook, returnBook, markPickedUp, joinBookWaitlist, renewLoan } from "../src/lib/queries/reservations.js";
import { canReadCatalogBook, canReadBabel } from "../src/lib/queries/reading.js";
import { getStanding, addModeration, liftModeration, listModeration, getMemberSignals, listMonitoredMembers } from "../src/lib/queries/moderation.js";

const staff = { id: "staff", email: "staff@example.test" };

beforeEach(async () => {
  await pool.query('truncate waitlist, wishlist, admin_events, moderation_actions, reservations, books, neon_auth."user" restart identity cascade');
  for (const id of ["m1", "m2", "m3"]) await pool.query(`insert into neon_auth."user" (id, name, email) values ($1, $1, $1 || '@example.test')`, [id]);
  await pool.query(`insert into books (title, author, total_copies) values ('One', 'A', 1), ('Two', 'B', 2), ('Three', 'C', 1)`);
});
after(() => pool.end());

const restrict = (userId, days = 7) => addModeration({ userId, kind: "restrict", reason: "Repeated no-shows", days, actor: staff });
const suspend = (userId, days = null) => addModeration({ userId, kind: "suspend", reason: "Abuse of holds", days, actor: staff });

test("a restriction blocks new reservations until lifted, with a clear reason", async () => {
  await restrict("m1");
  const refused = await reserveBook("m1", 2);
  assert.equal(refused.ok, false);
  assert.match(refused.error, /Borrowing is paused/);
  assert.equal((await reserveBook("m2", 2)).ok, true, "other members are unaffected");
  assert.equal(await liftModeration({ userId: "m1", reason: "Talked to member", actor: staff }), 1);
  assert.equal((await reserveBook("m1", 2)).ok, true);
});

test("restrictions end on their own at ends_at", async () => {
  await pool.query(`insert into moderation_actions (user_id, kind, reason, ends_at, actor_id, created_at)
    values ('m1', 'restrict', 'Old restriction', now() - interval '1 day', 'staff', now() - interval '8 days')`);
  assert.equal((await reserveBook("m1", 2)).ok, true);
  assert.equal((await getStanding("m1")).block, null);
});

test("blocked members can't join waitlists or renew, but can still return", async () => {
  assert.equal((await reserveBook("m1", 1)).ok, true);
  const [{ id }] = (await pool.query("select id from reservations where user_id = 'm1'")).rows;
  await markPickedUp(id);
  await restrict("m1");
  const renewal = await renewLoan("m1", id);
  assert.equal(renewal.ok, false);
  assert.match(renewal.error, /paused/);
  assert.equal(await joinBookWaitlist("m1", 3), false, "joining while a copy is free is refused anyway; use an out book");
  assert.equal((await reserveBook("m2", 3)).ok, true);
  assert.equal(await joinBookWaitlist("m1", 3), false);
  assert.equal(await returnBook(id, "m1"), true);
});

test("waitlist promotion skips blocked members but keeps their place", async () => {
  assert.equal((await reserveBook("m3", 1)).ok, true);
  assert.equal(await joinBookWaitlist("m1", 1), true);
  assert.equal(await joinBookWaitlist("m2", 1), true);
  await restrict("m1");
  const [{ id }] = (await pool.query("select id from reservations where user_id = 'm3'")).rows;
  await markPickedUp(id);
  await returnBook(id, "m3");
  const holders = (await pool.query("select user_id from reservations where book_id = 1 and status = 'reserved'")).rows.map((r) => r.user_id);
  assert.deepEqual(holders, ["m2"]);
  const queued = (await pool.query("select user_id from waitlist where book_id = 1")).rows.map((r) => r.user_id);
  assert.deepEqual(queued, ["m1"], "the restricted member keeps their place");
});

test("suspension closes reading access; a restriction does not", async () => {
  assert.equal((await reserveBook("m1", 2)).ok, true);
  const [{ id }] = (await pool.query("select id from reservations where user_id = 'm1'")).rows;
  await markPickedUp(id);
  await restrict("m1");
  assert.equal(await canReadCatalogBook("m1", 2), true);
  await suspend("m1");
  assert.equal(await canReadCatalogBook("m1", 2), false);
  assert.equal(await canReadBabel("m1"), false);
  const standing = await getStanding("m1");
  assert.equal(standing.block.kind, "suspend", "the stronger block is reported");
  await liftModeration({ userId: "m1", reason: "Resolved", actor: staff });
  assert.equal(await canReadCatalogBook("m1", 2), true);
});

test("notes and warnings never block, and history records who and why", async () => {
  await addModeration({ userId: "m1", kind: "note", reason: "Asked about lost book", actor: staff });
  await addModeration({ userId: "m1", kind: "warning", reason: "Late twice", actor: staff });
  assert.equal((await reserveBook("m1", 2)).ok, true);
  const standing = await getStanding("m1");
  assert.equal(standing.block, null);
  assert.equal(standing.warning.reason, "Late twice");
  const history = await listModeration("m1");
  assert.deepEqual(history.map((h) => h.kind), ["warning", "note"]);
  assert.equal(history[0].actor_email, "staff@example.test");
  assert.equal(await addModeration({ userId: "nobody", kind: "warning", reason: "x".repeat(5), actor: staff }), null);
  await assert.rejects(pool.query(`insert into moderation_actions (user_id, kind, reason, actor_id) values ('m1', 'warning', 'no', 'staff')`), "reasons need 3+ characters");
  await assert.rejects(pool.query(`insert into moderation_actions (user_id, kind, reason, ends_at, actor_id) values ('m1', 'note', 'timed note', now() + interval '1 day', 'staff')`), "only blocks can expire");
});

test("signals measure overdue loans, lateness, no-shows and bursts from real rows", async () => {
  await pool.query(`insert into reservations (user_id, book_id, status, reserved_at, expires_at, picked_up_at, returned_at) values
    ('m1', 1, 'picked_up', now() - interval '45 days', now() - interval '38 days', now() - interval '44 days', null),
    ('m1', 2, 'returned', now() - interval '80 days', now() - interval '73 days', now() - interval '79 days', now() - interval '40 days'),
    ('m1', 2, 'returned', now() - interval '70 days', now() - interval '63 days', now() - interval '69 days', now() - interval '30 days'),
    ('m1', 2, 'returned', now() - interval '60 days', now() - interval '53 days', now() - interval '59 days', now() - interval '50 days'),
    ('m1', 3, 'expired', now() - interval '30 days', now() - interval '23 days', null, null),
    ('m1', 3, 'expired', now() - interval '20 days', now() - interval '13 days', null, null),
    ('m2', 2, 'returned', now() - interval '20 days', now() - interval '13 days', now() - interval '19 days', now() - interval '5 days')`);
  for (let i = 0; i < 6; i++) await pool.query(`insert into reservations (user_id, book_id, status, reserved_at) values ('m3', 2, 'cancelled', now() - interval '2 days' + make_interval(mins => $1))`, [i * 5]);

  const m1 = await getMemberSignals("m1");
  assert.equal(m1.overdue_now, 1);
  assert.ok(m1.overdue_days >= 15 && m1.overdue_days <= 17, `overdue_days ${m1.overdue_days}`);
  assert.equal(m1.returned_90, 3);
  assert.equal(m1.late_90, 2);
  assert.equal(m1.no_shows_90, 2);
  assert.equal(m1.assessment.level, "review");
  assert.deepEqual(m1.assessment.signals.map((s) => s.id).sort(), ["late", "no_show", "overdue"]);

  const m3 = await getMemberSignals("m3");
  assert.equal(m3.burst_7, 6);
  assert.equal(m3.cancels_30, 6);
  assert.ok(m3.assessment.signals.some((s) => s.id === "burst"));

  const m2 = await getMemberSignals("m2");
  assert.equal(m2.assessment.level, "clear");

  const ranked = await listMonitoredMembers();
  assert.equal(ranked[0].user_id, "m1");
  assert.deepEqual(ranked.map((r) => r.user_id).sort(), ["m1", "m2", "m3"]);
});

test("moderation history and active blocks show up in signals", async () => {
  await restrict("m2");
  await addModeration({ userId: "m2", kind: "warning", reason: "Late again", actor: staff });
  const m2 = await getMemberSignals("m2");
  assert.equal(m2.restricted, true);
  assert.equal(m2.suspended, false);
  assert.equal(m2.prior_180, 2);
  assert.ok(m2.assessment.signals.some((s) => s.id === "history"));
});
