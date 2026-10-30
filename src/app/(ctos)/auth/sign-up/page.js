import Link from "next/link";
import { signUpAction } from "@/app/(ctos)/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { ObservationPanel } from "@/components/observation";

export const metadata = { title: "Register" };

export default function SignUpPage() {
  return (
    <div className="ctos-gate">
      <section className="ctos-panel ctos-gate-main" aria-labelledby="gate-heading">
        <ol className="ctos-boot" aria-hidden="true">
          <li>ctOS identity gateway</li>
          <li>Library node connected</li>
          <li>New subject registration</li>
        </ol>
        <h1 id="gate-heading" className="ctos-title">Open a ctOS file</h1>
        <p className="ctos-lede">
          Your library account is a ctOS profile. From your first reservation, it records what you borrow, when, and every session you open.
          You can review all of it in the account console.
        </p>
        <AuthForm action={signUpAction} mode="sign-up" />
        <p className="ctos-switch">Already registered? <Link href="/auth/sign-in">Sign in</Link></p>
      </section>
      <ObservationPanel title="Observed before you register" />
    </div>
  );
}
