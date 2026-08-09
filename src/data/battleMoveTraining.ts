import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
  type BattleOutfitterResult,
} from "@/data/battleOutfitter";
import {
  MAX_EQUIPPED_BATTLE_MOVES,
  MAX_LEARNED_BATTLE_MOVES,
  canSpeciesLearnBattleMove,
  equipBattleMove,
  forgetBattleMove,
  getCreatureBattleMoveLoadout,
  learnBattleMove,
  unequipBattleMove,
} from "@/data/battleLoadouts";
import { BATTLE_MOVES, getBattleMove } from "@/data/battleMoves";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import type { BattleMove, BattleMoveId, BattleMoveLoadout } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type BattleMoveTrainingOption = {
  move: BattleMove;
  learned: boolean;
  equipped: boolean;
  teachableByFocusManual: boolean;
  requiresLibraryReplacement: boolean;
  blockedReason: string | null;
};

const FOCUS_MANUAL_ID = "focus_manual";

function getFocusManualItem() {
  const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === FOCUS_MANUAL_ID);
  if (!item) throw new Error("Focus Manual is missing from Battle Outfitter data.");
  return item;
}

function updateCreatureRecord(
  save: GameSave,
  creatureId: CreatureId,
  update: (creature: CreatureRecord) => CreatureRecord,
): GameSave | null {
  const creatures = save.creatures ?? [];
  const index = creatures.findIndex((creature) => creature.creatureId === creatureId);
  if (index < 0) return null;
  const nextCreatures = [...creatures];
  nextCreatures[index] = update(creatures[index]);
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    creatures: nextCreatures,
    creatureIds: nextCreatures.map((creature) => creature.creatureId),
  };
}

function applyLoadout(
  save: GameSave,
  creatureId: CreatureId,
  loadout: BattleMoveLoadout,
): GameSave | null {
  return updateCreatureRecord(save, creatureId, (creature) => ({
    ...creature,
    battleMoveLoadout: loadout,
  }));
}

function canFocusManualTeach(move: BattleMove): boolean {
  if (move.sourceType === "combination") return false;
  if (move.sourceType === "event") return false;
  if (move.sourceType === "story") return false;
  if (move.sourceType === "coliseum") return false;
  if (move.sourceType === "talent") return false;
  if (move.rarity === "event" || move.rarity === "signature") return false;
  return true;
}

function getMoveTrainingUnavailableResult(
  save: GameSave,
  creature: CreatureRecord,
): BattleOutfitterResult | null {
  const reason = getTrainingUnavailableReason(save, creature.creatureId);
  if (!reason) return null;
  return {
    save,
    ok: false,
    message: `${creature.nickname} is unavailable for move training. ${reason}`,
  };
}

export function getBattleMoveTrainingOptions(
  creature: CreatureRecord,
): BattleMoveTrainingOption[] {
  const loadout = getCreatureBattleMoveLoadout(creature);
  const libraryFull = loadout.learnedMoveIds.length >= MAX_LEARNED_BATTLE_MOVES;
  return BATTLE_MOVES
    .filter((move) => canSpeciesLearnBattleMove(creature.speciesId, move.id))
    .map((move) => {
      const learned = loadout.learnedMoveIds.includes(move.id);
      const equipped = loadout.equippedMoveIds.includes(move.id);
      const teachableByFocusManual = !learned && canFocusManualTeach(move);
      let blockedReason: string | null = null;
      if (!learned && !teachableByFocusManual) {
        blockedReason =
          move.sourceType === "combination"
            ? "Combination moves must emerge through breeding."
            : `${move.sourceType} moves require their dedicated source.`;
      }
      return {
        move,
        learned,
        equipped,
        teachableByFocusManual,
        requiresLibraryReplacement: teachableByFocusManual && libraryFull,
        blockedReason,
      };
    })
    .sort((left, right) => {
      if (left.equipped !== right.equipped) return left.equipped ? -1 : 1;
      if (left.learned !== right.learned) return left.learned ? -1 : 1;
      return left.move.name.localeCompare(right.move.name);
    });
}

