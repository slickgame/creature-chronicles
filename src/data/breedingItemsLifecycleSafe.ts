import * as lifecycle from "./breedingItemsLifecycle";
import { isBreedingSupportItemArmed } from "./breedingItems";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { GameSave } from "@/types/save";

export * from "./breedingItemsLifecycle";

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const fertilityWasArmed = isBreedingSupportItemArmed(save, "fertility_tonic");
  const result = lifecycle.performBreedingAttempt(save, giverId, receiverId);
  if (!result) return null;

  const conceptionWasBlocked = Boolean(
    result.attempt.receiverWasPregnant || result.attempt.pregnancyBlockedReason,
  );
  if (!fertilityWasArmed || !conceptionWasBlocked) return result;

  return {
    attempt: result.attempt,
    save: {
      ...result.save,
      flags: {
        ...result.save.flags,
        breedingFertilityTonicArmed: 1,
      },
    },
  };
}
