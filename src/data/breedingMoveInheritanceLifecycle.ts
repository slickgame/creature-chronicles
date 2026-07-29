import * as lifecycle from "./breedingItemsLifecycleSafe";
import { getBattleMove } from "@/data/battleMoves";
import { rollBattleMoveInheritance } from "@/data/battleMoveInheritance";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { GameSave } from "@/types/save";

export * from "./breedingItemsLifecycleSafe";
export { getBattleMoveInheritancePreview } from "@/data/battleMoveInheritance";

function replaceAttempt(save: GameSave, attempt: BreedingAttemptRecord): GameSave {
  if (!save.breeding) return save;
  return {
    ...save,
    breeding: {
      ...save.breeding,
      attempts: save.breeding.attempts.map((record) =>
        record.attemptId === attempt.attemptId ? attempt : record,
      ),
    },
  };
}

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const giver = (save.creatures ?? []).find(
    (creature) => String(creature.creatureId) === giverId,
  );
  const receiver = (save.creatures ?? []).find(
    (creature) => String(creature.creatureId) === receiverId,
  );
  const result = lifecycle.performBreedingAttempt(save, giverId, receiverId);
  if (!result || result.attempt.outcome !== "pregnancy" || !result.attempt.pregnancyId) {
    return result;
  }

  const pregnancy = (result.save.pregnancies ?? []).find(
    (record) => record.pregnancyId === result.attempt.pregnancyId,
  );
  if (!pregnancy || pregnancy.status !== "pregnant" || !giver || !receiver) {
    return result;
  }

  const battleMoveInheritance = rollBattleMoveInheritance({
    save,
    childSpeciesId: pregnancy.inheritance.projectedSpeciesId,
    giver,
    receiver,
    seed: `${result.attempt.attemptId}_move_inheritance`,
  });
  const inheritedMoveIds = [
    ...battleMoveInheritance.combinationMoveIds,
    ...battleMoveInheritance.directInheritedMoveIds,
  ];
  const inheritedNames = inheritedMoveIds.map((moveId) => getBattleMove(moveId).name);
  const moveText = inheritedNames.length
    ? ` Move lineage produced ${inheritedNames.join(", ")}.`
    : " No additional parent move carried through; the offspring retains a complete native move library.";
  const attempt: BreedingAttemptRecord = {
    ...result.attempt,
    resultText: `${result.attempt.resultText}${moveText}`,
    processText: `${result.attempt.processText} Offspring move inheritance was resolved from immutable parent loadout snapshots.`,
    outcomeFlavorText: `${result.attempt.outcomeFlavorText}${moveText}`,
  };
  const pregnancies = (result.save.pregnancies ?? []).map((record) =>
    record.pregnancyId === pregnancy.pregnancyId
      ? {
          ...record,
          inheritance: {
            ...record.inheritance,
            battleMoveInheritance,
            geneticsNotes: [
              ...(record.inheritance.geneticsNotes ?? []),
              ...battleMoveInheritance.notes,
            ],
          },
        }
      : record,
  );

  const nextSave = replaceAttempt({
    ...result.save,
    pregnancies,
    flags: {
      ...result.save.flags,
      battleMoveInheritanceEnabled: true,
      battleMoveCombinationRecipesEnabled: true,
      lastBreedingInheritedMoveCount: inheritedMoveIds.length,
      lastBreedingCombinationMoveCount: battleMoveInheritance.combinationMoveIds.length,
    },
  }, attempt);

  return { save: nextSave, attempt };
}
