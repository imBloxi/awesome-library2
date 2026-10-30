import test from "node:test";
import assert from "node:assert/strict";
import { generateEdition, inventBook, extractNames, chooseWorld, titleCase, buildBible, MAX_EDITION } from "../src/lib/babel-book/index.mjs";
import { STRUCTURES } from "../src/lib/babel-book/beats.mjs";
import { WORLDS, NAMES } from "../src/lib/babel-book/worlds.mjs";

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

// These exercise events a reader can follow, including all structure/ending branches.
const forcedEdition = (world, structure, ending, edition = 1) => {
  const bible = buildBible({ world, seed: `editorial-${world}` });
  bible.structure = structure;
  bible.ending = ending;
  return { bible, edition: generateEdition({ title: `Editorial ${world}`, bookId: world, edition, bible }) };
};

test("discovery, injury, factual revelation and recovery cannot disappear", () => {
  for (const world of Object.keys(WORLDS)) {
    for (const structure of Object.keys(STRUCTURES)) {
      for (const ending of ["kept", "given", "released"]) {
        const { bible, edition } = forcedEdition(world, structure, ending);
        const chapters = edition.chapters.map((c) => c.paragraphs.join("\n"));
        const discovery = STRUCTURES[structure].indexOf("discovery");
        assert.doesNotMatch(chapters.slice(0, discovery).join("\n"), new RegExp(bible.slots.objS), `${world}/${structure}: object before discovery`);
        assert.match(chapters[discovery], new RegExp(`${bible.cast.H.name} found`), "hero finds the object as the premise promises");
        const loss = STRUCTURES[structure].indexOf("loss");
        assert.match(chapters[loss], new RegExp(`${bible.cast.A.name} was hurt`), "injury precedes healing");
        assert.doesNotMatch(chapters.slice(loss, -2).join("\n"), /(?:carried|went over|kept checking|turned) the (?:seeds|letters|key|proof|map|notebook|book)/, "stolen object is unavailable");
        const midpoint = STRUCTURES[structure].indexOf("midpoint");
        assert.ok(bible.slots.truth?.length > 30, `${world}: concrete resolution in the story bible`);
        const truth = bible.slots.truth.replace(/\{R\}/g, bible.cast.R.name);
        assert.ok(chapters[midpoint].includes(truth), "revelation states the factual resolution");
        assert.ok(chapters.at(-2).includes(truth), "confrontation discusses the same fact");
        assert.match(chapters.at(-2), /recovered/, "explicit recovery before every ending");
      }
    }
  }
});

test("story texture follows the current place and a homecoming stays at home", () => {
  for (const structure of Object.keys(STRUCTURES)) {
    for (let edition = 1; edition <= 20; edition++) {
      const { bible, edition: e } = forcedEdition("sea", structure, "given", edition);
      const beats = STRUCTURES[structure];
      const threshold = beats.indexOf("threshold");
      if (threshold >= 0) {
        const awayText = e.chapters.slice(threshold + 1, -1).flatMap(c => c.paragraphs).join("\n");
        assert.doesNotMatch(awayText, new RegExp(`At the edge of ${bible.slots.home}|Every harbor town has its hour`));
      } else {
        assert.doesNotMatch(allText(e), /the last evening in|the worst time to leave|packed what/);
        assert.doesNotMatch(allText(e), new RegExp(`everything that went wrong in ${bible.slots.away}`));
      }
    }
  }
});

test("plural objects, vowel trades and season headings read grammatically", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const book = inventBook(seed);
    const e = generateEdition({ ...book, bookId: `invented-${seed}` });
    const text = `${book.description}\n${allText(e)}`;
    assert.doesNotMatch(text, /\ba (?:instrument|archivist|old)\b/i);
    assert.doesNotMatch(text, /does the (?:letters|seeds)\b|(?:letters|seeds)[^.\n]*\. It was older|(?:letters|seeds)[^.\n]*\. By the time[^.\n]*it was gone/);
    assert.doesNotMatch(text, /\bAn Ordinary the\b|\bthere was (?:gulls|bees|boots|bells|pages)\b|\bcame round again, as it always does\b/);
    assert.doesNotMatch(text, /Outside,[^.\n]*(?:morning|noon)|long after midnight|snow had buried|summer evening refused/);
  }
});

