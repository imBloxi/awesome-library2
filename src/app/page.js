"use client";

import { useRef, useState, useSyncExternalStore } from "react";

const books = [
  { id: 1, title: "The Creative Act", author: "Rick Rubin", category: "Art & design", color: "cream", mark: "◎", subtitle: "A WAY OF BEING", description: "A thoughtful invitation to notice more, trust your curiosity, and make creativity a way of moving through the world." },
  { id: 2, title: "The Midnight Library", author: "Matt Haig", category: "Fiction", color: "navy", mark: "✦", subtitle: "A NOVEL", description: "Between life and death is a library of possibilities. Nora Seed gets the chance to explore the lives she might have lived." },
  { id: 3, title: "Atomic Habits", author: "James Clear", category: "Personal growth", color: "sand", mark: "···", subtitle: "TINY CHANGES, REMARKABLE RESULTS", description: "A practical exploration of how small, consistent changes can reshape our habits and the systems behind them." },
  { id: 4, title: "The Psychology of Money", author: "Morgan Housel", category: "Business", color: "green", mark: "❋", subtitle: "TIMELESS LESSONS ON WEALTH, GREED, AND HAPPINESS", description: "Stories about the surprising ways our experiences, emotions, and expectations shape our relationship with money." },
  { id: 5, title: "Normal People", author: "Sally Rooney", category: "Fiction", color: "coral", mark: "◒", subtitle: "A NOVEL", description: "Connell and Marianne navigate intimacy, class, and the quiet complexity of growing up and finding one another." },
  { id: 6, title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", color: "blue", mark: "◉", subtitle: "FROM THE BIG BANG TO BLACK HOLES", description: "An accessible journey into the big questions of space, time, black holes, and the origins of our universe." },
];
const categories = ["All books", "Fiction", "Art & design", "Personal growth", "Business", "Science"];

function Icon({ name, ...props }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{name === "search" ? <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></> : name === "bookmark" ? <path d="M6 3h12v18l-6-4-6 4Z" /> : name === "arrow" ? <path d="M4 12h16m-6-6 6 6-6 6" /> : <><path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z" /><path d="M12 5v15" /></>}</svg>;
}
function Cover({ book, hero = false }) {
  return <div className={`book-cover ${book.color} ${hero ? "hero-cover" : ""}`} aria-hidden="true"><span className="cover-kicker">{book.subtitle}</span><strong>{book.title}</strong><span className="cover-art">{book.mark}</span><span className="cover-author">{book.author}</span></div>;
}

let sessionShelf = "[]";
let useSessionShelf = false;
function writeShelf(next) {
  sessionShelf = JSON.stringify(next);
  try { localStorage.setItem("dogear-shelf", sessionShelf); useSessionShelf = false; }
  catch { useSessionShelf = true; }
  window.dispatchEvent(new Event("dogear-shelf-change"));
  return !useSessionShelf;
}
function subscribeShelf(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("dogear-shelf-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("dogear-shelf-change", callback);
  };
}
function getShelfSnapshot() {
  try { return useSessionShelf ? sessionShelf : localStorage.getItem("dogear-shelf") || "[]"; }
  catch { return sessionShelf; }
}
function getServerShelf() { return "[]"; }

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All books");
  const shelfSnapshot = useSyncExternalStore(subscribeShelf, getShelfSnapshot, getServerShelf);
  let saved = [];
  try {
    const parsed = JSON.parse(shelfSnapshot);
    if (Array.isArray(parsed)) saved = parsed.filter(id => books.some(book => book.id === id));
  } catch { /* Invalid stored data is treated as an empty shelf. */ }
  const [shelf, setShelf] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef(null);
  function toggleSave(id) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    const persisted = writeShelf(next);
    setNotice(persisted ? (next.includes(id) ? "Added to your reading list." : "Removed from your reading list.") : "Saved for this visit. Your browser could not store your list.");
  }
  function openBook(book) { setSelected(book); dialog.current.showModal(); }
  function browse(savedOnly = false) { setShelf(savedOnly); setCategory("All books"); setQuery(""); }
  const filtered = books.filter(book => (!shelf || saved.includes(book.id)) && (category === "All books" || book.category === category) && `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <>
    <a className="skip-link" href="#collection">Skip to books</a>
    <header className="site-header"><a className="wordmark" href="#" onClick={() => browse()}><Icon name="book" /> dogear<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><a className={!shelf ? "active" : ""} href="#collection" onClick={() => browse()}>Discover</a><a href="#collections">Collections</a><a href="#about">Our story</a></nav><a className="shelf-link" href="#collection" onClick={() => browse(true)}><Icon name="bookmark" /> My reading list <span>{saved.length}</span></a></header>
    <main>
      <section className="hero" aria-labelledby="hero-heading"><div className="hero-copy"><div className="eyebrow"><span /> FOR THE ENDLESSLY CURIOUS</div><h1 id="hero-heading">Your next<br />chapter starts<span className="here"> here<svg viewBox="0 0 230 18" aria-hidden="true"><path d="M3 12Q100-2 225 8M15 16Q120 6 210 13" /></svg></span>.</h1><p>Big ideas. Beautiful stories. Books that stay with you.<br className="desktop-break" /> A little less scrolling, a little more getting lost.</p><a className="primary-button" href="#collection" onClick={() => browse()}>Find your next read <Icon name="arrow" /></a><div className="hero-note"><span className="mini-stars">✦ ✦ ✦</span> Good books. Open minds. Everyone welcome.</div></div><div className="hero-art"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="art-star star-one">✳</span><span className="art-star star-two">✧</span><div className="hero-book back-book"><Cover book={books[1]} hero /></div><div className="hero-book front-book"><Cover book={books[0]} hero /></div><div className="round-stamp">ONE MORE<br /><span>chapter</span><br />WON’T HURT ↗</div><span className="art-caption">Go somewhere. Without going anywhere.</span></div></section>
      <div className="manifesto-strip"><span>A home for your next favorite book</span><span>✳</span><span>Curated with curiosity</span><span>✳</span><span>Stay a little. Read a lot.</span><span>✳</span><span>Find your kind of story</span></div>
      <section id="collection" className="collection"><div className="section-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>{shelf ? "Your next chapters." : "Meet your next obsession."}</h2></div><label className="search"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search books, authors…" aria-label="Search books and authors" /><span>↵</span></label></div><div className="filter-row"><div className="filters" aria-label="Filter by genre">{categories.map(item => <button key={item} aria-pressed={category === item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="result-count">{filtered.length} books to get lost in</span></div><div className="book-grid">{filtered.map(book => <article className="book-card" key={book.id}><div className={`cover-stage stage-${book.color}`}><button className="cover-button" onClick={() => openBook(book)} aria-label={`Read about ${book.title}`}><Cover book={book} /></button><button className={`save-button ${saved.includes(book.id) ? "is-saved" : ""}`} onClick={() => toggleSave(book.id)} aria-label={`${saved.includes(book.id) ? "Remove" : "Save"} ${book.title}`} aria-pressed={saved.includes(book.id)}><Icon name="bookmark" /></button></div><div className="book-meta"><span>{book.category}</span><span>↗</span></div><button className="book-title" onClick={() => openBook(book)}>{book.title}</button><p className="book-author">{book.author}</p></article>)}</div>{filtered.length === 0 && <div className="empty-state"><Icon name="book" /><h3>{shelf && saved.length === 0 ? "Your story starts with a bookmark." : "No books on this shelf just yet."}</h3><p>{shelf && saved.length === 0 ? "Save a book that catches your eye and find it here." : "Try another author, title, or genre."}</p><button className="primary-button" onClick={() => browse()}>Explore all books <Icon name="arrow" /></button></div>}<p className="save-notice" role="status">{notice}</p></section>
      <section id="collections" className="collection-banner"><div className="banner-art" aria-hidden="true">✳</div><div><span className="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>A different shelf.<br />A whole new perspective.</h2><p>For the daydreamers, the deep thinkers, and the “just one more page” people.</p></div><a href="#collection" onClick={() => { browse(); setCategory("Fiction"); }}>Get lost in fiction <Icon name="arrow" /></a></section>
    </main><footer id="about"><a className="wordmark" href="#"><Icon name="book" /> dogear.</a><p>An independent little corner of the internet.<br />Made for the love of a good book.</p><span>Keep your curiosity. Turn the page. ↗</span></footer>
    <dialog ref={dialog} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="book-dialog-title"><button className="close-dialog" aria-label="Close book details" onClick={() => dialog.current.close()}>×</button>{selected && <div className="book-details"><Cover book={selected} /><div><span className="eyebrow">{selected.category}</span><h2 id="book-dialog-title">{selected.title}</h2><p className="detail-author">By {selected.author}</p><p>{selected.description}</p><button className="primary-button" onClick={() => toggleSave(selected.id)}>{saved.includes(selected.id) ? "Remove from reading list" : "Add to reading list"}<Icon name="bookmark" /></button><p className="dialog-note">Your reading list is stored in this browser.</p><p role="status">{notice}</p></div></div>}</dialog>
  </>;
}
