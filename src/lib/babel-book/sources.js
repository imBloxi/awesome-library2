import { getBookDetails } from "@/lib/queries/books";
import { babelPassage } from "@/lib/babel.mjs";
import { generateEdition, inventBook } from "./index.mjs";
import { MAX_EDITION, MAX_INVENTED_SEED, parseRouteInt } from "./limits.mjs";

// Everything a reader page needs for one edition of a catalog book, or null for a 404.
// Book details come from the tagged cache, so admin edits show up immediately.
export async function catalogEdition(id, edition) {
  const bookId = parseRouteInt(id, Number.MAX_SAFE_INTEGER);
  const n = parseRouteInt(edition, MAX_EDITION);
  if (!bookId || !n) return null;
  const book = await getBookDetails(bookId);
  if (!book) return null;
  return {
    basePath: `/books/${book.id}/read/${n}`,
    bookKey: `book-${book.id}`,
    backLink: { href: `/books/${book.id}`, label: "← Back to the book" },
    byline: `Imagined from “${book.title}” by ${book.author}`,
    backCover: babelPassage(book.title, book.id, book.description),
    rollPath: `/books/${book.id}/read`,
    edition: generateEdition({ title: book.title, description: book.description, bookId: book.id, edition: n }),
  };
}

// A wholly invented book. No database at all: the number is the book.
export function inventedEdition(seed) {
  const n = parseRouteInt(seed, MAX_INVENTED_SEED);
  if (!n) return null;
  const book = inventBook(n);
  return {
    basePath: `/babel/${n}`,
    bookKey: `invented-${n}`,
    backLink: { href: "/babel", label: "← All invented books" },
    byline: `by ${book.author} (who does not exist)`,
    // The premise was written from the same story bible as the chapters, so it is the back cover.
    backCover: book.description.split(/(?<=[.?!])\s+/u),
    rollPath: "/babel",
    cover: { id: n, title: book.title, author: book.author },
    edition: generateEdition({ title: book.title, description: book.description, bookId: `invented-${n}`, bible: book.bible }),
  };
}
