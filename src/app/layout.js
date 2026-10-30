import { Suspense } from "react";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { getMemberNotices } from "@/lib/queries/reservations";
import { signOutAction } from "@/app/actions";
import "./globals.css";

export const metadata = {
  title: "ctOS · Library network",
  description: "ctOS library network. Discover books, manage your loans, and enter the reading archive.",
};

// Reads the session, so it streams in after the static header.
async function UserNav() {
  const user = await getUser();
  if (!user) {
    return (
      <>
        <Link href="/auth/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
        <Link href="/auth/sign-up" className="btn btn-primary btn-sm">Register</Link>
      </>
    );
  }
  const notices = await getMemberNotices(user.id);
  const alerts = notices.overdue + notices.expiring + notices.ready;
  return (
    <>
      <Link href="/reservations" className="btn btn-ghost btn-sm">
        My library
        {alerts > 0 && (
          <span className={`rounded-full px-1.5 text-xs font-semibold text-white ${notices.overdue ? "bg-bad" : "bg-accent"}`}>
            {alerts}
            <span className="sr-only"> {alerts === 1 ? "item needs" : "items need"} attention</span>
          </span>
        )}
      </Link>
      <Link href="/account" className="btn btn-ghost btn-sm">Account</Link>
      {user.isAdmin && <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
      <form action={signOutAction}>
        <button type="submit" className="btn btn-ghost btn-sm" title={user.email}>Sign out</button>
      </form>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow">
          Skip to content
        </a>
        <header className="ctos-masthead">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="ctos-brand" aria-label="ctOS Surveillance library home"><span>ctOS<span className="ctos-brand-mark" aria-hidden="true">_</span></span><small>SURVEILLANCE / LIBRARY NETWORK</small></Link>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
              <Link href="/" className="btn btn-ghost btn-sm">Catalogue</Link>
              <Link href="/babel" className="btn btn-ghost btn-sm">Babel</Link>
              <Suspense fallback={<span className="h-8 w-32" />}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
            <span className="font-mono">ctOS / Library network</span><span className="mx-3" aria-hidden="true">·</span>Holds last 7 days · Up to 10 books at a time
          </div>
        </footer>
      </body>
    </html>
  );
}
