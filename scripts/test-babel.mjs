import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { babelPassage } from "../src/lib/babel.mjs";

test("Babel reads as a back-cover teaser grounded in the supplied description", () => {
  const description = "Paul Atreides is drawn into a war over spice on the desert planet Arrakis.";
  const paragraphs = babelPassage("Dune", 41, description);
  assert.ok(paragraphs[0].includes(description));
  assert.match(paragraphs.at(-1), /\?$/);
  assert.doesNotMatch(paragraphs.join(" "), /accession|catalogue number|retired navigator|item was found|Together they/);
});

test("changing the description changes the premise and thematic copy", () => {
  const sea = "A marine biologist follows a vanished whale across a storm-torn ocean.";
  const maths = "A mathematician searches for a proof that could change the laws of geometry.";
  const first = babelPassage("The Unknown", 42, sea);
  const second = babelPassage("The Unknown", 42, maths);
  assert.ok(first[0].includes(sea));
  assert.ok(second[0].includes(maths));
  assert.notDeepEqual(first.slice(1), second.slice(1));
});

test("the description's people and open hook survive without invented protagonists", () => {
  const first = "Dr. Inez Vale investigates a series of disappearances in London.";
  const hook = "Which of her witnesses can she trust?";
  const paragraphs = babelPassage("The Night Watch", 45, `${first} ${hook}`);
  assert.equal(paragraphs[0], first);
  assert.equal(paragraphs[2], hook);
  assert.doesNotMatch(paragraphs.join(" "), /\b(?:Mara|Iris|Jonah|Leena|Nora|Felix)\b/);
});

test("the source's second premise sentence is kept", () => {
  const first = "Mary Lennox discovers a locked garden after she is sent to live at her uncle’s house.";
  const second = "As she begins to care for it, she forms friendships that change her understanding of home.";
  const paragraphs = babelPassage("The Secret Garden", 42, `${first} ${second}`);
  assert.equal(paragraphs[0], first);
  assert.ok(paragraphs[1].includes(second));
  assert.doesNotMatch(paragraphs.slice(1).join(" "), /forgive|overlook|betray/i);
});

test("explicit concluding sentences are not copied into the teaser", () => {
  const paragraphs = babelPassage("The Last Witness", 6,
    "A detective investigates a missing witness. In the end, the killer is revealed to be the detective.");
  assert.ok(paragraphs[0].includes("A detective investigates a missing witness."));
  assert.doesNotMatch(paragraphs.join(" "), /killer is revealed|In the end/);
});

test("the same metadata produces repeatable copy independently of other calls", () => {
  const description = "A family reunites after years of silence.";
  const first = babelPassage("The Long Return", 101, description);
  babelPassage("A Different Door", 2, "A researcher follows a disputed theory.");
  assert.deepEqual(babelPassage("The Long Return", 101, description), first);
  assert.notDeepEqual(babelPassage("The Long Return", 102, description), first);
});

test("normalized metadata shares editorial choices while display casing is preserved", () => {
  const lower = (paragraphs) => paragraphs.map((p) => p.toLowerCase());
  assert.deepEqual(lower(babelPassage("  THE\nAmber   Library ", "101", "A family returns home.")),
    lower(babelPassage("the amber library", 101, "a family returns home.")));
  assert.deepEqual(babelPassage("Café"), babelPassage("Cafe\u0301"));
});

test("missing and placeholder descriptions use title-led copy without fake plot facts", () => {
  assert.deepEqual(babelPassage("The River Night", 43), babelPassage("The River Night", 43, null));
  const paragraphs = babelPassage("The River Night", 43, "A sample book by Toni Morrison.");
  assert.ok(paragraphs[0].includes("The River Night"));
  assert.doesNotMatch(paragraphs.join(" "), /sample book|Toni Morrison|retired navigator/);
});

