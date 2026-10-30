// Shared by the generator and client components, so the browser never loads the generator.
export const MAX_EDITION = 9999;
export const MAX_INVENTED_SEED = 2 ** 31 - 1;

// Parse a positive integer route param within bounds, or null. Rejects "01", "1e3", "-1".
export function parseRouteInt(value, max) {
  if (!/^[1-9]\d{0,9}$/.test(String(value))) return null;
  const n = Number(value);
  return n <= max ? n : null;
}
