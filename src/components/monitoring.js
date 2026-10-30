// Monitoring views shared by the admin screens. Every score is shown with the signals and
// evidence that produced it.
import { formatDate } from "@/components/ui";

const LEVEL_CLASS = { review: "badge-late", watch: "badge-ready", clear: "badge-done" };

export function LevelBadge({ assessment }) {
  return <span className={`badge ${LEVEL_CLASS[assessment.level]}`}>{assessment.levelLabel}</span>;
}

export function ScoreMeter({ score, level }) {
  return (
    <span className="score-meter" data-level={level} title={`Score ${score} of 100`}>
      <span className="score-meter-bar" aria-hidden="true"><span style={{ "--score": `${score}%` }} /></span>
      <span className="score-meter-value">{score}</span>
    </span>
  );
}

export function StandingBadge({ suspended, restricted, block }) {
  const kind = block?.kind ?? (suspended ? "suspend" : restricted ? "restrict" : null);
  if (!kind) return <span className="text-sm text-muted">Good standing</span>;
  return (
    <span className="badge badge-late">
      {kind === "suspend" ? "Suspended" : "Borrowing paused"}
      {block?.ends_at ? ` until ${formatDate(block.ends_at)}` : block ? ", no end date" : ""}
    </span>
  );
}

export function SignalList({ signals, compact = false }) {
  if (signals.length === 0) return <p className="text-sm text-muted">No signals. Nothing in this member&apos;s record stands out.</p>;
  if (compact) {
    return (
      <span className="signal-chips">
        {signals.map((s) => <span key={s.id} className="signal-chip" title={s.evidence}>{s.label} <b>+{s.points}</b></span>)}
      </span>
    );
  }
  return (
    <ul className="signal-list">
      {signals.map((s) => (
        <li key={s.id}>
          <span className="signal-points">+{s.points}</span>
          <span><strong>{s.label}</strong><span className="block text-sm text-muted">{s.evidence}</span></span>
        </li>
      ))}
    </ul>
  );
}

// The scoring rules in plain words, so a score is never a black box.
export function ScoringRules() {
  return (
    <details className="book-aside scoring-rules">
      <summary>How scores are calculated</summary>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li><strong>Overdue now</strong>: 25 points for one overdue loan, 10 more per extra loan, 10 more if the oldest is 14+ days late (max 50).</li>
        <li><strong>Returns late</strong>: with 3+ returns in 90 days, 15 points if a third came back late, 25 if two thirds did.</li>
        <li><strong>Holds not collected</strong>: 10 points for 2 expired holds in 90 days, 20 for 4 or more.</li>
        <li><strong>Frequent cancelling</strong>: 10 points for 5 cancellations in 30 days, 15 for 10 or more.</li>
        <li><strong>Rapid booking</strong>: 10 points for 5 reservations inside one hour in the last week, 20 for 8 or more.</li>
        <li><strong>Heavy waitlisting</strong>: 5 points when waiting for half the allowed books, 10 at three quarters.</li>
        <li><strong>At the limit</strong>: 5 points when holding all 10 reservations.</li>
        <li><strong>Recent staff action</strong>: 10 points per warning, restriction or suspension in 180 days (max 20).</li>
      </ul>
      <p className="mt-3 text-sm text-muted">Score is capped at 100. Watch from 20, needs review from 45. Scores never act on their own; only staff pause or suspend accounts, and the member sees every reason.</p>
    </details>
  );
}

export function LastActivity({ value }) {
  return <span className="text-sm text-muted tabular-nums">{value ? formatDate(value) : "None"}</span>;
}
