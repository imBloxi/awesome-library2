"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bookTone, spineShape } from "@/lib/book-shape.mjs";
import { babelScramble, decodeFrame } from "@/lib/babel-shelf.mjs";
import { FORWARD } from "@/components/page-turn";

const DECODE_MS = 650;

// A spine title in Borges' symbols that resolves into the real title when its link is
// pointed at or focused. Purely visual: the link carries the real title for assistive tech.
function DecodeTitle({ title, seed }) {
  const ref = useRef(null);
  const [text, setText] = useState(() => babelScramble(title, seed));

  useEffect(() => {
    const link = ref.current?.closest("a");
    if (!link) return;
    let frame = 0;
    let solved = false;
    const solve = () => {
      if (solved) return;
      solved = true;
      if (document.documentElement.dataset.fx !== "full") return setText(title);
      const start = performance.now();
      const tick = (now) => {
        const p = (now - start) / DECODE_MS;
        setText(p >= 1 ? title : decodeFrame(title, seed, p, Math.floor(now / 45)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    link.addEventListener("pointerenter", solve);
    link.addEventListener("focus", solve);
    return () => {
      cancelAnimationFrame(frame);
      link.removeEventListener("pointerenter", solve);
      link.removeEventListener("focus", solve);
    };
  }, [title, seed]);

  return <span ref={ref} className="book-spine-title babel-cipher" data-long={Array.from(title).length > 22 ? "" : undefined}>{text}</span>;
}

function Spine({ book, hidden }) {
  const [cloth, foil] = bookTone(book.seed);
  const { height, width } = spineShape({ id: book.seed, title: book.title });
  return (
    <li>
      <Link
        href={`/babel/${book.seed}`}
        transitionTypes={FORWARD}
        className="spine-link"
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden || undefined}
      >
        <span
          aria-hidden="true"
          className="book-spine"
          style={{ "--spine-cloth": cloth, "--spine-foil": foil, "--spine-h": `${height}%`, "--spine-w": `${width}rem` }}
        >
          <DecodeTitle title={book.title} seed={book.seed} />
        </span>
        {!hidden && <span className="sr-only">{book.title}, by {book.author}</span>}
      </Link>
    </li>
  );
}

// The shelf runs on forever: two identical rows slide left and loop. It stops while
// you point at it or move through it with the keyboard, and stands still unless motion is Full.
export function BabelDrift({ books }) {
  return (
    <div className="babel-drift">
      <ul className="spine-shelf babel-drift-track" aria-label="Invented books">
        {books.map((b) => <Spine key={b.seed} book={b} />)}
      </ul>
      <ul className="spine-shelf babel-drift-track" aria-hidden="true">
        {books.map((b) => <Spine key={b.seed} book={b} hidden />)}
      </ul>
    </div>
  );
}
