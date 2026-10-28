import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";

// Better Auth stores roles as "admin", "user,admin" or an array.
function hasAdminRole(role) {
  return String(role ?? "")
    .split(",")
    .map((r) => r.trim())
    .includes("admin");
}

// Current user or null. Cached per request, so calling it from several
// components costs one session read.
export const getUser = cache(async () => {
  // Wait for a real request. Without this the session lookup also runs during
  // prerender/prefetch passes, where Next cancels it (logged as an error by
  // neon-auth) and the auth server gets called for every prefetch.
  await connection();
  const { data } = await getAuth().getSession();
  const u = data?.user;
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, isAdmin: hasAdminRole(u.role) };
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}
