import test from "node:test";
import assert from "node:assert/strict";
import { signUpPayload, signUpSchema } from "../src/lib/auth/schemas.mjs";
import { formatHourUTC, requestAddress, circulationRecord, readingPatterns, staffActionLabel } from "../src/lib/ctos/profile.mjs";

const valid = { name: "Rūta Quill", email: "ruta@example.com", password: "long enough", terms: "on" };

test("registering requires accepting the terms", () => {
  assert.match(signUpPayload({ ...valid, terms: undefined }).error, /Terms of service/);
  assert.match(signUpPayload({ ...valid, terms: "off" }).error, /Terms of service/);
  assert.match(signUpPayload({ ...valid, terms: "true" }).error, /Terms of service/);
});

test("the terms flag is never forwarded to the auth provider", () => {
  const { account, error } = signUpPayload(valid);
  assert.equal(error, undefined);
  assert.deepEqual(account, { name: "Rūta Quill", email: "ruta@example.com", password: "long enough" });
});

test("existing sign-up rules still apply", () => {
  assert.ok(signUpPayload({ ...valid, password: "short" }).error);
  assert.ok(signUpPayload({ ...valid, email: "nope" }).error);
  assert.ok(signUpPayload({ ...valid, name: "   " }).error);
  assert.equal(signUpSchema.safeParse(valid).success, true);
});

test("hours are shown as UTC ranges and junk is dropped", () => {
  assert.equal(formatHourUTC(22), "22:00–23:00 UTC");
  assert.equal(formatHourUTC(23), "23:00–00:00 UTC");
  assert.equal(formatHourUTC(0), "00:00–01:00 UTC");
  for (const v of [null, undefined, -1, 24, 3.5, "x"]) assert.equal(formatHourUTC(v), null);
});

test("only well-formed request addresses are shown", () => {
  const h = (map) => ({ get: (k) => map[k] ?? null });
  assert.equal(requestAddress(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
  assert.equal(requestAddress(h({ "x-real-ip": "2001:db8::1" })), "2001:db8::1");
  assert.equal(requestAddress(h({ "x-forwarded-for": "<script>" })), null);
  assert.equal(requestAddress(h({ "x-forwarded-for": "999.1.1.1" })), null);
  assert.equal(requestAddress(h({})), null);
  assert.equal(requestAddress(undefined), null);
});

test("the circulation record reports real counts and discloses retained hidden rows", () => {
  const fmt = (d) => `D:${d}`;
  const empty = Object.fromEntries(circulationRecord({}, fmt));
  assert.equal(empty["Reservations on record"], "0 reservations");
  assert.ok(!("Removed from your view, still retained" in empty));
  assert.ok(!("First reservation" in empty));
  const busy = Object.fromEntries(circulationRecord({ reservations: 3, loans: 1, returned: 1, hidden: 2, waiting: 1, saved: 0, first_reserved: "a", last_activity: "b" }, fmt));
  assert.equal(busy["Reservations on record"], "3 reservations");
  assert.equal(busy["Books collected"], "1 book");
  assert.equal(busy["Removed from your view, still retained"], "2 records");
  assert.equal(busy["First reservation"], "D:a");
});

test("reading patterns only appear when there is data", () => {
  assert.deepEqual(readingPatterns({}), []);
  const p = Object.fromEntries(readingPatterns({ peak_hour: 22, peak_day: "Monday", top_authors: [{ author: "Ann", n: 2 }], top_genres: [] }));
  assert.equal(p["Most active reservation hour"], "22:00–23:00 UTC");
  assert.equal(p["Most active day"], "Monday");
  assert.equal(p["Most borrowed authors"], "Ann (2)");
  assert.ok(!("Most borrowed genres" in p));
});

test("staff actions get plain labels", () => {
  assert.equal(staffActionLabel("loan.pickup"), "Pickup confirmed by staff");
  assert.equal(staffActionLabel("something.new"), "Staff action");
});

import { accountSessions } from "../src/lib/account/service.mjs";
test("the session list shows the recorded address only when it is a real IP", async () => {
  const identity = { user: { id: "m" }, session: { id: "a" } };
  const data = [
    { id: "a", userId: "m", token: "t1", expiresAt: "2099-01-01", ipAddress: "198.51.100.4" },
    { id: "b", userId: "m", token: "t2", expiresAt: "2099-01-01", ipAddress: "javascript:alert(1)" },
  ];
  const { sessions } = await accountSessions({ listSessions: async () => ({ data }) }, identity);
  assert.equal(sessions[0].address, "198.51.100.4");
  assert.equal(sessions[1].address, null);
  assert.ok(!JSON.stringify(sessions).includes("t1"));
});
