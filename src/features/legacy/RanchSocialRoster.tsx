"use client";

import { getCreaturePersonalityProfile } from "@/data/creaturePersonalities";
import {
  getCreatureRelationshipLabel,
  getRelationshipsForCreature,
} from "@/data/creatureRelationships";
import type { RanchJobId } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

const JOB_LABELS: Record<RanchJobId, string> = {
  security_patrol: "Security Patrol",
  comfort_care: "Comfort Care",
  stable_production: "Stable Production",
  garden_tending: "Garden Tending",
  field_hauling: "Field Hauling",
};

export function RanchSocialRoster({ save }: { save: GameSave }) {
  const creatures = save.creatures ?? [];
  const namesById = new Map(creatures.map((creature) => [String(creature.creatureId), creature.nickname]));

  return (
    <section
      aria-label="Ranch social roster"
      data-legacy-social-roster="true"
      style={{
        display: "grid",
        gap: 12,
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(155,214,255,.22)",
        background: "rgba(14,22,31,.78)",
      }}
    >
      <header>
        <small style={{ display: "block", color: "#9bd6ff", letterSpacing: ".1em", textTransform: "uppercase" }}>
          Living Ranch History
        </small>
        <strong style={{ display: "block", fontSize: 20 }}>Personalities and strongest bonds</strong>
        <p style={{ margin: "5px 0 0", opacity: .75 }}>
          Every creature develops stable preferences while shared work, battles, family events, and daily moments reshape their relationships.
        </p>
      </header>

      {creatures.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
          {creatures.map((creature) => {
            const personality = getCreaturePersonalityProfile(save, creature.creatureId);
            const strongestRelationship = getRelationshipsForCreature(save, creature.creatureId)[0];
            const otherId = strongestRelationship?.creatureIds.find((id) => id !== creature.creatureId);
            const otherName = otherId ? namesById.get(String(otherId)) ?? "Former ranch creature" : null;
            return (
              <article
                key={creature.creatureId}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.09)",
                  background: "rgba(255,255,255,.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <strong>{creature.nickname}</strong>
                  <span style={{ fontSize: 12, opacity: .7 }}>Lv. {creature.level}</span>
                </div>
                <div>
                  <span style={{ display: "block", color: "#9bd6ff", fontWeight: 800 }}>{personality.displayName}</span>
                  <small style={{ opacity: .72, textTransform: "capitalize" }}>{personality.socialStyle}</small>
                </div>
                <small style={{ lineHeight: 1.4, opacity: .78 }}>{personality.description}</small>
                <span style={{ fontSize: 12, opacity: .72 }}>
                  Prefers {personality.preferredJobIds.map((jobId) => JOB_LABELS[jobId]).join(" and ")}
                </span>
                {strongestRelationship && otherName ? (
                  <div style={{ paddingTop: 7, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                    <small style={{ display: "block", opacity: .62 }}>Strongest relationship</small>
                    <strong style={{ display: "block", fontSize: 14 }}>
                      {otherName} · {getCreatureRelationshipLabel(strongestRelationship)}
                    </strong>
                    <span style={{ fontSize: 12, opacity: .72 }}>
                      Affinity {strongestRelationship.affinity > 0 ? "+" : ""}{strongestRelationship.affinity} · {strongestRelationship.sharedEvents} shared events
                    </span>
                  </div>
                ) : (
                  <small style={{ opacity: .62 }}>No established bond yet.</small>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, opacity: .7 }}>No creatures currently live at the ranch.</p>
      )}
    </section>
  );
}