export function teachBattleMoveWithFocusManual(
  save: GameSave,
  creatureId: CreatureId,
  moveId: BattleMoveId,
  replaceLearnedMoveId?: BattleMoveId,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for move training." };
  const unavailable = getMoveTrainingUnavailableResult(save, creature);
  if (unavailable) return unavailable;

  const move = getBattleMove(moveId);
  if (!canFocusManualTeach(move)) {
    return {
      save,
      ok: false,
      message: `${move.name} cannot be learned from a standard Focus Manual.`,
    };
  }

  const currentLoadout = getCreatureBattleMoveLoadout(creature);
  if (currentLoadout.learnedMoveIds.includes(moveId)) {
    return { save, ok: false, message: `${creature.nickname} already knows ${move.name}.` };
  }

  const manual = getFocusManualItem();
  const stock = getBattleOutfitterStock(save, manual);
  if (stock <= 0) return { save, ok: false, message: "No Focus Manual is available." };

  let workingLoadout = currentLoadout;
  let replacementLabel = "";
  if (workingLoadout.learnedMoveIds.length >= MAX_LEARNED_BATTLE_MOVES) {
    if (!replaceLearnedMoveId) {
      return {
        save,
        ok: false,
        message: `The learned library is full. Choose one learned move to replace before teaching ${move.name}.`,
      };
    }
    const forgottenMove = getBattleMove(replaceLearnedMoveId);
    const forgotten = forgetBattleMove(
      creature.speciesId,
      workingLoadout,
      replaceLearnedMoveId,
    );
    if (!forgotten.ok) return { save, ok: false, message: forgotten.message };
    workingLoadout = forgotten.loadout;
    replacementLabel = ` ${forgottenMove.name} was forgotten.`;
  }

  const change = learnBattleMove(
    creature.speciesId,
    workingLoadout,
    moveId,
  );
  if (!change.ok) return { save, ok: false, message: change.message };

  const nextSave = applyLoadout(save, creatureId, change.loadout);
  if (!nextSave) return { save, ok: false, message: "Creature move library could not be updated." };

  return {
    save: {
      ...nextSave,
      flags: {
        ...nextSave.flags,
        [manual.flagKey]: stock - 1,
        mBattleMoveTraining: true,
      },
    },
    ok: true,
    message: `${creature.nickname} studied a Focus Manual and learned ${move.name}.${replacementLabel} ${change.loadout.learnedMoveIds.length}/${MAX_LEARNED_BATTLE_MOVES} moves learned.`,
  };
}

export function equipCreatureBattleMove(
  save: GameSave,
  creatureId: CreatureId,
  moveId: BattleMoveId,
  replaceMoveId?: BattleMoveId,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for move loadout editing." };
  const unavailable = getMoveTrainingUnavailableResult(save, creature);
  if (unavailable) return unavailable;

  const change = equipBattleMove(
    creature.speciesId,
    creature.battleMoveLoadout ?? {},
    moveId,
    replaceMoveId,
  );
  if (!change.ok) return { save, ok: false, message: change.message };

  const nextSave = applyLoadout(save, creatureId, change.loadout);
  if (!nextSave) return { save, ok: false, message: "Creature move loadout could not be updated." };
  return {
    save: {
      ...nextSave,
      flags: { ...nextSave.flags, mBattleMoveTraining: true },
    },
    ok: true,
    message: `${creature.nickname}: ${change.message} ${change.loadout.equippedMoveIds.length}/${MAX_EQUIPPED_BATTLE_MOVES} moves equipped.`,
  };
}

export function unequipCreatureBattleMove(
  save: GameSave,
  creatureId: CreatureId,
  moveId: BattleMoveId,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for move loadout editing." };
  const unavailable = getMoveTrainingUnavailableResult(save, creature);
  if (unavailable) return unavailable;

  const change = unequipBattleMove(
    creature.speciesId,
    creature.battleMoveLoadout ?? {},
    moveId,
  );
  if (!change.ok) return { save, ok: false, message: change.message };

  const nextSave = applyLoadout(save, creatureId, change.loadout);
  if (!nextSave) return { save, ok: false, message: "Creature move loadout could not be updated." };
  return {
    save: {
      ...nextSave,
      flags: { ...nextSave.flags, mBattleMoveTraining: true },
    },
    ok: true,
    message: `${creature.nickname}: ${change.message}`,
  };
}
