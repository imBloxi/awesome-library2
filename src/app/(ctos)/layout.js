import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import { MotionSwitch } from "@/components/motion";
import "./ctos.css";

// ctOS runs accounts, sign-in and the legal record. It is a separate system from the
// library's own interface, with its own type, colour and chrome.
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-ctos",
  display: "swap",
});

export const metadata = {
  title: { template: "%s · ctOS", default: "ctOS identity services" },
  robots: { index: false, follow: false },
};

export default function CtosLayout({ children }) {
  return (
    <div className={`ctos ${mono.variable}`}>
      <a href="#main" className="ctos-skip">Skip to content</a>
      <div className="ctos-scan" aria-hidden="true" />
      <header className="ctos-bar">
        <Link href="/" className="ctos-exit">Exit to Library</Link>
        <Link href="/account" className="ctos-logo" aria-label="ctOS account console">
          ctOS<span className="ctos-caret" aria-hidden="true">_</span>
        </Link>
        <p className="ctos-status">
          <span className="ctos-status-dot" aria-hidden="true" />
          Identity services <span className="ctos-status-sep" aria-hidden="true">/</span> Session monitored
        </p>
      </header>
      <main id="main" className="ctos-main">{children}</main>
      <footer className="ctos-foot">
        <nav aria-label="ctOS records" className="ctos-foot-links">
          <Link href="/legal/terms">Terms of service</Link>
          <Link href="/legal/privacy">Privacy policy</Link>
          <Link href="/account">Account console</Link>
        </nav>
        <MotionSwitch />
      </footer>
    </div>
  );
}
