import test from "node:test";
import assert from "node:assert/strict";
import { assessMember, rankMembers, LEVELS } from "../src/lib/monitoring.mjs";

test("a member with no signals is clear with score 0", () => {
  const a = assessMember({});
  assert.deepEqual(a, { score: 0, level: "clear", levelLabel: "Clear", signals: [] });
  assert.equal(assessMember(null).score, 0);
});

test("overdue loans weigh most and grow with count and age", () => {
  assert.equal(assessMember({ overdue_now: 1, overdue_days: 3 }).score, 25);
  assert.equal(assessMember({ overdue_now: 1, overdue_days: 20 }).score, 35);
  assert.equal(assessMember({ overdue_now: 2, overdue_days: 20 }).score, 45);
  assert.equal(assessMember({ overdue_now: 9, overdue_days: 90 }).score, 50, "capped");
  assert.match(assessMember({ overdue_now: 2, overdue_days: 1 }).signals[0].evidence, /2 loans past due, the oldest by 1 day/);
});

test("lateness needs enough returns before it counts", () => {
  assert.equal(assessMember({ returned_90: 2, late_90: 2 }).score, 0, "two returns is too few to judge");
  assert.equal(assessMember({ returned_90: 4, late_90: 1 }).score, 0, "one in four is under a third");
  assert.equal(assessMember({ returned_90: 3, late_90: 1 }).score, 15);
  assert.equal(assessMember({ returned_90: 3, late_90: 2 }).score, 25);
});

test("thresholds for no-shows, churn, bursts, queues, capacity and history", () => {
  const ids = (s) => assessMember(s).signals.map((x) => x.id);
  assert.deepEqual(ids({ no_shows_90: 1 }), []);
  assert.deepEqual(ids({ no_shows_90: 2 }), ["no_show"]);
  assert.equal(assessMember({ no_shows_90: 4 }).score, 20);
  assert.deepEqual(ids({ cancels_30: 4 }), []);
  assert.equal(assessMember({ cancels_30: 10 }).score, 15);
  assert.deepEqual(ids({ burst_7: 4 }), []);
  assert.equal(assessMember({ burst_7: 8 }).score, 20);
  assert.deepEqual(ids({ waiting: 9 }), []);
  assert.equal(assessMember({ waiting: 15 }).score, 10);
  assert.deepEqual(ids({ active_now: 10 }), ["capacity"]);
  assert.equal(assessMember({ prior_180: 5 }).score, 20, "capped");
});

test("levels follow the score and the total is capped at 100", () => {
  assert.equal(assessMember({ no_shows_90: 4 }).level, "watch");
  assert.equal(assessMember({ overdue_now: 2, overdue_days: 20 }).level, "review");
  const worst = assessMember({ overdue_now: 5, overdue_days: 60, returned_90: 3, late_90: 3, no_shows_90: 5, cancels_30: 12, burst_7: 9, waiting: 20, active_now: 10, prior_180: 3 });
  assert.equal(worst.score, 100);
  assert.equal(worst.signals[0].id, "overdue", "strongest signal first");
  assert.deepEqual(LEVELS.map((l) => l.id), ["review", "watch", "clear"]);
});

test("junk input never produces points", () => {
  assert.equal(assessMember({ overdue_now: "x", burst_7: -5, waiting: null, no_shows_90: "2abc" }).score, 10, "parseInt('2abc') is 2: still a real count");
  assert.equal(assessMember({ overdue_now: "x", burst_7: -5, waiting: null }).score, 0);
});

test("ranking puts the highest score first, then the most recent activity", () => {
  const ranked = rankMembers([
    { user_id: "a", last_activity: "2026-10-01" },
    { user_id: "b", overdue_now: 1, last_activity: "2026-09-01" },
    { user_id: "c", last_activity: "2026-10-20" },
  ]);
  assert.deepEqual(ranked.map((r) => r.user_id), ["b", "c", "a"]);
  assert.equal(ranked[0].assessment.level, "watch");
});
