import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <>
      <nav aria-label="Admin" className="mb-6 flex flex-wrap gap-1.5 border-b border-line pb-3">
        <Link href="/admin" className="btn btn-ghost btn-sm">Overview</Link>
        <Link href="/admin/books" className="btn btn-ghost btn-sm">Books</Link>
        <Link href="/admin/reservations" className="btn btn-ghost btn-sm">Reservations</Link>
        <Link href="/admin/users" className="btn btn-ghost btn-sm">Users</Link>
      </nav>
      {children}
    </>
  );
}
