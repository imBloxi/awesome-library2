"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

// Typing waits a little so each keystroke doesn't start a request; year fields wait longer
// so "19" isn't searched on the way to "1990".
const DELAY = { search: 300, text: 300, number: 700 };

// GET search form. Without JavaScript it is a plain form; with it, results update as you type.
// `values` are the params currently in the URL: the inputs follow them (Back, "Clear filters")
// without remounting, so the field you're typing in keeps its focus and caret.
export function SearchForm({ action, q = "", values, placeholder = "Search by title, author or ISBN", autoFocus = false, children }) {
  const router = useRouter();
  const formRef = useRef(null);
  const timer = useRef(null);
  const [pending, startTransition] = useTransition();
  const current = values ?? (q ? { q } : {});
  const syncKey = JSON.stringify(current);

  useEffect(() => {
    const params = JSON.parse(syncKey);
    for (const el of formRef.current?.elements ?? []) {
      if (!el.name || el.type === "submit") continue;
      if (el.type === "checkbox") el.checked = params[el.name] === el.value;
      else if (el.tagName === "SELECT") {
        if (params[el.name] != null) el.value = params[el.name];
        else el.selectedIndex = 0;
      } else if (el !== document.activeElement) el.value = params[el.name] ?? "";
    }
  }, [syncKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function navigate() {
    clearTimeout(timer.current);
    const sp = new URLSearchParams();
    const form = formRef.current;
    for (const [key, value] of new FormData(form)) {
      // A select left on its first option is the default (e.g. "Any", or the default sort).
      const el = form.elements.namedItem(key);
      if (el?.tagName === "SELECT" && value === el.options[0]?.value) continue;
      if (typeof value === "string" && value.trim()) sp.set(key, value.trim());
    }
    const qs = sp.toString();
    const href = qs ? `${action}?${qs}` : action;
    if (href === `${window.location.pathname}${window.location.search}`) return;
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function onInput(e) {
    const el = e.target;
    if (el.type === "checkbox" || el.tagName === "SELECT") return navigate();
    const delay = DELAY[el.type];
    if (delay == null) return;
    if (el.type === "number" && el.value && !el.checkValidity()) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(navigate, delay);
  }

  return (
    <Form
      ref={formRef}
      action={action}
      role="search"
      onInput={onInput}
      onSubmit={() => clearTimeout(timer.current)}
      data-pending={pending ? "" : undefined}
      className="search-form mb-10 flex flex-wrap items-center gap-2"
    >
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} aria-label="Search" autoFocus={autoFocus} className="field min-w-0 flex-1" />
      {children}
      <button type="submit" className="btn btn-primary py-[0.6rem]">Search</button>
      <span role="status" aria-live="polite" className="sr-only">{pending ? "Searching…" : ""}</span>
    </Form>
  );
}
