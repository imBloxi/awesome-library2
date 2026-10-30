"use server";

import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { signInSchema, signUpPayload } from "@/lib/auth/schemas.mjs";

function firstIssue(result) {
  return result.error.issues[0]?.message ?? "Invalid input.";
}

export async function signInAction(_prev, formData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed), email: formData.get("email") };

  const { error } = await getAuth().signIn.email(parsed.data);
  if (error) return { error: "Sign-in failed. Check your email and password, or try again shortly.", email: parsed.data.email };
  redirect("/");
}

export async function signUpAction(_prev, formData) {
  const { account, error: invalid } = signUpPayload(Object.fromEntries(formData));
  const keep = { name: formData.get("name"), email: formData.get("email") };
  if (invalid) return { error: invalid, ...keep };

  const { error } = await getAuth().signUp.email(account);
  if (error) return { error: error.message || "Could not create the account.", ...keep };
  redirect("/");
}
