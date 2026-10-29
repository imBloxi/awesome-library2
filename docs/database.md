# Database

Neon Postgres. The schema is in `db/migrations/*.sql`. `scripts/migrate.mjs` applies the files in name order, once each, recording them in `schema_migrations`.

## Tables

### `books`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | primary key |
| `title`, `author` | text, required | |
| `isbn` | text, unique | cleared on soft delete so it can be reused |
| `description` | text | |
| `published_year` | int | 0–2100, validated in the admin action |
| `total_copies` | int ≥ 0 | can't go below the active reservation count (checked in the action) |
| `top_pick_at` | timestamptz | when an admin flagged it as a top pick; null = not a pick (migration 002) |
| `deleted_at` | timestamptz | soft delete; keeps reservation history intact |
| `created_at`, `updated_at` | timestamptz | |

### `reservations`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | |
| `user_id` | same type as `neon_auth."user".id` | FK, cascades on user delete |
| `book_id` | bigint | FK to books |
| `status` | enum `reserved, picked_up, returned, cancelled, expired` | |
| `reserved_at`, `expires_at` | timestamptz | `expires_at` defaults to now + 7 days |
| `picked_up_at`, `returned_at` | timestamptz | |
| `hidden_by_user` | boolean | |

### `active_reservations` (view)

These rows count against copies and the 10-book limit:

- `picked_up` rows, and
- `reserved` rows whose `expires_at` is still in the future.

### `neon_auth."user"`

This table is managed by Neon Auth. The app reads `id`, `name`, `email` and `role`, and writes only `role`, from the admin Users tab. Admins have `role = 'admin'`.

## Indexes

| Index | On | Serves |
|---|---|---|
| `books_search_trgm` | GIN trigram on `title ‖ author ‖ isbn`, where not deleted | catalogue search (`ilike`) |
| `books_top_pick` | `top_pick_at desc`, where flagged and not deleted | "This week's top books" |
| `books_author` | `author`, where not deleted | "More by this author" (migration 003) |
| `res_user_active`, `res_book_active` | partial on active statuses | availability and the 10-book limit |
| `res_user_all` | `(user_id, reserved_at desc)` | "My reservations" |

## Migrations

| File | What it does |
|---|---|
| `001_init.sql` | pg_trgm, books, reservation enum and table (user id type copied from Neon Auth), indexes, `active_reservations` view |
| `002_top_pick.sql` | `books.top_pick_at` and `books_top_pick` partial index |
| `003_books_author.sql` | `books_author` index |

### Writing a new migration

1. Add `db/migrations/NNN_short_name.sql`, numbered after the last one.
2. Make it **idempotent and additive**: `add column if not exists`, `create index if not exists`, nullable columns or constant defaults. It runs inside a transaction during the Vercel build, so it must be safe while the **old code is still serving traffic**.
3. Run it locally twice: `pnpm db:migrate`. The second run should print only `migrations up to date`.
4. Never edit a migration that has already been applied anywhere. Add a new one.

## Rules the SQL enforces

All of these are in `src/lib/queries/*.mjs`, so tests run the same SQL:

- **Search** escapes `%`, `_` and `\`, and every value is a `$n` placeholder. User input is never concatenated into SQL.
- **Availability** = `total_copies − count(active_reservations)`.
- **Reserve:** a per-user lock, a book row lock, then an insert. The insert only happens when the user has fewer than 10 active reservations, a copy is free, and they don't already hold the book.
- **Top pick active** = `top_pick_at > now() − 7 days`.
- **Saving a book** keeps `top_pick_at` if the pick is still current and the box is ticked. If ticked but expired or never set, it becomes `now()`. Unticked clears it to `null`.
- **Deleting a book** is refused while any active reservation exists.

## Sample data

`pnpm db:seed` adds about 200 books. Duplicate ISBNs are skipped, so it's safe to re-run.
