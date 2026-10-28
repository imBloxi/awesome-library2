import { Suspense } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getUser } from "@/lib/dal";
import { signOutAction } from "@/app/actions";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
        <Link href="/auth/sign-in" className="hover:underline">Sign in</Link>
        <Link href="/auth/sign-up" className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
          Register
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/reservations" className="hover:underline">My reservations</Link>
      {user.isAdmin && <Link href="/admin" className="hover:underline">Admin</Link>}
      <form action={signOutAction}>
        <button type="submit" className="text-zinc-500 hover:underline" title={user.email}>Sign out</button>
      </form>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">Library</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Suspense fallback={<span className="h-5 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
