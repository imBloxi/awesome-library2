import { db } from "@/lib/db";
import { standingQuery, addActionQuery, liftQuery, historyQuery } from "./moderation-sql.mjs";
import { signalsQuery } from "./monitoring-sql.mjs";
import { assessMember, rankMembers } from "@/lib/monitoring.mjs";

// { block: { kind, reason, ends_at, created_at } | null, warning: { reason, created_at } | null }
export async function getStanding(userId) {
  const [row] = await db().query(standingQuery.text, [userId]);
  return { block: row?.block ?? null, warning: row?.warning ?? null };
}

export async function listModeration(userId, limit = 50) {
  return db().query(historyQuery.text, [String(userId), limit]);
}

// Returns the new row id, or null when the member doesn't exist.
export async function addModeration({ userId, kind, reason, days, actor }) {
  const [row] = await db().query(addActionQuery.text, [String(userId), kind, reason, days ?? null, String(actor.id), actor.email ?? null]);
  return row?.id ?? null;
}

export async function liftModeration({ userId, reason, actor }) {
  const rows = await db().query(liftQuery.text, [String(userId), String(actor.email ?? actor.id), reason]);
  return rows.length;
}

export async function getMemberSignals(userId) {
  const [row] = await db().query(signalsQuery({ single: true }), [String(userId)]);
  return row ? { ...row, assessment: assessMember(row) } : null;
}

export async function listMonitoredMembers() {
  return rankMembers(await db().query(signalsQuery()));
}
