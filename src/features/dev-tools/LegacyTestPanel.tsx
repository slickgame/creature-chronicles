"use client";

import { useMemo, useState } from "react";
import {
  prepareLegacyHallCandidate,
  prepareLegacyRetirementCandidate,
} from "@/data/legacyDevTools";
import { getCreatureLegacyProfile } from "@/data/creatureLegacyRankings";
import {
  getCreatureHeirlooms,
  getHallOfLegendsEntries,
  getRetiredCreatureRecords,
  getRetirementEligibility,
} from "@/data/creatureRetirement";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export function LegacyTestPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [message, setMessage] = useState(
    "Use a fresh dev creature to test retirement and Hall flows without grinding progression first.",
  );

  const activeCreatures = currentSave?.creatures ?? [];
  const effectiveCreatureId =
    selectedCreatureId && activeCreatures.some((creature) => creature.creatureId === selectedCreatureId)
      ? selectedCreatureId
      : activeCreatures[0]?.creatureId ?? null;
  const selectedCreature = effectiveCreatureId
    ? activeCreatures.find((creature) => creature.creatureId === effectiveCreatureId) ?? null
    : null;

  const eligibility = useMemo(
    () =>
      currentSave && effectiveCreatureId
        ? getRetirementEligibility(currentSave, effectiveCreatureId)
        : null,
    [currentSave, effectiveCreatureId],
  );
  const profile = useMemo(
    () =>
      currentSave && selectedCreature
        ? getCreatureLegacyProfile(currentSave, selectedCreature)
        : null,
    [currentSave, selectedCreature],
  );

  if (!currentSave) return null;
  const activeSave = currentSave;
  const retiredCount = getRetiredCreatureRecords(activeSave).length;
  const heirloomCount = getCreatureHeirlooms(activeSave).length;
  const hallCount = getHallOfLegendsEntries(activeSave).length;

  function apply(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  return (
    <section
      data-legacy-test-lab="true"
      style={{
        width: "min(1180px, calc(100% - 24px))",
        margin: "18px auto",
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(245,201,128,.28)",
        background: "linear-gradient(145deg,rgba(44,31,16,.94),rgba(8,14,18,.96))",
        color: "#fff7dd",
        boxShadow: "0 18px 50px rgba(0,0,0,.28)",
      }}
      aria-labelledby="legacy-test-title"
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#f5c980",
              fontWeight: 900,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              fontSize: ".72rem",
            }}
          >
            Home QA Controls
          </p>
          <h2 id="legacy-test-title" style={{ margin: "4px 0 5px" }}>Legacy Test Lab</h2>
          <span style={{ opacity: .76 }}>
            Prepare a real creature for the normal player-facing retirement, Heirloom, and Hall flows.
          </span>
        </div>
        <strong
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(245,201,128,.13)",
            color: "#ffe4a8",
            fontSize: ".76rem",
          }}
        >
          {activeCreatures.length} ACTIVE · {retiredCount} RETIRED · {hallCount} HALL
        </strong>
      </header>

      <p
        role="status"
        style={{
          margin: "14px 0",
          padding: 10,
          borderRadius: 11,
          background: "rgba(127,219,255,.09)",
          color: "#d9f4ff",
        }}
      >
        {message}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        <label
          style={{
            display: "grid",
            gap: 6,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,.045)",
          }}
        >
          <strong>Test creature</strong>
          <select
            value={effectiveCreatureId ?? ""}
            onChange={(event) => setSelectedCreatureId(event.target.value as CreatureId)}
            style={{ minHeight: 42, borderRadius: 9, padding: "0 10px" }}
          >
            {activeCreatures.length === 0 ? <option value="">No active creatures</option> : null}
            {activeCreatures.map((creature) => (
              <option key={creature.creatureId} value={creature.creatureId}>
                {creature.nickname} · Lv. {creature.level}
              </option>
            ))}
          </select>
          <small style={{ opacity: .68 }}>
            For the cleanest test, add a fresh creature from Dev Tools → Add Test Data first.
          </small>
        </label>

        <Metric label="Level" value={selectedCreature?.level ?? "—"} />
        <Metric label="Legacy Score" value={profile?.legacyScore ?? "—"} />
        <Metric label="Legacy Title" value={profile?.title ?? "—"} />
        <Metric label="Hall Eligible" value={profile?.hallEligible ? "Yes" : "No"} />
        <Metric label="Heirlooms" value={heirloomCount} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          disabled={!effectiveCreatureId}
          onClick={() =>
            effectiveCreatureId &&
            apply(prepareLegacyRetirementCandidate(activeSave, effectiveCreatureId))
          }
          style={buttonStyle}
        >
          Prepare Retirement Candidate
        </button>
        <button
          type="button"
          disabled={!effectiveCreatureId}
          onClick={() =>
            effectiveCreatureId && apply(prepareLegacyHallCandidate(activeSave, effectiveCreatureId))
          }
          style={primaryButtonStyle}
        >
          Prepare Hall-Ready Candidate
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        <div style={noteStyle}>
          <strong>Current retirement status</strong>
          <p style={{ margin: "5px 0 0", opacity: .78 }}>
            {eligibility?.eligible
              ? "Ready. Open this creature's Legacy profile and use Retire & Create Heirloom."
              : eligibility?.reasons.join(" ") || "Choose an active creature."}
          </p>
        </div>
        <div style={noteStyle}>
          <strong>Hall test</strong>
          <p style={{ margin: "5px 0 0", opacity: .78 }}>
            Hall-ready preset gives the selected creature a deterministic veteran Career Record. Then use
            Retire & Induct into Hall from the real Legacy profile so confirmation, removal, archive,
            Heirloom, Chronicle, and persistence are all exercised together.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid rgba(255,255,255,.09)",
        borderRadius: 12,
        background: "rgba(0,0,0,.16)",
      }}
    >
      <strong style={{ display: "block", fontSize: "1.05rem" }}>{value}</strong>
      <small style={{ opacity: .68 }}>{label}</small>
    </div>
  );
}

const noteStyle = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(245,201,128,.16)",
  background: "rgba(245,201,128,.055)",
} as const;

const buttonStyle = {
  minHeight: 42,
  padding: "9px 14px",
  border: "1px solid rgba(127,219,255,.55)",
  borderRadius: 10,
  background: "linear-gradient(#d9f4ff,#67bfe7)",
  color: "#071923",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  ...buttonStyle,
  border: "1px solid rgba(245,201,128,.7)",
  background: "linear-gradient(#ffe3a6,#c98c35)",
  color: "#241507",
} as const;
