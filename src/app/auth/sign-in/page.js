import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Sign in · ctOS" };

export default function SignInPage() {
  return (
    <div className="ctos-auth">
      <p className="ctos-eyebrow">ctOS Surveillance / Identity gateway</p>
      <PageTitle>Sign in</PageTitle>
      <AuthForm action={signInAction} mode="sign-in" />
      <p className="mt-6 text-sm text-muted">
        No account? <Link href="/auth/sign-up" className="link">Register</Link>
      </p>
    </div>
  );
}
