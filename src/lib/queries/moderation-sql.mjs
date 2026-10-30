// Moderation SQL. No Next or driver imports, so tests run these exact statements on Postgres.
//
// A restriction pauses borrowing: no new reservations, waitlist joins, renewals or waitlist
// holds. A suspension does all of that and also closes reading access. Both end on their own
// at ends_at, or when staff lift them. Returning books is never blocked.

export const MODERATION_KINDS = ["note", "warning", "restrict", "suspend"];
export const BLOCKING_KINDS = ["restrict", "suspend"];

// `user` is an SQL expression for the member's id, e.g. "$1" or "w.user_id".
function openBlock(user, kinds) {
  return `exists (select 1 from moderation_actions m
    where m.user_id = ${user} and m.kind in (${kinds.map((k) => `'${k}'`).join(", ")})
      and m.lifted_at is null and (m.ends_at is null or m.ends_at > now()))`;
}

export const borrowBlockedSql = (user) => openBlock(user, BLOCKING_KINDS);
export const suspendedSql = (user) => openBlock(user, ["suspend"]);

// The member's current standing: the strongest open block, if any, and the latest warning.
export const standingQuery = {
  text: `select
      (select row_to_json(b) from (
         select m.kind, m.reason, m.ends_at, m.created_at from moderation_actions m
         where m.user_id = $1 and m.kind in ('restrict', 'suspend')
           and m.lifted_at is null and (m.ends_at is null or m.ends_at > now())
         order by (m.kind = 'suspend') desc, m.ends_at desc nulls first limit 1) b) as block,
      (select row_to_json(w) from (
         select m.reason, m.created_at from moderation_actions m
         where m.user_id = $1 and m.kind = 'warning' and m.created_at > now() - interval '30 days'
         order by m.created_at desc limit 1) w) as warning`,
};

export const addActionQuery = {
  text: `insert into moderation_actions (user_id, kind, reason, ends_at, actor_id, actor_email)
    select u.id, $2, $3, case when $4::int is null then null else now() + make_interval(days => $4::int) end, $5, $6
    from neon_auth."user" u where u.id::text = $1::text
    returning id`,
};

// Lifts every open restriction and suspension at once; returns how many were lifted.
export const liftQuery = {
  text: `update moderation_actions set lifted_at = now(), lifted_by = $2, lift_reason = $3
    where user_id::text = $1::text and kind in ('restrict', 'suspend')
      and lifted_at is null and (ends_at is null or ends_at > now())
    returning id`,
};

// History for staff (everything) or for the member (notes are summarised, not shown).
export const historyQuery = {
  text: `select id, kind, reason, ends_at, actor_email, created_at, lifted_at, lift_reason,
      (kind in ('restrict', 'suspend') and lifted_at is null and (ends_at is null or ends_at > now())) as active
    from moderation_actions where user_id::text = $1::text
    order by created_at desc, id desc limit $2`,
};
