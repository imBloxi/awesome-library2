// Member monitoring signals, computed from circulation and moderation records in one pass.
// No Next or driver imports, so tests run this exact statement on Postgres.
import { LOAN_DAYS } from "../constants.js";

const DUE = `(r.picked_up_at + interval '${LOAN_DAYS} days' * (1 + r.renewals))`;

// One row per member with any circulation, waitlist or moderation record, or only `$1` when given.
// Every count is over a stated window so a member's record recovers with time.
export function signalsQuery({ single = false } = {}) {
  const only = (col) => (single ? `where ${col}::text = $1::text` : "");
  return `with
    res as (
      select r.user_id,
        count(*) filter (where r.status = 'picked_up' and r.returned_at is null and ${DUE} < now())::int as overdue_now,
        coalesce(max(extract(epoch from now() - ${DUE}) / 86400) filter (
          where r.status = 'picked_up' and r.returned_at is null and ${DUE} < now()), 0)::int as overdue_days,
        count(*) filter (where r.returned_at > now() - interval '90 days')::int as returned_90,
        count(*) filter (where r.returned_at > now() - interval '90 days' and r.returned_at > ${DUE})::int as late_90,
        count(*) filter (where r.picked_up_at is null and r.expires_at > now() - interval '90 days'
          and (r.status = 'expired' or (r.status = 'reserved' and r.expires_at < now())))::int as no_shows_90,
        count(*) filter (where r.reserved_at > now() - interval '90 days' and (r.picked_up_at is not null
          or r.status = 'expired' or (r.status = 'reserved' and r.expires_at < now())))::int as holds_90,
        count(*) filter (where r.status = 'cancelled' and r.reserved_at > now() - interval '30 days')::int as cancels_30,
        count(*) filter (where r.returned_at is null and (r.status = 'picked_up' or (r.status = 'reserved' and r.expires_at > now())))::int as active_now,
        count(*)::int as lifetime,
        max(greatest(r.reserved_at, coalesce(r.picked_up_at, r.reserved_at), coalesce(r.returned_at, r.reserved_at))) as last_activity
      from reservations r ${only("r.user_id")} group by r.user_id
    ),
    burst as (
      select x.user_id, max(x.n)::int as burst_7
      from (
        select r1.user_id, (select count(*) from reservations r2
          where r2.user_id = r1.user_id and r2.reserved_at >= r1.reserved_at
            and r2.reserved_at < r1.reserved_at + interval '1 hour') as n
        from reservations r1 where r1.reserved_at > now() - interval '7 days' ${single ? "and r1.user_id::text = $1::text" : ""}
      ) x group by x.user_id
    ),
    wl as (select w.user_id, count(*)::int as waiting from waitlist w ${only("w.user_id")} group by w.user_id),
    moder as (
      select m.user_id,
        count(*) filter (where m.kind in ('warning', 'restrict', 'suspend') and m.created_at > now() - interval '180 days')::int as prior_180,
        bool_or(m.kind = 'suspend' and m.lifted_at is null and (m.ends_at is null or m.ends_at > now())) as suspended,
        bool_or(m.kind = 'restrict' and m.lifted_at is null and (m.ends_at is null or m.ends_at > now())) as restricted
      from moderation_actions m ${only("m.user_id")} group by m.user_id
    )
    select u.id::text as user_id, u.name, u.email, u.role,
      coalesce(res.overdue_now, 0) as overdue_now, coalesce(res.overdue_days, 0) as overdue_days,
      coalesce(res.returned_90, 0) as returned_90, coalesce(res.late_90, 0) as late_90,
      coalesce(res.no_shows_90, 0) as no_shows_90, coalesce(res.holds_90, 0) as holds_90,
      coalesce(res.cancels_30, 0) as cancels_30, coalesce(res.active_now, 0) as active_now,
      coalesce(res.lifetime, 0) as lifetime, res.last_activity,
      coalesce(burst.burst_7, 0) as burst_7, coalesce(wl.waiting, 0) as waiting,
      coalesce(moder.prior_180, 0) as prior_180, coalesce(moder.suspended, false) as suspended,
      coalesce(moder.restricted, false) as restricted
    from neon_auth."user" u
      left join res on res.user_id = u.id
      left join burst on burst.user_id = u.id
      left join wl on wl.user_id = u.id
      left join moder on moder.user_id = u.id
    where ${single ? "u.id::text = $1::text" : "res.user_id is not null or wl.user_id is not null or moder.user_id is not null"}`;
}
