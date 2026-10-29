import { parsePage } from "./search-params.mjs";

export const RESERVATION_STATUSES = ["active", "attention", "expiring", "reserved", "picked_up", "overdue", "returned", "cancelled", "expired", "all"];
export const RESERVATION_PAGE_SIZE = 20;
const LIVE_QUEUES = new Set(["active", "attention", "expiring", "reserved", "picked_up", "overdue"]);
const str = (value) => typeof value === "string" ? value.trim() : "";

export function parseReservationParams(sp = {}) {
  const status = RESERVATION_STATUSES.includes(sp.status) ? sp.status : "active";
  const defaultSort = LIVE_QUEUES.has(status) ? "priority" : "newest";
  const member = str(sp.user);
  return {
    q: str(sp.q).slice(0, 100),
    status,
    sort: ["priority", "newest"].includes(sp.sort) ? sp.sort : defaultSort,
    userId: member && member.length <= 200 ? member : null,
    page: parsePage(sp.page),
  };
}

// Page is deliberately omitted: submitting filters starts at page one.
export function reservationParams({ q, status, sort, userId }) {
  return { ...(q ? { q } : {}), status, sort, ...(userId ? { user: userId } : {}) };
}
