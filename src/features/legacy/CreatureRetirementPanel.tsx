"use client";

import { useMemo, useState } from "react";
import { getHeirloomPassiveDefinition } from "@/data/creatureHeirloomEffects";
import {
  getCreatureHeirlooms,
  getHallOfLegendsEntries,
  getRetiredCreatureRecord,
  getRetirementEligibility,
  inductRetiredCreatureIntoHall,
  retireCreature,
} from "@/data/creatureRetirement";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";

export function CreatureRetirementPanel({
  save,
  creature,
  onSave,
  compact = false,
}: {
  save: GameSave;
  creature: CreatureRecord;
  onSave: (save: GameSave) => void;
  compact?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const retired = getRetiredCreatureRecord(save, creature.creatureId);
  const eligibility = useMemo(
    () => getRetirementEligibility(save, creature.creatureId),
    [creature.creatureId, save],
  );
  const heirloom = retired
    ? getCreatureHeirlooms(save).find((entry) => entry.heirloomId === retired.heirloomId) ?? null
    : null;
  const heirloomPassive = heirloom ? getHeirloomPassiveDefinition(heirloom.category) : null;
  const hallEntry = getHallOfLegendsEntries(save).find(
    (entry) => entry.creatureId === creature.creatureId,
  );

  function confirmRetirement(inductIntoHall: boolean) {
    const action = inductIntoHall ? "retire and permanently induct" : "retire";
    const confirmed = window.confirm(
      `${action.replace(/^./, (letter) => letter.toUpperCase())} ${creature.nickname}?\n\n` +
        "Retirement removes this creature from active Ranch work, breeding, training, and battle rosters. " +
        "Their full profile, Memories, Career Record, Heirloom, and Legacy remain permanently available.",
    );
    if (!confirmed) return;
    const result = retireCreature(save, creature.creatureId, inductIntoHall);
    setMessage(result.message);
    if (result.ok) onSave(result.save);
  }

  function confirmHallInduction() {
    const confirmed = window.confirm(
      `Induct ${creature.nickname} into the Hall of Legends?\n\n` +
        "Hall induction is permanent and adds this retired creature to the ranch's official Legacy record.",
    );
    if (!confirmed) return;
    const result = inductRetiredCreatureIntoHall(save, creature.creatureId);
    setMessage(result.message);
    if (result.ok) onSave(result.save);
  }

  return (
    <section
      data-legacy-panel="retirement"
      style={{
        display: "grid",
        gap: 10,
        padding: compact ? 11 : 14,
        border: "1px solid rgba(245,201,128,.3)",
        borderRadius: 15,
        background: retired
          ? "linear-gradient(145deg,rgba(70,48,22,.34),rgba(12,16,18,.82))"
          : "rgba(10,13,18,.78)",
        color: "#fff7dd",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <small
            style={{
              display: "block",
              color: "#f5c980",
              fontWeight: 900,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Retirement &amp; Legacy
          </small>
          <strong style={{ display: "block", fontSize: compact ? 15 : 18 }}>
            {retired ? `${creature.nickname}'s permanent legacy` : "Conclude an active career"}
          </strong>
        </div>
        <span
          style={{
            alignSelf: "start",
            padding: "5px 8px",
            borderRadius: 999,
            background: hallEntry
              ? "rgba(245,201,128,.22)"
              : retired
                ? "rgba(127,219,255,.15)"
                : "rgba(255,255,255,.08)",
            color: hallEntry ? "#ffe4a8" : retired ? "#d9f4ff" : "#ead8b7",
            fontSize: ".7rem",
            fontWeight: 900,
          }}
        >
          {hallEntry ? "Hall Legend" : retired ? "Retired" : "Active"}
        </span>
      </header>

      {retired ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
              gap: 8,
            }}
          >
            <Metric label="Retirement Day" value={retired.retiredAtDayNumber} />
            <Metric label="Legacy Score" value={retired.legacyScore} />
            <Metric label="Ambitions" value={retired.fulfilledAmbitions} />
          </div>
          <div style={{ padding: 10, borderRadius: 11, background: "rgba(245,201,128,.08)" }}>
            <strong style={{ display: "block" }}>{retired.legacyTitle}</strong>
            <span style={{ display: "block", opacity: .74 }}>
              Remembered for {retired.strongestContribution}
            </span>
          </div>
          {heirloom ? (
            <div
              data-legacy-heirloom="true"
              style={{
                padding: 10,
                border: "1px solid rgba(245,201,128,.24)",
                borderRadius: 11,
                background: "rgba(0,0,0,.2)",
              }}
            >
              <small style={{ display: "block", color: "#f5c980" }}>Heirloom</small>
              <strong>{heirloom.name}</strong>
              <p style={{ margin: "4px 0 0", opacity: .76 }}>{heirloom.description}</p>
              <small style={{ display: "block", marginTop: 5, opacity: .68 }}>
                Preserves {heirloom.legacyPrestigeValue} Legacy Prestige
              </small>
              {heirloomPassive ? (
                <div
                  data-heirloom-passive="true"
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 9,
                    background: "rgba(127,219,255,.08)",
                    border: "1px solid rgba(127,219,255,.18)",
                  }}
                >
                  <small style={{ display: "block", color: "#d9f4ff" }}>
                    Permanent Passive · {heirloomPassive.name}
                  </small>
                  <strong style={{ display: "block", marginTop: 2 }}>{heirloomPassive.trigger}</strong>
                  <span style={{ display: "block", marginTop: 3, opacity: .76 }}>
                    {heirloomPassive.effect}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          {hallEntry ? (
            <div
              data-hall-of-legends-entry="true"
              style={{
                padding: 10,
                borderRadius: 11,
                border: "1px solid rgba(245,201,128,.38)",
                background: "rgba(245,201,128,.12)",
              }}
            >
              <strong style={{ display: "block", color: "#ffe4a8" }}>Hall of Legends Inductee</strong>
              <span style={{ opacity: .76 }}>
                Permanently inducted on Ranch Day {hallEntry.inductedAtDayNumber}.
              </span>
            </div>
          ) : eligibility.hallEligible ? (
            <button type="button" onClick={confirmHallInduction} style={primaryButtonStyle}>
              Induct into Hall of Legends
            </button>
          ) : (
            <p style={{ margin: 0, opacity: .7 }}>
              This retired profile remains preserved, but did not meet Hall eligibility at retirement.
            </p>
          )}
        </>
      ) : (
        <>
          <p style={{ margin: 0, opacity: .78, lineHeight: 1.45 }}>
            Retirement is permanent. The creature leaves all active systems, creates a career-based
            Heirloom, and remains viewable in Legacy Profiles and the Chronicle.
          </p>
          {eligibility.profile ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                gap: 8,
              }}
            >
              <Metric label="Legacy Score" value={eligibility.profile.legacyScore} />
              <Metric label="Ambitions" value={eligibility.profile.fulfilledAmbitions} />
              <Metric label="Hall Eligible" value={eligibility.hallEligible ? "Yes" : "No"} />
            </div>
          ) : null}
          {eligibility.reasons.length ? (
            <div style={{ padding: 10, borderRadius: 11, background: "rgba(255,130,130,.08)" }}>
              <strong style={{ display: "block", color: "#ffc1c1" }}>Not ready to retire</strong>
              {eligibility.reasons.map((reason) => (
                <span key={reason} style={{ display: "block", marginTop: 4, opacity: .78 }}>
                  {reason}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                onClick={() => confirmRetirement(false)}
                style={secondaryButtonStyle}
              >
                Retire &amp; Create Heirloom
              </button>
              {eligibility.hallEligible ? (
                <button
                  type="button"
                  onClick={() => confirmRetirement(true)}
                  style={primaryButtonStyle}
                >
                  Retire &amp; Induct into Hall
                </button>
              ) : null}
            </div>
          )}
        </>
      )}

      {message ? (
        <p
          role="status"
          style={{
            margin: 0,
            padding: 8,
            borderRadius: 9,
            background: "rgba(127,219,255,.09)",
            color: "#d9f4ff",
          }}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ padding: 8, border: "1px solid rgba(255,255,255,.1)", borderRadius: 10 }}>
      <strong style={{ display: "block" }}>{value}</strong>
      <small style={{ opacity: .68 }}>{label}</small>
    </div>
  );
}

const primaryButtonStyle = {
  minHeight: 40,
  padding: "8px 13px",
  border: "1px solid rgba(245,201,128,.7)",
  borderRadius: 10,
  background: "linear-gradient(#ffe3a6,#c98c35)",
  color: "#241507",
  fontWeight: 950,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: "1px solid rgba(127,219,255,.55)",
  background: "linear-gradient(#d9f4ff,#67bfe7)",
  color: "#071923",
} as const;
