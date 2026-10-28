import test from "node:test";
import assert from "node:assert/strict";
import { getDatabaseUrl, getAuthConfig } from "../src/lib/env.mjs";

const PG = "postgresql://user:s3cretpw@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const GOOD_SECRET = "x".repeat(32);

function withEnv(env, fn) {
  const saved = { ...process.env };
  for (const k of ["DATABASE_URL", "NEON_AUTH_BASE_URL", "NEON_AUTH_COOKIE_SECRET"]) delete process.env[k];
  Object.assign(process.env, env);
  try {
    return fn();
  } finally {
    process.env = saved;
  }
}

test("DATABASE_URL: missing, wrong scheme, ok", () => {
  withEnv({}, () => assert.throws(getDatabaseUrl, /DATABASE_URL is not set/));
  withEnv({ DATABASE_URL: "https://example.com" }, () => assert.throws(getDatabaseUrl, /Postgres connection string/));
  withEnv({ DATABASE_URL: PG }, () => assert.equal(getDatabaseUrl(), PG));
});

test("NEON_AUTH_BASE_URL set to the Postgres URL gives a clear error without leaking it", () => {
  withEnv({ NEON_AUTH_BASE_URL: PG, NEON_AUTH_COOKIE_SECRET: GOOD_SECRET }, () => {
    assert.throws(getAuthConfig, (err) => {
      assert.match(err.message, /Postgres connection string/);
      assert.ok(!err.message.includes("s3cretpw") && !err.message.includes("user:"), "error leaked the value");
      return true;
    });
  });
});

test("NEON_AUTH_BASE_URL: invalid, credentials, http", () => {
  const base = { NEON_AUTH_COOKIE_SECRET: GOOD_SECRET };
  withEnv({ ...base, NEON_AUTH_BASE_URL: "not a url" }, () => assert.throws(getAuthConfig, /not a valid URL/));
  withEnv({ ...base, NEON_AUTH_BASE_URL: "https://u:p@example.com/auth" }, () => assert.throws(getAuthConfig, /username or password/));
  withEnv({ ...base, NEON_AUTH_BASE_URL: "http://example.com/auth" }, () => assert.throws(getAuthConfig, /https/));
  withEnv({ ...base, NEON_AUTH_BASE_URL: "http://localhost:3000/auth" }, () => assert.ok(getAuthConfig()));
});

test("NEON_AUTH_COOKIE_SECRET: missing and too short", () => {
  const base = { NEON_AUTH_BASE_URL: "https://auth.example.com/db/auth" };
  withEnv(base, () => assert.throws(getAuthConfig, /NEON_AUTH_COOKIE_SECRET is not set/));
  withEnv({ ...base, NEON_AUTH_COOKIE_SECRET: "short" }, () => assert.throws(getAuthConfig, /at least 32/));
});

test("valid auth config", () => {
  withEnv({ NEON_AUTH_BASE_URL: "https://auth.example.com/db/auth", NEON_AUTH_COOKIE_SECRET: GOOD_SECRET }, () => {
    assert.deepEqual(getAuthConfig(), {
      baseUrl: "https://auth.example.com/db/auth",
      cookies: { secret: GOOD_SECRET },
    });
  });
});
