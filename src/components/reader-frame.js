"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MAX_EDITION } from "@/lib/babel-book/limits.mjs";

const PREFS_KEY = "babel:prefs";
const DEFAULTS = { size: "m", font: "serif", theme: "light" };
const OPTIONS = {
  size: [["s", "A−", "Smaller text"], ["m", "A", "Normal text"], ["l", "A+", "Larger text"]],
  font: [["serif", "Serif", "Serif font"], ["sans", "Sans", "Sans-serif font"]],
  theme: [["light", "Light", "Light page"], ["sepia", "Sepia", "Sepia page"], ["dark", "Dark", "Dark page"]],
};

// Storage can be blocked (private mode, strict settings); reading then simply uses defaults.
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const lastReadKey = (bookKey) => `babel:last:${bookKey}`;

// The reading surface: text settings remembered on this device, the current place saved
// for "Continue reading", and ←/→ to turn chapters.
export function ReaderFrame({ bookKey, position, prevHref, nextHref, children }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(DEFAULTS);

  useEffect(() => {
    // Read after mount so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs({ ...DEFAULTS, ...load(PREFS_KEY, {}) });
  }, []);

  useEffect(() => {
    if (position) save(lastReadKey(bookKey), position);
  }, [bookKey, position]);

  useEffect(() => {
    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
      if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref]);

  const set = (name, value) => {
    const next = { ...prefs, [name]: value };
    setPrefs(next);
    save(PREFS_KEY, next);
  };

  return (
    <div className="reader" data-size={prefs.size} data-font={prefs.font} data-theme={prefs.theme}>
      <div role="toolbar" aria-label="Reading settings" className="reader-toolbar">
        {Object.entries(OPTIONS).map(([name, options]) => (
          <div key={name} className="reader-toggle" role="group" aria-label={name}>
            {options.map(([value, label, title]) => (
              <button key={value} type="button" title={title} aria-pressed={prefs[name] === value} onClick={() => set(name, value)}>
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

// Opens a random edition of a book (or a random invented book when basePath is "/babel").
export function RandomEditionButton({ basePath, label = "Roll a random edition", max = MAX_EDITION, className = "btn" }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => router.push(`${basePath}/${1 + Math.floor(Math.random() * max)}`)}
    >
      {label}
    </button>
  );
}

// "Continue reading" from the last chapter opened on this device, if any.
export function ContinueReading({ bookKey }) {
  const [last, setLast] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast(load(lastReadKey(bookKey), null));
  }, [bookKey]);
  if (!last?.href || typeof last.href !== "string" || !/^\/(?![/\\])/.test(last.href)) return null;
  return (
    <Link href={last.href} className="link text-sm">
      Continue reading: edition {Number(last.edition) || 1}, chapter {Number(last.chapter) || 1}
    </Link>
  );
}
