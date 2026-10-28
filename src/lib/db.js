import { neon } from "@neondatabase/serverless";

// One HTTP-based client per server instance. Created lazily so builds
// don't need DATABASE_URL.
let client;

export function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}
