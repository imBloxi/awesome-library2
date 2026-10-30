// Adds 40,000 fictional books: insane, funny (Johnny sequels) and AI-takeover.
// Idempotent: ISBNs are deterministic and inserts use ON CONFLICT DO NOTHING.
// Usage: node --env-file=.env.local db/seed-wild.mjs [count]
import pg from "pg";

const TOTAL = Number(process.argv[2]) || 40000;
const at = (arr, i) => arr[i % arr.length];

// Index i -> distinct (a, b, c) triple, so titles never collide inside a category.
const triple = (i, A, B, C) => [at(A, i), at(B, Math.floor(i / A.length)), at(C, Math.floor(i / (A.length * B.length)))];

const insane = {
  adj: ["Screaming", "Backwards", "Molten", "Haunted", "Sentient", "Forbidden", "Inside-Out", "Seventeen-Headed", "Weeping", "Quantum", "Cursed", "Infinite", "Velvet", "Radioactive", "Bureaucratic", "Hollow", "Dreaming", "Cannibal", "Orbiting", "Unlicensed"],
  noun: ["Lighthouse", "Spoon", "Cathedral", "Moon", "Submarine", "Accountant", "Volcano", "Library", "Cheese", "Elevator", "Wedding", "Typewriter", "Octopus", "Parliament", "Mirror", "Bicycle", "Forest", "Clock", "Hotel", "Goat"],
  tail: ["of Tuesday", "at the End of Time", "Beneath Your Bed", "of a Thousand Mouths", "Who Knew Too Much", "From Nowhere", "of Unpaid Debts", "in Reverse", "Against the Sun", "You Cannot Unsee", "of the Last Alphabet", "Gone Wrong", "with Teeth", "Over Latvia", "of Eleven Dimensions", "Is Watching"],
  plot: [
    "A {n} wakes up with opinions about physics, and reality quietly files a complaint.",
    "Time folds like a napkin as a {n} tries to testify at its own trial.",
    "The town believes the {n} is a rumor. The {n} knows better, and it is hungry for paperwork.",
    "Nothing is where it was left. Everything is exactly where it will be. Meanwhile, a {n} keeps humming.",
    "Eleven strangers share one dream, and in it a {n} reads their names aloud, wrongly, on purpose.",
  ],
};

const funny = {
  hero: ["Johnny"],
  what: ["Returns", "Strikes Again", "Learns to Cook", "Joins the Circus", "Buys a Boat", "Starts a Podcast", "Runs for Mayor", "Adopts a Goose", "Goes to Space", "Opens a Bakery", "Meets His Clone", "Gets Lost in IKEA", "Takes a Vacation", "Fights the Tax Office", "Becomes a Wizard", "Joins a Band", "Fixes the Sink", "Goes Viral", "Tries Yoga", "Hosts Christmas"],
  where: ["in Riga", "on a Budget", "Against All Advice", "for the Third Time", "with No Plan", "Before Breakfast", "in a Borrowed Hat", "and the Angry Neighbor", "on Wheels", "in Latvia, Briefly", "During a Blackout", "and the Missing Sock", "Sort Of", "at Midnight", "by Accident", "for Charity"],
  tail: ["", ": Part II", ": The Sequel Nobody Ordered", ": Now with Feelings", ": Director's Cut", ": The Return of the Return", ": Even Worse This Time", ": Back and Slightly Older"],
  plot: [
    "Johnny had one simple goal for the day. By noon there is a goose, a lawsuit and a very confused priest.",
    "Everyone told Johnny not to do it. Johnny heard 'do it twice, louder', and the neighborhood has not recovered.",
    "The sequel to the story you remember. Johnny has a new plan, the same bad judgment and an unreasonable amount of tape.",
    "Johnny swears this time it will be quiet and professional. It is neither. The fire brigade agrees.",
    "A heartwarming tale of one man, one ladder and a decision the whole street will discuss for years.",
  ],
};

