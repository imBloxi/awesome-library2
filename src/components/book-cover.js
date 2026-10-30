import { ViewTransition } from "react";
import { bookTone, spineShape } from "@/lib/book-shape.mjs";

// Clothbound hardcovers drawn in CSS: no images, fonts or extra requests.
// Colour comes from the book id, so a book always looks the same.
// vtName: the shared-element name this cover morphs by between pages (null for none).
export function BookCover({ book, size = "md", vtName = null }) {
  const [cloth, foil] = bookTone(book.id);
  const compact = size === "sm";
  const dims = compact ? "h-12 w-9" : size === "lg" ? "w-44 sm:w-56" : "w-full";
  const cover = (
    <span
      aria-hidden="true"
      className={`book-cover book-cover--${size} ${dims}`}
      data-tilt={compact ? undefined : ""}
      style={{ "--cover-cloth": cloth, "--cover-foil": foil }}
    >
      <span className="book-cover__pages" />
      <span className="book-cover__front">
        {compact ? (
          <span className="book-cover__initial">
            {Array.from(book.title.replace(/^(the|a|an)\s+/i, "").trim())[0]?.toUpperCase()}
          </span>
        ) : (
          <>
            <span className="book-cover__ornament">✦</span>
            <span className="book-cover__title">{book.title}</span>
            <span className="book-cover__author">{book.author}</span>
          </>
        )}
      </span>
      {!compact && <span className="book-cover__glint" />}
    </span>
  );
  if (!vtName) return cover;
  return (
    <ViewTransition name={vtName} share="morph" default="none">
      {cover}
    </ViewTransition>
  );
}

// The same book standing on a shelf. Decorative: the link around it carries the words.
export function BookSpine({ book, available, vtName = null }) {
  const [cloth, foil] = bookTone(book.id);
  const { height, width } = spineShape(book);
  const spine = (
    <span
      aria-hidden="true"
      className="book-spine"
      style={{ "--spine-cloth": cloth, "--spine-foil": foil, "--spine-h": `${height}%`, "--spine-w": `${width}rem` }}
    >
      <span className="book-spine-title">{book.title}</span>
      <span className="book-spine-dot" data-available={available > 0 ? "" : undefined} />
    </span>
  );
  if (!vtName) return spine;
  return (
    <ViewTransition name={vtName} share="morph" default="none">
      {spine}
    </ViewTransition>
  );
}
