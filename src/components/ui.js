import Link from "next/link";

export function PageTitle({ children, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-2 border-navy pb-1">
      <h1 className="text-3xl font-bold text-navy">{children}</h1>
      {action}
    </div>
  );
}

// Win95-style progress dialog. Reserves roughly the space the content will take.
export function Skeleton({ rows = 5 }) {
  return (
    <div aria-busy="true" style={{ minHeight: `${rows * 2.5}rem` }}>
      <div className="ui inline-flex flex-col gap-2 bg-silver p-3 bevel-out" role="status">
        <span className="text-sm">⏳ Loading… please wait</span>
        <span className="block h-4 w-56 bg-white bevel-in p-[2px]">
          <span className="progress-blocks block h-full" />
        </span>
      </div>
    </div>
  );
}

// short: for narrow spots like the cover shelf ("● 2 of 3" instead of "● 2 of 3 available").
export function Availability({ available, total, short = false }) {
  const n = Math.max(0, available);
  return n > 0 ? (
    <span className="ui whitespace-nowrap text-sm font-bold text-ok" title={`${n} of ${total} available`}>
      ● {n} of {total}{short ? "" : " available"}
    </span>
  ) : (
    <span className="ui whitespace-nowrap text-sm text-bad">○ {short ? "All out" : "None available"}</span>
  );
}

export function TopPickBadge() {
  return <span className="ui blink whitespace-nowrap text-xs font-bold text-[#ff0000]" title="This week's top pick">NEW!</span>;
}

const STATUS_LABEL = {
  reserved: "Ready for pickup",
  picked_up: "Borrowed",
  returned: "Returned",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({ status, daysLeft }) {
  const tone = status === "reserved" ? "bg-paper" : status === "picked_up" ? "bg-[#dde8ff]" : "bg-silver";
  return (
    <span className={`ui bevel-in whitespace-nowrap px-1.5 py-0.5 text-xs ${tone}`}>
      {STATUS_LABEL[status] ?? status}
      {status === "reserved" && daysLeft != null && ` · ${daysLeft}d left`}
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
    <nav aria-label="Pages" className="ui mt-6 flex items-center justify-between gap-2 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="btn btn-sm" rel="prev">« Previous</Link> : <span />}
      <span className="text-muted">Page {page}</span>
      {hasNext ? <Link href={href(page + 1)} className="btn btn-sm" rel="next">Next »</Link> : <span />}
    </nav>
  );
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export const inputClass = "field";
export const buttonClass = "btn btn-primary";
