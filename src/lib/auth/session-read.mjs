import { createAuthServer, extractNeonAuthCookies } from "@neondatabase/auth/server";

// Render-only adapter. The Next SDK's normal adapter writes Set-Cookie headers,
// which is forbidden in Server Components (including cookie deletion on expiry).
// Mutations still use the regular Next adapter; it must retain cookie writes.
export async function readFreshSession(config, headers) {
  const auth = createAuthServer({
    baseUrl: config.baseUrl,
    cookieSecret: config.cookies.secret,
    context: () => ({
      getCookies: () => extractNeonAuthCookies(headers),
      setCookie: () => {},
      getHeader: (name) => headers.get(name),
      getOrigin: () => headers.get("origin") || headers.get("referer")?.split("/").slice(0, 3).join("/") || "",
      getFramework: () => "nextjs",
    }),
  });
  // Strings are required by this SDK's own cache bypass. Avoid refreshing the
  // session in read-only rendering; the Auth handler/proxy owns cookie updates.
  const { data, error } = await auth.getSession({ query: { disableCookieCache: "true", disableRefresh: "true" } });
  if (error || !data?.user?.id || !data?.session?.id || !(new Date(data.session.expiresAt).getTime() > Date.now())) return null;
  return data;
}
