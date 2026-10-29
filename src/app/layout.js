import { Suspense } from "react";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { signOutAction } from "@/app/actions";
import "./globals.css";

export const metadata = {
  title: "Library",
  description: "Search, reserve and pick up books from your local library.",
};

// Reads the session, so it streams in after the static frame.
async function UserNav() {
  const user = await getUser();
  if (!user) {
    return (
      <>
        <Link href="/auth/sign-in" className="btn btn-sm">Sign in</Link>
        <Link href="/auth/sign-up" className="btn btn-sm btn-primary">Register</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/reservations" className="btn btn-sm">My reservations</Link>
      {user.isAdmin && <Link href="/admin" className="btn btn-sm">Admin</Link>}
      <form action={signOutAction}>
        <button type="submit" className="btn btn-sm" title={user.email}>Sign out</button>
      </form>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col p-2 sm:p-6">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:bg-white focus:p-2">
          Skip to content
        </a>
        <div className="window bevel-out mx-auto flex w-full max-w-5xl flex-1 flex-col p-[3px]">
          <header>
            <div className="titlebar flex items-center justify-between gap-2 px-1.5 py-[3px] text-sm">
              <Link href="/" className="truncate">📚 The Library — Online Catalogue</Link>
              <span className="flex shrink-0 gap-[2px]" aria-hidden="true">
                <span className="titlebar-btn bevel-out">_</span>
                <span className="titlebar-btn bevel-out">□</span>
                <span className="titlebar-btn bevel-out">×</span>
              </span>
            </div>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-1.5 px-1 py-1.5">
              <Link href="/" className="btn btn-sm">🏠 Catalog</Link>
              <span className="ml-auto flex flex-wrap items-center gap-1.5">
                <Suspense fallback={<span className="ui px-2 text-sm text-muted">Connecting…</span>}>
                  <UserNav />
                </Suspense>
              </span>
            </nav>
          </header>
          <main id="main" className="bevel-in flex-1 bg-white px-4 py-5 sm:px-8 sm:py-7">{children}</main>
          <footer className="ui mt-[3px] flex flex-wrap gap-[3px] text-xs">
            <span className="bevel-in flex-1 px-2 py-0.5">Document: Done</span>
            <span className="bevel-in px-2 py-0.5">Best viewed in Netscape Navigator 4.0 at 800×600</span>
            <span className="bevel-in px-2 py-0.5">© 1997–2026</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
