import { getAuth } from "@/lib/auth/server";

// Redirects logged-out visitors away from private pages early.
// Real access checks happen in src/lib/dal.js on every page and action.
let middleware;

export default function proxy(request) {
  middleware ??= getAuth().middleware({ loginUrl: "/auth/sign-in" });
  return middleware(request);
}

export const config = {
  matcher: ["/reservations/:path*", "/admin/:path*"],
};
