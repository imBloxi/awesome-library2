import Form from "next/form";

// Plain GET form: works without JS, and next/form makes it a client-side navigation.
export function SearchForm({ action, q = "", placeholder = "Search by title, author or ISBN", children }) {
  return (
    <Form action={action} role="search" className="mb-10 flex flex-wrap items-center gap-2">
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} aria-label="Search" className="field min-w-0 flex-1" />
      {children}
      <button type="submit" className="btn btn-primary py-[0.6rem]">Search</button>
    </Form>
  );
}
