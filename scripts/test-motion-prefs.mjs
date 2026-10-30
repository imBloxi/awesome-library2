import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { effectiveMotion, normalizeMotionChoice, motionZone, MOTION_BOOT_SCRIPT, MOTION_CHOICES, MOTION_KEY } from "../src/lib/motion-prefs.mjs";

test("unknown or missing choices fall back to auto", () => {
  for (const v of [undefined, null, "", "FULL", "fast", 1, {}]) assert.equal(normalizeMotionChoice(v), "auto");
  for (const v of MOTION_CHOICES) assert.equal(normalizeMotionChoice(v), v);
});

test("auto follows the system and calms admin pages", () => {
  assert.equal(effectiveMotion({ choice: "auto" }), "full");
  assert.equal(effectiveMotion({ choice: "auto", reduced: true }), "off");
  assert.equal(effectiveMotion({ choice: "auto", zone: "calm" }), "calm");
  assert.equal(effectiveMotion({ choice: "auto", reduced: true, zone: "calm" }), "off");
});

test("an explicit choice wins over the system setting and the zone", () => {
  assert.equal(effectiveMotion({ choice: "full", reduced: true, zone: "calm" }), "full");
  assert.equal(effectiveMotion({ choice: "calm" }), "calm");
  assert.equal(effectiveMotion({ choice: "off" }), "off");
});

test("only admin routes are a calm zone", () => {
  assert.equal(motionZone("/admin"), "calm");
  assert.equal(motionZone("/admin/desk"), "calm");
  assert.equal(motionZone("/administrator"), null);
  assert.equal(motionZone("/"), null);
  assert.equal(motionZone(undefined), null);
});

function runBoot({ stored, reduced = false, pathname = "/", storageThrows = false }) {
  const dataset = {};
  const context = {
    document: { documentElement: { dataset } },
    location: { pathname },
    localStorage: { getItem: (key) => { if (storageThrows) throw new Error("blocked"); return key === MOTION_KEY ? stored : null; } },
    matchMedia: () => ({ matches: reduced }),
  };
  vm.runInNewContext(MOTION_BOOT_SCRIPT, context);
  return dataset;
}

test("the pre-paint script agrees with effectiveMotion", () => {
  for (const stored of [null, "garbage", ...MOTION_CHOICES]) {
    for (const reduced of [false, true]) {
      for (const pathname of ["/", "/books/1", "/admin", "/admin/desk"]) {
        const got = runBoot({ stored, reduced, pathname });
        assert.equal(got.motion, normalizeMotionChoice(stored));
        assert.equal(got.fx, effectiveMotion({ choice: stored, reduced, zone: motionZone(pathname) }), `${stored} ${reduced} ${pathname}`);
      }
    }
  }
});

test("blocked storage still sets a level", () => {
  assert.deepEqual(runBoot({ storageThrows: true }), { motion: "auto", fx: "full" });
});
