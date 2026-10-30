// Babel Editions: a whole imagined book, generated locally and deterministically from a
// catalog book's title and description plus an edition number. No network, no keys, no I/O.
//
// Pipeline: seed → story bible (world, cast, places, object, secret) → plot structure
// (a list of beats) → chapters realized from templates, with callbacks to earlier chapters.
//
// Template slots (see beats.mjs and worlds.mjs):
//   {H} {A} {R} {E}            hero, ally, rival, elder (first names)
//   {H.full} {H.trade} {R.role} {E.role}
//   {H.subj} {H.obj} {H.poss} {H.self} {H.was} {H.has}   pronouns; {H.Subj} capitalizes
//   {home} {away} {pass} {homeKind} {awayKind} {obj} {objS} {secret} {want} {flaw}
//   {threat} {travel} {vessel} {season} {trade}
//   {sense} {weather}          a fresh detail each time, without repeats until all are used
//   {cb}                       a callback to something that happened in an earlier chapter
//   A capital first letter on any slot ({Weather}, {ObjS}) capitalizes the result.

import { BABEL_THEMES } from "../babel-themes.mjs";
import { makeRandom } from "./random.mjs";
import { WORLDS, THEME_WORLD, NAMES, SURNAMES, PRONOUNS } from "./worlds.mjs";
import { STRUCTURES, BEATS, CALLBACKS, INTERLUDES, DIALOGUES, SCENES } from "./beats.mjs";

import { MAX_EDITION, MAX_INVENTED_SEED } from "./limits.mjs";
export { MAX_EDITION, MAX_INVENTED_SEED };

const clean = (value, limit) =>
  typeof value === "string" ? value.normalize("NFKC").replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim().slice(0, limit) : "";
