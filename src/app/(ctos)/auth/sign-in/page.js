import Link from "next/link";
import { signInAction } from "@/app/(ctos)/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { ObservationPanel } from "@/components/observation";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="ctos-gate">
      <section className="ctos-panel ctos-gate-main" aria-labelledby="gate-heading">
        <ol className="ctos-boot" aria-hidden="true">
          <li>ctOS identity gateway</li>
          <li>Library node connected</li>
          <li>Awaiting credentials</li>
        </ol>
        <h1 id="gate-heading" className="ctos-title">Identify yourself</h1>
        <p className="ctos-lede">Sign in to manage your loans and reading access. Each sign-in starts a session that ctOS records and you can review in the account console.</p>
        <AuthForm action={signInAction} mode="sign-in" />
        <p className="ctos-switch">No account yet? <Link href="/auth/sign-up">Register</Link></p>
      </section>
      <ObservationPanel />
    </div>
  );
}
