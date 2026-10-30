import Link from "next/link";
import { BACK, FORWARD } from "@/components/page-turn";

export function PageTitle({ children, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <h1 className="page-heading">{children}</h1>
      {action}
    </div>
  );
}

// Placeholder rows while data streams in, drawn as fanned page edges.
// `rows` reserves roughly the final height.
export function Skeleton({ rows = 5 }) {
  return (
    <div aria-busy="true" className="skeleton-pages" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-page" />
      ))}
    </div>
  );
}

// short: for narrow spots like cover grids ("2 of 3" instead of "2 of 3 available").
export function Availability({ available, total, short = false }) {
  const n = Math.max(0, available);
  return n > 0 ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ok" title={`${n} of ${total} available`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
      {n} of {total}{short ? "" : " available"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-muted">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#a4a8b0]" />
      {short ? "All out" : "None available"}
    </span>
  );
}

export function TopPickBadge() {
  return (
    <span className="badge badge-gilt">
      <span aria-hidden="true">✦</span> Top pick
    </span>
  );
}

const STATUS_LABEL = {
  reserved: "Ready for pickup",
  picked_up: "Borrowed",
  returned: "Returned",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({ status, daysLeft }) {
  const tone = status === "reserved" ? "badge-ready" : status === "picked_up" ? "badge-loan" : "badge-done";
  return (
    <span className={`badge ${tone}`}>
      {STATUS_LABEL[status] ?? status}
      {status === "reserved" && daysLeft != null && `, ${daysLeft}d left`}
    </span>
  );
}

export function Pagination({ basePath, params, page, hasNext }) {
  const href = (p) => {
    const sp = new URLSearchParams(params);
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  if (page <= 1 && !hasNext) return null;
  return (
    <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-2 text-sm">
      {page > 1 ? <Link href={href(page - 1)} transitionTypes={BACK} className="btn btn-sm" rel="prev">Previous page</Link> : <span />}
      <span className="text-muted">Page {page}</span>
      {hasNext ? <Link href={href(page + 1)} transitionTypes={FORWARD} className="btn btn-sm" rel="next">Next page</Link> : <span />}
    </nav>
  );
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export const inputClass = "field";
export const buttonClass = "btn btn-primary";
