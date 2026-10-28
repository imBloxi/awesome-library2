// Adds ~200 sample books so search and pagination have something to work with.
// Usage: node --env-file=.env.local db/seed.mjs
import pg from "pg";

const authors = ["Jane Austen", "Leo Tolstoy", "Rūdolfs Blaumanis", "Toni Morrison", "Haruki Murakami", "Ursula K. Le Guin", "George Orwell", "Chimamanda Ngozi Adichie", "Italo Calvino", "Regīna Ezera"];
const words = ["River", "Night", "Garden", "Winter", "Glass", "Silent", "Forest", "City", "Letters", "Harbor", "Shadow", "Stone", "Summer", "Island", "Memory", "Light", "Road", "Bridge", "Wolf", "Salt"];

const pick = (arr, i) => arr[i % arr.length];
const books = Array.from({ length: 200 }, (_, i) => ({
  title: `The ${pick(words, i * 7)} ${pick(words, i * 3 + 1)}${i % 5 === 0 ? " and Other Stories" : ""}`,
  author: pick(authors, i),
  isbn: `978${String(1000000000 + i * 7919).slice(0, 10)}`,
  year: 1850 + ((i * 37) % 175),
  copies: 1 + (i % 4),
}));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  let added = 0;
  for (const b of books) {
    const { rowCount } = await client.query(
      `insert into books (title, author, isbn, published_year, total_copies, description)
       values ($1, $2, $3, $4, $5, $6) on conflict (isbn) do nothing`,
      [b.title, b.author, b.isbn, b.year, b.copies, `A sample book by ${b.author}.`]
    );
    added += rowCount;
  }
  console.log(`seeded ${added} books`);
} finally {
  await client.end();
}
