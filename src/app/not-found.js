import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto my-16 max-w-md text-center">
      <p className="eyebrow mb-2">404</p>
      <h1 className="mb-3 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mb-6 text-muted">This page may have been moved or deleted.</p>
      <Link href="/" className="btn btn-primary">Back to the catalog</Link>
    </div>
  );
}
