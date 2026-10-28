"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inputClass, buttonClass } from "@/components/ui";

export function BookForm({ action, book = {}, submitLabel }) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = state.values ?? {
    title: book.title ?? "",
    author: book.author ?? "",
    isbn: book.isbn ?? "",
    description: book.description ?? "",
    published_year: book.published_year ?? "",
    total_copies: book.total_copies ?? 1,
  };

  return (
    // key resets the inputs to the submitted values after a failed save
    <form key={JSON.stringify(v)} action={formAction} className="flex max-w-xl flex-col gap-4">
      <Field label="Title"><input name="title" required maxLength={300} defaultValue={v.title} className={inputClass} /></Field>
      <Field label="Author"><input name="author" required maxLength={200} defaultValue={v.author} className={inputClass} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="ISBN"><input name="isbn" maxLength={20} defaultValue={v.isbn} className={inputClass} /></Field>
        <Field label="Year"><input name="published_year" type="number" min={0} max={2100} defaultValue={v.published_year} className={inputClass} /></Field>
        <Field label="Copies"><input name="total_copies" type="number" required min={0} max={1000} defaultValue={v.total_copies} className={inputClass} /></Field>
      </div>
      <Field label="Description">
        <textarea name="description" rows={5} maxLength={5000} defaultValue={v.description} className={inputClass} />
      </Field>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Saving…" : submitLabel}</button>
        <Link href="/admin/books" className="text-sm text-zinc-500 hover:underline">Cancel</Link>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return <label className="flex flex-col gap-1 text-sm">{label}{children}</label>;
}
