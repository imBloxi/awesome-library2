import { Suspense } from "react";
import { Literata } from "next/font/google";
import { MotionController } from "@/components/motion";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion-prefs.mjs";
import "./globals.css";

// One variable serif for titles, covers and reading. Interface text stays on system fonts.
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata = {
  title: "Library",
  description: "Search, reserve and pick up books from your local library.",
};

// Each route group draws its own chrome: (library) the bindery, (ctos) the account system.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${literata.variable}`} data-fx="full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <MotionController />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
