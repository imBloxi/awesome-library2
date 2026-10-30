import { LEGAL_UPDATED } from "@/lib/legal.mjs";

// A ctOS record: a sticky index of clauses beside the text.
// sections: [{ id, title, body }] where body is JSX.
export function LegalDoc({ label, title, intro, sections }) {
  return (
    <article className="ctos-legal">
      <header className="ctos-console-header">
        <p className="ctos-label">{label}</p>
        <h1 className="ctos-title">{title}</h1>
        <div className="ctos-lede">{intro}</div>
        <p className="ctos-doc-meta"><span>Effective {LEGAL_UPDATED}</span><span>Clauses {sections.length}</span></p>
      </header>
      <div className="ctos-doc">
        <nav aria-label="Clauses" className="ctos-doc-index">
          {sections.map((s, i) => <a key={s.id} href={`#${s.id}`}>{String(i + 1).padStart(2, "0")} {s.title}</a>)}
        </nav>
        <div className="ctos-doc-body">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}><span className="ctos-clause">{String(i + 1).padStart(2, "0")}</span>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
