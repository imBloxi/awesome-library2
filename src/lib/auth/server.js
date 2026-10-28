import { createNeonAuth } from "@neondatabase/auth/next/server";

// Created on first use so `next build` works without the auth env vars.
let instance;

export function getAuth() {
  instance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET },
  });
  return instance;
}
