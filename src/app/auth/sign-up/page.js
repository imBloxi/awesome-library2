import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Register · Library" };

export default function SignUpPage() {
  return (
    <>
      <PageTitle>Create an account</PageTitle>
      <AuthForm action={signUpAction} mode="sign-up" />
      <p className="mt-6 text-sm text-muted">
        Already registered? <Link href="/auth/sign-in" className="link">Sign in</Link>
      </p>
    </>
  );
}
