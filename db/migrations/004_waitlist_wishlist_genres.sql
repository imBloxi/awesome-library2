-- Member waitlists and wishlists, one loan renewal, book genres, and an admin activity log.
-- user_id columns take the type of neon_auth."user".id, as in 001_init.sql.
do $$
declare id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'neon_auth."user"'::regclass and a.attname = 'id' and not a.attisdropped;

  -- Queue for books with no free copy. First come, first served: when a copy frees up,
  -- the next eligible member gets a normal 7-day hold and leaves the queue.
  execute format($f$
    create table if not exists waitlist (
      id         bigint generated always as identity primary key,
      user_id    %s not null references neon_auth."user"(id) on delete cascade,
      book_id    bigint not null references books(id),
      created_at timestamptz not null default now(),
      unique (user_id, book_id)
    )$f$, id_type);

  execute format($f$
    create table if not exists wishlist (
      user_id    %s not null references neon_auth."user"(id) on delete cascade,
      book_id    bigint not null references books(id),
      created_at timestamptz not null default now(),
      primary key (user_id, book_id)
    )$f$, id_type);

  -- Who did what in the admin screens. actor is kept as text so the log survives user deletion.
  create table if not exists admin_events (
    id         bigint generated always as identity primary key,
    actor_id   text not null,
    actor_email text,
    action     text not null,
    book_id    bigint references books(id),
    reservation_id bigint references reservations(id),
    target_user text,
    detail     text,
    created_at timestamptz not null default now()
  );
end $$;

create index if not exists waitlist_queue on waitlist (book_id, created_at, id);
create index if not exists wishlist_user on wishlist (user_id, created_at desc);
create index if not exists admin_events_recent on admin_events (created_at desc, id desc);

-- A waitlisted hold says so on the member's list.
alter table reservations add column if not exists from_waitlist boolean not null default false;
-- Each renewal adds one more loan period (LOAN_DAYS) to the due date.
alter table reservations add column if not exists renewals int not null default 0 check (renewals >= 0);
-- For "Readers also borrowed".
create index if not exists res_book_user on reservations (book_id, user_id);

alter table books add column if not exists genre text check (genre is null or length(genre) between 1 and 60);
create index if not exists books_genre on books (lower(genre)) where deleted_at is null and genre is not null;

-- Views expand "select *" when created, so re-create active_reservations to expose the new
-- columns (appended at the end, which "create or replace view" allows). Same rule as 001.
create or replace view active_reservations as
  select * from reservations
  where status in ('reserved', 'picked_up')
    and (status = 'picked_up' or expires_at > now());
