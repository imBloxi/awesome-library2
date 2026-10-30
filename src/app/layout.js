import { Suspense } from "react";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { signOutAction } from "@/app/actions";
import "./globals.css";

export const metadata = {
  title: "Library",
  description: "Search, reserve and pick up books from your local library.",
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
  return (
    <>
      <Link href="/reservations" className="btn btn-ghost btn-sm">My reservations</Link>
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
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">Library</Link>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
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
            Holds last 7 days · Up to 10 books at a time
          </div>
        </footer>
      </body>
    </html>
  );
}
