import { createNeonAuth } from "@neondatabase/auth/next/server";
import { getAuthConfig } from "@/lib/env.mjs";

// Created on first use so `next build` works without the auth env vars.
let instance;

export function getAuth() {
  instance ??= createNeonAuth(getAuthConfig());
  return instance;
}
