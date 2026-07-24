import * as core from "./breeding";
import { getBreedingSceneImagePath } from "./breedingSceneImages";
import type { BreedingAttemptRecord, BreedingPreview } from "@/types/breeding";
import type { PregnancyId } from "@/types/ids";
import type { GameSave, PregnancyRecord } from "@/types/save";

export * from "./breeding";

function getReceiver(save: GameSave, receiverId: string | null) {
  if (!receiverId) return null;
  return (
    core
      .getBreedingParticipants(save)
      .find((participant) => participant.participantId === receiverId) ?? null
  );
}

function getPregnantReceiverBlock(receiverName: string): string {
  return `${receiverName} is already pregnant and cannot be selected as a receiver again until delivery.`;
}

export function getBreedingPreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  const preview = core.getBreedingPreview(save, giverId, receiverId);
  if (!preview) return null;

  const receiver = getReceiver(save, receiverId);
  if (!receiver) return preview;

  if (receiver.kind === "player") {
    const playerNote = `${receiver.displayName} can participate as receiver for XP, affection, and pair familiarity, but the player cannot become pregnant.`;
    return {
      ...preview,
      pregnancyChance: 0,
      receiverCanBecomePregnant: false,
      receiverPregnant: false,
      pregnancyBlockedReason: null,
      readinessNotes: [
        ...preview.readinessNotes.slice(0, 2),
        playerNote,
      ],
      abilityTriggers: [...preview.abilityTriggers, playerNote],
    };
  }

  if (receiver.isPregnant) {
    const blockedReason = getPregnantReceiverBlock(receiver.displayName);
    return {
      ...preview,
      pregnancyChance: 0,
      canAttempt: false,
      blockedReason,
      receiverCanBecomePregnant: false,
      receiverPregnant: true,
      pregnancyBlockedReason: blockedReason,
      readinessNotes: [
        ...preview.readinessNotes.slice(0, 2),
        blockedReason,
      ],
    };
  }

  return preview;
}

function buildTemporaryPlayerPregnancy(
  save: GameSave,
  receiverId: string,
): PregnancyRecord {
  const firstCreature = save.creatures?.[0];
  const firstPregnancy = save.pregnancies?.[0];

  return {
    pregnancyId: `pregnancy_player_guard_${Date.now()}` as PregnancyId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date().toISOString(),
    daysRemaining: 1,
    totalDays: 1,
    status: "pregnant",
    giver: {
      participantId: "player_guard_giver",
      displayName: "System Guard",
      familyLabel: "System",
      kind: "player",
    },
    receiver: {
      participantId: receiverId,
      displayName: save.player.name,
      familyLabel: "Player",
      kind: "player",
    },
    inheritance: firstPregnancy?.inheritance ?? {
      projectedSpeciesId: firstCreature?.speciesId as never,
      projectedVariantId: firstCreature?.variantId as never,
      projectedStats: firstCreature?.stats ?? save.player.stats,
      projectedStatGrades: firstCreature?.statGrades ?? save.player.statGrades,
      projectedAbilities: [],
      statRollNotes: [],
      abilityRollNotes: [],
      lineageRisk: "none",
      lineageRiskLabel: "No Risk",
      lineageNotes: [],
      lineageTraits: [],
      suggestedName: "Hatchling",
    },
  };
}

function updateStoredAttempt(
  save: GameSave,
  updatedAttempt: BreedingAttemptRecord,
): GameSave {
  if (!save.breeding) return save;
  return {
    ...save,
    breeding: {
      ...save.breeding,
      attempts: save.breeding.attempts.map((attempt) =>
        attempt.attemptId === updatedAttempt.attemptId ? updatedAttempt : attempt,
      ),
    },
  };
}

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const preview = getBreedingPreview(save, giverId, receiverId);
  if (!preview || !preview.canAttempt) return null;

  const participants = core.getBreedingParticipants(save);
  const giver = participants.find((participant) => participant.participantId === giverId);
  const receiver = participants.find((participant) => participant.participantId === receiverId);
  if (!giver || !receiver) return null;

  if (receiver.kind !== "player") {
    return core.performBreedingAttempt(save, giverId, receiverId);
  }

  const temporaryPregnancy = buildTemporaryPlayerPregnancy(save, receiverId);
  const validPregnancies = (save.pregnancies ?? []).filter(
    (pregnancy) =>
      !(
        pregnancy.status === "pregnant" &&
        pregnancy.receiver.kind === "player"
      ),
  );
  const guardedSave: GameSave = {
    ...save,
    pregnancies: [temporaryPregnancy, ...validPregnancies],
  };

  const result = core.performBreedingAttempt(guardedSave, giverId, receiverId);
  if (!result) return null;

  const updatedAttempt: BreedingAttemptRecord = {
    ...result.attempt,
    pregnancyChance: 0,
    outcome: "failed",
    resultText: `${receiver.displayName} cannot become pregnant, but the session still granted experience, affection, and pair familiarity.`,
    outcomeFlavorText: "The nursery ledger records no pregnancy. The pair still benefited from the completed Breeding Pen session.",
    receiverWasPregnant: false,
    pregnancyBlockedReason: null,
    outcomeImagePath: getBreedingSceneImagePath(
      giver.sceneFamily,
      receiver.sceneFamily,
      "outcome",
      "failed",
      result.attempt.attemptId,
    ),
  };

  const cleanedSave = updateStoredAttempt(
    {
      ...result.save,
      pregnancies: (result.save.pregnancies ?? []).filter(
        (pregnancy) => pregnancy.pregnancyId !== temporaryPregnancy.pregnancyId,
      ),
      flags: {
        ...result.save.flags,
        lastBreedingOutcome: "failed",
        lastBreedingReceiverPregnantBlocked: false,
        playerReceiverPregnancyDisabled: true,
      },
    },
    updatedAttempt,
  );

  return { save: cleanedSave, attempt: updatedAttempt };
}
