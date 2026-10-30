import Link from "next/link";
import { LibraryFrame } from "@/components/library-chrome";

export const metadata = { title: "Not on the shelf · Library" };

// Root 404 sits outside the route groups, so it brings its own frame.
export default function NotFound() {
  return (
    <LibraryFrame>
      <section className="not-found" aria-labelledby="not-found-heading">
        <div className="empty-shelf" aria-hidden="true">
          <span className="empty-shelf-bookend" />
          <span className="empty-shelf-fallen" />
          <span className="empty-shelf-bookend empty-shelf-bookend-right" />
        </div>
        <h1 id="not-found-heading" className="page-heading">This page isn&apos;t on the shelf</h1>
        <p>It may have been moved, renamed or never catalogued. Search the catalogue or head back to where you were.</p>
        <Link href="/" className="btn btn-primary">Search the catalogue</Link>
      </section>
    </LibraryFrame>
  );
}