test("a catalog retains distinct book premises rather than recycling a separate plot", () => {
  const blurbs = new Set();
  for (let id = 1; id <= 500; id++) {
    const description = `A history of the coastal garden in ${1400 + id}, based on its surviving planting records.`;
    const paragraphs = babelPassage(`The Garden Record ${id}`, id, description);
    assert.equal(paragraphs[0], description);
    for (const paragraph of paragraphs) {
      assert.ok(paragraph.length > 0 && paragraph.length < 800);
      assert.doesNotMatch(paragraph, /undefined|NaN|\[object Object\]/);
      assert.equal(paragraph.isWellFormed(), true);
    }
    blurbs.add(paragraphs.join("\n").replace(/“[^”]*”/gu, "BOOK"));
  }
  assert.equal(blurbs.size, 500);
});

test("Unicode titles and descriptions retain complete characters", () => {
  for (const title of ["星図", "किताब", "q\u0307", "a".repeat(299) + "📚", "\uFB03".repeat(99) + "aa📚"]) {
    for (const paragraph of babelPassage(title, 1, `${title} opens a question about memory.`)) {
      assert.equal(paragraph.isWellFormed(), true);
      assert.doesNotMatch(paragraph, /undefined|NaN/);
    }
  }
  assert.ok(babelPassage("星図")[0].includes("星図"));
});

test("empty and punctuation-only metadata produce bounded teasers", () => {
  assert.deepEqual(babelPassage(), babelPassage("   "));
  for (const title of ["", "!!!", "x".repeat(100000), "\uFDFA".repeat(300)]) {
    const paragraphs = babelPassage(title, 4, "s".repeat(100000));
    assert.equal(paragraphs.length, 3);
    for (const paragraph of paragraphs) {
      assert.ok(paragraph.length > 0 && paragraph.length < 800);
      assert.equal(paragraph.isWellFormed(), true);
    }
  }
});

test("description abbreviations and mathematical comparisons remain intact", () => {
  for (const description of [
    "Dr. Inez Vale investigates a disappearance in London.",
    "A guide to 3.14, approximation, and numerical reasoning.",
    "For x < y and y > z, the relative values of x and z remain an open question.",
  ]) assert.equal(babelPassage("A Question", 6, description)[0], description);
});

test("initials, honorifics and dotted abbreviations keep the full premise together", () => {
  for (const description of [
    "J. R. R. Tolkien writes to his son about language and family.",
    "Dr. A. Smith investigates a murder in London.",
    "A study of the U.S. Constitution and its changing interpretation.",
    "A biography of C.S. Lewis and his life in Oxford.",
  ]) assert.equal(babelPassage("A Life in Words", 8, description)[0], description);
});

test("quoted conclusions are excluded along with their spoiler details", () => {
  const paragraphs = babelPassage("The Last Witness", 6,
    'A detective follows the clues. “In the end, the killer is her father.”');
  assert.equal(paragraphs[0], "A detective follows the clues.");
  assert.doesNotMatch(paragraphs.join(" "), /the killer|her father/i);
});

test("explicit handbooks and practical guides keep an explanatory lens", () => {
  for (const [title, description] of [
    ["Deep Water", "A handbook of ocean chemistry and dissolved salts."],
    ["The Garden", "A beginner’s guide to planting seeds."],
  ]) {
    const paragraphs = babelPassage(title, 8, description);
    assert.equal(paragraphs[0], description);
    assert.doesNotMatch(paragraphs.slice(1).join(" "), /departure|far shore|return home|unfinished business|neglected|abandoned|family secret|longing|care become the courage to let go/i);
  }
});

test("metadata markup remains escaped when React renders the blurb", () => {
  const paragraphs = babelPassage('<script>alert("book")</script>', 3, '<img src=x onerror="alert(1)"> A family returns home.');
  const html = renderToStaticMarkup(createElement("div", null, ...paragraphs.map((p, i) => createElement("p", { key: i }, p))));
  assert.doesNotMatch(html, /<script|<img/);
});
