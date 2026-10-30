-- Book watchlist: staff keywords that mark matching books as watched. Members who reserve,
-- borrow, wait for or save a watched book are flagged to staff as persons of interest.
create table if not exists watch_terms (
  id          bigint generated always as identity primary key,
  term        text not null check (length(term) between 2 and 80),
  reason      text not null check (length(reason) between 3 and 500),
  active      boolean not null default true,
  created_by  text not null,
  created_at  timestamptz not null default now()
);
create unique index if not exists watch_terms_unique on watch_terms (lower(term));

-- Small key/value store for site-wide switches. The watchlist starts switched off.
create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);
