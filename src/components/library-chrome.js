import { Suspense } from "react";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { getMemberNotices } from "@/lib/queries/reservations";
import { signOutAction } from "@/app/actions";
import { NavLink } from "@/components/nav";
import { MotionSwitch, PointerTilt } from "@/components/motion";

// Three spines that make the wordmark. They shuffle when you point at the logo.
function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Library home">
      <span className="wordmark-spines" aria-hidden="true"><span /><span /><span /></span>
      <span className="wordmark-text">Library</span>
    </Link>
  );
}

// Reads the session, so it streams in after the static header.
async function UserNav() {
  const user = await getUser();
  if (!user) {
    return (
      <>
        <Link href="/auth/sign-in" className="nav-link nav-gateway">Sign in</Link>
        <Link href="/auth/sign-up" className="btn btn-primary btn-sm">Register</Link>
      </>
    );
  }
  const notices = await getMemberNotices(user.id);
  const alerts = notices.overdue + notices.expiring + notices.ready;
  return (
    <>
      <NavLink href="/reservations">
        My library
        {alerts > 0 && (
          <span className={`nav-count ${notices.overdue ? "nav-count-urgent" : ""}`}>
            {alerts}
            <span className="sr-only"> {alerts === 1 ? "item needs" : "items need"} attention</span>
          </span>
        )}
      </NavLink>
      <Link href="/account" className="nav-link nav-gateway">Account</Link>
      {user.isAdmin && <NavLink href="/admin">Admin</NavLink>}
      <form action={signOutAction}>
        <button type="submit" className="nav-link" title={user.email}>Sign out</button>
      </form>
    </>
  );
}

export function LibraryHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Wordmark />
        <nav aria-label="Main" className="site-nav">
          <NavLink href="/" also={["/books"]}>Catalogue</NavLink>
          <NavLink href="/babel">Babel</NavLink>
          <Suspense fallback={<span className="site-nav-placeholder" />}>
            <UserNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

export function LibraryFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>Holds last 7 days. Up to 10 books at a time.</p>
        <nav aria-label="Legal" className="site-footer-links">
          <Link href="/legal/terms">Terms of service</Link>
          <Link href="/legal/privacy">Privacy policy</Link>
        </nav>
        <MotionSwitch />
      </div>
    </footer>
  );
}

export function SkipLink() {
  return <a href="#main" className="skip-link">Skip to content</a>;
}

export function LibraryFrame({ children }) {
  return (
    <div className="bindery">
      <SkipLink />
      <PointerTilt />
      <LibraryHeader />
      <main id="main" className="site-main">{children}</main>
      <LibraryFooter />
    </div>
  );
}
