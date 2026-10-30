import test from "node:test";
import assert from "node:assert/strict";
import { generateEdition, inventBook, extractNames, chooseWorld, titleCase, MAX_EDITION } from "../src/lib/babel-book/index.mjs";
import { NAMES } from "../src/lib/babel-book/worlds.mjs";

const TITLES = ["The River Winter", "The Glass City", "Desert Stars", "A Guide to Calculus", "Letters of Memory", "The Silent Library", "Star Harbor", "Untitled Thing"];
const premise = "When Marta returns to Rīga after twenty years, she finds her mother's letters in the attic.";
const allText = (e) => e.chapters.flatMap((c) => [c.title, ...c.paragraphs]).join("\n");

test("the same book and edition always produce the same text", () => {
  const input = { title: "The River Winter", description: premise, bookId: 7, edition: 3 };
  assert.deepEqual(generateEdition(input), generateEdition(input));
});

test("different editions of one book differ in cast and wording", () => {
  const a = generateEdition({ title: "The River Winter", bookId: 7, edition: 1 });
  const b = generateEdition({ title: "The River Winter", bookId: 7, edition: 2 });
  assert.notDeepEqual(a.cast, b.cast);
  assert.notEqual(allText(a), allText(b));
});

test("every slot is filled, pronouns agree, and nothing repeats within a book", () => {
  for (let id = 1; id <= 120; id++) {
    const e = generateEdition({ title: TITLES[id % TITLES.length], description: id % 2 ? "" : premise, bookId: id, edition: id });
    const text = allText(e);
    assert.doesNotMatch(text, /[{}[\]]/, `unfilled slot in edition ${id}`);
    assert.doesNotMatch(text, /\b[Tt]hey (?:was|has)\b|\bhisself\b|\btheirself\b/, `agreement in edition ${id}`);
    const long = e.chapters.flatMap((c) => c.paragraphs).filter((p) => p.length > 90);
    assert.equal(new Set(long).size, long.length, `repeated paragraph in edition ${id}`);
    assert.ok(e.chapters.length >= 10, "ten chapters");
    assert.ok(e.words > 1800 && e.words < 4000, `length ${e.words}`);
  }
});

test("only the book's own cast is named", () => {
  for (let edition = 1; edition <= 40; edition++) {
    const e = generateEdition({ title: TITLES[edition % TITLES.length], bookId: 1, edition });
    const firstNames = new Set(e.cast.map((full) => full.split(" ")[0]));
    const text = allText(e);
    for (const name of [...NAMES.she, ...NAMES.he, ...NAMES.they]) {
      if (new RegExp(`(?<![\\p{L}])${name}(?![\\p{L}])`, "u").test(text)) assert.ok(firstNames.has(name), `${name} appears but is not in the cast`);
    }
  }
});

test("a real premise keeps its people, place, pronouns and time away", () => {
  assert.deepEqual(extractNames(premise), { people: ["Marta"], places: ["Rīga"] });
  const found = Array.from({ length: 12 }, (_, i) => generateEdition({ title: "Letters of Memory", description: premise, bookId: 2, edition: i + 1 }));
  for (const e of found) {
    assert.match(e.cast[0], /^Marta /);
    assert.match(allText(e), /Rīga/);
    assert.match(allText(e), /\bshe\b/);
  }
  const returning = found.find((e) => e.structure === "return");
  assert.ok(returning, "some edition uses the homecoming structure");
  assert.match(allText(returning), /in twenty years/);
});

test("worlds follow the title and description, with a calm fallback", () => {
  assert.equal(chooseWorld("The Harbor", ""), "sea");
  assert.equal(chooseWorld("Anything", "A practical guide to proofs and theorems."), "inquiry");
  assert.equal(chooseWorld("Qwerty", ""), "literary");
  assert.equal(generateEdition({ title: "The Harbor", description: "A sample book by Jane Austen." }).world, "sea");
});

test("odd metadata never breaks generation", () => {
  for (const title of ["", "  ", "Мастер и Маргарита", "📚".repeat(400), "A".repeat(5000), "<script>alert(1)</script>"]) {
    const e = generateEdition({ title, description: "\u0000\u0007 weird", bookId: null, edition: 1 });
    assert.ok(e.title.length > 0 && e.title.length <= 300);
    assert.equal(e.chapters.length >= 10, true);
  }
  assert.equal(generateEdition({ title: "", edition: 1 }).title, "Untitled");
});

test("edition numbers are clamped to a sane range", () => {
  assert.equal(generateEdition({ title: "X", edition: 0 }).edition, 1);
  assert.equal(generateEdition({ title: "X", edition: -5 }).edition, 1);
  assert.equal(generateEdition({ title: "X", edition: "abc" }).edition, 1);
  assert.equal(generateEdition({ title: "X", edition: 1e12 }).edition, MAX_EDITION);
});

test("generation is fast enough to run on every request", () => {
  const start = performance.now();
  for (let i = 1; i <= 50; i++) generateEdition({ title: TITLES[i % TITLES.length], description: premise, bookId: i, edition: i });
  assert.ok((performance.now() - start) / 50 < 25, "under 25ms per book");
});

test("invented books are stable and their premise matches their text", () => {
  assert.deepEqual(inventBook(42), inventBook(42));
  const titles = new Set(Array.from({ length: 30 }, (_, i) => inventBook(i + 1).title));
  assert.ok(titles.size >= 20, `only ${titles.size} distinct titles in 30 books`);
  for (let seed = 1; seed <= 30; seed++) {
    const book = inventBook(seed);
    const hero = book.bible.cast.H;
    assert.ok(book.description.includes(hero.full), "premise names the hero");
    assert.doesNotMatch(book.description, /[{}]/);
    const e = generateEdition({ title: book.title, description: book.description, bookId: `invented-${seed}`, bible: book.bible });
    assert.match(allText(e), new RegExp(hero.name));
    assert.ok(e.cast.includes(hero.full));
  }
});

test("title case keeps small words low except at the start", () => {
  assert.equal(titleCase("what the key kept"), "What the Key Kept");
  assert.equal(titleCase("the far side of the strait"), "The Far Side of the Strait");
});

test("the offline file escapes everything and names itself safely", async () => {
  const { editionToHtml, editionFileName } = await import("../src/lib/babel-book/html.mjs");
  const { parseRouteInt } = await import("../src/lib/babel-book/limits.mjs");
  const edition = generateEdition({ title: "<img src=x onerror=alert(1)> & \"Co\"", edition: 2 });
  const html = editionToHtml({ edition, byline: "<b>x</b>", backCover: ["<script>bad()</script>"] });
  assert.doesNotMatch(html, /<img|<script|<b>x/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; &quot;Co&quot;/);
  assert.equal(editionFileName("Ünïcode: Tale / Part 2", 7), "unicode-tale-part-2-babel-edition-7.html");
  assert.equal(editionFileName("📚📚", 1), "book-babel-edition-1.html");
  assert.equal(parseRouteInt("12", 99), 12);
  for (const bad of ["0", "01", "-1", "1e3", "100", "", "abc", "12345678901"]) assert.equal(parseRouteInt(bad, 99), null, bad);
});
