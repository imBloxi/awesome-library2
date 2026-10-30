import { MAX_EDITION, MAX_INVENTED_SEED } from "./babel-book/limits.mjs";

export const READER_DEFAULTS = { size: "m", font: "serif", theme: "light" };
const choices = { size: ["s", "m", "l"], font: ["serif", "sans"], theme: ["light", "sepia", "dark"] };

export function normalizeReaderPrefs(value) {
  return Object.fromEntries(Object.entries(choices).map(([key, allowed]) => [key,
    allowed.includes(value?.[key]) ? value[key] : READER_DEFAULTS[key],
  ]));
}

export function normalizeReadingPosition(bookKey, value, { basePath = null, chapterCount = 10 } = {}) {
  if (!value || typeof value !== "object" || !Number.isSafeInteger(value.edition) || !Number.isSafeInteger(value.chapter)
    || value.chapter < 1 || value.chapter > chapterCount || !Number.isSafeInteger(chapterCount) || chapterCount < 1) return null;
  const catalog = /^book-([1-9]\d*)$/.exec(bookKey);
  const invented = /^invented-([1-9]\d*)$/.exec(bookKey);
  let expectedBase;
  if (catalog && Number.isSafeInteger(Number(catalog[1])) && value.edition >= 1 && value.edition <= MAX_EDITION) {
    expectedBase = `/books/${catalog[1]}/read/${value.edition}`;
  } else if (invented && Number(invented[1]) <= MAX_INVENTED_SEED && value.edition === 1) {
    expectedBase = `/babel/${invented[1]}`;
  } else return null;
  const href = `${expectedBase}/${value.chapter}`;
  if (value.href !== href || (basePath != null && basePath !== expectedBase)) return null;
  return { href, edition: value.edition, chapter: value.chapter };
}

export function chapterDirection(event, { interactive = false, selection = false } = {}) {
  if (interactive || selection || event.defaultPrevented || event.isComposing || event.repeat
    || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return 0;
  return event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
}

export function readingMinutes(words) {
  const count = Number(words);
  return Number.isFinite(count) && count > 0 ? Math.min(9999, Math.ceil(count / 220)) : 1;
}
