# Library

Book search and reservations on Next.js 16, Neon Postgres and Neon Auth.

- **Users:** register, sign in, search, reserve (max 10 active), return, cancel or delete reservations.
- **Admins:** add, edit and delete books, browse reservations, mark books as picked up or returned.
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
- Add the four env vars from `.env.example` in the Vercel project settings.
- In Neon, turn off **scale to zero** for the production branch, so the first request after idle isn't slow.
- A daily cron (`/api/cron/expire`) marks lapsed holds as expired. It's housekeeping only: availability and the 10-book limit already ignore expired holds.

## How reservations stay correct

`src/lib/queries/reserve-sql.mjs` runs three statements in one transaction: a per-user lock, a lock on the book row, then an insert that only succeeds if the user has fewer than 10 active reservations, a copy is free, and they don't already hold that book. Parallel clicks can't get past the limits.

Check it against a **throwaway** database:

```bash
DATABASE_URL=postgres://... pnpm test:reserve
```

## Layout

- `db/migrations/`: SQL schema, applied by `scripts/migrate.mjs`
- `src/lib/queries/`: all SQL
- `src/lib/dal.js`: `getUser` / `requireUser` / `requireAdmin`, called by every private page and action
- `src/proxy.js`: early redirect for logged-out visitors (not the security boundary)
- `src/app/actions.js`, `src/app/admin/actions.js`: server actions
