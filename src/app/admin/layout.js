import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <>
      <nav className="mb-8 flex gap-4 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800">
        <Link href="/admin" className="hover:underline">Overview</Link>
        <Link href="/admin/books" className="hover:underline">Books</Link>
        <Link href="/admin/reservations" className="hover:underline">Reservations</Link>
        <Link href="/admin/users" className="hover:underline">Users</Link>
      </nav>
      {children}
    </>
  );
}
