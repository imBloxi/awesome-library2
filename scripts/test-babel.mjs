import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { babelPassage } from "../src/lib/babel.mjs";

test("a title always opens the same Babel page, independently of previous calls", () => {
  const passage = babelPassage("The Amber Library");
  babelPassage("A Different Door");
  assert.deepEqual(babelPassage("The Amber Library"), passage);
  assert.notDeepEqual(babelPassage("A Different Door"), passage);
});

test("editions with the same title have different, repeatable stories", () => {
  const first = babelPassage("The Secret Garden", 101);
  assert.notDeepEqual(babelPassage("The Secret Garden", 102), first);
  assert.deepEqual(babelPassage("  THE SECRET GARDEN  ", "101"), first);
});

test("a catalog has distinct story bodies beyond book titles and character names", () => {
  const bodies = new Set();
  const developments = new Set();
  const endings = new Set();
  for (let id = 1; id <= 500; id++) {
    const paragraphs = babelPassage(`The Library Collection Volume ${id}`, id);
    for (const paragraph of paragraphs) {
      assert.ok(paragraph.length >= 50 && paragraph.length < 800);
      assert.doesNotMatch(paragraph, /undefined|NaN|\[object Object\]/);
      assert.equal(paragraph.isWellFormed(), true);
    }
    const reader = paragraphs[0].match(/^(\p{Lu}[\p{L}\p{M}]+)/u)[1];
    const clean = (text) => text.replaceAll(reader, "READER").replace(/“[^”]*”/gu, "BOOK");
    bodies.add(clean(paragraphs.slice(1).join("\n")));
    developments.add(clean(paragraphs[1]));
    endings.add(clean(paragraphs[2]));
  }
  assert.ok(bodies.size >= 495, `Only ${bodies.size}/500 distinct story bodies`);
  assert.ok(developments.size >= 450, `Only ${developments.size}/500 distinct investigations`);
  assert.ok(endings.size >= 450, `Only ${endings.size}/500 distinct conclusions`);
});

test("a passage treats the full title as one book rather than quoting random title words", () => {
  const paragraphs = babelPassage("The Hitchhiker’s Guide to the Galaxy");
  assert.ok(paragraphs[0].includes("the hitchhiker’s guide to the galaxy"));
  assert.doesNotMatch(paragraphs.join(" "), /“(?:the|to|a|of|and)”/i);
});

test("all three paragraphs follow the same named reader", () => {
  for (const title of ["The Amber Library", "Moby Dick", "The Secret Garden", "Dune", "A Different Door"]) {
    const paragraphs = babelPassage(title);
    const name = paragraphs[0].match(/^(\p{Lu}[\p{L}\p{M}]+)/u)?.[1];
    assert.ok(name, "Introduce the reader at the start of the story");
    for (const paragraph of paragraphs) assert.ok(paragraph.includes(name), `Lost the story's reader: ${name}`);
  }
});

test("case, Unicode normalization, and whitespace share a seed", () => {
  assert.deepEqual(babelPassage("  THE\nAmber   Library "), babelPassage("the amber library"));
  assert.deepEqual(babelPassage("Café"), babelPassage("Cafe\u0301"));
});

test("Unicode title words become part of the invented prose", () => {
  for (const title of ["星図", "किताब", "q\u0307"]) {
    const passage = babelPassage(title).join(" ");
    assert.ok(passage.includes(title), `Missing title word: ${title}`);
    assert.doesNotMatch(passage, /undefined|NaN/);
  }
});

test("blank and punctuation-only titles have a stable fallback", () => {
  assert.deepEqual(babelPassage(""), babelPassage("   "));
  assert.equal(babelPassage("!!!").length, 3);
  assert.doesNotMatch(babelPassage().join(" "), /undefined|NaN/);
});

test("output stays short even for very long titles", () => {
  for (const title of ["", "Moby Dick", "x".repeat(100000), "\uFDFA".repeat(300)]) {
    const paragraphs = babelPassage(title);
    assert.equal(paragraphs.length, 3);
    for (const paragraph of paragraphs) {
      assert.ok(paragraph.length >= 50 && paragraph.length < 800);
      assert.match(paragraph, /[.!?][”’"']?$/);
    }
  }
});

test("title length limits preserve complete Unicode characters", () => {
  for (const title of ["a".repeat(299) + "📚", "\uFB03".repeat(99) + "aa📚"]) {
    for (const paragraph of babelPassage(title)) assert.equal(paragraph.isWellFormed(), true);
  }
});

test("book title markup stays escaped when React renders the passage", () => {
  const paragraphs = babelPassage('<script>alert("book")</script>');
  const html = renderToStaticMarkup(createElement("div", null, ...paragraphs.map((p, i) => createElement("p", { key: i }, p))));
  assert.doesNotMatch(html, /<script|<img|onerror=/);
});
