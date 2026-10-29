// Clothbound hardcovers drawn in CSS: no images, fonts or client JavaScript.
// Colour comes from the book id, so a book always looks the same.
const TONES = [
  ["#243c54", "#f1dfb4"],
  ["#603640", "#f3dfb8"],
  ["#2c493d", "#e8ddb9"],
  ["#594334", "#f2dfba"],
  ["#433c5b", "#e9dfc3"],
  ["#60502f", "#f3e5be"],
  ["#2d5057", "#eadfbd"],
  ["#3f4247", "#eee4cc"],
];

export function BookCover({ book, size = "md" }) {
  const [cloth, foil] = TONES[Number(book.id) % TONES.length];
  const compact = size === "sm";
  const dims = compact ? "h-12 w-9" : size === "lg" ? "w-44 sm:w-56" : "w-full";
  return (
    <span
      aria-hidden="true"
      className={`book-cover book-cover--${size} ${dims}`}
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
    </span>
  );
}
