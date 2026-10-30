import test from "node:test";
import assert from "node:assert/strict";
import { babelScramble, decodeFrame, BABEL_SYMBOLS, DRIFT_SEEDS } from "../src/lib/babel-shelf.mjs";

const allowed = new Set([...BABEL_SYMBOLS, ",", ".", " "]);

test("scrambles use only the 25 symbols, keep spaces and length, and repeat per seed", () => {
  const title = "What the Key Kept";
  const s = babelScramble(title, 42);
  assert.equal(Array.from(s).length, Array.from(title).length);
  for (const [i, ch] of Array.from(s).entries()) {
    assert.ok(allowed.has(ch), `symbol ${ch}`);
    assert.equal(ch === " ", title[i] === " ");
  }
  assert.equal(s, babelScramble(title, 42));
  assert.notEqual(s, babelScramble(title, 43));
  assert.equal(babelScramble("", 1), "");
  assert.equal(babelScramble(null, 1), "");
});

test("unicode titles keep one symbol per character", () => {
  assert.equal(Array.from(babelScramble("Rūta's Lantern", 7)).length, Array.from("Rūta's Lantern").length);
});

test("decoding starts unreadable, ends exact, and settles monotonically", () => {
  const title = "A Lantern for Rūta";
  assert.equal(decodeFrame(title, 9, 1), title);
  assert.equal(decodeFrame(title, 9, 5), title, "progress is clamped");
  let correct = -1;
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = Array.from(decodeFrame(title, 9, p, 3));
    const n = frame.filter((ch, i) => ch === Array.from(title)[i]).length;
    assert.ok(n >= correct, `progress ${p}`);
    correct = n;
  }
  assert.ok(Array.from(decodeFrame(title, 9, 0, 1)).every((ch) => allowed.has(ch)));
});

test("drift seeds are unique positive integers", () => {
  assert.equal(new Set(DRIFT_SEEDS).size, DRIFT_SEEDS.length);
  assert.ok(DRIFT_SEEDS.every((n) => Number.isSafeInteger(n) && n > 0));
});
