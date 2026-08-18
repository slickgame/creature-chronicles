export * from "./trainingGrounds";

import * as Base from "./trainingGrounds";
import {
  getGuildServiceReturnSummaryItems,
  getGuildServiceUnavailableReason,
  isCreatureAwayOnGuildService,
} from "./guildServiceAvailability";
import type { CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

/**
 * Historical callers use this helper as the cross-system busy check. Keep that
 * API stable while allowing Guild service assignments to participate in the
 * same disabled/greyed roster behavior as Training Grounds assignments.
 */
export function getTrainingUnavailableReason(save: GameSave, creatureId: CreatureId): string | null {
  return getGuildServiceUnavailableReason(save, creatureId) ?? Base.getTrainingUnavailableReason(save, creatureId);
}

/**
 * External gameplay systems historically use this to decide whether an absent
 * creature should eat, work, or otherwise participate in the Ranch Day. Guild
 * service is another physical absence, so it follows the same presence rule.
 */
export function isCreatureAwayForTraining(save: GameSave, creatureId: CreatureId): boolean {
  return isCreatureAwayOnGuildService(save, creatureId) || Base.isCreatureAwayForTraining(save, creatureId);
}

export function startTrainingGroundsAssignment(
  save: GameSave,
  creatureId: CreatureId,
  focusId: Base.TrainingFocusId,
  targetStatKey?: CreatureStatKey,
): Base.TrainingResult {
  const guildReason = getGuildServiceUnavailableReason(save, creatureId);
  if (guildReason) {
    const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
    return {
      save,
      ok: false,
      message: `${creature?.nickname ?? "That creature"} cannot start training while away. ${guildReason}`,
    };
  }
  return Base.startTrainingGroundsAssignment(save, creatureId, focusId, targetStatKey);
}

/** Morning Brief compatibility: service returns share the existing away/return feed. */
export function getTrainingReturnSummaryItems(save: GameSave): string[] {
  return [...Base.getTrainingReturnSummaryItems(save), ...getGuildServiceReturnSummaryItems(save)];
}
