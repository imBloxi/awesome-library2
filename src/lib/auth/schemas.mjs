import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

// "terms" is the checkbox on the register form. It is checked here, then dropped
// before anything is sent to the auth provider.
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  terms: z.literal("on", { error: "Accept the Terms of service to create an account." }),
});

export function signUpPayload(formData) {
  const parsed = signUpSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { terms: _accepted, ...account } = parsed.data;
  return { account };
}
