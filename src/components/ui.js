import Link from "next/link";

export function PageTitle({ children, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
      ))}
    </div>
  );
}

export function Availability({ available, total }) {
  const n = Math.max(0, available);
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        n > 0
          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {n > 0 ? `${n} of ${total} available` : "None available"}
    </span>
  );
}

export function TopPickBadge() {
  return (
    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300">
      Top pick
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
  const tone =
    status === "reserved"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
      : status === "picked_up"
        ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300"
        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
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
    <nav className="mt-6 flex justify-between text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="underline">← Previous</Link> : <span />}
      {hasNext && <Link href={href(page + 1)} className="underline">Next →</Link>}
    </nav>
  );
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";
export const buttonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
