"use client";

import type { CSSProperties } from "react";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type CreatureCareerPanelProps = {
  save: GameSave;
  creatureId: CreatureId;
  compact?: boolean;
};

const shell: CSSProperties = {
  border: "1px solid rgba(245,201,128,.28)",
  borderRadius: 16,
  background: "rgba(0,0,0,.22)",
  padding: 12,
  color: "#fff7dd",
};

const groupStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
  gap: 8,
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid rgba(245,201,128,.2)",
        borderRadius: 12,
        padding: "9px 10px",
        background: "rgba(255,247,221,.05)",
      }}
    >
      <strong style={{ display: "block", fontSize: "1.08rem", color: "#fff7dd" }}>
        {value.toLocaleString()}
      </strong>
      <span style={{ color: "#e9d4ae", fontSize: ".72rem", fontWeight: 800 }}>{label}</span>
    </div>
  );
}

export function CreatureCareerPanel({ save, creatureId, compact = false }: CreatureCareerPanelProps) {
  const record = getCreatureCareerRecord(save, creatureId);
  const combat = [
    ["Battles", record.battlesEntered],
    ["Victories", record.victories],
    ["Knockouts", record.knockouts],
    ["Damage", record.damageDealt],
    ["Healing", record.healingDone],
    ["Allies Protected", record.alliesProtected],
  ] as const;
  const ranch = [
    ["Days Worked", record.daysWorked],
    ["Resources", record.resourcesProduced],
    ["Training", record.trainingSessionsCompleted],
    ["Guild Requests", record.guildRequestsCompleted],
  ] as const;
  const legacy = [
    ["Breeding Attempts", record.breedingAttempts],
    ["Offspring", record.offspringCount],
    ["Rare Offspring", record.rareOffspringCount],
    ["Epic Offspring", record.epicOffspringCount],
    ["Injuries", record.injuriesSuffered],
  ] as const;

  const renderGroup = (title: string, entries: readonly (readonly [string, number])[]) => (
    <section>
      <h4 style={{ margin: "0 0 8px", color: "#f5c980", fontSize: ".78rem" }}>{title}</h4>
      <div style={groupStyle}>
        {entries.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
      </div>
    </section>
  );

  return (
    <section style={shell} aria-label="Creature career record">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div>
          <p style={{ margin: 0, color: "#f5c980", fontSize: ".64rem", fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase" }}>
            Career Record
          </p>
          <h3 style={{ margin: "3px 0 0", fontSize: "1rem" }}>Lifetime accomplishments</h3>
        </div>
        <span style={{ color: "#d9c39e", fontSize: ".7rem" }}>
          Since Day {record.firstRecordedDayNumber}
        </span>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {renderGroup("Combat", compact ? combat.slice(0, 3) : combat)}
        {renderGroup("Ranch & Guild", compact ? ranch.slice(0, 2) : ranch)}
        {!compact ? renderGroup("Legacy", legacy) : null}
      </div>
    </section>
  );
}
