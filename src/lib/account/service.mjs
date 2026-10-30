import { z } from "zod";

const profileSchema = z.object({ name: z.string().trim().min(1, "Enter a display name.").max(100, "Use 100 characters or fewer.").refine((value) => !/[\u0000-\u001f\u007f]/u.test(value), "Remove control characters from your name.") });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  newPassword: z.string().min(12, "Use at least 12 characters for your new password.").max(128, "Use 128 characters or fewer."),
  confirmPassword: z.string(),
}).refine((v) => v.newPassword === v.confirmPassword, "New passwords must match.")
  .refine((v) => v.newPassword !== v.currentPassword, "Choose a different password.");

// Only these allowlisted fields reach a browser. A session token is a credential,
// even when Neon returns it in listSessions; resolve it only during server actions.
function deviceLabel(agent = "") {
  const text = String(agent).slice(0, 512);
  const browser = /Edg\//.test(text) ? "Edge" : /Firefox\//.test(text) ? "Firefox" : /Chrome\//.test(text) ? "Chrome" : /Safari\//.test(text) ? "Safari" : "Browser";
  const platform = /Android/.test(text) ? "Android" : /iPhone|iPad/.test(text) ? "iOS" : /Windows/.test(text) ? "Windows" : /Macintosh|Mac OS/.test(text) ? "macOS" : /Linux/.test(text) ? "Linux" : "unknown device";
  return `${browser} on ${platform}`;
}
function date(value) {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
async function ownedSessions(auth, identity) {
  if (!identity?.user?.id || !identity?.session?.id) throw new Error("No session");
  const result = await auth.listSessions();
  if (result.error?.code === "SESSION_NOT_FRESH") throw new Error("reauthenticate");
  if (result.error || !Array.isArray(result.data)) throw new Error("Sessions unavailable");
  return result.data.filter((s) => s.userId === identity.user.id && typeof s.id === "string" && new Date(s.expiresAt).getTime() > Date.now());
}
export async function accountSessions(auth, identity) {
  try {
    const rows = await ownedSessions(auth, identity);
    return { sessions: rows.map((s) => ({ id: s.id, current: s.id === identity.session.id, device: deviceLabel(s.userAgent), createdAt: date(s.createdAt), expiresAt: date(s.expiresAt) })) };
  } catch (error) {
    return { sessions: [], error: error.message === "reauthenticate" ? "For session controls, sign out and sign in again to confirm your identity." : "Session information is unavailable. Please try again." };
  }
}
export async function updateProfile(auth, values) {
  const result = profileSchema.safeParse(values);
  if (!result.success) return { error: result.error.issues[0].message };
  try {
    const response = await auth.updateUser(result.data);
    if (response.error || !response.data) throw new Error("Update failed");
    return { message: "Display name updated." };
  } catch {
    return { error: "Could not update your profile. Please try again." };
  }
}
export async function changePassword(auth, values) {
  const result = passwordSchema.safeParse(values);
  if (!result.success) return { error: result.error.issues[0].message };
  try {
    const { currentPassword, newPassword } = result.data;
    const response = await auth.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    if (response.error || !response.data) throw new Error("Password change failed");
    return { message: "Password changed. Other sessions have been signed out." };
  } catch {
    return { error: "Could not change your password. Check your current password and try again." };
  }
}
export async function revokeAccountSession(auth, identity, id) {
  if (typeof id !== "string" || !id || id.length > 200 || id === identity?.session?.id) return { error: "Choose another active session." };
  try {
    const target = (await ownedSessions(auth, identity)).find((s) => s.id === id);
    if (!target || typeof target.token !== "string" || !target.token) return { error: "That session is no longer available." };
    const result = await auth.revokeSession({ token: target.token });
    if (result.error || result.data?.status !== true) throw new Error("Revoke failed");
    return { message: "Session signed out." };
  } catch {
    return { error: "Could not sign out that session. Please try again." };
  }
}
export async function revokeOtherAccountSessions(auth, identity) {
  try {
    const rows = (await ownedSessions(auth, identity)).filter((s) => s.id !== identity.session.id);
    // Resolve every token from the provider; never accept tokens or user IDs from a form.
    for (const row of rows) {
      if (typeof row.token !== "string" || !row.token) throw new Error("Missing token");
      const result = await auth.revokeSession({ token: row.token });
      if (result.error || result.data?.status !== true) throw new Error("Revoke failed");
    }
    return { message: rows.length ? "Other listed sessions have been signed out." : "No other active sessions." };
  } catch {
    return { error: "Some sessions could not be signed out. Refresh the list and try again." };
  }
}
