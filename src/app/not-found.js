import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ui mx-auto my-8 max-w-md bg-silver bevel-out">
      <div className="titlebar px-2 py-1 text-sm">Error</div>
      <div className="flex gap-4 p-4">
        <span aria-hidden="true" className="text-4xl">⚠️</span>
        <div className="flex flex-col gap-3 text-sm">
          <h1 className="text-base font-bold">404: Page not found</h1>
          <p>This page has been checked out and never returned. It may have been moved or deleted.</p>
          <p><Link href="/" className="btn btn-primary">OK</Link></p>
        </div>
      </div>
    </div>
  );
}
