"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";
import { CreatureDetailWithMemories } from "./CreatureDetailWithMemories";

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
  const [open, setOpen] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(
    defaultCreatureId ?? creatures[0]?.creatureId ?? null,
  );

  useEffect(() => {
    if (!creatures.length) {
      setSelectedCreatureId(null);
      return;
    }
    if (!creatures.some((creature) => creature.creatureId === selectedCreatureId)) {
      setSelectedCreatureId(defaultCreatureId ?? creatures[0].creatureId);
    }
  }, [creatures, defaultCreatureId, selectedCreatureId]);

  const selectedCreature = useMemo(
    () =>
      creatures.find((creature) => creature.creatureId === selectedCreatureId) ??
      creatures[0] ??
      null,
    [creatures, selectedCreatureId],
  );

  if (!creatures.length) return null;

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
                {creatures.map((creature) => {
                  const variant = getVariantDefinition(creature.variantId);
                  const species = getSpeciesDefinition(creature.speciesId);
                  const selected = creature.creatureId === selectedCreature?.creatureId;
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
                          : "1px solid rgba(245,201,128,.24)",
                        borderRadius: 13,
                        background: selected ? "rgba(86,199,255,.14)" : "rgba(0,0,0,.22)",
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
                        }}
                      />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {creature.nickname}{creature.shiny ? " ✦" : ""}
                        </strong>
                        <small style={{ display: "block", color: "#ead8b7", lineHeight: 1.35 }}>
                          {variant.name} {species.name} · Lv {creature.level}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </aside>

              <div style={{ minHeight: 0, overflow: "auto", paddingRight: 2 }}>
                {selectedCreature ? (
                  <CreatureDetailWithMemories
                    save={save}
                    creature={selectedCreature}
                    dayNumber={save.dayState.dayNumber}
                    showActions={false}
                    statusNote="Legacy profile: ambitions, personality, relationships, career records, and memories are shown below the standard creature details."
                    compactAmbition
                    compactCareer
                    compactPersonality
                    compactRelationships
                    relationshipLimit={5}
                    memoryLimit={8}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
