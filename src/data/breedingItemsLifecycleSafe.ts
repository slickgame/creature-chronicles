import * as lifecycle from "./breedingItemsLifecycle";
import { isBreedingSupportItemArmed } from "./breedingItems";
import {
  abortSaveTransaction,
  beginSaveTransaction,
  tagSaveTransaction,
} from "@/lib/save/saveReliability";
import type { BreedingAttemptRecord, BreedingPreview } from "@/types/breeding";
import type { PregnancyId } from "@/types/ids";
import type { GameSave, PregnancyRecord } from "@/types/save";

export * from "./breedingItemsLifecycle";

const PLAYER_PARTICIPANT_ID = "player";
const PLAYER_PREGNANCY_GUARD_ID = "pregnancy_player_receiver_guard" as PregnancyId;
const PLAYER_PREGNANCY_BLOCK_REASON = "The player character cannot become pregnant; player-receiver sessions always resolve without pregnancy.";

function playerPregnancyGuard(save: GameSave): PregnancyRecord {
  const now = new Date().toISOString();
  return {
    pregnancyId: PLAYER_PREGNANCY_GUARD_ID,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: now,
    daysRemaining: 1,
    totalDays: 1,
    status: "pregnant",
    giver: {
      participantId: "system_guard",
      displayName: "System Guard",
      familyLabel: "System",
      kind: "player",
    },
    receiver: {
      participantId: PLAYER_PARTICIPANT_ID,
      displayName: save.player.name,
      familyLabel: "Player",
      kind: "player",
    },
    inheritance: {
      projectedSpeciesId: "species_feline" as never,
      projectedVariantId: "variant_base_feline" as never,
      projectedStats: { STR: 1, DEX: 1, STA: 1, CHA: 1, WIL: 1, FER: 1 },
      projectedStatGrades: { STR: "D", DEX: "D", STA: "D", CHA: "D", WIL: "D", FER: "D" },
      projectedAbilities: [],
      statRollNotes: [],
      abilityRollNotes: [],
      geneticsNotes: [],
      lineageRisk: "none",
      lineageRiskLabel: "No Risk",
      lineageNotes: [],
      lineageTraits: [],
      suggestedName: "System Guard",
    },
  };
}

function withPlayerReceiverGuard(save: GameSave, receiverId: string): GameSave {
  if (receiverId !== PLAYER_PARTICIPANT_ID) return save;
  const existingPregnancies = (save.pregnancies ?? []).filter(
    (pregnancy) => pregnancy.receiver.participantId !== PLAYER_PARTICIPANT_ID,
  );
  return {
    ...save,
    pregnancies: [playerPregnancyGuard(save), ...existingPregnancies],
  };
}

function stripPlayerPregnancyGuard(save: GameSave): GameSave {
  return {
    ...save,
    pregnancies: (save.pregnancies ?? []).filter(
      (pregnancy) =>
        pregnancy.pregnancyId !== PLAYER_PREGNANCY_GUARD_ID &&
        pregnancy.receiver.participantId !== PLAYER_PARTICIPANT_ID,
    ),
  };
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

export function getBreedingPreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  const preview = lifecycle.getBreedingPreview(save, giverId, receiverId);
  if (!preview || receiverId !== PLAYER_PARTICIPANT_ID) return preview;
  return {
    ...preview,
    pregnancyChance: 0,
    receiverCanBecomePregnant: false,
    receiverPregnant: false,
    pregnancyBlockedReason: PLAYER_PREGNANCY_BLOCK_REASON,
    abilityTriggers: preview.abilityTriggers.filter(
      (trigger) => !trigger.toLowerCase().includes("fertility tonic"),
    ),
    readinessNotes: [
      ...preview.readinessNotes.filter(
        (note) => !note.toLowerCase().includes("can become pregnant"),
      ),
      PLAYER_PREGNANCY_BLOCK_REASON,
    ],
  };
}

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
  const playerReceiver = receiverId === PLAYER_PARTICIPANT_ID;

  try {
    const result = lifecycle.performBreedingAttempt(
      withPlayerReceiverGuard(save, receiverId),
      giverId,
      receiverId,
    );
    if (!result) {
      abortSaveTransaction(transaction);
      return null;
    }

    const conceptionWasBlocked = Boolean(
      playerReceiver || result.attempt.receiverWasPregnant || result.attempt.pregnancyBlockedReason,
    );
    let attempt = result.attempt;
    let correctedSave = stripPlayerPregnancyGuard(result.save);

    if (playerReceiver) {
      attempt = {
        ...attempt,
        outcome: "failed",
        receiverWasPregnant: false,
        pregnancyBlockedReason: PLAYER_PREGNANCY_BLOCK_REASON,
        resultText: `${save.player.name} cannot become pregnant. The session still granted experience and pair familiarity.`,
        processText: `${attempt.giverName} and ${save.player.name} completed a player-receiver Breeding Pen session. Energy was spent, XP was gained, and no pregnancy roll was permitted.`,
        outcomeFlavorText: "Player-receiver sessions are permanently non-pregnancy outcomes and use the player failure scene pool.",
      };
      correctedSave = replaceAttempt({
        ...correctedSave,
        flags: {
          ...correctedSave.flags,
          lastBreedingOutcome: "failed",
          lastBreedingReceiverPregnantBlocked: false,
          lastBreedingPlayerReceiverNonPregnancy: true,
          playerPregnancyOutcomePreventionEnabled: true,
        },
      }, attempt);
    }

    if (fertilityWasArmed && conceptionWasBlocked) {
      correctedSave = {
        ...correctedSave,
        flags: {
          ...correctedSave.flags,
          breedingFertilityTonicArmed: 1,
        },
      };
    }

    return {
      attempt,
      save: tagSaveTransaction(
        correctedSave,
        transaction,
        String(attempt.attemptId),
      ),
    };
  } catch (error) {
    abortSaveTransaction(transaction);
    throw error;
  }
}
