# Library

Book search and reservations on Next.js 16, Neon Postgres and Neon Auth.

- **Users:** register, sign in, search (filter by available now and publication year), reserve (max 10 active), return, cancel or delete reservations.
- **Home page:** "This week's top books" above the catalog, on the unfiltered first page.
- **Admins** (`/admin`):
  - Books: add, edit, delete and restore, see who currently holds a copy, export to CSV. Tick **Top pick this week** to feature a book on the home page for 7 days (newest 6 show; see `TOP_PICK_DAYS` in `src/lib/queries/search-sql.mjs`).
  - Reservations: mark picked up or returned, extend or cancel a hold, filter overdue loans (over 28 days, see `src/lib/constants.js`), export to CSV.
  - Users: search, make or remove admins (role changes apply at the user's next sign-in; you can't change your own).
  - Overview: totals, overdue loans, holds about to lapse, recent activity.
- A reservation is a hold until pickup. Holds not picked up within 7 days stop counting automatically.

## Setup

1. Create a Neon project in **AWS Europe Central (Frankfurt)** and enable **Neon Auth** (with the admin plugin) in the Console.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Install, migrate and (optionally) seed sample books:

```bash
pnpm install
```

```bash
pnpm db:migrate
```

```bash
pnpm db:seed
```

4. Run it:

```bash
pnpm dev
```

5. Make yourself admin: register in the app, then in the Neon SQL editor run
   `update neon_auth."user" set role = 'admin' where email = 'you@example.com';`
   and sign out and back in.

## Deploying (Vercel)

- `vercel.json` pins functions to `fra1` (Frankfurt), next to the database. Keep both in the same region.
- Add the four env vars from `.env.example` in the Vercel project settings, with the **Production** target ticked, then redeploy. The app checks them on first use and fails with a message naming the variable that's wrong (never its value).
- `NEON_AUTH_BASE_URL` is the Auth URL (`https://...`) from Neon Console > Auth. It is not the database connection string.
- In Neon, turn off **scale to zero** for the production branch, so the first request after idle isn't slow.
- A daily cron (`/api/cron/expire`) marks lapsed holds as expired. It's housekeeping only: availability and the 10-book limit already ignore expired holds.

## How reservations stay correct

`src/lib/queries/reserve-sql.mjs` runs three statements in one transaction: a per-user lock, a lock on the book row, then an insert that only succeeds if the user has fewer than 10 active reservations, a copy is free, and they don't already hold that book. Parallel clicks can't get past the limits.

Search and top-pick SQL against a **throwaway** database:

```bash
DATABASE_URL=postgres://... pnpm test:search-db
```

Env and unit checks:

```bash
pnpm test:env
```

Check the reserve logic against a **throwaway** database:

```bash
DATABASE_URL=postgres://... pnpm test:reserve
```

Book-edit concurrency and dashboard checks (Node 24+, **disposable database only**;
this suite truncates its fixture tables):

```bash
TEST_DATABASE_URL=postgres://... pnpm test:books
```

Apply both migrations first. For a local PostgreSQL test database without Neon Auth,
create a test-only `neon_auth."user"` table with `id text primary key`, `name text`,
`email text` and `role text` before migrating. This tests SQL and locking, not the
remote Neon Auth service. Never run these checks against production.

## Layout

- `db/migrations/`: SQL schema, applied by `scripts/migrate.mjs`
- `src/lib/queries/`: all SQL
- `src/lib/dal.js`: `getUser` / `requireUser` / `requireAdmin`, called by every private page and action
- `src/proxy.js`: early redirect for logged-out visitors (not the security boundary)
- `src/app/actions.js`, `src/app/admin/actions.js`: server actions
