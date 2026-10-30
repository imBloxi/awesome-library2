-- Member moderation: staff notes, warnings, borrowing restrictions and suspensions.
-- Rows are never edited except to lift a restriction or suspension, so the table is the history.
-- user_id takes the type of neon_auth."user".id, as in 001_init.sql.
do $$
declare id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'neon_auth."user"'::regclass and a.attname = 'id' and not a.attisdropped;

  execute format($f$
    create table if not exists moderation_actions (
      id          bigint generated always as identity primary key,
      user_id     %s not null references neon_auth."user"(id) on delete cascade,
      kind        text not null check (kind in ('note', 'warning', 'restrict', 'suspend')),
      reason      text not null check (length(reason) between 3 and 1000),
      ends_at     timestamptz,
      actor_id    text not null,
      actor_email text,
      created_at  timestamptz not null default now(),
      lifted_at   timestamptz,
      lifted_by   text,
      lift_reason text,
      check (ends_at is null or ends_at > created_at),
      check (kind in ('restrict', 'suspend') or (ends_at is null and lifted_at is null))
    )$f$, id_type);
end $$;

create index if not exists moderation_by_user on moderation_actions (user_id, created_at desc);
-- The enforcement checks look only at unlifted restrictions and suspensions.
create index if not exists moderation_open_blocks on moderation_actions (user_id)
  where lifted_at is null and kind in ('restrict', 'suspend');
