import test from "node:test";
import assert from "node:assert/strict";
import { utcTimestamp } from "../src/lib/circulation-format.mjs";

test("circulation timestamps preserve the instant and show UTC to the second", () => {
  assert.deepEqual(utcTimestamp("2026-10-29T16:30:45.123+02:00"), {
    dateTime: "2026-10-29T14:30:45.123Z",
    text: "29 Oct 2026, 14:30:45 UTC",
  });
});

test("midnight stays on the correct UTC date for database Date values", () => {
  assert.deepEqual(utcTimestamp(new Date("2026-10-30T00:00:00Z")), {
    dateTime: "2026-10-30T00:00:00.000Z",
    text: "30 Oct 2026, 00:00:00 UTC",
  });
});

test("missing or invalid timestamps have no invented deadline", () => {
  for (const value of [null, undefined, "", "not-a-date", new Date(NaN)]) {
    assert.equal(utcTimestamp(value), null);
  }
});
