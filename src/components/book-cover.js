// A cloth-bound cover drawn in CSS, so the catalog has covers without image downloads.
// Colour comes from the book id, so a book always looks the same.
const CLOTH = ["#7b1e1e", "#1e3a5f", "#2f5233", "#5b3a29", "#4a235a", "#6b4f1d", "#1f4e4e", "#3b3b6d"];

export function BookCover({ book, size = "md" }) {
  const bg = CLOTH[Number(book.id) % CLOTH.length];
  if (size === "sm") {
    return (
      <span
        aria-hidden="true"
        className="inline-grid h-11 w-8 shrink-0 place-items-center border-l-4 border-black/30 font-bold text-[#f3e3a3] shadow-[2px_2px_0_#808080]"
        style={{ background: bg }}
      >
        {book.title.replace(/^(the|a|an)\s+/i, "").charAt(0).toUpperCase()}
      </span>
    );
  }
  const dims = size === "lg" ? "w-40 h-56 text-lg sm:w-48 sm:h-68" : "w-full aspect-[2/3] text-sm";
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 flex-col justify-between overflow-hidden border-l-8 border-black/30 p-[6%] text-center text-[#f3e3a3] shadow-[4px_4px_0_#808080] ${dims}`}
      style={{ background: bg }}
    >
      <span className="absolute inset-[6%] border border-[#f3e3a3]/50" />
      <span className="relative mt-[12%] line-clamp-4 font-bold leading-tight">{book.title}</span>
      <span className="relative mb-[8%] line-clamp-2 text-[0.8em] italic">{book.author}</span>
    </span>
  );
}