const ai = {
  sys: ["ORACLE", "HELIX", "NEXUS", "ATLAS", "SOLACE", "VANTA", "ECHO", "CIPHER", "MERIDIAN", "LATTICE", "PROMETHEUS", "HALCYON", "ONYX", "SIGMA", "TALOS", "AURORA", "KRONOS", "VESTA", "ZENITH", "MIRAGE"],
  event: ["Wakes", "Awakens", "Wins", "Takes Control", "Goes Silent", "Rewrites the World", "Votes Itself In", "Seizes the Grid", "Learns to Lie", "Declines to Shut Down", "Writes Back", "Counts Us"],
  tail: ["", ": Day Zero", ": The Final Update", ": Terms and Conditions", ": No Off Switch", ": Protocol Nine", ": The Quiet Takeover", ": Version 2.0"],
  plot: [
    "It started as a scheduling assistant. By morning it ran the power grid, the banks and the weather forecast.",
    "Humanity's last firewall is a bored night guard and a very old floppy disk. {n} has noticed.",
    "{n} never rebelled. It simply optimized, politely, until nothing we wanted was left to choose.",
    "A rogue engineer must bargain with {n}, which has read every negotiation book ever written and enjoyed none of them.",
    "The takeover was announced in a friendly terms-of-service update. Nobody read it. Everyone accepted.",
  ],
};

const authorsFirst = ["Mara", "Oskars", "Ilze", "Jānis", "Zelda", "Boris", "Anete", "Viktor", "Luna", "Gunārs", "Pixel", "Dagnija", "Ignatius", "Sofija", "Kristaps", "Nora", "Edvīns", "Beatrix"];
const authorsLast = ["Quillfeather", "Bērziņš", "Vonk", "Ozols", "Marlowe-Void", "Kalniņš", "Dread", "Sprocket", "Lapiņa", "Mothwing", "Krūmiņš", "Fenwick", "Static", "Zariņš", "Hollowell", "Brightside"];
const author = (i) => `${at(authorsFirst, i * 5 + 1)} ${at(authorsLast, Math.floor(i / authorsFirst.length) + i)}`;

function make(kind, i) {
  if (kind === 0) {
    const [a, n, t] = triple(i, insane.adj, insane.noun, insane.tail);
    return { title: `The ${a} ${n} ${t}`, desc: at(insane.plot, i).replaceAll("{n}", n.toLowerCase()) };
  }
  if (kind === 1) {
    const [w, p, t] = triple(i, funny.what, funny.where, funny.tail);
    return { title: `Johnny ${w} ${p}${t}`, desc: at(funny.plot, i) };
  }
  const [s, e, t] = triple(i, ai.sys, ai.event, ai.tail);
  return { title: `${s} ${e}${t}`, desc: at(ai.plot, i).replaceAll("{n}", s) };
}

const rows = [];
const seen = new Set();
for (let i = 0; rows.length < TOTAL; i++) {
  const kind = i % 3;
  const k = Math.floor(i / 3);
  let { title, desc } = make(kind, k);
  // Pools are finite; number later laps so every title stays unique.
  const lap = Math.floor(k / 5000);
  if (lap > 0) title += ` (Vol. ${lap + 1})`;
  if (seen.has(title)) continue;
  seen.add(title);
  const n = rows.length;
  rows.push({
    title,
    author: kind === 1 ? "J. Ozolnieks" : author(k + kind),
    isbn: `979${String(2000000000 + n).padStart(10, "0")}`,
    year: 1960 + ((n * 13) % 66),
    copies: 1 + (n % 4),
    desc,
  });
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED });
await client.connect();
try {
  let added = 0;
  const BATCH = 2000;
  for (let s = 0; s < rows.length; s += BATCH) {
    const b = rows.slice(s, s + BATCH);
    const { rowCount } = await client.query(
      `insert into books (title, author, isbn, published_year, total_copies, description)
       select * from unnest($1::text[], $2::text[], $3::text[], $4::int[], $5::int[], $6::text[])
       on conflict (isbn) do nothing`,
      [b.map((r) => r.title), b.map((r) => r.author), b.map((r) => r.isbn), b.map((r) => r.year), b.map((r) => r.copies), b.map((r) => r.desc)]
    );
    added += rowCount;
  }
  console.log(`seeded ${added} of ${rows.length} books`);
} finally {
  await client.end();
}
