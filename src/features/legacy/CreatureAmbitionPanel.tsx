"use client";

import { getCreatureAmbitionProgress } from "@/data/creatureAmbitions";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

type CreatureAmbitionPanelProps = {
  save: GameSave;
  creatureId: CreatureId;
  compact?: boolean;
};

export function CreatureAmbitionPanel({ save, creatureId, compact = false }: CreatureAmbitionPanelProps) {
  const ambition = getCreatureAmbitionProgress(save, creatureId);
  const { definition } = ambition;

  return (
    <section
      aria-label="Creature ambition"
      data-legacy-panel="ambition"
      style={{
        display: "grid",
        gap: compact ? 8 : 10,
        padding: compact ? 12 : 14,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(16, 20, 30, 0.72)",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            aria-hidden="true"
            style={{
              width: compact ? 34 : 42,
              height: compact ? 34 : 42,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <img src={definition.iconPath} alt="" style={{ width: "76%", height: "76%", objectFit: "contain" }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <small style={{ display: "block", opacity: 0.68, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Primary Ambition · {definition.category}
            </small>
            <strong style={{ display: "block", fontSize: compact ? 15 : 18 }}>{definition.name}</strong>
          </div>
        </div>
        <strong style={{ whiteSpace: "nowrap" }}>{ambition.percent}%</strong>
      </header>

      {!compact ? <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.45 }}>{definition.description}</p> : null}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
          <span>{definition.progressLabel}</span>
          <strong>{ambition.progress} / {ambition.target}</strong>
        </div>
        <div
          aria-label={`${definition.name} progress`}
          style={{ height: 9, overflow: "hidden", borderRadius: 999, background: "rgba(255,255,255,0.1)" }}
        >
          <span
            style={{ display: "block", width: `${ambition.percent}%`, height: "100%", borderRadius: 999, background: "currentColor" }}
          />
        </div>
      </div>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {definition.milestoneTargets.map((target) => {
          const reached = ambition.reachedMilestones.includes(target);
          return (
            <span
              key={target}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 12,
                opacity: reached ? 1 : 0.55,
                background: reached ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
              }}
            >
              {reached ? "✓" : "○"} {target}
            </span>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.72 }}>
          {ambition.completed ? "Ambition fulfilled" : ambition.nextMilestone ? `Next milestone: ${ambition.nextMilestone}` : "Final milestone reached"}
        </span>
      </footer>
    </section>
  );
}
