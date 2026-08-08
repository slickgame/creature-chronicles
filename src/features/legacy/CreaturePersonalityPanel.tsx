"use client";

import { getCreaturePersonalityProfile } from "@/data/creaturePersonalities";
import type { CreatureId } from "@/types/ids";
import type { RanchJobId } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

const JOB_LABELS: Record<RanchJobId, string> = {
  security_patrol: "Security Patrol",
  comfort_care: "Comfort Care",
  stable_production: "Stable Production",
  garden_tending: "Garden Tending",
  field_hauling: "Field Hauling",
};

type CreaturePersonalityPanelProps = {
  save: GameSave;
  creatureId: CreatureId;
  compact?: boolean;
};

function TagList({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.1)",
            fontSize: 12,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function CreaturePersonalityPanel({
  save,
  creatureId,
  compact = false,
}: CreaturePersonalityPanelProps) {
  const profile = getCreaturePersonalityProfile(save, creatureId);
  const preferredJobs = profile.preferredJobIds.map((jobId) => JOB_LABELS[jobId]);

  return (
    <section
      aria-label="Creature personality and preferences"
      data-legacy-panel="personality"
      style={{
        display: "grid",
        gap: compact ? 8 : 12,
        padding: compact ? 12 : 14,
        borderRadius: 14,
        border: "1px solid rgba(155,214,255,.25)",
        background: "linear-gradient(145deg,rgba(35,54,72,.72),rgba(18,24,33,.78))",
        color: "#eff8ff",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <small style={{ display: "block", opacity: .66, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Personality
          </small>
          <strong style={{ display: "block", fontSize: compact ? 16 : 20 }}>{profile.displayName}</strong>
        </div>
        <span style={{ fontSize: 12, opacity: .76, textTransform: "capitalize" }}>
          {profile.socialStyle.replaceAll("_", " ")}
        </span>
      </header>

      <p style={{ margin: 0, lineHeight: 1.45, opacity: .86 }}>{profile.description}</p>

      <section>
        <strong style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#9bd6ff" }}>
          Preferred Ranch Work
        </strong>
        <TagList items={preferredJobs} />
      </section>

      {!compact ? (
        <>
          <section>
            <strong style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#9bd6ff" }}>
              Values
            </strong>
            <TagList items={profile.values} />
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            <section style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,.045)" }}>
              <strong style={{ display: "block", marginBottom: 5, fontSize: 12 }}>Likes</strong>
              <span style={{ fontSize: 13, opacity: .82 }}>{profile.likes.join(" · ")}</span>
            </section>
            <section style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,.045)" }}>
              <strong style={{ display: "block", marginBottom: 5, fontSize: 12 }}>Dislikes</strong>
              <span style={{ fontSize: 13, opacity: .82 }}>{profile.dislikes.join(" · ")}</span>
            </section>
          </div>
          <small style={{ opacity: .68 }}>
            Preferred Guild work: {profile.preferredGuildCategories.join(", ")}. Preferred training themes: {profile.preferredTrainingTags.join(", ")}.
          </small>
        </>
      ) : null}
    </section>
  );
}
