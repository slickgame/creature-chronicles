"use client";

import { useEffect, useMemo, useState } from "react";
import { GameDialog } from "@/features/ui/GameDialog";
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
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveId } from "@/types/battle";
import type { CreatureId } from "@/types/ids";

const FALLBACK_IMAGE = "/images/ui/icons/icon_paw_crest.png";

const panel = {
  border: "1px solid rgba(245,201,128,.42)",
  borderRadius: 10,
  background: "#f4e7c8",
  color: "#3a2917",
} as const;

const button = {
  minHeight: 36,
  padding: "8px 11px",
  border: "1px solid rgba(245,201,128,.62)",
  borderRadius: 8,
  background: "linear-gradient(#fff1bd,#d5a24d)",
  color: "#21130c",
  fontWeight: 900,
  cursor: "pointer",
} as const;

function moveNumbers(moveId: BattleMoveId): string {
  const move = getBattleMove(moveId);
  return `${move.category} · ${move.targetType.replaceAll("_", " ")} · PWR ${move.power} · ACC ${move.accuracy}% · BE ${move.battleEnergyCost} · CD ${move.cooldown}`;
}

export function BattleMoveTrainingOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [replaceEquippedMoveId, setReplaceEquippedMoveId] = useState<BattleMoveId | "">("");
  const [replaceLearnedMoveId, setReplaceLearnedMoveId] = useState<BattleMoveId | "">("");
  const [message, setMessage] = useState("Choose a creature and configure its permanent move library.");

  const creatures = currentSave?.creatures ?? [];
  const selectedCreature = creatures.find((creature) => creature.creatureId === selectedCreatureId) ?? creatures[0] ?? null;
  const loadout = selectedCreature ? getCreatureBattleMoveLoadout(selectedCreature) : null;
  const options = useMemo(
    () => selectedCreature ? getBattleMoveTrainingOptions(selectedCreature) : [],
    [selectedCreature],
  );
  const learned = options.filter((option) => option.learned);
  const unlearned = options.filter((option) => !option.learned);
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual") ?? null;
  const manualStock = currentSave && manual ? getBattleOutfitterStock(currentSave, manual) : 0;

  useEffect(() => {
    setReplaceEquippedMoveId("");
    setReplaceLearnedMoveId("");
  }, [selectedCreatureId]);

  if (!open || !currentSave) return null;
  const activeSave = currentSave;

  function applyResult(result: BattleOutfitterResult) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function teach(moveId: BattleMoveId, requiresReplacement: boolean) {
    if (!selectedCreature) return;
    if (requiresReplacement && !replaceLearnedMoveId) {
      setMessage("The learned library is full. Choose one non-protected learned move to replace.");
      return;
    }
    const result = teachBattleMoveWithFocusManual(
      activeSave,
      selectedCreature.creatureId,
      moveId,
      requiresReplacement ? replaceLearnedMoveId || undefined : undefined,
    );
    applyResult(result);
    if (result.ok) setReplaceLearnedMoveId("");
  }

  function equip(moveId: BattleMoveId) {
    if (!selectedCreature || !loadout) return;
    const full = loadout.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES;
    if (full && !replaceEquippedMoveId) {
      setMessage("The active loadout is full. Choose one equipped move to replace.");
      return;
    }
    const result = equipCreatureBattleMove(
      activeSave,
      selectedCreature.creatureId,
      moveId,
      full ? replaceEquippedMoveId || undefined : undefined,
    );
    applyResult(result);
    if (result.ok) setReplaceEquippedMoveId("");
  }

  function unequip(moveId: BattleMoveId) {
    if (!selectedCreature) return;
    applyResult(unequipCreatureBattleMove(activeSave, selectedCreature.creatureId, moveId));
  }

  const protectedMoveIds = new Set<BattleMoveId>([
    "strike",
    ...(selectedCreature ? [getBattleMoveTrainingOptions(selectedCreature).find((option) => option.move.rarity === "signature")?.move.id].filter((id): id is BattleMoveId => Boolean(id)) : []),
  ]);
  const replaceableLearnedIds = loadout?.learnedMoveIds.filter((moveId) => !protectedMoveIds.has(moveId)) ?? [];

  return (
    <GameDialog title="Move Training" onClose={onClose} wide>
      <p role="status">{message}</p>
        <div style={{ display: "flex", gap: 8, padding: 10, overflowX: "auto", borderBottom: "1px solid rgba(245,201,128,.2)", background: "rgba(0,0,0,.2)" }}>
          {creatures.map((creature) => {
            const variant = getVariantDefinition(creature.variantId);
            const creatureLoadout = getCreatureBattleMoveLoadout(creature);
            const selected = creature.creatureId === selectedCreature?.creatureId;
            return <button key={creature.creatureId} type="button" onClick={() => setSelectedCreatureId(creature.creatureId)} style={{ ...button, minWidth: 188, display: "grid", gridTemplateColumns: "48px minmax(0,1fr)", alignItems: "center", gap: 8, textAlign: "left", background: selected ? "linear-gradient(#ffe3a0,#ca8d32)" : "#f4e7c8", color: selected ? "#21130c" : "#3a2917" }}><img src={creature.portraitPath || variant.portraitPath || FALLBACK_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} style={{ width: 48, height: 48, objectFit: "contain" }} /><span><strong style={{ display: "block" }}>{creature.nickname}</strong><small style={{ display: "block" }}>{creatureLoadout.learnedMoveIds.length}/{MAX_LEARNED_BATTLE_MOVES} learned · {creatureLoadout.equippedMoveIds.length}/{MAX_EQUIPPED_BATTLE_MOVES} equipped</small></span></button>;
          })}
        </div>

        <div style={{ minWidth: 0, padding: "12px 0" }}>
          {selectedCreature && loadout ? <div style={{ display: "grid", gap: 18 }}>
            <section style={{ ...panel, padding: 13, background: "#e6d3a9" }} data-ui-text-box="auto">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, alignItems: "end" }}>
                <div><span style={{ color: "#635029", fontWeight: 900 }}>CURRENT CREATURE</span><h3 style={{ margin: "4px 0" }}>{selectedCreature.nickname}</h3><p style={{ margin: 0 }}>Focus Manuals owned: <strong>{manualStock}</strong></p></div>
                <label><span style={{ display: "block", color: "#635029", fontSize: 12, fontWeight: 900 }}>REPLACE EQUIPPED MOVE</span><select value={replaceEquippedMoveId} onChange={(event) => setReplaceEquippedMoveId(event.target.value as BattleMoveId | "")} style={{ width: "100%", minHeight: 38, borderRadius: 7, padding: 7, background: "#f8edcf", color: "#3a2917" }}><option value="">Choose active move</option>{loadout.equippedMoveIds.map((moveId) => <option key={moveId} value={moveId}>{getBattleMove(moveId).name}</option>)}</select></label>
                <label><span style={{ display: "block", color: "#635029", fontSize: 12, fontWeight: 900 }}>REPLACE LEARNED MOVE</span><select value={replaceLearnedMoveId} onChange={(event) => setReplaceLearnedMoveId(event.target.value as BattleMoveId | "")} style={{ width: "100%", minHeight: 38, borderRadius: 7, padding: 7, background: "#f8edcf", color: "#3a2917" }}><option value="">Choose learned move</option>{replaceableLearnedIds.map((moveId) => <option key={moveId} value={moveId}>{getBattleMove(moveId).name}</option>)}</select></label>
              </div>
            </section>

            <section><h3>Learned Library</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 10 }}>{learned.map((option) => <article key={option.move.id} style={{ ...panel, padding: 12, background: option.equipped ? "#cdd9ae" : "#eeddbc" }} data-ui-text-box="auto"><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{option.move.name}</strong><span style={{ color: option.equipped ? "#28623a" : "#635029", fontWeight: 900 }}>{option.equipped ? "EQUIPPED" : "LEARNED"}</span></div><p style={{ margin: "7px 0" }}>{option.move.description}</p><small style={{ display: "block", color: "#635029", marginBottom: 9 }}>{moveNumbers(option.move.id)}</small><button type="button" style={button} onClick={() => option.equipped ? unequip(option.move.id) : equip(option.move.id)}>{option.equipped ? "Unequip" : loadout.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES ? "Replace Selected Active Move" : "Equip"}</button></article>)}</div></section>

            <section><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><h3>Compatible Unlearned Techniques</h3><span style={{ color: "#635029", fontWeight: 900 }}>Library {loadout.learnedMoveIds.length}/{MAX_LEARNED_BATTLE_MOVES}</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 10 }}>{unlearned.map((option) => { const replacementMissing = option.requiresLibraryReplacement && !replaceLearnedMoveId; const disabled = manualStock <= 0 || Boolean(option.blockedReason) || !option.teachableByFocusManual || replacementMissing; return <article key={option.move.id} style={{ ...panel, padding: 12, background: "#eeddbc" }} data-ui-text-box="auto"><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{option.move.name}</strong><span style={{ color: "#635029", fontWeight: 900 }}>{option.move.sourceType.toUpperCase()}</span></div><p style={{ margin: "7px 0" }}>{option.move.description}</p><small style={{ display: "block", color: "#635029", marginBottom: 6 }}>{moveNumbers(option.move.id)}</small>{option.blockedReason ? <small style={{ display: "block", color: "#932e20", marginBottom: 7 }}>{option.blockedReason}</small> : option.requiresLibraryReplacement ? <small style={{ display: "block", color: "#635029", marginBottom: 7 }}>Choose a learned move to replace.</small> : null}<button type="button" style={{ ...button, opacity: disabled ? .5 : 1 }} disabled={disabled} onClick={() => teach(option.move.id, option.requiresLibraryReplacement)}>{option.requiresLibraryReplacement ? "Replace & Learn" : "Teach with Focus Manual"}</button></article>; })}</div></section>
          </div> : <p>No creature is available for move training.</p>}
        </div>
    </GameDialog>
  );
}
