import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <>
      <nav aria-label="Admin" className="mb-6 flex flex-wrap gap-1.5 border-b-2 border-shadow pb-2">
        <Link href="/admin" className="btn btn-sm">Overview</Link>
        <Link href="/admin/books" className="btn btn-sm">Books</Link>
        <Link href="/admin/reservations" className="btn btn-sm">Reservations</Link>
        <Link href="/admin/users" className="btn btn-sm">Users</Link>
      </nav>
      {children}
    </>
  );
}
