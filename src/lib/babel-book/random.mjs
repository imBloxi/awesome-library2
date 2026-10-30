// Seeded randomness for Babel Editions. Same seed, same book, on every server and in tests.
// FNV-1a to hash the seed text, then a small 32-bit mixer (same family as babel.mjs).

export function hashSeed(text) {
  let state = 2166136261;
  for (const char of String(text)) state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  return state;
}

export function makeRandom(seedText) {
  let state = hashSeed(seedText);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  const pick = (items) => items[Math.floor(next() * items.length)];
  const chance = (p) => next() < p;
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  // Pick without repeating until every option has been used once.
  const decks = new Map();
  const deal = (key, items) => {
    let deck = decks.get(key);
    if (!deck || deck.length === 0) {
      deck = shuffle(items.map((_, i) => i));
      decks.set(key, deck);
    }
    return items[deck.pop()];
  };
  return { next, int, pick, chance, shuffle, deal };
}
