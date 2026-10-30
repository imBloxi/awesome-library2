import test from "node:test";
import assert from "node:assert/strict";
import { bookTone, spineShape, transitionNames, TONES } from "../src/lib/book-shape.mjs";

test("a book's binding colour is stable and always defined", () => {
  assert.deepEqual(bookTone(9), bookTone(9));
  assert.deepEqual(bookTone(0), TONES[0]);
  for (const id of [-1, "x", null, undefined, 2 ** 60, "12"]) assert.ok(TONES.includes(bookTone(id)));
  assert.deepEqual(bookTone("12"), bookTone(12));
});

test("spines stay within the shelf and depend only on id and title", () => {
  for (let id = 0; id < 500; id++) {
    const s = spineShape({ id, title: "A".repeat(id % 90) });
    assert.ok(s.height >= 78 && s.height <= 98, `height ${s.height}`);
    assert.ok(s.width >= 2 && s.width <= 3.3, `width ${s.width}`);
    assert.deepEqual(s, spineShape({ id, title: "A".repeat(id % 90) }));
  }
  assert.deepEqual(spineShape({ id: "bad" }), spineShape({ id: 0 }));
});

test("transition names are unique across lists on one page", () => {
  const picks = [{ id: 1 }, { id: 2 }];
  const catalog = [{ id: 2 }, { id: 3 }, { id: 3 }];
  const [a, b] = transitionNames(picks, catalog);
  assert.equal(a.get("1"), "book-1");
  assert.equal(a.get("2"), "book-2");
  assert.equal(b.get("2"), undefined);
  assert.equal(b.get("3"), "book-3");
  assert.equal(b.size, 1);
  const [empty] = transitionNames(undefined);
  assert.equal(empty.size, 0);
});
