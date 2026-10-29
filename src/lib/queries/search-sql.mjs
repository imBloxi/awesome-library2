// Plain SQL for book search and top picks. No Next or driver imports, so the
// test scripts can run these exact fragments against Postgres.

// How long a book stays in "This week's top books" after an admin flags it.
export const TOP_PICK_DAYS = 7;

// True while books row `b` is a current top pick.
export const TOP_PICK_ACTIVE_SQL = `(b.top_pick_at > now() - interval '${TOP_PICK_DAYS} days')`;

// SET expression for top_pick_at from a boolean parameter, e.g. topPickAtSql("$8").
// Ticked and still current: keep the date. Ticked otherwise: now. Unticked: null.
export function topPickAtSql(param) {
  return `case when ${param} then coalesce(case when ${TOP_PICK_ACTIVE_SQL} then b.top_pick_at end, now()) end`;
}
