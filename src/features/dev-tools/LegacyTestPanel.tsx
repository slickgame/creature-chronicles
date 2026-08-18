"use client";

import { useMemo, useState } from "react";
import {
  GUILD_TRUST_TEST_NPC_IDS,
  GUILD_TRUST_TEST_PRESETS,
  prepareGuildTrustPreset,
  prepareGuildTrustThresholdTest,
  prepareLegacyHallCandidate,
  prepareLegacyRetirementCandidate,
  prepareSeleneLineageQuestStage,
} from "@/data/legacyDevTools";
import { getCreatureLegacyProfile } from "@/data/creatureLegacyRankings";
import {
  getCreatureHeirlooms,
  getHallOfLegendsEntries,
  getRetiredCreatureRecords,
  getRetirementEligibility,
} from "@/data/creatureRetirement";
import { TOWN_NPCS, getNpcTrustRecord, getTrustTierLabel } from "@/data/townNpcs";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { TownNpcId } from "@/types/townNpc";

export function LegacyTestPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [selectedGuildNpcId, setSelectedGuildNpcId] = useState<TownNpcId>("mara_vell");
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
  const selectedGuildNpc = TOWN_NPCS[selectedGuildNpcId];
  const selectedGuildTrust = getNpcTrustRecord(activeSave, selectedGuildNpcId);

  function apply(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  return (
    <>
      <button
        type="button"
        data-legacy-test-launcher="true"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          top: 208,
          zIndex: 75,
          minWidth: 118,
          minHeight: 38,
          padding: "7px 12px",
          border: "1px solid rgba(245,201,128,.7)",
          borderRadius: 10,
          background: "linear-gradient(#ffe3a6,#c98c35)",
          color: "#241507",
          fontWeight: 950,
          boxShadow: "0 6px 18px rgba(0,0,0,.35)",
          cursor: "pointer",
        }}
      >
        Legacy Lab
      </button>

      {open ? (
        <div
          role="presentation"
          data-legacy-test-backdrop="true"
          onMouseDown={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 140,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(0,0,0,.76)",
            backdropFilter: "blur(5px)",
          }}
        >
          <section
            data-legacy-test-lab="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legacy-test-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "min(1180px, 100%)",
              maxHeight: "calc(100dvh - 36px)",
              overflow: "auto",
              padding: 18,
              borderRadius: 18,
              border: "1px solid rgba(245,201,128,.5)",
              background: "linear-gradient(145deg,rgba(44,31,16,.99),rgba(8,14,18,.99))",
              color: "#fff7dd",
              boxShadow: "0 24px 70px rgba(0,0,0,.62)",
            }}
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
                  Prepare real player-facing Legacy and Guild relationship states without grinding progression first.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    minHeight: 38,
                    padding: "7px 12px",
                    border: "1px solid rgba(255,255,255,.2)",
                    borderRadius: 10,
                    background: "rgba(255,255,255,.08)",
                    color: "#fff7dd",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
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

            <section data-legacy-retirement-test-section="true">
              <h3 style={sectionTitleStyle}>Creature Legacy</h3>
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

            <section
              data-guild-trust-test-lab="true"
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid rgba(245,201,128,.24)",
              }}
            >
              <h3 style={sectionTitleStyle}>Guild Trust Test Lab</h3>
              <p style={{ margin: "0 0 12px", opacity: .76, lineHeight: 1.4 }}>
                Set a named requester directly to a relationship tier, or prepare a real 18 → 20 Trust threshold test. The Request Board then uses the normal live contract, Trust, Chronicle, service-duration, and personal-request systems.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 12,
                }}
              >
                <label style={controlCardStyle}>
                  <strong>Guild requester</strong>
                  <select
                    data-guild-trust-test-npc="true"
                    value={selectedGuildNpcId}
                    onChange={(event) => setSelectedGuildNpcId(event.target.value as TownNpcId)}
                    style={{ minHeight: 42, borderRadius: 9, padding: "0 10px" }}
                  >
                    {GUILD_TRUST_TEST_NPC_IDS.map((npcId) => (
                      <option key={npcId} value={npcId}>
                        {TOWN_NPCS[npcId].name} · {TOWN_NPCS[npcId].title}
                      </option>
                    ))}
                  </select>
                  <small style={{ opacity: .68 }}>
                    Choose whose relationship progression should be prepared.
                  </small>
                </label>
                <Metric label="Current Trust" value={selectedGuildTrust.points} />
                <Metric label="Relationship" value={getTrustTierLabel(selectedGuildTrust.level)} />
                <Metric label="Requester" value={selectedGuildNpc.name} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  data-guild-trust-threshold-preset="true"
                  onClick={() => apply(prepareGuildTrustThresholdTest(activeSave, selectedGuildNpcId))}
                  style={primaryButtonStyle}
                >
                  Prepare 18 → 20 Threshold Test
                </button>
                {GUILD_TRUST_TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.points}
                    type="button"
                    data-guild-trust-preset={preset.points}
                    onClick={() => apply(prepareGuildTrustPreset(activeSave, selectedGuildNpcId, preset.points))}
                    style={buttonStyle}
                  >
                    {preset.label} · {preset.points}
                  </button>
                ))}
                <button
                  type="button"
                  data-guild-trust-preset={0}
                  onClick={() => apply(prepareGuildTrustPreset(activeSave, selectedGuildNpcId, 0))}
                  style={subtleButtonStyle}
                >
                  Reset Trust to 0
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <div style={noteStyle}>
                  <strong>Threshold test</strong>
                  <p style={{ margin: "5px 0 0", opacity: .78 }}>
                    This sets the selected NPC to 18 Trust and posts a harmless Bronze “Familiarity Test.” Complete it normally in Guild Hall → Request Board. The +2 Trust reward should trigger Familiar, a Relationship Deepened message, a Chronicle entry, and a personal request.
                  </p>
                </div>
                <div style={noteStyle}>
                  <strong>Tier presets</strong>
                  <p style={{ margin: "5px 0 0", opacity: .78 }}>
                    Familiar (20) unlocks personal requests, Trusted (50) raises their priority/rewards, Favored (90) upgrades them to Gold, and Confidant (140) adds the strongest bounded relationship rewards.
                  </p>
                </div>
              </div>

              <div
                data-selene-lineage-test-controls="true"
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: "1px solid rgba(127,219,255,.2)",
                  borderRadius: 12,
                  background: "rgba(127,219,255,.055)",
                }}
              >
                <strong style={{ color: "#bfeeff" }}>Selene personal lineage chain</strong>
                <p style={{ margin: "5px 0 10px", opacity: .78, lineHeight: 1.4 }}>
                  Jump directly to any live stage of Selene's three-part Trusted relationship chain. Stage 1 needs FER 7+, Stage 2 needs WIL 7+, and the Gold capstone needs a Rare or Epic creature.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[1, 2, 3].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      data-selene-lineage-stage={stage}
                      onClick={() => apply(prepareSeleneLineageQuestStage(activeSave, stage as 1 | 2 | 3))}
                      style={buttonStyle}
                    >
                      Prepare Selene Stage {stage}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      ) : null}
    </>
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

const sectionTitleStyle = {
  margin: "0 0 10px",
  color: "#ffe4a8",
} as const;

const controlCardStyle = {
  display: "grid",
  gap: 6,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,.045)",
} as const;

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

const subtleButtonStyle = {
  ...buttonStyle,
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)",
  color: "#fff7dd",
} as const;
