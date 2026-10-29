import Form from "next/form";

// Plain GET form: works without JS, and next/form makes it a client-side navigation.
export function SearchForm({ action, q = "", placeholder = "Title, author or ISBN", children }) {
  return (
    <Form action={action} role="search" className="mb-6 flex flex-wrap items-center gap-2">
      {/* display: contents keeps the label's children in the flex row; no id needed. */}
      <label className="contents">
        <span className="ui text-sm font-bold">Search:</span>
        <input name="q" type="search" defaultValue={q} placeholder={placeholder} className="field min-w-0 flex-1" />
      </label>
      {children}
      <button type="submit" className="btn btn-primary">Search</button>
    </Form>
  );
}
