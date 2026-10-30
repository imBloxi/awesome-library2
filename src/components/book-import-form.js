"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importBooksAction } from "@/app/(library)/admin/actions";

// Upload or paste a CSV, check the preview, then import. Nothing is written until "Import".
export function BookImportForm() {
  const [state, formAction, pending] = useActionState(importBooksAction, {});

  if (state.done) {
    return (
      <div role="status" className="flex max-w-xl flex-col gap-3">
        <p className="text-ok">
          Added {state.done.inserted} {state.done.inserted === 1 ? "book" : "books"}.
          {state.done.skipped > 0 && ` Skipped ${state.done.skipped} whose ISBN is already in the catalog.`}
          {state.done.invalid > 0 && ` ${state.done.invalid} invalid rows were left out.`}
        </p>
        <p className="flex gap-3"><Link href="/admin/books" className="btn btn-primary">See books</Link><Link href="/admin/books/import" className="btn">Import another file</Link></p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      <p className="text-sm text-muted">
        A CSV with a header row. Required: <strong>Title</strong>, <strong>Author</strong>. Optional: ISBN, Year, Copies (default 1), Description, Genre.
        The books export works as-is. Up to 2,000 books or 1 MB per file. Books whose ISBN is already in the catalog are skipped.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        CSV file
        <input type="file" name="file" accept=".csv,text/csv" className="text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        or paste it here
        <textarea name="csv" rows={8} defaultValue={state.csv ?? ""} key={state.csv ?? ""} className="field font-mono text-sm" placeholder={"Title,Author,ISBN,Year,Copies,Genre\nThe Salt Road,Ann Writer,9781234567897,2019,2,Travel"} />
      </label>

      {state.total > 0 && (
        <section aria-live="polite" className="flex flex-col gap-3 text-sm">
          <p><strong>{state.count}</strong> of {state.total} rows are ready to import.{state.errors?.length > 0 && ` ${state.errors.length} need fixing first and will be left out.`}</p>
          {state.errors?.length > 0 && (
            <ul className="max-h-60 overflow-auto rounded-lg bg-[#fef3f2] px-4 py-3 text-bad">
              {state.errors.slice(0, 100).map((e) => <li key={`${e.line}-${e.message}`}>Line {e.line}: {e.message}</li>)}
            </ul>
          )}
          {state.preview?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Line</th><th>Title</th><th>Author</th><th>ISBN</th><th>Year</th><th>Copies</th><th>Genre</th></tr></thead>
                <tbody>
                  {state.preview.map((r) => (
                    <tr key={r.line}><td>{r.line}</td><td>{r.title}</td><td>{r.author}</td><td>{r.isbn}</td><td>{r.published_year}</td><td>{r.total_copies}</td><td>{r.genre}</td></tr>
                  ))}
                </tbody>
              </table>
              {state.count > state.preview.length && <p className="mt-2 text-muted">…and {state.count - state.preview.length} more.</p>}
            </div>
          )}
        </section>
      )}
      {state.total === 0 && state.errors?.length > 0 && <p role="alert" className="text-sm text-bad">{state.errors[0].message}</p>}
      {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="mode" value="preview" disabled={pending} className="btn">{pending ? "Checking…" : "Check file"}</button>
        {state.count > 0 && (
          <button type="submit" name="mode" value="import" disabled={pending} className="btn btn-primary">
            {pending ? "Importing…" : `Import ${state.count} ${state.count === 1 ? "book" : "books"}`}
          </button>
        )}
      </div>
    </form>
  );
}
