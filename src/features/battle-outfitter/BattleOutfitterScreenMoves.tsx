"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
  type BattleOutfitterResult,
} from "@/data/battleOutfitter";
import {
  equipCreatureBattleMove,
  getBattleMoveTrainingOptions,
  teachBattleMoveWithFocusManual,
  unequipCreatureBattleMove,
} from "@/data/battleMoveTraining";
import {
  MAX_EQUIPPED_BATTLE_MOVES,
  MAX_LEARNED_BATTLE_MOVES,
  getCreatureBattleMoveLoadout,
} from "@/data/battleLoadouts";
import { getBattleMove } from "@/data/battleMoves";
import { getVariantDefinition } from "@/data/creatures";
import { BattleOutfitterScreen } from "./BattleOutfitterScreen";
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveId } from "@/types/battle";
import type { CreatureId } from "@/types/ids";

const FALLBACK_IMAGE = "/images/ui/icons/icon_paw_crest.png";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 240,
  display: "grid",
  placeItems: "center",
  padding: 18,
  background: "rgba(3, 5, 8, .86)",
  backdropFilter: "blur(8px)",
} as const;

const panelStyle = {
  border: "1px solid rgba(245, 201, 128, .42)",
  borderRadius: 12,
  background: "rgba(19, 12, 9, .94)",
  color: "#fff7dd",
  boxShadow: "0 20px 60px rgba(0,0,0,.55)",
} as const;

const buttonStyle = {
  minHeight: 38,
  padding: "8px 12px",
  border: "1px solid rgba(245, 201, 128, .62)",
  borderRadius: 8,
  background: "linear-gradient(#fff1bd, #d5a24d)",
  color: "#21130c",
  fontWeight: 900,
  cursor: "pointer",
} as const;

function moveSummary(moveId: BattleMoveId): string {
  const move = getBattleMove(moveId);
  return `${move.category} • ${move.targetType.replaceAll("_", " ")} • PWR ${move.power} • ACC ${move.accuracy}% • BE ${move.battleEnergyCost} • CD ${move.cooldown}`;
}

