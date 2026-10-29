-- For "More by this author" on the book page.
create index if not exists books_author on books (author) where deleted_at is null;
