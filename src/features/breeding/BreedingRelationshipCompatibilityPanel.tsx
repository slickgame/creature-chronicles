"use client";

import type { BreedingRelationshipCompatibility } from "@/data/creatureRelationshipGameplay";

export function BreedingRelationshipCompatibilityPanel({
  compatibility,
}: {
  compatibility: BreedingRelationshipCompatibility | null;
}) {
  if (!compatibility) {
    return (
      <section
        data-breeding-relationship-compatibility="unavailable"
        style={{
          display: "grid",
          gap: 3,
          padding: "8px 10px",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 11,
          background: "rgba(255,255,255,.04)",
        }}
      >
        <small
          style={{
            color: "#d7ccb9",
            fontSize: ".62rem",
            fontWeight: 950,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          Relationship Compatibility
        </small>
        <strong style={{ color: "#fff7dd" }}>Creature pairs only</strong>
        <span style={{ color: "#d7ccb9", fontSize: ".76rem", lineHeight: 1.3 }}>
          Select two creatures to compare their personalities and established bond.
        </span>
      </section>
    );
  }

  const positive = compatibility.score >= 1;
  const strained = compatibility.score < 0;
  const accent = positive ? "#a8efc2" : strained ? "#ffb3b3" : "#f5c980";

  return (
    <section
      data-breeding-relationship-compatibility="available"
      aria-label="Breeding relationship compatibility"
      style={{
        display: "grid",
        gap: 5,
        padding: "9px 10px",
        border: `1px solid ${positive ? "rgba(127,225,166,.4)" : strained ? "rgba(255,150,150,.38)" : "rgba(245,201,128,.38)"}`,
        borderRadius: 11,
        background: positive
          ? "rgba(76,177,112,.1)"
          : strained
            ? "rgba(190,72,72,.1)"
            : "rgba(245,201,128,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <small
          style={{
            color: "#e7c991",
            fontSize: ".62rem",
            fontWeight: 950,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          Relationship Compatibility
        </small>
        <strong style={{ color: accent }}>
          {compatibility.label} · {compatibility.score >= 0 ? "+" : ""}
          {compatibility.score}
        </strong>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 6,
        }}
      >
        <span style={{ color: "#f2dfbd", fontSize: ".72rem" }}>
          Personality {compatibility.personalityScore >= 0 ? "+" : ""}
          {compatibility.personalityScore}
        </span>
        <span style={{ color: "#f2dfbd", fontSize: ".72rem", textAlign: "right" }}>
          Bond {compatibility.affinity >= 0 ? "+" : ""}
          {compatibility.affinity}
        </span>
      </div>
      <p style={{ margin: 0, color: "#f2dfbd", fontSize: ".76rem", lineHeight: 1.35 }}>
        {compatibility.summary}
      </p>
      <small style={{ color: "#bfb4a3", lineHeight: 1.25 }}>
        Compatibility currently affects social aftermath, not pregnancy chance.
      </small>
    </section>
  );
}
