"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import {
  getHallOfLegendsEntries,
  getRetiredCreatureRecord,
  getRetiredCreatureRecords,
} from "@/data/creatureRetirement";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";
import { CreatureDetailWithMemories } from "./CreatureDetailWithMemories";
import { CreatureRetirementPanel } from "./CreatureRetirementPanel";

type LegacyCreatureProfileLauncherProps = {
  save: GameSave;
  creatures: CreatureRecord[];
  label?: string;
  title?: string;
  defaultCreatureId?: string | null;
  position?: "left" | "right";
};

export function LegacyCreatureProfileLauncher({
  save,
  creatures,
  label = "Legacy Profiles",
  title = "Creature Legacy Profiles",
  defaultCreatureId = null,
  position = "right",
}: LegacyCreatureProfileLauncherProps) {
  const { saveCurrentGame } = useGameContext();
  const allCreatures = useMemo(() => {
    const byId = new Map<string, CreatureRecord>();
    for (const creature of creatures) byId.set(String(creature.creatureId), creature);
    for (const retired of getRetiredCreatureRecords(save)) {
      byId.set(String(retired.creatureId), retired.creature);
    }
    return Array.from(byId.values());
  }, [creatures, save]);
  const hallIds = useMemo(
    () => new Set(getHallOfLegendsEntries(save).map((entry) => String(entry.creatureId))),
    [save],
  );
  const [open, setOpen] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(
    defaultCreatureId ?? allCreatures[0]?.creatureId ?? null,
  );

  useEffect(() => {
    if (!allCreatures.length) {
      setSelectedCreatureId(null);
      return;
    }
    if (!allCreatures.some((creature) => creature.creatureId === selectedCreatureId)) {
      setSelectedCreatureId(defaultCreatureId ?? allCreatures[0].creatureId);
    }
  }, [allCreatures, defaultCreatureId, selectedCreatureId]);

  const selectedCreature = useMemo(
    () =>
      allCreatures.find((creature) => creature.creatureId === selectedCreatureId) ??
      allCreatures[0] ??
      null,
    [allCreatures, selectedCreatureId],
  );

  if (!allCreatures.length) return null;

  return (
    <>
      <button
        type="button"
        data-legacy-profile-launcher="true"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          [position]: 18,
          bottom: 18,
          zIndex: 48,
          minHeight: 42,
          padding: "8px 15px",
          border: "2px solid #2a1b12",
          borderRadius: 12,
          background: "linear-gradient(#fff4cf,#d6a25b)",
          color: "#211208",
          fontWeight: 950,
          boxShadow: "0 4px 0 rgba(0,0,0,.42)",
        }}
      >
        {label}
      </button>

      {open ? (
        <div
          role="presentation"
          onMouseDown={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            display: "grid",
            placeItems: "center",
            padding: "max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
            background: "rgba(7,8,9,.84)",
            backdropFilter: "blur(8px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-legacy-profile-dialog="true"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "min(1220px, 100%)",
              maxHeight: "min(920px, 96vh)",
              display: "grid",
              gridTemplateRows: "auto minmax(0,1fr)",
              overflow: "hidden",
              border: "2px solid rgba(245,201,128,.64)",
              borderRadius: 22,
              background:
                "radial-gradient(circle at top right,rgba(245,201,128,.11),transparent 36%),linear-gradient(145deg,#2a1714,#111516)",
              color: "#fff7dd",
              boxShadow: "0 28px 70px rgba(0,0,0,.62)",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "14px 16px",
                borderBottom: "1px solid rgba(245,201,128,.24)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#f5c980",
                    fontSize: ".68rem",
                    fontWeight: 950,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  Living Ranch History
                </p>
                <h1 style={{ margin: "3px 0 0", fontSize: "clamp(1.35rem,3vw,2.2rem)" }}>
                  {title}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  minWidth: 42,
                  minHeight: 42,
                  border: "1px solid rgba(245,201,128,.34)",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.28)",
                  color: "#fff7dd",
                  fontSize: "1.35rem",
                  fontWeight: 900,
                }}
              >
                ×
              </button>
            </header>

            <div
              style={{
                minHeight: 0,
                display: "grid",
                gridTemplateColumns: "minmax(190px,260px) minmax(0,1fr)",
                gap: 12,
                padding: 12,
                overflow: "hidden",
              }}
            >
              <aside
                aria-label="Legacy creature roster"
                style={{
                  minHeight: 0,
                  overflow: "auto",
                  display: "grid",
                  alignContent: "start",
                  gap: 8,
                  paddingRight: 2,
                }}
              >
                {allCreatures.map((creature) => {
                  const variant = getVariantDefinition(creature.variantId);
                  const species = getSpeciesDefinition(creature.speciesId);
                  const selected = creature.creatureId === selectedCreature?.creatureId;
                  const retired = getRetiredCreatureRecord(save, creature.creatureId);
                  const hallLegend = hallIds.has(String(creature.creatureId));
                  return (
                    <button
                      key={creature.creatureId}
                      type="button"
                      onClick={() => setSelectedCreatureId(creature.creatureId)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "54px minmax(0,1fr)",
                        gap: 9,
                        alignItems: "center",
                        padding: 8,
                        textAlign: "left",
                        border: selected
                          ? "2px solid rgba(127,219,255,.9)"
                          : hallLegend
                            ? "1px solid rgba(245,201,128,.58)"
                            : "1px solid rgba(245,201,128,.24)",
                        borderRadius: 13,
                        background: selected
                          ? "rgba(86,199,255,.14)"
                          : retired
                            ? "rgba(245,201,128,.08)"
                            : "rgba(0,0,0,.22)",
                        color: "#fff7dd",
                      }}
                    >
                      <img
                        src={variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                        }}
                        style={{
                          width: 54,
                          height: 54,
                          objectFit: "contain",
                          borderRadius: 10,
                          background: "rgba(255,255,255,.04)",
                          filter: retired ? "sepia(.18) saturate(.84)" : undefined,
                        }}
                      />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {creature.nickname}{creature.shiny ? " ✦" : ""}
                        </strong>
                        <small style={{ display: "block", color: "#ead8b7", lineHeight: 1.35 }}>
                          {variant.name} {species.name} · Lv {creature.level}
                        </small>
                        <small
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: hallLegend
                              ? "rgba(245,201,128,.2)"
                              : retired
                                ? "rgba(127,219,255,.12)"
                                : "rgba(255,255,255,.06)",
                            color: hallLegend ? "#ffe4a8" : retired ? "#d9f4ff" : "#d8d0c2",
                          }}
                        >
                          {hallLegend ? "Hall Legend" : retired ? "Retired" : "Active"}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </aside>

              <div style={{ minHeight: 0, overflow: "auto", paddingRight: 2 }}>
                {selectedCreature ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <CreatureDetailWithMemories
                      save={save}
                      creature={selectedCreature}
                      dayNumber={save.dayState.dayNumber}
                      showActions={false}
                      statusNote={
                        getRetiredCreatureRecord(save, selectedCreature.creatureId)
                          ? "Retired Legacy profile: the complete career, personality, relationships, and memories remain permanently preserved."
                          : "Legacy profile: ambitions, personality, relationships, career records, and memories are shown below the standard creature details."
                      }
                      compactAmbition
                      compactCareer
                      compactPersonality
                      compactRelationships
                      relationshipLimit={5}
                      memoryLimit={8}
                    />
                    <CreatureRetirementPanel
                      save={save}
                      creature={selectedCreature}
                      onSave={(nextSave) => saveCurrentGame(nextSave)}
                      compact
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
