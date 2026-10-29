// A flat, typographic cover drawn in CSS, so the catalog has covers without image downloads.
// Colour comes from the book id, so a book always looks the same.
const TONES = [
  ["#e8eef9", "#1f3a68"],
  ["#f3ece4", "#5b3a1e"],
  ["#e7f1ec", "#1f4d36"],
  ["#f4e9ec", "#6b2337"],
  ["#eeeaf6", "#3d2d6b"],
  ["#f2f0e3", "#4f4a1c"],
  ["#e6f0f2", "#1d4a54"],
  ["#efefef", "#2b2b2b"],
];

export function BookCover({ book, size = "md" }) {
  const [bg, fg] = TONES[Number(book.id) % TONES.length];
  if (size === "sm") {
    return (
      <span
        aria-hidden="true"
        className="inline-grid h-12 w-9 shrink-0 place-items-center rounded-[3px] text-sm font-semibold"
        style={{ background: bg, color: fg }}
      >
        {book.title.replace(/^(the|a|an)\s+/i, "").charAt(0).toUpperCase()}
      </span>
    );
  }
  const dims = size === "lg" ? "w-44 sm:w-56 text-xl" : "w-full text-sm";
  return (
    <span
      aria-hidden="true"
      className={`flex aspect-[2/3] shrink-0 flex-col justify-between rounded-md p-[9%] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.25)] ${dims}`}
      style={{ background: bg, color: fg }}
    >
      <span className="line-clamp-4 font-semibold leading-snug tracking-tight">{book.title}</span>
      <span className="line-clamp-2 text-[0.75em] opacity-75">{book.author}</span>
    </span>
  );
}
