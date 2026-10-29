import { BABEL_THEMES } from "./babel-themes.mjs";

const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
const clip = (text, limit) => text.slice(0, limit).replace(/[\uD800-\uDBFF]$/u, "");
const clean = (value, limit) => typeof value === "string"
  ? clip(clip(value, limit).normalize("NFKC").replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim(), limit)
  : "";
const lowerFirst = (text) => text[0].toLowerCase() + text.slice(1);
const placeholder = /^a sample book by\b/i;
const honorific = /\b(?:Dr|Mr|Mrs|Ms|Prof|St|Jr|Sr)\.(?:\s+\p{L}\.)*$/iu;
const initials = /(?:^(?:\p{L}\.\s*)+|(?:^|\s)(?:\p{L}\.\s*){2,})$/u;

function excerpt(description) {
  const parts = [];
  for (const { segment } of sentences.segment(description)) {
    const part = segment.trim();
    if (placeholder.test(part)) continue;
    const unwrapped = part.replace(/^[^\p{L}\p{N}]+/u, "");
    if (parts.length && /^(?:in the end|ultimately|the ending reveals|the killer is)\b/i.test(unwrapped)) break;
    const previous = parts.at(-1) ?? "";
    const continuesName = /\p{L}\.$/u.test(previous) && /^\p{L}\.\s/u.test(part);
    if (parts.length && (honorific.test(previous) || initials.test(previous) || continuesName)) {
      parts[parts.length - 1] += ` ${part}`;
    } else {
      parts.push(part);
    }
  }
  return parts.slice(0, 3).map((part) => {
    if (part.length > 320) {
      const cut = clip(part, 316);
      const boundary = cut.lastIndexOf(" ");
      return `${boundary > 180 ? cut.slice(0, boundary) : cut}…`;
    }
    return /[.!?…][”’"']?$/u.test(part) ? part : `${part}.`;
  });
}

function words(text) {
  const result = new Set(text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []);
  for (const word of [...result]) {
    if (word.endsWith("ies")) result.add(`${word.slice(0, -3)}y`);
    else if (word.length > 4 && word.endsWith("s")) result.add(word.slice(0, -1));
  }
  return result;
}

// A metadata-grounded back-cover teaser. Preserve the premise and open hook,
// skip common explicit conclusion markers, and use no external calls or I/O.
export function babelPassage(title = "", bookId = "", description = "") {
  const displayTitle = clean(title, 300) || "Untitled";
  const source = clean(description, 5000);
  let state = 2166136261;
  const seed = `${displayTitle.toLowerCase()}\0${source.toLowerCase()}\0${String(bookId ?? "").slice(0, 64)}`;
  for (const char of seed) state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  const pick = (items) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return items[((n ^ (n >>> 14)) >>> 0) % items.length];
  };

  const premise = excerpt(source);
  const titleWords = words(displayTitle);
  const descriptionWords = words(premise.join(" "));
  const ranked = BABEL_THEMES.map((theme) => ({
    theme,
    score: theme.words.reduce((sum, word) => sum + (titleWords.has(word) ? 3 : 0) + (descriptionWords.has(word) ? 4 : 0), 0),
  })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
  const instructional = /^(?:(?:a|an|this|the)\s+)?(?:(?:practical|beginner[’']?s?|introductory|illustrated|comprehensive)\s+)*(?:handbook|manual|textbook|workbook|primer|guide|introduction|study|reference)\b/iu.test(premise[0] ?? "");
  const primary = instructional
    ? BABEL_THEMES.find(({ kind }) => kind === "inquiry")
    : ranked[0]?.theme ?? BABEL_THEMES.at(-1);
  const lead = pick(primary.focus);
  const focus = premise[0] ? lead : pick(primary.focus.filter((line) => line !== lead));
  const stakes = pick(primary.stakes);
  const question = premise.slice(1).find((part) => /\?[”’"']?$/.test(part)) ?? pick(primary.questions);
  const detail = premise.slice(1).find((part) => !/\?[”’"']?$/.test(part));
  const variants = [
    `${focus} ${stakes}`,
    `${stakes} ${focus}`,
  ];
  if (premise[0]) variants.push(
    `In “${displayTitle}”, ${lowerFirst(focus)} ${stakes}`,
    `${stakes} In “${displayTitle}”, ${lowerFirst(focus)}`,
  );
  const middle = detail ? `${detail} ${stakes}` : pick(variants);
  return [
    premise[0] ?? `In “${displayTitle}”, ${lowerFirst(lead)}`,
    middle,
    question,
  ];
}
