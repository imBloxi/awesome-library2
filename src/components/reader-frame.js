"use client";

import { useEffect, useState } from "react";
import { MAX_EDITION } from "@/lib/babel-book/limits.mjs";
import { READER_DEFAULTS, normalizeReaderPrefs, normalizeReadingPosition, chapterDirection } from "@/lib/reader-state.mjs";

// Force a new server authorization check rather than reuse the client route cache.
function openReaderPage(href) {
  window.location.assign(href);
}

const PREFS_KEY = "babel:prefs";
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
export function ReaderFrame({ bookKey, basePath, chapterCount = 10, label = "Reading room", position, prevHref, nextHref, children }) {
  const [prefs, setPrefs] = useState(READER_DEFAULTS);

  useEffect(() => {
    // Read after mount so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(normalizeReaderPrefs(load(PREFS_KEY, {})));
  }, []);

  useEffect(() => {
    const valid = normalizeReadingPosition(bookKey, position, { basePath, chapterCount });
    if (valid) save(lastReadKey(bookKey), valid);
  }, [bookKey, basePath, chapterCount, position]);

  useEffect(() => {
    function onKey(e) {
      const interactive = e.target.isContentEditable || Boolean(e.target.closest?.(
        "input, textarea, select, button, a, summary, [role='button'], [role='slider'], [role='tab'], [role='textbox'], [role='combobox']"
      ));
      const direction = chapterDirection(e, { interactive, selection: Boolean(window.getSelection()?.toString()) });
      const href = direction < 0 ? prevHref : direction > 0 ? nextHref : null;
      if (!href) return;
      e.preventDefault();
      openReaderPage(href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref]);

  const set = (name, value) => {
    const next = { ...prefs, [name]: value };
    setPrefs(next);
    save(PREFS_KEY, next);
  };

  return (
    <div className="reader" data-size={prefs.size} data-font={prefs.font} data-theme={prefs.theme}>
      <div className="reader-toolbar">
        <p className="reader-toolbar-label">{label}</p>
        <details className="reader-settings">
          <summary><span aria-hidden="true">Aa</span> Appearance</summary>
          <div className="reader-settings-panel">
            {Object.entries(OPTIONS).map(([name, options]) => (
              <fieldset key={name} className="reader-setting">
                <legend className="reader-setting-label">{name === "size" ? "Text size" : name === "font" ? "Typeface" : "Page color"}</legend>
                <div className="reader-toggle">
                  {options.map(([value, text, title]) => (
                    <button key={value} type="button" title={title} aria-label={title} aria-pressed={prefs[name] === value} onClick={() => set(name, value)}>
                      {text}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </details>
      </div>
      {children}
    </div>
  );
}

// Opens a random edition of a book (or a random invented book when basePath is "/babel").
export function RandomEditionButton({ basePath, label = "Roll a random edition", max = MAX_EDITION, className = "btn" }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openReaderPage(`${basePath}/${1 + Math.floor(Math.random() * max)}`)}
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
    setLast(normalizeReadingPosition(bookKey, load(lastReadKey(bookKey), null)));
  }, [bookKey]);
  const current = normalizeReadingPosition(bookKey, last);
  if (!current) return null;
  return (
    <a href={current.href} className="link text-sm">
      Continue reading: edition {current.edition}, chapter {current.chapter}
    </a>
  );
}

export function ReaderResume({ bookKey, basePath, chapterCount }) {
  const [last, setLast] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast(normalizeReadingPosition(bookKey, load(lastReadKey(bookKey), null), { basePath, chapterCount }));
  }, [bookKey, basePath, chapterCount]);
  const current = normalizeReadingPosition(bookKey, last, { basePath, chapterCount });
  if (!current) return null;
  return <a href={current.href} className="btn btn-primary">Continue chapter {current.chapter}</a>;
}