test("sentence-initial people are retained without treating ordinary prose as names", () => {
  assert.deepEqual(extractNames("Marta returns to Rīga after twenty years. She finds letters."), { people: ["Marta"], places: ["Rīga"] });
  assert.deepEqual(extractNames("Elizabeth Bennet returns to Pemberley. She keeps a secret."), { people: ["Elizabeth Bennet"], places: ["Pemberley"] });
  assert.deepEqual(extractNames("Winter comes early. The village waits."), { people: [], places: [] });
});

test("metadata clipping preserves complete Unicode characters", () => {
  const e = generateEdition({ title: `x${"📚".repeat(200)}` });
  assert.ok(e.title.length <= 300);
  assert.doesNotMatch(e.title, /\p{Cs}/u, "no unpaired surrogate after clipping");
});

test("chapter atmosphere varies without seasonal or clock contradictions", () => {
  for (const world of Object.keys(WORLDS)) {
    const { edition: e } = forcedEdition(world, "crossing", "released");
    const atmosphere = e.chapters[0].paragraphs[1].split(". ")[0];
    assert.equal(allText(e).split(atmosphere).length - 1, 1, `${world}: repeated atmospheric sentence`);
    assert.doesNotMatch(allText(e), /near the end of the week of the funeral|near the end of the week of examinations/);
  }
});

test("the science-fiction discovery has a physical carrier", () => {
  const bible = buildBible({ world: "stars", seed: "review-stars" });
  bible.structure = "crossing";
  const e = generateEdition({ title: "Review stars", bible });
  assert.doesNotMatch(allText(e), /found an unlogged message on an old frequency, wedged|turned the message over in/);
});

test("kept plural objects and callbacks retain agreement through the epilogue", () => {
  const book = inventBook(2);
  book.bible.ending = "kept";
  const e = generateEdition({ ...book, bookId: "plural-kept" });
  const final = e.chapters.at(-1).paragraphs.join("\n");
  assert.doesNotMatch(final, /letters and turned it over|\. It (?:did|only)/);
  assert.doesNotMatch(allText(e), /the letters was taken|the seeds was taken/);
});

test("vowel occupations and place kinds agree in returning stories and dedications", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const bible = buildBible({ world: "time", seed: String(seed) });
    bible.structure = "return";
    const e = generateEdition({ title: "The Archive", edition: seed, bible });
    assert.doesNotMatch(`${e.dedication}\n${allText(e)}`, /\ba archivist\b/);
    const desert = forcedEdition("desert", "return", "kept", seed).edition;
    assert.doesNotMatch(desert.dedication, /\ba oasis town\b/);
  }
});

test("a caller can select another known mystery without a stale factual answer", () => {
  const bible = buildBible({ world: "sea", seed: "editable-bible" });
  const firstSecret = bible.slots.secret;
  bible.slots.secret = WORLDS.sea.secrets.find(secret => secret !== firstSecret);
  const e = generateEdition({ title: "Changed question", bible });
  const reveal = e.chapters[STRUCTURES[bible.structure].indexOf("midpoint")].paragraphs[0];
  assert.ok(!reveal.includes(bible.slots.truth.replace(/\{R\}/g, bible.cast.R.name)), "known question updates its factual answer");
});

test("plural objects retain agreement during crossings and discovery dialogue", () => {
  let pluralQuestions = 0;
  let pluralReflections = 0;
  for (const [world, objS] of [["family", "the letters"], ["wild", "the seeds"]]) {
    for (let edition = 1; edition <= 30; edition++) {
      const bible = buildBible({ world, seed: `plural-dialogue-${edition}` });
      bible.structure = "crossing";
      [bible.slots.obj, bible.slots.objS] = WORLDS[world].objects.find(object => object[1] === objS);
      const text = allText(generateEdition({ title: "A Plural Discovery", edition, bible }));
      assert.equal(text.match(/the (?:seeds|letters) was safe|Why did you keep it\?|left it where it was|what to do with it now/)?.[0] ?? null, null, "no singular agreement for plural objects");
      if (text.includes("Why did you keep them?")) pluralQuestions++;
      if (text.includes("left them where they were")) pluralReflections++;
    }
  }
  assert.ok(pluralQuestions > 0 && pluralReflections > 0, "both plural dialogue forms were exercised");
});
