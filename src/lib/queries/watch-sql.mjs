// Book watchlist SQL. No Next or driver imports, so tests run these exact statements on Postgres.
// A book is watched when the watchlist is switched on and an active term appears in its title,
// author, genre or description (case-insensitive substring; no wildcards, so input is literal).

export const WATCH_WINDOW_DAYS = 180;
export const WATCH_ENABLED_SQL = `coalesce((select (s.value->>'enabled')::boolean from app_settings s where s.key = 'watchlist'), false)`;

// `b` is the alias of a books row.
export function watchedBookSql(b) {
  return `(${WATCH_ENABLED_SQL} and exists (select 1 from watch_terms t where t.active and (
      position(lower(t.term) in lower(${b}.title)) > 0
      or position(lower(t.term) in lower(${b}.author)) > 0
      or position(lower(t.term) in lower(coalesce(${b}.genre, ''))) > 0
      or position(lower(t.term) in lower(coalesce(${b}.description, ''))) > 0)))`;
}

export const settingQuery = { text: `select ${WATCH_ENABLED_SQL} as enabled` };
export const setEnabledQuery = {
  text: `insert into app_settings (key, value, updated_by) values ('watchlist', jsonb_build_object('enabled', $1::boolean), $2)
    on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`,
};

// Terms with how many live books each one matches.
export const listTermsQuery = {
  text: `select t.id, t.term, t.reason, t.active, t.created_by, t.created_at,
      (select count(*)::int from books b where b.deleted_at is null and (
        position(lower(t.term) in lower(b.title)) > 0 or position(lower(t.term) in lower(b.author)) > 0
        or position(lower(t.term) in lower(coalesce(b.genre, ''))) > 0
        or position(lower(t.term) in lower(coalesce(b.description, ''))) > 0)) as matches
    from watch_terms t order by t.active desc, lower(t.term)`,
};
export const addTermQuery = {
  text: `insert into watch_terms (term, reason, created_by) values ($1, $2, $3)
    on conflict (lower(term)) do nothing returning id`,
};
export const toggleTermQuery = { text: "update watch_terms set active = not active where id = $1 returning term, active" };
export const deleteTermQuery = { text: "delete from watch_terms where id = $1 returning term" };

// Watched hits: one row per (member, watched book, moment) from recent reservations,
// current waitlist places and saved books. Starts from activity, so only those books are tested.
export function watchHitsCte(userFilter = "") {
  return `act as (
      select r.user_id, r.book_id, r.reserved_at as at from reservations r
        where r.reserved_at > now() - interval '${WATCH_WINDOW_DAYS} days' ${userFilter && `and r.user_id::text = ${userFilter}`}
      union all select w.user_id, w.book_id, w.created_at from waitlist w ${userFilter && `where w.user_id::text = ${userFilter}`}
      union all select s.user_id, s.book_id, s.created_at from wishlist s ${userFilter && `where s.user_id::text = ${userFilter}`}
    ),
    hits as (
      select a.user_id, b.id as book_id, b.title, a.at from act a join books b on b.id = a.book_id
      where ${watchedBookSql("b")}
    )`;
}

// Persons of interest: members with watched activity, most watched books first.
export const personsOfInterestQuery = {
  text: `with ${watchHitsCte()}
    select u.id::text as user_id, u.name, u.email, count(distinct h.book_id)::int as books,
      (array_agg(distinct h.title))[1:5] as titles, max(h.at) as last_seen
    from hits h join neon_auth."user" u on u.id = h.user_id
    group by u.id, u.name, u.email
    order by books desc, last_seen desc
    limit 200`,
};