export function BattleOutfitterScreenMoves() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [replaceMoveId, setReplaceMoveId] = useState<BattleMoveId | "">("");
  const [message, setMessage] = useState("Select a creature to review learned and equipped moves.");

  const creatures = currentSave?.creatures ?? [];
  const selectedCreature =
    creatures.find((creature) => creature.creatureId === selectedCreatureId) ??
    creatures[0] ??
    null;
  const moveOptions = useMemo(
    () => selectedCreature ? getBattleMoveTrainingOptions(selectedCreature) : [],
    [selectedCreature],
  );
  const learnedOptions = moveOptions.filter((option) => option.learned);
  const teachableOptions = moveOptions.filter((option) => !option.learned);
  const loadout = selectedCreature ? getCreatureBattleMoveLoadout(selectedCreature) : null;
  const focusManual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual") ?? null;
  const manualStock = currentSave && focusManual
    ? getBattleOutfitterStock(currentSave, focusManual)
    : 0;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    setReplaceMoveId("");
  }, [selectedCreatureId]);

  function applyResult(result: BattleOutfitterResult) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function teachMove(moveId: BattleMoveId) {
    if (!currentSave || !selectedCreature) return;
    applyResult(
      teachBattleMoveWithFocusManual(
        currentSave,
        selectedCreature.creatureId,
        moveId,
      ),
    );
  }

  function equipMove(moveId: BattleMoveId) {
    if (!currentSave || !selectedCreature || !loadout) return;
    const loadoutFull = loadout.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES;
    if (loadoutFull && !replaceMoveId) {
      setMessage("The active loadout is full. Choose an equipped move to replace first.");
      return;
    }
    const result = equipCreatureBattleMove(
      currentSave,
      selectedCreature.creatureId,
      moveId,
      loadoutFull ? replaceMoveId || undefined : undefined,
    );
    applyResult(result);
    if (result.ok) setReplaceMoveId("");
  }

  function unequipMove(moveId: BattleMoveId) {
    if (!currentSave || !selectedCreature) return;
    applyResult(
      unequipCreatureBattleMove(
        currentSave,
        selectedCreature.creatureId,
        moveId,
      ),
    );
  }

  return (
    <>
      <BattleOutfitterScreen />
      {currentSave ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            ...buttonStyle,
            position: "fixed",
            left: 18,
            bottom: 18,
            zIndex: 170,
            minWidth: 154,
            boxShadow: "0 12px 30px rgba(0,0,0,.45)",
          }}
        >
          Move Training
        </button>
      ) : null}

      {open && currentSave ? (
        <div style={overlayStyle} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Battle move training"
            style={{
              ...panelStyle,
              width: "min(1180px, 96vw)",
              maxHeight: "92vh",
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
              overflow: "hidden",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(245,201,128,.28)" }}>
              <div>
                <p style={{ margin: 0, color: "#eebd68", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Battle M6</p>
                <h2 style={{ margin: "4px 0" }}>Move Training & Active Loadouts</h2>
                <p style={{ margin: 0, color: "#e8d7b5" }}>{message}</p>
              </div>
              <button type="button" style={buttonStyle} onClick={() => setOpen(false)}>Close</button>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)", minHeight: 0 }}>
              <aside style={{ padding: 12, borderRight: "1px solid rgba(245,201,128,.24)", overflowY: "auto", background: "rgba(0,0,0,.18)" }}>
                <p style={{ margin: "0 0 10px", color: "#eebd68", fontWeight: 900 }}>CREATURES</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {creatures.map((creature) => {
                    const variant = getVariantDefinition(creature.variantId);
                    const selected = selectedCreature?.creatureId === creature.creatureId;
                    const creatureLoadout = getCreatureBattleMoveLoadout(creature);
                    return (
                      <button
                        key={creature.creatureId}
                        type="button"
                        onClick={() => setSelectedCreatureId(creature.creatureId)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "54px minmax(0, 1fr)",
                          gap: 10,
                          alignItems: "center",
                          padding: 8,
                          border: selected ? "2px solid #f1c56f" : "1px solid rgba(245,201,128,.32)",
                          borderRadius: 10,
                          background: selected ? "rgba(129,83,31,.42)" : "rgba(0,0,0,.28)",
                          color: "#fff7dd",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={creature.portraitPath || variant.portraitPath || FALLBACK_IMAGE}
                          alt=""
                          onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                          style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 8 }}
                        />
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: "block" }}>{creature.nickname}</strong>
                          <small style={{ display: "block", color: "#d7c39e" }}>{variant.name} · Lv. {creature.level}</small>
                          <small style={{ display: "block", color: "#9ed7ff" }}>{creatureLoadout.learnedMoveIds.length}/{MAX_LEARNED_BATTLE_MOVES} learned · {creatureLoadout.equippedMoveIds.length}/{MAX_EQUIPPED_BATTLE_MOVES} equipped</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <main style={{ minWidth: 0, overflowY: "auto", padding: 16 }}>
                {selectedCreature && loadout ? (
                  <div style={{ display: "grid", gap: 18 }}>
                    <section style={{ ...panelStyle, padding: 14, boxShadow: "none", background: "rgba(36,25,17,.72)" }} data-ui-text-box="auto">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ margin: 0, color: "#eebd68", fontWeight: 900 }}>ACTIVE LOADOUT</p>
                          <h3 style={{ margin: "4px 0" }}>{selectedCreature.nickname}</h3>
                          <p style={{ margin: 0 }}>{loadout.equippedMoveIds.length}/{MAX_EQUIPPED_BATTLE_MOVES} equipped · {loadout.learnedMoveIds.length}/{MAX_LEARNED_BATTLE_MOVES} learned</p>
                        </div>
                        <div>
                          <label htmlFor="replace-move" style={{ display: "block", fontSize: 12, color: "#d7c39e", fontWeight: 900 }}>REPLACE WHEN FULL</label>
                          <select
                            id="replace-move"
                            value={replaceMoveId}
                            onChange={(event) => setReplaceMoveId(event.target.value as BattleMoveId | "")}
                            style={{ minHeight: 38, minWidth: 210, borderRadius: 8, padding: "6px 8px", background: "#1d1712", color: "#fff7dd", border: "1px solid rgba(245,201,128,.5)" }}
                          >
                            <option value="">Choose equipped move</option>
                            {loadout.equippedMoveIds.map((moveId) => <option key={moveId} value={moveId}>{getBattleMove(moveId).name}</option>)}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <h3 style={{ margin: "0 0 10px" }}>Learned Moves</h3>
                        <span style={{ color: "#9ed7ff" }}>Equipped moves are available in battle.</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 10 }}>
                        {learnedOptions.map((option) => (
                          <article key={option.move.id} style={{ ...panelStyle, padding: 12, boxShadow: "none", background: option.equipped ? "rgba(55,93,64,.45)" : "rgba(0,0,0,.25)" }} data-ui-text-box="auto">
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <strong>{option.move.name}</strong>
                              <span style={{ color: option.equipped ? "#9cf2ae" : "#d7c39e", fontWeight: 900 }}>{option.equipped ? "EQUIPPED" : "LEARNED"}</span>
                            </div>
                            <p style={{ margin: "7px 0", color: "#eadcc0" }}>{option.move.description}</p>
                            <small style={{ display: "block", color: "#9ed7ff", marginBottom: 9 }}>{moveSummary(option.move.id)}</small>
                            <button
                              type="button"
                              style={buttonStyle}
                              onClick={() => option.equipped ? unequipMove(option.move.id) : equipMove(option.move.id)}
                            >
                              {option.equipped ? "Unequip" : loadout.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES ? "Replace Selected Move" : "Equip"}
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                        <h3 style={{ margin: "0 0 10px" }}>Compatible Techniques</h3>
                        <span style={{ color: "#eebd68", fontWeight: 900 }}>Focus Manuals owned: {manualStock}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                        {teachableOptions.map((option) => (
                          <article key={option.move.id} style={{ ...panelStyle, padding: 12, boxShadow: "none", background: "rgba(0,0,0,.25)" }} data-ui-text-box="auto">
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <strong>{option.move.name}</strong>
                              <span style={{ color: "#d7c39e", fontWeight: 900 }}>{option.move.sourceType.toUpperCase()}</span>
                            </div>
                            <p style={{ margin: "7px 0", color: "#eadcc0" }}>{option.move.description}</p>
                            <small style={{ display: "block", color: "#9ed7ff", marginBottom: 6 }}>{moveSummary(option.move.id)}</small>
                            {option.blockedReason ? <small style={{ display: "block", color: "#ffb6a0", marginBottom: 8 }}>{option.blockedReason}</small> : null}
                            <button
                              type="button"
                              style={{ ...buttonStyle, opacity: manualStock <= 0 || Boolean(option.blockedReason) ? .55 : 1 }}
                              disabled={manualStock <= 0 || Boolean(option.blockedReason) || !option.teachableByFocusManual}
                              onClick={() => teachMove(option.move.id)}
                            >
                              Teach with Focus Manual
                            </button>
                          </article>
                        ))}
                        {teachableOptions.length === 0 ? <p>No additional compatible techniques are currently available.</p> : null}
                      </div>
                    </section>
                  </div>
                ) : (
                  <p>No creature is available for move training.</p>
                )}
              </main>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
