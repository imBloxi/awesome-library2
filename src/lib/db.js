import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/env.mjs";

// One HTTP-based client per server instance. Created lazily so builds
// don't need DATABASE_URL.
let client;

export function db() {
  client ??= neon(getDatabaseUrl());
  return client;
}
