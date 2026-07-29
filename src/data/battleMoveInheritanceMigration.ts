import {
  buildBredCreatureStartingMoveLoadout,
  canSpeciesLearnBattleMove,
  normalizeBattleMoveLoadout,
} from "@/data/battleLoadouts";
import { BATTLE_MOVES_BY_ID } from "@/data/battleMoves";
import type {
  BattleMoveId,
  BattleMoveInheritanceResult,
  ParentBattleMoveSource,
} from "@/types/battle";
import type { SpeciesId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function uniqueKnownMoveIds(moveIds: readonly BattleMoveId[]): BattleMoveId[] {
  return Array.from(new Set(moveIds.filter((moveId) => Boolean(BATTLE_MOVES_BY_ID[moveId]))));
}

function normalizeParentSnapshot(source: ParentBattleMoveSource): ParentBattleMoveSource {
  const learnedMoveIds = uniqueKnownMoveIds(source.learnedMoveIds ?? []);
  return {
    learnedMoveIds,
    equippedMoveIds: uniqueKnownMoveIds(source.equippedMoveIds ?? [])
      .filter((moveId) => learnedMoveIds.includes(moveId)),
  };
}

export function normalizeBattleMoveInheritanceResult(
  result: BattleMoveInheritanceResult,
  childSpeciesId: SpeciesId,
): BattleMoveInheritanceResult {
  const directInheritedMoveIds = uniqueKnownMoveIds(result.directInheritedMoveIds ?? [])
    .filter((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      return move.inheritable && move.sourceType !== "combination" && canSpeciesLearnBattleMove(childSpeciesId, moveId);
    })
    .slice(0, 3);
  const combinationMoveIds = uniqueKnownMoveIds(result.combinationMoveIds ?? [])
    .filter((moveId) => {
      const move = BATTLE_MOVES_BY_ID[moveId];
      return move.sourceType === "combination" && canSpeciesLearnBattleMove(childSpeciesId, moveId);
    })
    .slice(0, 1);
  const projectedLoadout = buildBredCreatureStartingMoveLoadout(
    childSpeciesId,
    [...combinationMoveIds, ...directInheritedMoveIds],
  );
  const removedCount = (result.directInheritedMoveIds?.length ?? 0)
    + (result.combinationMoveIds?.length ?? 0)
    - directInheritedMoveIds.length
    - combinationMoveIds.length;

  return {
    ...result,
    version: Math.max(1, result.version || 1),
    childSpeciesId,
    giverMoveSnapshot: normalizeParentSnapshot(result.giverMoveSnapshot ?? { learnedMoveIds: [], equippedMoveIds: [] }),
    receiverMoveSnapshot: normalizeParentSnapshot(result.receiverMoveSnapshot ?? { learnedMoveIds: [], equippedMoveIds: [] }),
    directInheritedMoveIds,
    combinationMoveIds,
    projectedLoadout,
    rolls: (result.rolls ?? []).filter((roll) => Boolean(BATTLE_MOVES_BY_ID[roll.moveId])),
    notes: Array.from(new Set([
      ...(result.notes ?? []),
      ...(removedCount > 0
        ? [`Save validation removed ${removedCount} deleted or incompatible move-lineage entr${removedCount === 1 ? "y" : "ies"}.`]
        : []),
    ])),
  };
}

export function normalizeBattleMoveInheritanceSave(save: GameSave): GameSave {
  let changed = false;
  const pregnancies = (save.pregnancies ?? []).map((pregnancy) => {
    const inheritance = pregnancy.inheritance.battleMoveInheritance;
    if (!inheritance) return pregnancy;
    const normalized = normalizeBattleMoveInheritanceResult(
      inheritance,
      pregnancy.inheritance.projectedSpeciesId,
    );
    if (JSON.stringify(normalized) !== JSON.stringify(inheritance)) changed = true;
    return {
      ...pregnancy,
      inheritance: {
        ...pregnancy.inheritance,
        battleMoveInheritance: normalized,
      },
    };
  });
  const eggs = (save.eggs ?? []).map((egg) => {
    if (!egg.battleMoveInheritance) return egg;
    const normalized = normalizeBattleMoveInheritanceResult(
      egg.battleMoveInheritance,
      egg.speciesId,
    );
    if (JSON.stringify(normalized) !== JSON.stringify(egg.battleMoveInheritance)) changed = true;
    return { ...egg, battleMoveInheritance: normalized };
  });
  const birthHistory = (save.birthHistory ?? []).map((birth) => {
    const inheritedMoveIds = uniqueKnownMoveIds(birth.inheritedMoveIds ?? [])
      .filter((moveId) => canSpeciesLearnBattleMove(birth.speciesId, moveId));
    const combinationMoveIds = uniqueKnownMoveIds(birth.combinationMoveIds ?? [])
      .filter((moveId) => BATTLE_MOVES_BY_ID[moveId].sourceType === "combination")
      .filter((moveId) => inheritedMoveIds.includes(moveId));
    const startingBattleMoveLoadout = birth.startingBattleMoveLoadout
      ? normalizeBattleMoveLoadout(birth.speciesId, birth.startingBattleMoveLoadout)
      : birth.startingBattleMoveLoadout;
    if (
      JSON.stringify(inheritedMoveIds) !== JSON.stringify(birth.inheritedMoveIds ?? [])
      || JSON.stringify(combinationMoveIds) !== JSON.stringify(birth.combinationMoveIds ?? [])
      || JSON.stringify(startingBattleMoveLoadout) !== JSON.stringify(birth.startingBattleMoveLoadout)
    ) changed = true;
    return {
      ...birth,
      inheritedMoveIds,
      combinationMoveIds,
      startingBattleMoveLoadout,
    };
  });

  if (!changed && save.flags.m65BattleMoveInheritanceSchema === true) return save;
  return {
    ...save,
    pregnancies,
    eggs,
    birthHistory,
    flags: {
      ...save.flags,
      m65BattleMoveInheritanceSchema: true,
      battleMoveInheritanceSaveValidation: true,
    },
  };
}
