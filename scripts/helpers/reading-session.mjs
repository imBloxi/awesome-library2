// Test-only identity boundary. Authorization below this boundary uses real SQL.
export let currentUser = null;
export const getUser = async () => currentUser;
export function setUser(user) { currentUser = user; }
