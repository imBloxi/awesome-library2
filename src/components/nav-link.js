"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

function isActive(pathname, href, also = []) {
  return [href, ...also].some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}

// Header link. The current section carries a gilt ribbon; because the ribbon has one shared
// view-transition name, it slides from the old section to the new one when you navigate.
export function ActiveNavLink({ href, also, className = "", children, ...rest }) {
  const pathname = usePathname() ?? "";
  const active = isActive(pathname, href, also);
  return (
    <Link href={href} className={`nav-link ${className}`} aria-current={active ? "page" : undefined} {...rest}>
      {children}
      {active && (
        <ViewTransition name="nav-ribbon" share="nav-ribbon" default="none">
          <span className="nav-ribbon" aria-hidden="true" />
        </ViewTransition>
      )}
    </Link>
  );
}
