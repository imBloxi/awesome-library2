import test from "node:test";
import assert from "node:assert/strict";
import { editionToHtml, editionFileName } from "../src/lib/babel-book/html.mjs";

const edition = {
  title: "The Quiet Library",
  edition: 3,
  dedication: "For the ones who stayed.",
  words: 660,
  chapters: [
    { title: "An Open Door", paragraphs: ["A visitor arrived.", "The keeper listened."] },
    { title: "The Last Light", paragraphs: ["They found their way home."] },
  ],
};

test("offline edition has named contents and a return link from every chapter", () => {
  const html = editionToHtml({ edition });
  assert.match(html, /<nav[^>]*aria-labelledby="contents-title"/);
  assert.match(html, /id="contents"/);
  assert.match(html, /id="contents-title"[^>]*>Contents<\/h2>/);
  for (let chapter = 1; chapter <= edition.chapters.length; chapter++) {
    assert.match(html, new RegExp(`href="#ch${chapter}"`));
    assert.match(html, new RegExp(`<section id="ch${chapter}"[\\s\\S]*?href="#contents"`));
  }
  assert.equal((html.match(/href="#contents"/g) || []).length, edition.chapters.length);
  assert.match(html, /About 3 minutes/);
  assert.ok(html.indexOf("Original story") < html.indexOf('id="ch1"'));
});

test("offline HTML escapes every supplied field and contains no active network or script content", () => {
  const hostile = '<script src="https://bad.example/run.js">&\'alert(1)</script>';
  const html = editionToHtml({
    edition: { ...edition, title: hostile, edition: hostile, dedication: hostile, chapters: [{ title: hostile, paragraphs: [hostile] }] },
    byline: hostile,
    backCover: [hostile],
  });
  assert.doesNotMatch(html, /<script|<iframe|<img|<link|<object|<embed|\bon\w+=/i);
  assert.doesNotMatch(html, /(?:href|src|action)="(?!#)/i);
  assert.doesNotMatch(html, /@import|url\s*\(/i);
  assert.match(html, /&lt;script src=&quot;https:\/\/bad\.example\/run\.js&quot;&gt;&amp;&#39;alert\(1\)&lt;\/script&gt;/);
  assert.equal((html.match(/&lt;script src=/g) || []).length, 10);
});

test("offline filenames remain safe ASCII with a fallback for non-ASCII titles", () => {
  assert.equal(editionFileName("A Library / of Secrets", 4), "a-library-of-secrets-babel-edition-4.html");
  assert.equal(editionFileName("図書館", 2), "book-babel-edition-2.html");
  assert.doesNotMatch(editionFileName("../Résumé\r\nInjected: value", 7), /[\r\n/:]/);
});
