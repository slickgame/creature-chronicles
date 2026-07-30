import * as base from "./breeding";
import { rollBattleMoveInheritance } from "@/data/battleMoveInheritance";
import { createPregnancyRecord } from "./nursery";
import { createStrategicInheritancePreview } from "./genetics";
import { applyGeneticsPowerCurve } from "./geneticsBalance";
import { getBreedingSceneImagePath } from "./breedingSceneImages";
import { isChapterOneGuidedTutorialActive } from "./chapterOneGuidedTutorial";
import type { BreedingAttemptRecord, BreedingPreview } from "@/types/breeding";
import type { GameSave, PregnancyRecord } from "@/types/save";

export * from "./breeding";

export function getBreedingPreview(
  save: GameSave | null,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  return save ? base.getBreedingPreview(save, giverId, receiverId) : null;
}

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

function shouldGuaranteeTutorialPregnancy(
  save: GameSave,
  giverId: string,
  receiverId: string,
): boolean {
  if (!isChapterOneGuidedTutorialActive(save)) return false;
  if (save.flags.chapterOneTutorialPregnancyGuaranteed === true) return false;
  if ((save.pregnancies ?? []).some((pregnancy) => pregnancy.status === "pregnant")) return false;
  if ((save.eggs ?? []).some((egg) => egg.status !== "hatched")) return false;
  const giver = (save.creatures ?? []).find((creature) => String(creature.creatureId) === giverId);
  const receiver = (save.creatures ?? []).find((creature) => String(creature.creatureId) === receiverId);
  return Boolean(giver && receiver && giver.creatureId !== receiver.creatureId);
}

function shortenTutorialPregnancy(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): { save: GameSave; attempt: BreedingAttemptRecord } {
  const pregnancy = (save.pregnancies ?? []).find(
    (record) => record.pregnancyId === attempt.pregnancyId && record.status === "pregnant",
  );
  if (!pregnancy) return { save, attempt };
  const nextPregnancy: PregnancyRecord = {
    ...pregnancy,
    daysRemaining: 1,
    totalDays: 1,
    sourceAttemptId: attempt.attemptId,
  };
  const nextAttempt: BreedingAttemptRecord = {
    ...attempt,
    pregnancyId: nextPregnancy.pregnancyId,
    resultText: `${attempt.resultText} Veyra placed the guided pregnancy on a protected one-day nursery schedule.`,
    processText: `${attempt.processText} Chapter 1 safety rules removed complications and shortened the pregnancy to one day.`,
  };
  return {
    attempt: nextAttempt,
    save: replaceAttempt({
      ...save,
      pregnancies: (save.pregnancies ?? []).map((record) =>
        record.pregnancyId === nextPregnancy.pregnancyId ? nextPregnancy : record,
      ),
      flags: {
        ...save.flags,
        m5PregnancyCreated: true,
        chapterOneTutorialPregnancyGuaranteed: true,
        chapterOneTutorialPregnancyShortened: true,
        chapterOneTutorialPregnancyId: String(nextPregnancy.pregnancyId),
        lastBreedingOutcome: "pregnancy",
      },
    }, nextAttempt),
  };
}

