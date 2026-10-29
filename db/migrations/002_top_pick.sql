-- A book is one of "This week's top books" for 7 days after an admin flags it (see TOP_PICK_DAYS).
alter table books add column if not exists top_pick_at timestamptz;

-- The 7-day window needs now(), which an index predicate can't use, so it's applied in the query.
create index if not exists books_top_pick on books (top_pick_at desc)
  where top_pick_at is not null and deleted_at is null;
