# Deployment

Production runs on **Vercel** (project `awesome-library2`, functions in `fra1`). The database is **Neon** in AWS eu-central-1. Keep the two in the same region: every page makes database round trips.

## How a deploy works

1. Merging to `main` makes Vercel build a **production** deployment. Every other branch gets a **preview** deployment.
2. The build runs `pnpm build`, which is `node scripts/migrate.mjs --optional && next build`.
   - **Migrations run first, against the environment's `DATABASE_URL`.** A preview build migrates the preview database; a production build migrates production. If no URL is set, migrations are skipped.
   - A migration failure stops the build, and the previous deployment keeps serving.
3. Vercel switches traffic once the build is ready.

Because migrations run **before** the new code goes live, they must work with the old code too. Additive changes only; see [writing a migration](database.md#writing-a-new-migration).

## Environment variables (Vercel > Settings > Environment Variables)

Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` and `CRON_SECRET` with the **Production** target ticked, then redeploy. Previews need their own values. Point them at a Neon branch, never at production data.

- `NEON_AUTH_BASE_URL` must be the `https://` Auth URL. If a connection string ever lands there and gets logged, reset the database password in Neon.
- The Neon integration may set `DATABASE_URL_UNPOOLED`. The app falls back to it if `DATABASE_URL` is missing.

## Neon settings

- Turn off **scale to zero** on the production branch, so the first visitor after a quiet spell doesn't wait for a cold start.
- Optional: point previews at a dedicated Neon branch so preview migrations never touch production.

## Cron

`vercel.json` schedules `GET /api/cron/expire` daily at 02:17 UTC. Vercel sends `Authorization: Bearer $CRON_SECRET`. The job only marks lapsed holds as `expired`; availability doesn't depend on it.

## Checking a deploy

1. In Vercel, open the deployment's build log. Look for `applied NNN_*.sql` (or `migrations up to date`) and the route table. Catalogue routes should show `◐` (partial prerender).
2. Open the site and try:
   - `/`
   - a search with filters, for example `/?available=1&from=1900&to=1950`
   - a book page
3. Vercel > Observability > Errors shows runtime errors grouped by route.

## Rolling back

- **Code:** Vercel > Deployments > pick the last good production deployment > **Promote**.
- **Database:** migrations are additive, so old code keeps working with the new schema and a code rollback is usually enough. To undo a schema change, write a new migration. Don't edit or delete the old one. Neon's point-in-time restore is the last resort for data.

## Production history

| Change | Migration | Notes |
|---|---|---|
| Top picks and catalogue filters | `002_top_pick.sql` | Applied by the production build of the PR #6 merge |
| 1997 redesign | `003_books_author.sql` | Index for "More by this author" |
