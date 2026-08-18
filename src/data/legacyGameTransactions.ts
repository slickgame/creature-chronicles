import { performBreedingAttempt } from "@/data/breeding";
import {
  applyBreedingAttemptCareer,
  applyTrainingCareerCompletion,
  hatchEggWithLegacyRecords,
  processRanchJobsWithCareers,
} from "@/data/creatureCareerTransactions";
import { processDailyCreatureStories } from "@/data/creatureDailyStories";
import {
  applyHeirloomHatchEffect,
  applyHeirloomRanchWorkEffect,
  applyHeirloomTrainingEffect,
} from "@/data/creatureHeirloomEffects";
import { addCreatureMemory } from "@/data/creatureMemories";
import {
  getCreaturePersonalityProfile,
  isPreferredTrainingFocus,
} from "@/data/creaturePersonalities";
import {
  applyBreedingRelationshipAftermath,
  applyRanchWorkRelationshipEffects,
  applyTrainingRelationshipSupport,
  getBreedingRelationshipCompatibility,
  type BreedingRelationshipCompatibility,
} from "@/data/creatureRelationshipGameplay";
import { recordCreatureRelationshipEvent } from "@/data/creatureRelationships";
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
  relationshipCompatibility: BreedingRelationshipCompatibility | null;
};

export type LegacyHatchResult = {
  save: GameSave;
  creature: CreatureRecord;
};

function addCreatureAffection(save: GameSave, creatureId: CreatureId, amount: number): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) =>
      creature.creatureId === creatureId
        ? { ...creature, affection: Math.max(0, Math.min(100, creature.affection + amount)) }
        : creature,
    ),
  };
}

/**
 * GameProvider-ready breeding transaction. The existing breeding engine remains
 * authoritative; this wrapper adds lifetime attempt credit, relationship-aware
 * compatibility consequences, and a shared relationship event for creature
 * pairings without replacing the canonical pregnancy roll.
 */
export function performBreedingAttemptWithCareers(
  save: GameSave,
  giverId: string,
  receiverId: string,
): LegacyBreedingAttemptResult | null {
  const relationshipCompatibility = getBreedingRelationshipCompatibility(
    save,
    giverId,
    receiverId,
  );
  const result = performBreedingAttempt(save, giverId, receiverId);
  if (!result) return null;

  const parentCreatureIds = [
    result.attempt.giverSnapshot?.creatureId,
    result.attempt.receiverSnapshot?.creatureId,
  ].filter((creatureId): creatureId is CreatureId => Boolean(creatureId));

  let nextSave = applyBreedingAttemptCareer(result.save, {
    attemptId: String(result.attempt.attemptId),
    dayNumber: result.attempt.dayNumber,
    parentCreatureIds,
  });
  if (parentCreatureIds.length === 2) {
    nextSave = recordCreatureRelationshipEvent(nextSave, {
      eventKey: `breeding-pair:${String(result.attempt.attemptId)}`,
      creatureIds: [parentCreatureIds[0], parentCreatureIds[1]],
      dayNumber: result.attempt.dayNumber,
      affinityDelta: result.attempt.outcome === "pregnancy" ? 3 : 1,
    });
  }
  nextSave = applyBreedingRelationshipAftermath(
    nextSave,
    relationshipCompatibility,
    result.attempt.outcome,
    String(result.attempt.attemptId),
    result.attempt.dayNumber,
  );

  return {
    attempt: result.attempt,
    save: nextSave,
    relationshipCompatibility,
  };
}

/**
 * Preserves the existing Egg Atelier post-hatch effects while retaining the
 * child/parent memories, personalities, and relationship records written by the
 * Legacy hatch layer. Permanent ranch Heirlooms can also welcome a hatchling
 * with a small, visible Affection bonus; Founder's Ribbons only affect direct
 * descendants of their retired source creature.
 */
