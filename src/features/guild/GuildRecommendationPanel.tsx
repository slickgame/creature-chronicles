"use client";

import { getGuildCreatureRecommendations } from "@/data/guildAmbitionRecommendations";
import type { CreatureId } from "@/types/ids";
import type { GuildContract } from "@/types/guild";
import type { GameSave } from "@/types/save";

export function GuildRecommendationPanel({
  save,
  contract,
  selectedCreatureId,
  onSelect,
}: {
  save: GameSave;
  contract: GuildContract;
  selectedCreatureId: CreatureId | null;
  onSelect: (creatureId: CreatureId) => void;
}) {
  const recommendations = getGuildCreatureRecommendations(save, contract, 3);
  if (!recommendations.length) {
    return (
      <section data-guild-recommendations="empty" style={{ padding: 12, opacity: 0.72 }}>
        <strong>No eligible recommendation</strong>
        <p style={{ margin: "5px 0 0" }}>No current ranch creature satisfies this request.</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Recommended creatures for this Guild request"
      data-guild-recommendations="true"
      style={{ display: "grid", gap: 8 }}
    >
      <header>
        <small style={{ display: "block", opacity: 0.68, textTransform: "uppercase", letterSpacing: ".08em" }}>
          Ambition-aware recommendations
        </small>
        <strong>Best fits for this request</strong>
      </header>
      <div style={{ display: "grid", gap: 7 }}>
        {recommendations.map((recommendation, index) => {
          const selected = selectedCreatureId === recommendation.creature.creatureId;
          return (
            <button
              key={recommendation.creature.creatureId}
              type="button"
              onClick={() => onSelect(recommendation.creature.creatureId)}
              aria-pressed={selected}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: 10,
                textAlign: "left",
                borderRadius: 12,
                border: selected ? "1px solid rgba(245,201,128,.8)" : "1px solid rgba(255,255,255,.12)",
                background: selected ? "rgba(245,201,128,.12)" : "rgba(255,255,255,.04)",
                color: "inherit",
              }}
            >
              <span aria-hidden="true" style={{ fontWeight: 900 }}>#{index + 1}</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: "block" }}>{recommendation.creature.nickname}</strong>
                <small style={{ display: "block", opacity: 0.75 }}>
                  {recommendation.ambitionName} · {recommendation.ambitionPercent}% complete
                </small>
                <small style={{ display: "block", opacity: 0.62 }}>
                  {recommendation.reasons.slice(0, 2).join(" • ")}
                </small>
              </span>
              <strong>{recommendation.score}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
