// Member monitoring: turns real circulation signals into a score staff can act on.
// Every point is explained by a signal with its evidence; nothing is hidden or estimated.
// The score never acts on its own: only staff restrict or suspend accounts.
import { MAX_ACTIVE } from "./queries/reserve-sql.mjs";
import { WAITLIST_LIMIT } from "./queries/waitlist-sql.mjs";

export const LEVELS = [
  { id: "review", min: 45, label: "Needs review" },
  { id: "watch", min: 20, label: "Watch" },
  { id: "clear", min: 0, label: "Clear" },
];

const n = (v) => Math.max(0, Number.parseInt(v, 10) || 0);
const plural = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

// Each rule returns null (no signal) or { id, label, points, evidence }.
// Weights, in short: an unreturned overdue book matters most, then repeated lateness and
// no-shows, then booking patterns that keep copies from others, then recent staff action.
export const RULES = [
  (s) => {
    const k = n(s.overdue_now);
    if (!k) return null;
    const days = n(s.overdue_days);
    const points = Math.min(50, 25 + (k - 1) * 10 + (days >= 14 ? 10 : 0));
    return { id: "overdue", label: "Overdue now", points, evidence: `${plural(k, "loan")} past due, the oldest by ${plural(days, "day")}` };
  },
  (s) => {
    const returned = n(s.returned_90), late = n(s.late_90);
    if (returned < 3 || late === 0) return null;
    const rate = late / returned;
    if (rate < 1 / 3) return null;
    return { id: "late", label: "Returns late", points: rate >= 2 / 3 ? 25 : 15, evidence: `${late} of ${returned} returns in 90 days came back after the due date` };
  },
  (s) => {
    const k = n(s.no_shows_90);
    if (k < 2) return null;
    const holds = n(s.holds_90);
    return { id: "no_show", label: "Holds not collected", points: k >= 4 ? 20 : 10, evidence: `${plural(k, "hold")} expired uncollected in 90 days${holds ? ` (of ${holds} that ended)` : ""}` };
  },
  (s) => {
    const k = n(s.cancels_30);
    if (k < 5) return null;
    return { id: "churn", label: "Frequent cancelling", points: k >= 10 ? 15 : 10, evidence: `${plural(k, "reservation")} cancelled in 30 days` };
  },
  (s) => {
    const k = n(s.burst_7);
    if (k < 5) return null;
    return { id: "burst", label: "Rapid booking", points: k >= 8 ? 20 : 10, evidence: `${plural(k, "reservation")} within one hour in the last 7 days` };
  },
  (s) => {
    const k = n(s.waiting);
    if (k < WAITLIST_LIMIT / 2) return null;
    return { id: "queue", label: "Heavy waitlisting", points: k >= WAITLIST_LIMIT * 0.75 ? 10 : 5, evidence: `waiting for ${k} of ${WAITLIST_LIMIT} allowed books` };
  },
  (s) => {
    if (n(s.active_now) < MAX_ACTIVE) return null;
    return { id: "capacity", label: "At the limit", points: 5, evidence: `holding all ${MAX_ACTIVE} reservations` };
  },
  (s) => {
    const k = n(s.watched_books);
    if (!k) return null;
    const titles = Array.isArray(s.watched_titles) && s.watched_titles.length ? `: ${s.watched_titles.join(", ")}` : "";
    return { id: "watched", label: "Person of interest", points: Math.min(30, 15 * k), evidence: `${plural(k, "title")} on the library watchlist in 180 days${titles}` };
  },
  (s) => {
    const k = n(s.prior_180);
    if (!k) return null;
    return { id: "history", label: "Recent staff action", points: Math.min(20, k * 10), evidence: `${plural(k, "warning or restriction", "warnings or restrictions")} in 180 days` };
  },
];

export function assessMember(stats) {
  const signals = RULES.map((rule) => rule(stats ?? {})).filter(Boolean).sort((a, b) => b.points - a.points);
  const score = Math.min(100, signals.reduce((sum, s) => sum + s.points, 0));
  const level = LEVELS.find((l) => score >= l.min);
  return { score, level: level.id, levelLabel: level.label, signals };
}

// Highest score first; ties go to the member with the most recent activity.
export function rankMembers(rows) {
  return rows
    .map((row) => ({ ...row, assessment: assessMember(row) }))
    .sort((a, b) => b.assessment.score - a.assessment.score
      || new Date(b.last_activity ?? 0) - new Date(a.last_activity ?? 0));
}
