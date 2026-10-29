import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { listUsers } from "@/lib/queries/users";
import { makeAdminAction, removeAdminAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/action-button";
import { SearchForm } from "@/components/search-form";
import { PageTitle, Skeleton, Pagination } from "@/components/ui";
import { parseSearchParams } from "@/lib/search-params.mjs";

export default function AdminUsersPage({ searchParams }) {
  return (
    <>
      <PageTitle>Users</PageTitle>
      <Suspense fallback={<><SearchForm action="/admin/users" placeholder="Search by name or email" /><Skeleton /></>}>
        <UserTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UserTable({ searchParams }) {
  const me = await requireAdmin();
  const { q, page } = parseSearchParams(await searchParams);
  const { users, hasNext } = await listUsers({ q, page });

  return (
    <>
      <SearchForm action="/admin/users" q={q} placeholder="Search by name or email" />
      {users.length === 0 ? (
        <p className="text-muted">No users found.</p>
      ) : (
        <ul className="divide-y divide-line">
          {users.map((u) => {
            const isAdmin = String(u.role ?? "").split(",").map((r) => r.trim()).includes("admin");
            const isMe = String(u.id) === String(me.id);
            return (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {u.name || u.email}
                    {isMe && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {u.email} · {u.active_count} active reservation{u.active_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${isAdmin ? "bg-[#eef2ff] text-accent" : "bg-subtle text-muted"}`}
                  >
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                  {!isMe &&
                    (isAdmin ? (
                      <ActionButton action={removeAdminAction} id={u.id} label="Remove admin" pendingLabel="Saving…" variant="danger" confirm={`Remove admin access for ${u.email}?`} />
                    ) : (
                      <ActionButton action={makeAdminAction} id={u.id} label="Make admin" pendingLabel="Saving…" confirm={`Give ${u.email} admin access?`} />
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination basePath="/admin/users" params={q ? { q } : {}} page={page} hasNext={hasNext} />
    </>
  );
}
