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
  for (const title of ["", "Moby Dick", "x".repeat(100000)]) {
    const paragraphs = babelPassage(title);
    assert.equal(paragraphs.length, 3);
    for (const paragraph of paragraphs) {
      assert.ok(paragraph.length >= 50 && paragraph.length < 800);
      assert.match(paragraph, /[.!?]$/);
    }
  }
});

test("book title markup stays escaped when React renders the passage", () => {
  const paragraphs = babelPassage('<script>alert("book")</script>');
  const html = renderToStaticMarkup(createElement("div", null, ...paragraphs.map((p, i) => createElement("p", { key: i }, p))));
  assert.doesNotMatch(html, /<script|<img|onerror=/);
});
