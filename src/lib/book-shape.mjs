// What a book looks like, derived only from its id and title, so it never changes between visits.

// [cloth, foil] pairs for the binding.
export const TONES = [
  ["#243c54", "#f1dfb4"],
  ["#603640", "#f3dfb8"],
  ["#2c493d", "#e8ddb9"],
  ["#594334", "#f2dfba"],
  ["#433c5b", "#e9dfc3"],
  ["#60502f", "#f3e5be"],
  ["#2d5057", "#eadfbd"],
  ["#3f4247", "#eee4cc"],
];

function idNumber(id) {
  const n = Number(id);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

export function bookTone(id) {
  return TONES[idNumber(id) % TONES.length];
}

// Small integer hash so neighbouring ids don't get neighbouring heights.
function mix(n) {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

// Spine height (share of the shelf row) and thickness (rem). Longer titles get a little
// more room; height varies like a real shelf of mixed editions.
export function spineShape({ id, title = "" }) {
  const h = mix(idNumber(id));
  const length = Math.min(Array.from(String(title)).length, 48);
  const height = 78 + (h % 21); // 78–98 %
  const width = 2.05 + ((h >>> 8) % 6) * 0.12 + length * 0.012; // ≈2.05–3.25 rem
  return { height, width: Math.round(width * 100) / 100 };
}

// Shared-element names must be unique on a page. A book can sit in two lists (top picks
// and the catalogue); only its first appearance gets the name it morphs by.
export function transitionNames(...lists) {
  const seen = new Set();
  return lists.map((list) => {
    const names = new Map();
    for (const book of list ?? []) {
      const key = String(book.id);
      if (seen.has(key)) continue;
      seen.add(key);
      names.set(key, `book-${key}`);
    }
    return names;
  });
}
