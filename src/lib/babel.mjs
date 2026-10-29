const NOUNS = ["librarian", "moon", "staircase", "moth", "clock", "ocean", "mirror", "key", "alphabet", "teapot", "shadow", "comet"];
const ADJECTIVES = ["velvet", "forgotten", "impossible", "sleepwalking", "paper", "invisible", "saltwater", "upside-down", "borrowed", "whispering"];
const PLACES = ["between two unwritten pages", "beneath the last library", "inside a sleeping dictionary", "at the edge of Tuesday", "behind the rain", "where the shelves become stars"];

// Title alone seeds a small deterministic PRNG; no global randomness or I/O.
export function babelPassage(title = "") {
  const seed = title.slice(0, 300).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase() || "untitled";
  const words = (seed.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? ["untitled"]).map((w) => w.slice(0, 32));
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  const pick = (items) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return items[((n ^ (n >>> 14)) >>> 0) % items.length];
  };
  const sentences = [
    (word) => `The ${pick(ADJECTIVES)} ${pick(NOUNS)} keeps a word called “${word}” ${pick(PLACES)}.`,
    (word) => `Every time someone whispers “${word}”, a ${pick(NOUNS)} forgets which century it belongs to.`,
    (word) => `“${word}” is written on a ${pick(ADJECTIVES)} door, but the door opens only into another ${pick(NOUNS)}.`,
    (word) => `We searched for “${word}” ${pick(PLACES)} and found a ${pick(ADJECTIVES)} ${pick(NOUNS)} reading us instead.`,
    (word) => `Nobody remembers who borrowed “${word}”; the ${pick(NOUNS)} insists it was the ${pick(NOUNS)}.`,
    (word) => `Somewhere ${pick(PLACES)}, “${word}” waits for a reader with a ${pick(ADJECTIVES)} ${pick(NOUNS)} for a heart.`,
  ];
  return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => pick(sentences)(pick(words))).join(" "));
}
