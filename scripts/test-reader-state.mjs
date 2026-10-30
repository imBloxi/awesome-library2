import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeReaderPrefs, normalizeReadingPosition, chapterDirection, readingMinutes } from "../src/lib/reader-state.mjs";

test("stored reader settings accept only supported appearance choices", () => {
  assert.deepEqual(normalizeReaderPrefs({ size: "l", font: "sans", theme: "dark", unknown: true }), { size: "l", font: "sans", theme: "dark" });
  for (const value of [null, [], "dark", 12, { size: "huge", font: "monospace", theme: "red" }]) {
    assert.deepEqual(normalizeReaderPrefs(value), { size: "m", font: "serif", theme: "light" });
  }
  assert.deepEqual(normalizeReaderPrefs({ theme: "sepia" }), { size: "m", font: "serif", theme: "sepia" });
});

test("catalog resume validates book, edition and chapter against its canonical URL", () => {
  const position = { href: "/books/12/read/3/7", edition: 3, chapter: 7 };
  assert.deepEqual(normalizeReadingPosition("book-12", position), position);
  assert.deepEqual(normalizeReadingPosition("book-12", position, { basePath: "/books/12/read/3", chapterCount: 10 }), position);
  assert.equal(normalizeReadingPosition("book-13", position), null);
  assert.equal(normalizeReadingPosition("book-12", position, { basePath: "/books/12/read/4", chapterCount: 10 }), null);
  assert.equal(normalizeReadingPosition("book-12", position, { chapterCount: 6 }), null);
  for (const bad of [
    { ...position, chapter: 2 }, { ...position, edition: 4 },
    { ...position, href: "/admin/users" }, { ...position, href: "//outside.test/x" },
    { ...position, href: "/books/12/read/3/7?redirect=outside" },
    { ...position, href: "/books/12/read/3/07" }, { ...position, href: "/books/12/read/3/7#x" },
    { ...position, href: "/books/12/read/3/../7" }, { ...position, edition: "3" },
    { ...position, href: "/books/12/read/10000/7", edition: 10000 },
    null, "bad", [],
  ]) assert.equal(normalizeReadingPosition("book-12", bad), null);
});

test("invented resume belongs to the matching seed and valid chapter", () => {
  const position = { href: "/babel/42/2", edition: 1, chapter: 2 };
  assert.deepEqual(normalizeReadingPosition("invented-42", position, { basePath: "/babel/42", chapterCount: 10 }), position);
  assert.equal(normalizeReadingPosition("invented-43", position), null);
  assert.equal(normalizeReadingPosition("invented-42", { ...position, edition: 2 }), null);
  assert.equal(normalizeReadingPosition("invented-42", { href: "/babel/42/11", edition: 1, chapter: 11 }), null);
  assert.equal(normalizeReadingPosition("invented-2147483648", { href: "/babel/2147483648/2", edition: 1, chapter: 2 }), null);
});

test("chapter shortcuts ignore interaction, selection, modifiers and handled events", () => {
  assert.equal(chapterDirection({ key: "ArrowLeft" }), -1);
  assert.equal(chapterDirection({ key: "ArrowRight" }), 1);
  assert.equal(chapterDirection({ key: "Home" }), 0);
  for (const flag of ["altKey", "ctrlKey", "metaKey", "shiftKey", "repeat", "isComposing", "defaultPrevented"]) {
    assert.equal(chapterDirection({ key: "ArrowRight", [flag]: true }), 0, flag);
  }
  assert.equal(chapterDirection({ key: "ArrowRight" }, { interactive: true }), 0);
  assert.equal(chapterDirection({ key: "ArrowRight" }, { selection: true }), 0);
});

test("reading estimates are whole positive minutes rather than claimed completion", () => {
  assert.equal(readingMinutes(220), 1);
  assert.equal(readingMinutes(221), 2);
  assert.equal(readingMinutes(2500), 12);
  for (const words of [null, undefined, "bad", -10, 0, Infinity]) assert.equal(readingMinutes(words), 1);
});