function createGuaranteedTutorialPregnancy(
  originalSave: GameSave,
  resultSave: GameSave,
  attempt: BreedingAttemptRecord,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } {
  const participants = base.getBreedingParticipants(originalSave);
  const giver = participants.find((participant) => participant.participantId === giverId);
  const receiver = participants.find((participant) => participant.participantId === receiverId);
  const giverCreature = (originalSave.creatures ?? []).find(
    (creature) => String(creature.creatureId) === giverId,
  );
  const receiverCreature = (originalSave.creatures ?? []).find(
    (creature) => String(creature.creatureId) === receiverId,
  );
  if (!giver || !receiver || receiver.kind === "player" || !giverCreature || !receiverCreature) {
    return { save: resultSave, attempt };
  }

  const seed = `${attempt.attemptId}_chapter_one_guided`;
  const rawInheritance = createStrategicInheritancePreview(resultSave, giver, receiver, seed);
  const strategicInheritance = applyGeneticsPowerCurve(
    resultSave,
    giver,
    receiver,
    rawInheritance,
    seed,
  );
  const battleMoveInheritance = rollBattleMoveInheritance({
    save: originalSave,
    childSpeciesId: strategicInheritance.projectedSpeciesId,
    giver: giverCreature,
    receiver: receiverCreature,
    seed: `${seed}_move_inheritance`,
  });
  const pregnancy: PregnancyRecord = {
    ...createPregnancyRecord(resultSave, giver, receiver, seed),
    sourceAttemptId: attempt.attemptId,
    daysRemaining: 1,
    totalDays: 1,
    inheritance: {
      ...strategicInheritance,
      battleMoveInheritance,
      geneticsNotes: [
        ...(strategicInheritance.geneticsNotes ?? []),
        ...battleMoveInheritance.notes,
        "Chapter 1 guided pairing: conception was guaranteed and the pregnancy was shortened to one day.",
      ],
      lineageTraits: Array.from(new Set([
        ...strategicInheritance.lineageTraits,
        "Guided First Pairing",
      ])),
    },
  };
  const nextAttempt: BreedingAttemptRecord = {
    ...attempt,
    pregnancyId: pregnancy.pregnancyId,
    pregnancyChance: 100,
    outcome: "pregnancy",
    streakAfter: 0,
    resultText: `${receiver.displayName} is now pregnant. Veyra has placed the first guided pregnancy on a protected one-day nursery schedule.`,
    processText: `${giver.displayName} and ${receiver.displayName} completed the first guided pairing. Normal Energy, XP, affection, familiarity, genetics, and move inheritance were recorded; conception was guaranteed.`,
    outcomeFlavorText: "The nursery ledger marks this as a protected first pairing: no dangerous complication, one-day pregnancy, and a complete inheritance record.",
    receiverWasPregnant: false,
    pregnancyBlockedReason: null,
    outcomeImagePath: getBreedingSceneImagePath(
      attempt.giverFamily,
      attempt.receiverFamily,
      "outcome",
      "pregnancy",
      attempt.attemptId,
    ),
  };
  const pairKey = base.getPairKey(giverId, receiverId);
  const nextSave: GameSave = {
    ...resultSave,
    pregnancies: [pregnancy, ...(resultSave.pregnancies ?? [])],
    breeding: resultSave.breeding ? {
      ...resultSave.breeding,
      attempts: resultSave.breeding.attempts.map((record) =>
        record.attemptId === nextAttempt.attemptId ? nextAttempt : record,
      ),
      streaks: resultSave.breeding.streaks.map((record) =>
        record.pairKey === pairKey
          ? { ...record, streakCount: 0, lastOutcome: "pregnancy" as const }
          : record,
      ),
    } : resultSave.breeding,
    flags: {
      ...resultSave.flags,
      m5PregnancyCreated: true,
      battleMoveInheritanceEnabled: true,
      battleMoveCombinationRecipesEnabled: true,
      strategicGeneticsEnabled: true,
      weightedInheritanceEnabled: true,
      chapterOneTutorialPregnancyGuaranteed: true,
      chapterOneTutorialPregnancyShortened: true,
      chapterOneTutorialPregnancyId: String(pregnancy.pregnancyId),
      lastBreedingOutcome: "pregnancy",
      lastBreedingInheritedMoveCount:
        battleMoveInheritance.combinationMoveIds.length +
        battleMoveInheritance.directInheritedMoveIds.length,
      lastBreedingCombinationMoveCount: battleMoveInheritance.combinationMoveIds.length,
    },
  };
  return { save: nextSave, attempt: nextAttempt };
}

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const guarantee = shouldGuaranteeTutorialPregnancy(save, giverId, receiverId);
  const result = base.performBreedingAttempt(save, giverId, receiverId);
  if (!result || !guarantee) return result;
  if (result.attempt.outcome === "pregnancy" && result.attempt.pregnancyId) {
    return shortenTutorialPregnancy(result.save, result.attempt);
  }
  if (result.attempt.receiverWasPregnant || result.attempt.pregnancyBlockedReason) return result;
  return createGuaranteedTutorialPregnancy(
    save,
    result.save,
    result.attempt,
    giverId,
    receiverId,
  );
}
