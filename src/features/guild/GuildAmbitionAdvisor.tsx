"use client";

import { useMemo, useState } from "react";
import { getGuildCreatureRecommendations } from "@/data/guildAmbitionRecommendations";
import type { GameSave } from "@/types/save";

export function GuildAmbitionAdvisor({ save }: { save: GameSave }) {
  const [expanded, setExpanded] = useState(false);
  const recommendations = useMemo(
    () => (save.guild?.contracts ?? [])
      .filter((contract) => contract.status === "available" || contract.status === "accepted")
      .map((contract) => ({ contract, matches: getGuildCreatureRecommendations(save, contract, 1) }))
      .filter((entry) => entry.matches.length > 0)
      .sort((left, right) => {
        const acceptedDifference = Number(right.contract.status === "accepted") - Number(left.contract.status === "accepted");
        if (acceptedDifference) return acceptedDifference;
        return (right.matches[0]?.score ?? 0) - (left.matches[0]?.score ?? 0);
      })
      .slice(0, expanded ? 6 : 1),
    [expanded, save],
  );

  return (
    <aside
      aria-label="Guild ambition advisor"
      data-guild-ambition-advisor="true"
      style={{
        position: "fixed",
        right: 16,
        bottom: 80,
        zIndex: 60,
        width: "min(360px,calc(100vw - 32px))",
        border: "1px solid rgba(245,201,128,.42)",
        borderRadius: 16,
        background: "rgba(17,15,18,.94)",
        color: "#fff7dd",
        boxShadow: "0 18px 44px rgba(0,0,0,.48)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        style={{
          width: "100%",
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          border: 0,
          background: "rgba(245,201,128,.1)",
          color: "inherit",
          fontWeight: 900,
          textAlign: "left",
        }}
      >
        <span>Ambition Advisor</span>
        <span>{expanded ? "Hide" : "Best Match"}</span>
      </button>
      <div style={{ display: "grid", gap: 8, padding: 10 }}>
        {recommendations.length ? recommendations.map(({ contract, matches }) => {
          const recommendation = matches[0];
          return recommendation ? (
            <article key={contract.contractId} style={{ padding: 9, borderRadius: 11, background: "rgba(255,255,255,.05)" }}>
              <small style={{ display: "block", color: "#f5c980" }}>{contract.status === "accepted" ? "Accepted request" : contract.tier.toUpperCase()}</small>
              <strong style={{ display: "block" }}>{contract.title}</strong>
              <span style={{ display: "block", marginTop: 4 }}>
                Recommended: <strong>{recommendation.creature.nickname}</strong>
              </span>
              <small style={{ display: "block", opacity: 0.72 }}>
                {recommendation.ambitionName} · {recommendation.reasons.slice(0, 2).join(" • ")}
              </small>
            </article>
          ) : null;
        }) : (
          <p style={{ margin: 0, opacity: 0.72 }}>No current request has an eligible ranch creature.</p>
        )}
      </div>
    </aside>
  );
}
