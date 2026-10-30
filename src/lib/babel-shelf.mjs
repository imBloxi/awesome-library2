// The endless Babel shelf. Borges' library uses 25 orthographic symbols: 22 letters,
// the space, the comma and the full stop. Spines show a title in those symbols until
// someone reads them, then the real title resolves character by character.

export const BABEL_SYMBOLS = "abcdefghijlmnopqrstuvxz";
const ALL = `${BABEL_SYMBOLS},.`;

function rng(seed) {
  let x = (Number(seed) >>> 0) || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

// The same seed always gives the same nonsense, so server and client render alike.
// Spaces stay where the real title has them, so the shape of the words survives.
export function babelScramble(title, seed) {
  const next = rng(seed);
  return Array.from(String(title ?? ""))
    .map((ch) => (ch === " " ? " " : ALL[Math.floor(next() * ALL.length)]))
    .join("");
}

// One frame of the decode: characters settle in a seeded order as progress goes 0 → 1;
// unsettled ones flicker through the symbols (frame changes which symbol).
export function decodeFrame(title, seed, progress, frame = 0) {
  const real = Array.from(String(title ?? ""));
  const order = real.map((_, i) => i);
  const next = rng(seed ^ 0x5bd1e995);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const settled = Math.floor(Math.min(1, Math.max(0, progress)) * real.length);
  const done = new Set(order.slice(0, settled));
  const flicker = rng((Number(seed) + frame * 7919) >>> 0);
  return real.map((ch, i) => (ch === " " || done.has(i) ? ch : ALL[Math.floor(flicker() * ALL.length)])).join("");
}

// Seeds for the drifting shelf: fixed, so the page stays static and cacheable.
export const DRIFT_SEEDS = [3, 11, 27, 64, 99, 128, 314, 512, 777, 1024, 1337, 2048, 4096, 8191, 12345, 27182, 65536, 99991];
