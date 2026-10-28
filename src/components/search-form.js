import Form from "next/form";
import { inputClass, buttonClass } from "@/components/ui";

// Plain GET form: works without JS, and next/form makes it a client-side navigation.
export function SearchForm({ action, q = "", placeholder = "Search by title, author or ISBN", children }) {
  return (
    <Form action={action} className="mb-6 flex flex-wrap gap-2">
      <input name="q" defaultValue={q} placeholder={placeholder} className={`${inputClass} min-w-0 flex-1`} aria-label="Search" />
      {children}
      <button type="submit" className={buttonClass}>Search</button>
    </Form>
  );
}
