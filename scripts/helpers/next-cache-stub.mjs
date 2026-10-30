// Plain-Node stand-in for next/cache in DB tests. Query modules tag cached reads;
// outside Next there is no cache, so these are no-ops and every read hits the database.
export const cacheTag = () => {};
export const cacheLife = () => {};
export const updateTag = () => {};
export const refresh = () => {};
