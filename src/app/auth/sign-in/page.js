import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Sign in · Library" };

export default function SignInPage() {
  return (
    <>
      <PageTitle>Sign in</PageTitle>
      <AuthForm action={signInAction} mode="sign-in" />
      <p className="mt-6 text-sm text-zinc-500">
        No account? <Link href="/auth/sign-up" className="underline">Register</Link>
      </p>
    </>
  );
}
