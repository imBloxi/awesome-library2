import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReservationParams, reservationParams } from "../src/lib/reservation-params.mjs";

test("active queues default to priority and history defaults to newest", () => {
  assert.deepEqual(parseReservationParams({}), { q: "", status: "active", sort: "priority", userId: null, page: 1 });
  for (const status of ["attention", "expiring", "reserved", "picked_up", "overdue"]) assert.equal(parseReservationParams({ status }).sort, "priority");
  for (const status of ["returned", "cancelled", "expired", "all"]) assert.equal(parseReservationParams({ status }).sort, "newest");
});

test("reservation parameters reject repeated filters and bound search, identity and page", () => {
  assert.deepEqual(parseReservationParams({ q: ["a", "b"], status: ["all"], sort: "invalid", user: ["member-a"], page: "-4" }), {
    q: "", status: "active", sort: "priority", userId: null, page: 1,
  });
  const options = parseReservationParams({ q: `  ${"x".repeat(150)} `, status: "expiring", sort: "newest", user: " member-a ", page: "99999999999999999" });
  assert.equal(options.q.length, 100);
  assert.equal(options.userId, "member-a");
  assert.equal(options.page, 10000);
  assert.equal(options.sort, "newest");
  assert.equal(parseReservationParams({ user: "x".repeat(201) }).userId, null);
});

test("pagination serialization preserves search, status, sort and exact identity without page", () => {
  const options = parseReservationParams({ q: "Ada & River", status: "overdue", user: "a+b/c", sort: "newest", page: "3" });
  const params = reservationParams(options);
  assert.deepEqual(params, { q: "Ada & River", status: "overdue", sort: "newest", user: "a+b/c" });
  const roundTrip = parseReservationParams(Object.fromEntries(new URLSearchParams(params)));
  assert.deepEqual(roundTrip, { ...options, page: 1 });
  assert.deepEqual(reservationParams(parseReservationParams({})), { status: "active", sort: "priority" });
});
