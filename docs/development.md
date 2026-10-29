# Development

## Prerequisites

- Node 22+ and pnpm (the version is pinned in `package.json` → `packageManager`).
- A Neon project in **AWS Europe Central (Frankfurt)** with **Neon Auth** enabled, including the admin plugin.
- Optional: a local Postgres 16 for the DB-backed tests.

## First run

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (`postgres://...`) |
| `NEON_AUTH_BASE_URL` | the Auth URL (`https://...`) from Neon Console > Auth. Not the connection string. |
| `NEON_AUTH_COOKIE_SECRET` | 32+ random characters (`openssl rand -base64 32`) |
| `CRON_SECRET` | protects `/api/cron/expire` (`openssl rand -hex 32`) |

The app checks these on first use. A bad value fails with a message that names the variable but never shows its value.

```bash
pnpm db:migrate
```

```bash
pnpm db:seed
```

```bash
pnpm dev
```

Then [make yourself an admin](admin-guide.md#making-someone-an-admin).

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` | runs migrations (skipped if no DB URL), then `next build` |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | applies new migrations using `.env.local` |
| `pnpm db:seed` | adds sample books |
| `pnpm test:env` | unit tests: env parsing, CSV, search, Babel, reservation URL params and UTC timestamps. No database needed. |
| `pnpm test:admin` | circulation filters, exact deadlines, member IDs and paging against a **throwaway** DB (`TEST_DATABASE_URL=... pnpm test:admin`, Node 24+) |
| `pnpm test:books` | book/hold mutation races and dashboard counts against a **throwaway** DB (`TEST_DATABASE_URL=... pnpm test:books`, Node 24+) |
| `pnpm test:search-db` | search, filter, top-pick and author SQL against a **throwaway** DB (`DATABASE_URL=... pnpm test:search-db`) |
| `pnpm test:reserve` | reserve concurrency rules against a **throwaway** DB |

The search and reserve scripts create rows and delete them afterwards. The admin and book suites **truncate their fixture tables**; run them sequentially. Never point any DB test at production or a database containing data you need to keep.

## A throwaway local database

```bash
initdb -D /tmp/libpg -A trust -U postgres && pg_ctl -D /tmp/libpg -o '-p 54329' start
```

```bash
psql postgres://postgres@localhost:54329/postgres -c "create database lib_test"
```

`001_init.sql` expects Neon Auth's user table, so create a stand-in:

```bash
psql postgres://postgres@localhost:54329/lib_test -c 'create schema neon_auth; create table neon_auth."user" (id text primary key, name text, email text, role text);'
```

```bash
DATABASE_URL=postgres://postgres@localhost:54329/lib_test node scripts/migrate.mjs
```

```bash
DATABASE_URL=postgres://postgres@localhost:54329/lib_test pnpm test:search-db
```

The app itself uses Neon's HTTP driver, which can't talk to a plain local Postgres. Run `pnpm dev` against a Neon branch. A free dev branch per developer works well.

## Conventions

- **Read `AGENTS.md` first.** This Next.js version differs from older ones. Check `node_modules/next/dist/docs/` before using a framework API.
- **Plain JavaScript**, `@/` imports in app code, relative imports in `.mjs` files that scripts import.
- **SQL with rules lives in `src/lib/queries/*.mjs`** with no framework imports, and gets a test in `scripts/` that runs it on Postgres. Always use `$n` placeholders.
- **Access checks:** every private page and server action calls `requireUser()` / `requireAdmin()` from `src/lib/dal.js`. `proxy.js` is not enough.
- **Server actions** validate with zod, return `{ error }` or `{ message }` for `ActionButton`, and call `refresh()` after writes.
- **Pages:** read `searchParams` / `params` inside a `<Suspense>` child, not in the page component, so the shell stays prerendered.
- **No `"use cache"` on availability data.** It must be live.
- **Styling:** use the classes and tokens from the [design system](design-system.md). No new colours without a contrast check, and no web fonts.
- **Commits:** small, imperative messages (`feat: ...`, `fix: ...`).

## Testing approach

- Write the failing test first, watch it fail, then implement.
- Pure logic (URL parsing, SQL builders, CSV) is unit-tested with `node --test`.
- SQL that encodes rules is tested on a real Postgres. Mocks wouldn't catch type or planner surprises.
- There's no browser test suite yet. For UI changes, run `pnpm build` (it catches prerender and `cacheComponents` errors) and check the pages at phone and desktop widths.
