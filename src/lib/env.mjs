// Reads and checks environment variables. Error messages name the variable
// and what is wrong, but never include its value (these values are secrets and
// error messages end up in logs).

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it in .env.local, or in Vercel > Settings > Environment Variables with the Production target ticked.`);
  }
  return value;
}

const POSTGRES_URL = /^postgres(ql)?:\/\//i;

// The Neon integration on Vercel sets DATABASE_URL (pooled) and
// DATABASE_URL_UNPOOLED. The unpooled one also works with the HTTP driver, so
// fall back to it when only that one is present on a target.
export function getDatabaseUrl() {
  const name = process.env.DATABASE_URL?.trim() || !process.env.DATABASE_URL_UNPOOLED?.trim() ? "DATABASE_URL" : "DATABASE_URL_UNPOOLED";
  const url = required(name);
  if (!POSTGRES_URL.test(url)) {
    throw new Error(`${name} must be a Postgres connection string (postgres://...).`);
  }
  return url;
}

export function getAuthConfig() {
  const baseUrl = required("NEON_AUTH_BASE_URL");

  if (POSTGRES_URL.test(baseUrl)) {
    throw new Error(
      "NEON_AUTH_BASE_URL is set to a Postgres connection string. It must be the Auth URL (https://...) from Neon Console > Auth. " +
        "If that connection string was logged, reset the database password in Neon."
    );
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("NEON_AUTH_BASE_URL is not a valid URL. Copy the Auth URL from Neon Console > Auth.");
  }
  if (url.username || url.password) {
    throw new Error("NEON_AUTH_BASE_URL must not contain a username or password.");
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new Error("NEON_AUTH_BASE_URL must start with https://.");
  }

  const secret = required("NEON_AUTH_COOKIE_SECRET");
  if (secret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32");
  }

  return { baseUrl, cookies: { secret } };
}
