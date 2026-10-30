"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";

const signInSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

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
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const keep = { name: formData.get("name"), email: formData.get("email") };
  if (!parsed.success) return { error: firstIssue(parsed), ...keep };

  const { error } = await getAuth().signUp.email(parsed.data);
  if (error) return { error: error.message || "Could not create the account.", ...keep };
  redirect("/");
}