export function hatchEggWithAtelierLegacy(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): LegacyHatchResult | null {
  const legacyResult = hatchEggWithLegacyRecords(save, eggId, nickname);
  if (!legacyResult) return null;
  const atelierResult = applyEggAtelierHatchEffects(save, legacyResult, eggId);
  const heirloom = applyHeirloomHatchEffect(atelierResult.save, atelierResult.creature);
  return { save: heirloom.save, creature: heirloom.save.creatures?.find((entry) => entry.creatureId === atelierResult.creature.creatureId) ?? atelierResult.creature };
}

/**
 * Credits a completed Training Grounds assignment exactly once. A preferred
 * focus grants a personality-backed reward, an established friend or family
 * bond can provide one additional point of return-day morale, and caregiving
 * Heirlooms provide a capped permanent ranch-wide training morale passive.
 */
export function collectTrainingWithCareer(
  save: GameSave,
  creatureId: CreatureId,
): TrainingResult {
  const assignment = getTrainingAssignment(save, creatureId);
  const result = collectTrainingGroundsAssignment(save, creatureId);
  if (!result.ok || !assignment) return result;

  const assignmentId = `${assignment.startDayNumber}:${assignment.focusId}`;
  let nextSave = applyTrainingCareerCompletion(result.save, {
    assignmentId,
    creatureId,
    dayNumber: save.dayState.dayNumber,
  });
  const profile = getCreaturePersonalityProfile(nextSave, creatureId);
  if (isPreferredTrainingFocus(profile, assignment.focusId)) {
    const creature = (nextSave.creatures ?? []).find((entry) => entry.creatureId === creatureId);
    nextSave = addCreatureAffection(nextSave, creatureId, 2);
    nextSave = addCreatureMemory(nextSave, {
      creatureId,
      category: "achievement",
      importance: "minor",
      title: `${creature?.nickname ?? "A ranch creature"} enjoyed the training`,
      description: `${assignment.focusId.replaceAll("_", " ")} matched the creature's ${profile.displayName.toLowerCase()} personality, turning the completed session into a personally meaningful success.`,
      dayNumber: save.dayState.dayNumber,
      sourceKey: `preferred-training:${assignment.startDayNumber}:${assignment.focusId}`,
      tags: ["personality", "training", profile.archetype, assignment.focusId],
    });
  }

  const supported = applyTrainingRelationshipSupport(
    nextSave,
    creatureId,
    assignmentId,
    save.dayState.dayNumber,
  );
  nextSave = supported.save;
  const heirloom = applyHeirloomTrainingEffect(nextSave, assignmentId, creatureId);
  nextSave = heirloom.save;
  const notes = [
    supported.support
      ? `${supported.support.supporterName}'s ${supported.support.relationshipLabel} provided +1 Affection on return.`
      : null,
    heirloom.note,
  ].filter((note): note is string => Boolean(note));

  return {
    ...result,
    save: nextSave,
    message: notes.length ? `${result.message} ${notes.join(" ")}` : result.message,
    reward: result.reward && notes.length
      ? { ...result.reward, notes: [...result.reward.notes, ...notes] }
      : result.reward,
  };
}

/** Canonical Ranch Day work transaction for GameProvider.advanceDay. */
export function processLegacyRanchJobs(save: GameSave): {
  save: GameSave;
  results: RanchJobResult[];
} {
  const processed = processRanchJobsWithCareers(save);
  const relationshipEffects = applyRanchWorkRelationshipEffects(
    processed.save,
    processed.results,
    save.dayState.dayNumber,
  );
  const heirloomEffects = applyHeirloomRanchWorkEffect(
    relationshipEffects.save,
    relationshipEffects.results,
    save.dayState.dayNumber,
  );
  return {
    results: heirloomEffects.results,
    save: processDailyCreatureStories(
      heirloomEffects.save,
      heirloomEffects.results,
      save.dayState.dayNumber,
    ),
  };
}
