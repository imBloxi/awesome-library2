// Turns an uploaded CSV into validated book rows. Pure, so it is unit tested.
// Accepts the books export format (ID and Available are ignored) or simple lower-case headers.
import { parseCsv } from "./csv.mjs";

export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_BYTES = 1_000_000;

const COLUMNS = {
  title: ["title"],
  author: ["author"],
  isbn: ["isbn"],
  published_year: ["year", "published_year", "published"],
  total_copies: ["copies", "total_copies"],
  description: ["description"],
  genre: ["genre"],
};

const clean = (v) => (v ?? "").normalize("NFKC").replace(/\p{Cc}/gu, " ").trim();

function int(value, min, max) {
  if (!/^-?\d+$/.test(value)) return NaN;
  const n = Number(value);
  return n >= min && n <= max ? n : NaN;
}

// Returns { rows, errors, total }: rows ready to insert, errors as { line, message }.
// Line numbers count the header as line 1, like a spreadsheet.
export function parseBookCsv(text) {
  if (typeof text !== "string" || !text.trim()) return { rows: [], errors: [{ line: 0, message: "The file is empty." }], total: 0 };
  if (text.length > IMPORT_MAX_BYTES) return { rows: [], errors: [{ line: 0, message: "The file is larger than 1 MB. Split it into smaller files." }], total: 0 };
  const [header, ...data] = parseCsv(text);
  const names = header.map((h) => clean(h).toLowerCase());
  const index = Object.fromEntries(Object.entries(COLUMNS).map(([key, aliases]) => [key, names.findIndex((n) => aliases.includes(n))]));
  if (index.title < 0 || index.author < 0) {
    return { rows: [], errors: [{ line: 1, message: "The first row must be a header with at least Title and Author columns." }], total: data.length };
  }
  if (data.length > IMPORT_MAX_ROWS) {
    return { rows: [], errors: [{ line: 0, message: `At most ${IMPORT_MAX_ROWS} books per file; this one has ${data.length}.` }], total: data.length };
  }

  const rows = [];
  const errors = [];
  const seenIsbn = new Map();
  data.forEach((cells, i) => {
    const line = i + 2;
    const get = (key) => (index[key] >= 0 ? clean(cells[index[key]]) : "");
    const problems = [];
    const title = get("title");
    const author = get("author");
    const isbn = get("isbn").replace(/[\s-]/g, "") || null;
    const yearText = get("published_year");
    const copiesText = get("total_copies");
    const published_year = yearText ? int(yearText, 0, 2100) : null;
    const total_copies = copiesText ? int(copiesText, 0, 1000) : 1;
    const description = get("description") || null;
    const genre = get("genre") || null;
    if (!title) problems.push("title is missing");
    else if (title.length > 300) problems.push("title is longer than 300 characters");
    if (!author) problems.push("author is missing");
    else if (author.length > 200) problems.push("author is longer than 200 characters");
    if (isbn && isbn.length > 20) problems.push("ISBN is longer than 20 characters");
    if (Number.isNaN(published_year)) problems.push(`year "${yearText}" isn't a year between 0 and 2100`);
    if (Number.isNaN(total_copies)) problems.push(`copies "${copiesText}" isn't a whole number from 0 to 1000`);
    if (description && description.length > 5000) problems.push("description is longer than 5000 characters");
    if (genre && genre.length > 60) problems.push("genre is longer than 60 characters");
    if (isbn && seenIsbn.has(isbn)) problems.push(`ISBN ${isbn} is also on line ${seenIsbn.get(isbn)}`);
    if (isbn && !seenIsbn.has(isbn)) seenIsbn.set(isbn, line);
    if (problems.length) errors.push({ line, message: problems.join("; ") });
    else rows.push({ line, title, author, isbn, published_year, total_copies, description, genre });
  });
  return { rows, errors, total: data.length };
}
