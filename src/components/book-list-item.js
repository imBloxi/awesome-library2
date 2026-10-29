import Link from "next/link";
import { Availability, TopPickBadge } from "@/components/ui";

export function BookListItem({ book: b, showTopPick = false }) {
  return (
    <li>
      <Link href={`/books/${b.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-950">
        <div className="min-w-0">
          <p className="truncate font-medium">{b.title}</p>
          <p className="truncate text-sm text-zinc-500">
            {b.author}
            {b.published_year ? ` · ${b.published_year}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showTopPick && b.is_top_pick && <TopPickBadge />}
          <Availability available={b.available} total={b.total_copies} />
        </div>
      </Link>
    </li>
  );
}
