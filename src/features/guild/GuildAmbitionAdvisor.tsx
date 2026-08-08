"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getGuildCreatureRecommendations } from "@/data/guildAmbitionRecommendations";
import {
  getGuildRequesterTrustReward,
  getGuildRequesterTrustSummary,
  normalizeGuildContractRequester,
} from "@/data/guildRequesters";
import type { GameSave } from "@/types/save";

export function GuildAmbitionAdvisor({ save }: { save: GameSave }) {
  const [expanded, setExpanded] = useState(false);
  const [boardHost, setBoardHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const findBoard = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setBoardHost(document.querySelector<HTMLElement>('[data-contract-board="list"]'));
      });
    };
    findBoard();
    const observer = new MutationObserver(findBoard);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const recommendations = useMemo(
    () => (save.guild?.contracts ?? [])
      .filter((contract) => contract.status === "available" || contract.status === "accepted")
      .map((rawContract) => {
        const contract = normalizeGuildContractRequester(rawContract);
        return { contract, matches: getGuildCreatureRecommendations(save, contract, 1) };
      })
      .filter((entry) => entry.matches.length > 0)
      .sort((left, right) => {
        const acceptedDifference = Number(right.contract.status === "accepted") - Number(left.contract.status === "accepted");
        if (acceptedDifference) return acceptedDifference;
        return (right.matches[0]?.score ?? 0) - (left.matches[0]?.score ?? 0);
      })
      .slice(0, expanded ? 6 : 1),
    [expanded, save],
  );

  if (!boardHost) return null;

  return createPortal(
    <aside
      aria-label="Guild assignment recommendations"
      data-guild-ambition-advisor="true"
      style={{
        minWidth: 0,
        alignSelf: "start",
        maxHeight: "100%",
        border: "1px solid rgba(245,201,128,.42)",
        borderRadius: 16,
        background: "rgba(17,15,18,.9)",
        color: "#fff7dd",
        boxShadow: "0 12px 30px rgba(0,0,0,.3)",
        overflow: "auto",
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
          cursor: "pointer",
        }}
      >
        <span>Recommended Assignments</span>
        <span>{expanded ? "Show Best" : "Show More"}</span>
      </button>
      <div style={{ display: "grid", gap: 8, padding: 10 }}>
        <small style={{ opacity: 0.7, lineHeight: 1.35 }}>
          Uses contract eligibility, Ambition progress, personality fit, Energy reserves, level, and Affection to suggest a creature. Recommendations never override contract rules.
        </small>
        {recommendations.length ? recommendations.map(({ contract, matches }) => {
          const recommendation = matches[0];
          return recommendation ? (
            <article key={contract.contractId} style={{ padding: 9, borderRadius: 11, background: "rgba(255,255,255,.05)" }}>
              <small style={{ display: "block", color: "#f5c980" }}>{contract.status === "accepted" ? "Accepted request" : contract.tier.toUpperCase()}</small>
              <strong style={{ display: "block" }}>{contract.title}</strong>
              <small style={{ display: "block", marginTop: 3, opacity: 0.78 }}>
                Requester: <strong>{contract.requesterName}</strong>
              </small>
              <small style={{ display: "block", opacity: 0.68 }} data-guild-requester-trust="true">
                {getGuildRequesterTrustSummary(save, contract)} · Completion +{getGuildRequesterTrustReward(contract)} Trust
              </small>
              <span style={{ display: "block", marginTop: 5 }}>
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
    </aside>,
    boardHost,
  );
}
