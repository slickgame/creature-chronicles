"use client";

import {
  getHallOfLegendsCandidates,
  getRanchLegacySummary,
} from "@/data/creatureLegacyRankings";
import { getHeirloomPassiveDefinition } from "@/data/creatureHeirloomEffects";
import {
  getCreatureHeirlooms,
  getHallOfLegendsEntries,
} from "@/data/creatureRetirement";
import { getRanchSocialSummary } from "@/data/creatureSocialSummary";
import { LegacyPrestigeBadge } from "./LegacyPrestigeBadge";
import type { GameSave } from "@/types/save";

export function LegacyOverviewPanel({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const summary = getRanchLegacySummary(save);
  const social = getRanchSocialSummary(save);
  const candidates = getHallOfLegendsCandidates(save, compact ? 3 : 5);
  const hallEntries = getHallOfLegendsEntries(save).slice(0, compact ? 3 : 6);
  const heirlooms = getCreatureHeirlooms(save).slice(0, compact ? 3 : 6);

  return (
    <section
      aria-label="Ranch Legacy overview"
      data-legacy-overview="true"
      style={{
        display: "grid",
        gap: 12,
        padding: compact ? 12 : 16,
        borderRadius: 16,
        border: "1px solid rgba(245,201,128,.28)",
        background: "rgba(10,12,18,.78)",
        color: "#fff7dd",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <small style={{ display: "block", color: "#f5c980", letterSpacing: ".1em", textTransform: "uppercase" }}>
            Creature Chronicles Legacy
          </small>
          <strong style={{ display: "block", fontSize: compact ? 16 : 20 }}>Ranch history at a glance</strong>
        </div>
        <LegacyPrestigeBadge save={save} compact={compact} />
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
        <Metric label="Chronicle Entries" value={summary.chronicleEntries} />
        <Metric label="Ambitions Fulfilled" value={summary.fulfilledAmbitions} />
        <Metric label="Hall Candidates" value={summary.hallEligibleCreatures} />
        <Metric label="Hall Inductees" value={summary.hallInductedCreatures} />
        <Metric label="Retired Legends" value={summary.retiredCreatures} />
        <Metric label="Heirlooms" value={summary.heirlooms} />
        <Metric label="Social Bonds" value={social.totalRelationships} />
        <Metric label="Daily Stories" value={social.dailyStories} />
      </div>

      {summary.topCreature ? (
        <div style={{ padding: 10, borderRadius: 12, background: "rgba(245,201,128,.08)" }}>
          <small style={{ display: "block", opacity: 0.68 }}>Highest all-time Legacy score</small>
          <strong>
            {summary.topCreature.creature.nickname} · {summary.topCreature.title}
            {summary.topCreature.inductedIntoHall ? " · Hall Legend" : summary.topCreature.retired ? " · Retired" : ""}
          </strong>
          <span style={{ display: "block", opacity: 0.76 }}>
            Score {summary.topCreature.legacyScore} · Known for {summary.topCreature.strongestContribution}
          </span>
        </div>
      ) : null}

      {social.strongestBond ? (
        <div
          data-legacy-social-summary="true"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
            gap: 8,
            padding: 10,
            borderRadius: 12,
            background: "rgba(236,171,211,.08)",
          }}
        >
          <div>
            <small style={{ display: "block", opacity: .68 }}>Strongest current bond</small>
            <strong>{social.strongestBond.leftName} &amp; {social.strongestBond.rightName}</strong>
            <span style={{ display: "block", opacity: .76, textTransform: "capitalize" }}>
              {social.strongestBond.label} · {social.strongestBond.affinity > 0 ? "+" : ""}{social.strongestBond.affinity}
            </span>
          </div>
          <Metric label="Friendships" value={social.friendships} />
          <Metric label="Family Bonds" value={social.familyBonds} />
          <Metric label="Rivalries" value={social.rivalries} />
        </div>
      ) : null}

      {hallEntries.length ? (
        <div data-hall-of-legends="true" style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 14, color: "#ffe4a8" }}>Hall of Legends</strong>
          {hallEntries.map((entry) => (
            <div
              key={entry.hallEntryId}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 8,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(245,201,128,.24)",
                background: "rgba(245,201,128,.08)",
              }}
            >
              <span>✦</span>
              <span>
                <strong style={{ display: "block" }}>{entry.creatureName}</strong>
                <small style={{ opacity: .72 }}>
                  {entry.legacyTitle} · inducted Day {entry.inductedAtDayNumber}
                </small>
              </span>
              <strong>{entry.legacyScore}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {heirlooms.length ? (
        <div data-legacy-heirloom-collection="true" style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 14 }}>Heirloom collection</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 7 }}>
            {heirlooms.map((heirloom) => {
              const passive = getHeirloomPassiveDefinition(heirloom.category);
              return (
                <div
                  key={heirloom.heirloomId}
                  data-heirloom-passive="true"
                  style={{
                    padding: 9,
                    borderRadius: 10,
                    border: "1px solid rgba(127,219,255,.16)",
                    background: "rgba(127,219,255,.06)",
                  }}
                >
                  <strong style={{ display: "block" }}>{heirloom.name}</strong>
                  <small style={{ display: "block", opacity: .7 }}>
                    {heirloom.category} · {heirloom.legacyPrestigeValue} Prestige
                  </small>
                  <small style={{ display: "block", marginTop: 5, color: "#d9f4ff" }}>
                    {passive.name} — {passive.trigger}
                  </small>
                  <small style={{ display: "block", marginTop: 2, opacity: .72 }}>
                    {passive.effect}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!compact || candidates.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 14 }}>Active Hall of Legends candidates</strong>
          {candidates.length ? candidates.map((candidate, index) => (
            <div
              key={candidate.creature.creatureId}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 8,
                alignItems: "center",
                padding: "7px 9px",
                borderRadius: 10,
                background: "rgba(255,255,255,.04)",
              }}
            >
              <span>#{index + 1}</span>
              <span>
                <strong style={{ display: "block" }}>{candidate.creature.nickname}</strong>
                <small style={{ opacity: 0.7 }}>{candidate.title} · {candidate.strongestContribution}</small>
              </span>
              <strong>{candidate.legacyScore}</strong>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.68 }}>No active creature has reached Hall candidacy yet.</p>}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 9, borderRadius: 11, border: "1px solid rgba(255,255,255,.1)" }}>
      <strong style={{ display: "block", fontSize: 18 }}>{value.toLocaleString()}</strong>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
    </div>
  );
}
