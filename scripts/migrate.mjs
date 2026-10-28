// Applies db/migrations/*.sql in order, once each. Usage: node --env-file=.env.local scripts/migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())"
  );
  const dir = new URL("../db/migrations/", import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const name of files) {
    const { rowCount } = await client.query("select 1 from schema_migrations where name = $1", [name]);
    if (rowCount) continue;
    const sqlText = await readFile(new URL(name, dir), "utf8");
    await client.query("begin");
    try {
      await client.query(sqlText);
      await client.query("insert into schema_migrations (name) values ($1)", [name]);
      await client.query("commit");
      console.log(`applied ${name}`);
    } catch (err) {
      await client.query("rollback");
      throw new Error(`${name} failed: ${err.message}`);
    }
  }
  console.log("migrations up to date");
} finally {
  await client.end();
}
