import * as lifecycle from "./breedingItemsLifecycle";
import { isBreedingSupportItemArmed } from "./breedingItems";
import {
  abortSaveTransaction,
  beginSaveTransaction,
  tagSaveTransaction,
} from "@/lib/save/saveReliability";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { GameSave } from "@/types/save";

export * from "./breedingItemsLifecycle";

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const transaction = beginSaveTransaction(
    save,
    "breeding-attempt",
    `${save.saveId}:${save.dayState.dayNumber}:${giverId}:${receiverId}:${save.breeding?.attempts.length ?? 0}`,
  );
  const fertilityWasArmed = isBreedingSupportItemArmed(save, "fertility_tonic");

  try {
    const result = lifecycle.performBreedingAttempt(save, giverId, receiverId);
    if (!result) {
      abortSaveTransaction(transaction);
      return null;
    }

    const conceptionWasBlocked = Boolean(
      result.attempt.receiverWasPregnant || result.attempt.pregnancyBlockedReason,
    );
    const correctedSave = fertilityWasArmed && conceptionWasBlocked
      ? {
          ...result.save,
          flags: {
            ...result.save.flags,
            breedingFertilityTonicArmed: 1,
          },
        }
      : result.save;

    return {
      attempt: result.attempt,
      save: tagSaveTransaction(
        correctedSave,
        transaction,
        String(result.attempt.attemptId),
      ),
    };
  } catch (error) {
    abortSaveTransaction(transaction);
    throw error;
  }
}
