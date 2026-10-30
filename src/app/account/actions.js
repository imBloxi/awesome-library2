"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { getAuth } from "@/lib/auth/server";
import { updateProfile, changePassword, revokeAccountSession, revokeOtherAccountSessions } from "@/lib/account/service.mjs";

async function identity() {
  const current = await getSession();
  if (!current) redirect("/auth/sign-in");
  return current;
}
function finish(result) {
  revalidatePath("/", "layout");
  return result;
}
export async function updateProfileAction(_prev, formData) {
  await identity();
  return finish(await updateProfile(getAuth(), { name: formData.get("name") }));
}
export async function changePasswordAction(_prev, formData) {
  await identity();
  return finish(await changePassword(getAuth(), {
    currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword"), confirmPassword: formData.get("confirmPassword"),
  }));
}
export async function revokeSessionAction(_prev, formData) {
  const current = await identity();
  return finish(await revokeAccountSession(getAuth(), current, formData.get("sessionId")));
}
export async function revokeOtherSessionsAction() {
  const current = await identity();
  return finish(await revokeOtherAccountSessions(getAuth(), current));
}
