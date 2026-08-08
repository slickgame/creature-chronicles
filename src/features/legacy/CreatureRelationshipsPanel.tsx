"use client";

import {
  getCreatureRelationshipLabel,
  getRelationshipsForCreature,
} from "@/data/creatureRelationships";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

type CreatureRelationshipsPanelProps = {
  save: GameSave;
  creatureId: CreatureId;
  limit?: number;
  compact?: boolean;
};

export function CreatureRelationshipsPanel({
  save,
  creatureId,
  limit = 4,
  compact = false,
}: CreatureRelationshipsPanelProps) {
  const relationships = getRelationshipsForCreature(save, creatureId).slice(0, Math.max(1, limit));
  const namesById = new Map((save.creatures ?? []).map((creature) => [String(creature.creatureId), creature.nickname]));

  return (
    <section
      aria-label="Creature relationships"
      data-legacy-panel="relationships"
      style={{
        display: "grid",
        gap: 10,
        padding: compact ? 12 : 14,
        borderRadius: 14,
        border: "1px solid rgba(236,171,211,.26)",
        background: "linear-gradient(145deg,rgba(65,34,55,.7),rgba(24,19,30,.8))",
        color: "#fff0fa",
      }}
    >
      <header>
        <small style={{ display: "block", opacity: .66, letterSpacing: ".1em", textTransform: "uppercase" }}>
          Relationships
        </small>
        <strong style={{ display: "block", fontSize: compact ? 16 : 19 }}>Ranch bonds and rivalries</strong>
      </header>

      {relationships.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {relationships.map((relationship) => {
            const otherId = relationship.creatureIds.find((id) => id !== creatureId) ?? relationship.creatureIds[0];
            const otherName = namesById.get(String(otherId)) ?? "Former ranch creature";
            const percent = Math.max(0, Math.min(100, Math.round((relationship.affinity + 100) / 2)));
            return (
              <article
                key={relationship.relationshipId}
                style={{
                  display: "grid",
                  gap: 6,
                  padding: "9px 10px",
                  borderRadius: 11,
                  border: "1px solid rgba(255,255,255,.09)",
                  background: "rgba(255,255,255,.045)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <div>
                    <strong style={{ display: "block" }}>{otherName}</strong>
                    <span style={{ fontSize: 12, opacity: .75 }}>{getCreatureRelationshipLabel(relationship)}</span>
                  </div>
                  <strong style={{ fontSize: 13 }}>{relationship.affinity > 0 ? "+" : ""}{relationship.affinity}</strong>
                </div>
                <div
                  aria-label={`${otherName} relationship affinity`}
                  style={{ height: 7, overflow: "hidden", borderRadius: 999, background: "rgba(255,255,255,.08)" }}
                >
                  <span
                    style={{ display: "block", width: `${percent}%`, height: "100%", borderRadius: 999, background: "currentColor" }}
                  />
                </div>
                {!compact ? (
                  <small style={{ opacity: .68 }}>
                    {relationship.sharedEvents} shared events · {relationship.positiveEvents} positive · {relationship.negativeEvents} difficult
                  </small>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, opacity: .72 }}>
          No meaningful relationships have formed yet. Shared chores, battles, family events, and daily ranch moments will build them over time.
        </p>
      )}
    </section>
  );
}