const capitalize = (text) => text.replace(/^([\s“"'(]*)(\p{Ll})/u, (_, lead, ch) => lead + ch.toUpperCase());
const SMALL = new Set(["a", "an", "the", "of", "in", "on", "at", "to", "for", "and", "or", "but", "by", "from"]);
export const titleCase = (text) =>
  text.split(" ").map((word, i) => (i > 0 && SMALL.has(word.toLowerCase()) ? word.toLowerCase() : capitalize(word))).join(" ");

const placeholder = /^a sample book by\b/i;
const instructional = /^(?:(?:a|an|this|the)\s+)?(?:(?:practical|beginner[’']?s?|introductory|illustrated)\s+)*(?:handbook|manual|textbook|workbook|primer|guide|introduction|study|reference)\b/iu;

function wordSet(text) {
  return new Set(text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []);
}

// Same keyword scoring as the back cover (title words 3, description words 4), so the
// edition's world matches the lens of the blurb shown next to it.
export function chooseWorld(title, description) {
  if (instructional.test(description)) return "inquiry";
  const titleWords = wordSet(title);
  const descriptionWords = wordSet(description);
  let best = null;
  let bestScore = 0;
  for (const theme of BABEL_THEMES) {
    const score = theme.words.reduce((sum, w) => sum + (titleWords.has(w) ? 3 : 0) + (descriptionWords.has(w) ? 4 : 0), 0);
    if (score > bestScore) [best, bestScore] = [theme, score];
  }
  return THEME_WORLD[best?.words[0]] ?? "literary";
}

const NOT_NAMES = new Set(["The", "A", "An", "In", "On", "At", "When", "But", "And", "Her", "His", "Their", "It", "Its", "This", "That", "These", "Those", "After", "Before", "I", "We", "You", "He", "She", "They", "As", "If", "One", "Now", "Then", "There", "With", "From", "For", "Of", "To", "By", "Mr", "Mrs", "Ms", "Dr", "Prof", "St", "Book", "Chapter", "Part", "God"]);

// Proper names from the description, so a real premise keeps its people and places.
// Words after "in/at/to/from/near/across" are taken as places, the rest as people.
// Sentence-initial words are skipped because they are capitalized anyway.
export function extractNames(description, title = "") {
  const titleWords = wordSet(title);
  const people = [];
  const places = [];
  for (const sentence of description.split(/(?<=[.!?])\s+/u)) {
    const re = /(?<=(\S+)\s)(\p{Lu}[\p{Ll}\p{M}'’-]+(?:\s\p{Lu}[\p{Ll}\p{M}'’-]+)?)/gu;
    for (const match of sentence.matchAll(re)) {
      const name = match[2];
      const first = name.split(" ")[0];
      if (NOT_NAMES.has(first) || first.length < 3 || name.length > 40 || titleWords.has(first.toLowerCase())) continue;
      const previous = match[1].toLowerCase().replace(/[^\p{L}]/gu, "");
      const list = ["in", "at", "to", "from", "near", "across", "of"].includes(previous) ? places : people;
      if (!list.includes(name)) list.push(name);
    }
  }
  return { people, places };
}

function guessPronouns(description) {
  const she = (description.match(/\b(?:she|her|hers|herself)\b/giu) ?? []).length;
  const he = (description.match(/\b(?:he|him|his|himself)\b/giu) ?? []).length;
  return she > he ? "she" : he > she ? "he" : "they";
}

function makePlace(rnd, parts, avoid) {
  for (let i = 0; i < 8; i++) {
    const name = `${rnd.pick(parts.firsts)}${rnd.pick(parts.lasts)}`;
    if (name !== avoid) return name;
  }
  return `${parts.firsts[0]}${parts.lasts[0]}`;
}

// The story bible: everything that must stay consistent across the whole book.
export function buildBible({ title = "", description = "", seed, world: forcedWorld = null }) {
  const rnd = makeRandom(`bible\0${seed}`);
  const source = placeholder.test(description) ? "" : description;
  const worldKey = forcedWorld ?? chooseWorld(title, source);
  const world = WORLDS[worldKey];
  const found = extractNames(source, title);
  const used = new Set();

  const person = (preset) => {
    let kind = preset?.kind ?? (rnd.chance(0.12) ? "they" : rnd.chance(0.5) ? "she" : "he");
    let first = preset?.first;
    let last = preset?.last;
    if (!first) {
      for (let i = 0; i < 20 && (!first || used.has(first)); i++) first = rnd.pick(NAMES[kind]);
      if (used.has(first)) [kind, first] = ["they", NAMES.they.find((n) => !used.has(n)) ?? "Robin"];
    }
    used.add(first);
    last ??= rnd.pick(SURNAMES);
    return { name: first, full: `${first} ${last}`, ...PRONOUNS[kind], kind };
  };

  const heroName = found.people[0]?.split(" ");
  const hero = person(heroName ? { first: heroName[0], last: heroName[1] ?? null, kind: guessPronouns(source) } : null);
  const ally = person();
  const rival = person();
  const elder = person();
  hero.trade = rnd.pick(world.trades);
  ally.trade = rnd.pick(world.trades);
  rival.role = rnd.pick(world.rivalRoles);
  elder.role = rnd.pick(world.elderRoles);

  const home = found.places[0] ?? makePlace(rnd, world.home);
  const years = source.match(/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|\d{1,2})\s+years\b/iu);
  const [obj, objS] = rnd.pick(world.objects);
  return {
    world: worldKey,
    structure: worldKey === "inquiry" || worldKey === "city" ? rnd.pick(["mystery", "mystery", "crossing"]) : rnd.pick(Object.keys(STRUCTURES)),
    ending: rnd.pick(["kept", "given", "released"]),
    cast: { H: hero, A: ally, R: rival, E: elder },
    slots: {
      home, away: makePlace(rnd, world.away, home), pass: rnd.pick(world.pass),
      homeKind: world.homeKind, awayKind: world.awayKind,
      obj, objS, secret: rnd.pick(world.secrets), want: rnd.pick(world.wants), flaw: rnd.pick(world.flaws),
      threat: world.threat, travel: world.travel, vessel: world.vessel, season: rnd.pick(world.seasons),
      trade: hero.trade, yearsAway: years ? years[1].toLowerCase() : rnd.pick(["eleven", "nine", "fifteen", "twenty"]),
    },
  };
}

// Fill one template. Character slots read the cast; detail slots deal from the world's
// banks so the same phrase doesn't come back until the others have been used.
function fill(template, ctx, depth = 0) {
  const text = template.replace(/\{([A-Za-z]+)(?:\.([A-Za-z]+))?\}/g, (whole, key, prop) => {
    const upper = /^\p{Lu}/u.test(prop ?? (key.length > 1 ? key : ""));
    let value;
    const character = ctx.bible.cast[key];
    if (character) {
      const field = prop ? prop[0].toLowerCase() + prop.slice(1) : "name";
      value = character[field];
      if (value == null) return whole;
    } else {
      const name = key[0].toLowerCase() + key.slice(1);
      if (name === "sense") value = ctx.rnd.deal("sense", ctx.world.senses);
      else if (name === "weather") value = ctx.rnd.deal("weather", ctx.world.weather);
      else if (name === "cb") value = ctx.callbacks.length ? ctx.rnd.pick(ctx.callbacks) : "the beginning of all this";
      else value = ctx.bible.slots[name];
      if (value == null) return whole;
    }
    if (depth < 4 && value.includes("{")) value = fill(value, ctx, depth + 1);
    return upper ? capitalize(value) : value;
  });
  return text;
}

const paragraph = (template, ctx) => capitalize(fill(template, ctx));

function realizeChapter(beatKey, index, total, ctx) {
  const beat = BEATS[beatKey];
  const rnd = ctx.rnd;
  // Keep the beat's paragraphs in order; drop at most one from the middle for variety.
  let body = beat.paragraphs.map((p) => paragraph(p, ctx));
  if (body.length > 3 && rnd.chance(0.5)) body.splice(rnd.int(1, body.length - 2), 1);
  if (beat.endings) body.push(paragraph(beat.endings[ctx.bible.ending], ctx));

  // Texture between story beats: two interludes, and a short conversation in most chapters.
  // The banks are large enough that a 10-chapter book never repeats one.
  const extras = [
    paragraph(rnd.deal("scene", SCENES), ctx),
    paragraph(rnd.deal("interlude", INTERLUDES), ctx),
    paragraph(rnd.deal("interlude", INTERLUDES), ctx),
  ];
  if (index < total - 1 && rnd.chance(0.8)) {
    extras.push(rnd.deal("dialogue", DIALOGUES).map((line) => paragraph(line, ctx)).join("\n"));
  }
  for (const extra of extras) body.splice(rnd.int(1, Math.max(1, body.length - (beat.endings ? 1 : 0))), 0, extra);

  const callback = CALLBACKS[beatKey];
  if (callback) ctx.callbacks.push(fill(rnd.pick(callback), ctx));
  return { title: titleCase(fill(rnd.pick(beat.titles), ctx)), paragraphs: body.flatMap((p) => p.split("\n")) };
}

// A full edition. `edition` picks a different cast, plot and wording for the same book.
export function generateEdition({ title = "", description = "", bookId = "", edition = 1, bible = null }) {
  const cleanTitle = clean(title, 300) || "Untitled";
  const source = clean(description, 5000);
  const n = Math.min(MAX_EDITION, Math.max(1, Math.trunc(Number(edition)) || 1));
  const seed = `${cleanTitle.toLowerCase()}\0${source.toLowerCase()}\0${String(bookId ?? "").slice(0, 64)}\0${n}`;
  const story = bible ?? buildBible({ title: cleanTitle, description: source, seed });
  const ctx = { bible: story, world: WORLDS[story.world], rnd: makeRandom(`text\0${seed}`), callbacks: [] };
  const beats = STRUCTURES[story.structure];
  const chapters = beats.map((beat, i) => realizeChapter(beat, i, beats.length, ctx));
  const words = chapters.reduce((sum, c) => sum + c.paragraphs.join(" ").split(/\s+/).length, 0);
  return {
    title: cleanTitle,
    edition: n,
    world: story.world,
    structure: story.structure,
    cast: Object.values(story.cast).map(({ full }) => full),
    dedication: fill(ctx.rnd.pick(DEDICATIONS), ctx),
    chapters,
    words,
  };
}

const DEDICATIONS = [
  "For everyone who ever stayed one more year in a {homeKind}.",
  "For the ones who kept the secret, and the ones who didn't.",
  "For {A}, wherever {A.subj} {A.was} now.",
  "For anyone who has held a thing that should not exist.",
];

// A wholly invented book for the "random book" page: title, author, premise and text,
// all from one number. The premise is written from the same bible as the text, so the
// back cover and the chapters agree.
export function inventBook(seedNumber) {
  const seed = Math.min(MAX_INVENTED_SEED, Math.max(1, Math.trunc(Number(seedNumber)) || 1));
  const rnd = makeRandom(`invent\0${seed}`);
  const world = rnd.pick(Object.keys(WORLDS));
  const bible = buildBible({ seed: `invented\0${seed}`, world });
  const { H, R } = bible.cast;
  const { home, obj, objS, secret } = bible.slots;
  const noun = titleCase(objS.replace(/^the /, ""));
  const adjectives = ["Silent", "Last", "Hidden", "Winter", "Lost", "Borrowed", "Unfinished", "Quiet", "Salt", "Second"];
  const title = rnd.pick([
    `The ${rnd.pick(adjectives)} ${noun}`,
    `The ${home} ${noun}`,
    `What the ${noun} Kept`,
    `A ${noun} for ${H.name}`,
    `${titleCase(bible.slots.season)} in ${home}`,
  ]);
  const author = `${rnd.pick([...NAMES.she, ...NAMES.he, ...NAMES.they])} ${rnd.pick(SURNAMES)}`;
  const ctx = { bible, world: WORLDS[world], rnd, callbacks: [] };
  const description = [
    fill(`In ${home}, {H.full}, a {H.trade}, finds ${obj}.`, ctx),
    capitalize(fill(`It points toward ${secret}, and ${R.name}, {R.role}, would much rather it stayed buried.`, ctx)),
    fill(`What does {H} owe the truth, and what does ${objS} owe {H.obj}?`, ctx),
  ].join(" ");
  return { seed, title, author, description, bible };
}
