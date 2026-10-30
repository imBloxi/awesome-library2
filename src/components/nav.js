import { Suspense } from "react";
import Link from "next/link";
import { ActiveNavLink } from "@/components/nav-link";

// The active state needs the URL, which is request data; the plain link is the static fallback.
export function NavLink({ href, className = "", children, also, ...rest }) {
  return (
    <Suspense fallback={<Link href={href} className={`nav-link ${className}`} {...rest}>{children}</Link>}>
      <ActiveNavLink href={href} className={className} also={also} {...rest}>{children}</ActiveNavLink>
    </Suspense>
  );
}
