import { performBreedingAttempt } from "@/data/breeding";
import {
  applyBreedingAttemptCareer,
  applyTrainingCareerCompletion,
  hatchEggWithLegacyRecords,
  processRanchJobsWithCareers,
} from "@/data/creatureCareerTransactions";
import { applyEggAtelierHatchEffects } from "@/data/eggAtelier";
import {
  collectTrainingGroundsAssignment,
  getTrainingAssignment,
  type TrainingResult,
} from "@/data/trainingGrounds";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

export type LegacyBreedingAttemptResult = {
  save: GameSave;
  attempt: BreedingAttemptRecord;
};

export type LegacyHatchResult = {
  save: GameSave;
  creature: CreatureRecord;
};

/**
 * GameProvider-ready breeding transaction. The existing breeding engine remains
 * authoritative; this wrapper only adds idempotent lifetime attempt credit for
 * creature participants.
 */
export function performBreedingAttemptWithCareers(
  save: GameSave,
  giverId: string,
  receiverId: string,
): LegacyBreedingAttemptResult | null {
  const result = performBreedingAttempt(save, giverId, receiverId);
  if (!result) return null;

  const parentCreatureIds = [
    result.attempt.giverSnapshot?.creatureId,
    result.attempt.receiverSnapshot?.creatureId,
  ].filter((creatureId): creatureId is CreatureId => Boolean(creatureId));

  return {
    attempt: result.attempt,
    save: applyBreedingAttemptCareer(result.save, {
      attemptId: String(result.attempt.attemptId),
      dayNumber: result.attempt.dayNumber,
      parentCreatureIds,
    }),
  };
}

/**
 * Preserves the existing Egg Atelier post-hatch effects while retaining the
 * child/parent memories and career records written by the Legacy hatch layer.
 */
export function hatchEggWithAtelierLegacy(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): LegacyHatchResult | null {
  const legacyResult = hatchEggWithLegacyRecords(save, eggId, nickname);
  if (!legacyResult) return null;
  const atelierResult = applyEggAtelierHatchEffects(save, legacyResult, eggId);
  return { save: atelierResult.save, creature: atelierResult.creature };
}

/**
 * Credits a completed Training Grounds assignment exactly once. Assignment
 * identity is captured before collection because the canonical collection
 * transaction clears its active-assignment flags.
 */
export function collectTrainingWithCareer(
  save: GameSave,
  creatureId: CreatureId,
): TrainingResult {
  const assignment = getTrainingAssignment(save, creatureId);
  const result = collectTrainingGroundsAssignment(save, creatureId);
  if (!result.ok || !assignment) return result;

  return {
    ...result,
    save: applyTrainingCareerCompletion(result.save, {
      assignmentId: `${assignment.startDayNumber}:${assignment.focusId}`,
      creatureId,
      dayNumber: save.dayState.dayNumber,
    }),
  };
}

/** Canonical Ranch Day work transaction for GameProvider.advanceDay. */
export function processLegacyRanchJobs(save: GameSave): {
  save: GameSave;
  results: RanchJobResult[];
} {
  return processRanchJobsWithCareers(save);
}
