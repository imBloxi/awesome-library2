-- Users live in neon_auth."user", managed by Neon Auth. Admins have role 'admin'.
create extension if not exists pg_trgm;

create table if not exists books (
  id             bigint generated always as identity primary key,
  title          text not null,
  author         text not null,
  isbn           text unique,
  description    text,
  published_year int,
  total_copies   int not null default 1 check (total_copies >= 0),
  deleted_at     timestamptz, -- soft delete keeps reservation history intact
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists books_search_trgm on books
  using gin ((title || ' ' || author || ' ' || coalesce(isbn, '')) gin_trgm_ops)
  where deleted_at is null;

do $$ begin
  create type reservation_status as enum ('reserved', 'picked_up', 'returned', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

create table if not exists reservations (
  id             bigint generated always as identity primary key,
  user_id        text not null references neon_auth."user"(id) on delete cascade,
  book_id        bigint not null references books(id),
  status         reservation_status not null default 'reserved',
  reserved_at    timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '7 days',
  picked_up_at   timestamptz,
  returned_at    timestamptz,
  hidden_by_user boolean not null default false
);

create index if not exists res_user_active on reservations (user_id) where status in ('reserved', 'picked_up');
create index if not exists res_book_active on reservations (book_id) where status in ('reserved', 'picked_up');
create index if not exists res_user_all on reservations (user_id, reserved_at desc);

-- A reservation counts against the limit and the book's copies while it's picked up,
-- or while it's a hold that hasn't passed its 7-day pickup window.
create or replace view active_reservations as
  select * from reservations
  where status in ('reserved', 'picked_up')
    and (status = 'picked_up' or expires_at > now());
