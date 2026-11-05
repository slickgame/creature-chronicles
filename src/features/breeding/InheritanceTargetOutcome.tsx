"use client";

import type { InheritanceTargetOutcome } from "@/types/breeding";
import s from "./InheritanceTargetOutcome.module.css";

const STATUS_LABELS: Record<InheritanceTargetOutcome["status"], string> = {
  passed: "Passed",
  missed: "Missed",
  "no-conception": "No inheritance roll",
};

export function InheritanceTargetOutcomeCard({
  outcome,
  detailed = false,
}: {
  outcome: InheritanceTargetOutcome;
  detailed?: boolean;
}) {
  const chance = outcome.chance > 0 && outcome.chance < 0.1
    ? "<0.1%"
    : `${Number(outcome.chance.toFixed(1))}%`;
  const actual = outcome.actualTalent;
  const actualLabel = actual && `${actual.name} · Grade ${actual.grade}`;
  return (
    <section className={s.card} data-outcome={outcome.status} aria-label="Recorded inheritance target">
      <div className={s.header}>
        <div className={s.target}><small>Inheritance target</small><strong>{outcome.label}</strong></div>
        <span className={s.badge}>{STATUS_LABELS[outcome.status]}</span>
      </div>
      {actual && (detailed || actual.origin === "mutation" || actualLabel !== outcome.label) && (
        <p className={s.detail}>{actualLabel}{actual.origin === "mutation" ? " · Mutation" : ""}</p>
      )}
      {outcome.status === "no-conception" && detailed && <p className={s.detail}>The attempt did not result in a pregnancy.</p>}
      {detailed && (
        <p className={s.detail}>Reviewed odds after conception · {chance}{outcome.target.kind === "move" ? " with a slot open" : " base odds"}.</p>
      )}
    </section>
  );
}
