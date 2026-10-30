// ctOS subject file: how the account console presents what this library actually holds
// about a member. Every value comes from the database, the session, or the current request.
// Nothing is invented or estimated.

const STAFF_ACTIONS = {
  "loan.pickup": "Pickup confirmed by staff",
  "loan.return": "Return checked in by staff",
  "hold.cancel": "Hold cancelled by staff",
  "hold.extend": "Hold extended by staff",
  "user.role": "Account role changed by staff",
  "member.note": "Staff note added to your file",
  "member.warning": "Warning issued by staff",
  "member.restrict": "Borrowing paused by staff",
  "member.suspend": "Account suspended by staff",
  "member.lift": "Restriction lifted by staff",
};

export function staffActionLabel(action) {
  return STAFF_ACTIONS[action] ?? "Staff action";
}

// The busiest hour of the day for reservations, as a UTC range.
export function formatHourUTC(hour) {
  // No data must stay no data: Number(null) would otherwise read as midnight.
  if (hour == null || hour === "") return null;
  const h = Number(hour);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:00–${pad((h + 1) % 24)}:00 UTC`;
}

// The address this request came from, as the hosting platform reports it.
// Only a well-formed IPv4 or IPv6 literal is shown; anything else is "not reported".
export function cleanAddress(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(raw) && raw.split(".").every((p) => Number(p) <= 255)) return raw;
  if (/^[0-9a-f:.]+$/i.test(raw) && raw.includes(":") && raw.length <= 45) return raw;
  return null;
}

export function requestAddress(headers) {
  return cleanAddress(headers?.get?.("x-forwarded-for")?.split(",")[0] || headers?.get?.("x-real-ip") || "");
}

const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const list = (rows, key) => rows.map((r) => `${r[key]} (${r.n})`).join(", ");

// stats: one row from getSubjectFile(). Returns [label, value] pairs, omitting what has no data.
export function circulationRecord(stats, formatDate) {
  const s = stats ?? {};
  const n = (k) => Math.max(0, Number.parseInt(s[k], 10) || 0);
  const rows = [
    ["Reservations on record", count(n("reservations"), "reservation")],
    ["Books collected", count(n("loans"), "book")],
    ["Books returned", count(n("returned"), "book")],
  ];
  if (n("hidden") > 0) rows.push(["Removed from your view, still retained", count(n("hidden"), "record")]);
  rows.push(["Waitlists joined", count(n("waiting"), "book")], ["Saved for later", count(n("saved"), "book")]);
  if (s.first_reserved) rows.push(["First reservation", formatDate(s.first_reserved)]);
  if (s.last_activity) rows.push(["Last circulation activity", formatDate(s.last_activity)]);
  return rows;
}

export function readingPatterns(stats) {
  const s = stats ?? {};
  const rows = [];
  const hour = formatHourUTC(s.peak_hour);
  if (hour) rows.push(["Most active reservation hour", hour]);
  if (s.peak_day) rows.push(["Most active day", s.peak_day]);
  if (Array.isArray(s.top_authors) && s.top_authors.length) rows.push(["Most borrowed authors", list(s.top_authors, "author")]);
  if (Array.isArray(s.top_genres) && s.top_genres.length) rows.push(["Most borrowed genres", list(s.top_genres, "genre")]);
  return rows;
}
