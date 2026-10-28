import { cache } from "react";
import { cookies } from "next/headers";
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
  await cookies(); // marks this as request-time before touching the auth client
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
