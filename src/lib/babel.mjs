const READERS = ["Mara", "Iris", "Jonah", "Ada", "Eli", "Leena"];
const LIBRARIES = ["the town library", "the riverside library", "the library above the station", "the hilltop library"];

// Choose a complete story, not independent sentences: the same reader follows
// one mystery from discovery to resolution, with one small magical premise.
const STORIES = [
  (reader, library, title) => [
    `${reader} found a sealed letter tucked inside “${title}” at ${library}. Its address kept changing, always naming a street that no longer appeared on modern maps.`,
    `Rather than chase each address, ${reader} compared them with an old street directory. All of them had once named the same road, where the letter's recipient had run a bookshop.`,
    `${reader} delivered the letter to the retired bookseller who still lived above the old shop. Once the right person held it, the address stopped changing, and the book could finally be returned to its shelf.`,
  ],
  (reader, library, title) => [
    `${reader} opened “${title}” at ${library} and found a map where the contents page should have been. A moving dot marked a locked room at the back of the building.`,
    `${reader} followed the map and found a box of unsorted books outside the room. As each book was returned to its proper shelf, one of the lines on the map faded; the last line led to the missing room key.`,
    `${reader} used the key to open the room and put the empty box away. The moving dot disappeared and the contents page returned: the mystery had been a very elaborate request to finish shelving.`,
  ],
  (reader, library, title) => [
    `${reader} borrowed “${title}” from ${library}, but its last page was blank. A pencilled note explained that the ending would appear only after the book reached its previous reader.`,
    `${reader} asked the librarian to pass a message to that reader, who had been searching for a lost bookmark. They met at the library, and the bookmark was still between the pages where it had been forgotten.`,
    `When ${reader} handed the book and bookmark back, words slowly filled the final page. After reading the ending together, they returned the book to the library with nothing left between its pages.`,
  ],
];

// Title alone seeds a small deterministic PRNG; no global randomness or I/O.
export function babelPassage(title = "") {
  const seed = title.slice(0, 300).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 300) || "untitled";
  const bookTitle = /[\p{L}\p{N}]/u.test(seed) ? seed : "untitled";
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  const pick = (items) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return items[((n ^ (n >>> 14)) >>> 0) % items.length];
  };
  return pick(STORIES)(pick(READERS), pick(LIBRARIES), bookTitle);
}
