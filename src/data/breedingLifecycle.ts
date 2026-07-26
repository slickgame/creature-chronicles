import * as core from "./breedingCore";
import { getBreedingSceneImagePath } from "./breedingSceneImages";
import { sanitizeImmediatePregnancyEggs } from "./nurseryLifecycle";
import type {
  BreedingAttemptRecord,
  BreedingParticipant,
  BreedingPreview,
} from "@/types/breeding";
import type { PregnancyId } from "@/types/ids";
import type { GameSave, PregnancyRecord } from "@/types/save";

export * from "./breedingCore";

type DeliveryRecovery = {
  deliveryDayNumber: number;
  availableDayNumber: number;
  reason: string;
};

function getPregnancyDeliveryDayNumber(
  save: GameSave,
  pregnancy: PregnancyRecord,
): number {
  const linkedEgg = (save.eggs ?? []).find((egg) =>
    String(egg.eggId).includes(String(pregnancy.pregnancyId)),
  );

  if (linkedEgg) return linkedEgg.createdAtDayNumber;

  return (
    pregnancy.createdAtDayNumber + Math.max(1, pregnancy.totalDays || 1)
  );
}

function getDeliveryRecovery(
  save: GameSave,
  participantId: string,
): DeliveryRecovery | null {
  const deliveryDays = (save.pregnancies ?? [])
    .filter(
      (pregnancy) =>
        pregnancy.status === "delivered" &&
        pregnancy.receiver.participantId === participantId,
    )
    .map((pregnancy) => getPregnancyDeliveryDayNumber(save, pregnancy));

  if (!deliveryDays.length) return null;

  const deliveryDayNumber = Math.max(...deliveryDays);
  if (save.dayState.dayNumber !== deliveryDayNumber) return null;

  const availableDayNumber = deliveryDayNumber + 1;
  const participantName =
    (save.creatures ?? []).find(
      (creature) => creature.creatureId === participantId,
    )?.nickname ?? "This receiver";

  return {
    deliveryDayNumber,
    availableDayNumber,
    reason: `${participantName} delivered an egg today and is recovering. Available tomorrow (Day ${availableDayNumber}).`,
  };
}

export function getBreedingParticipants(save: GameSave): BreedingParticipant[] {
  return core.getBreedingParticipants(save).map((participant) => {
    const recovery = getDeliveryRecovery(save, participant.participantId);
    if (!recovery) return participant;

    return {
      ...participant,
      canBreed: false,
      unavailableReason: recovery.reason,
    };
  });
}

function getReceiver(save: GameSave, receiverId: string | null) {
  if (!receiverId) return null;
  return (
    getBreedingParticipants(save).find(
      (participant) => participant.participantId === receiverId,
    ) ?? null
  );
}

function getPregnantReceiverBlock(receiverName: string): string {
  return `${receiverName} is already pregnant and cannot be selected as a receiver again until delivery.`;
}

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

/**
 * A breeding attempt is allowed to add a PregnancyRecord only. It must never
 * add an EggRecord. The input egg snapshot is restored after the core attempt,
 * and any legacy conception-time egg tied to an active pregnancy is removed.
 */
function enforcePregnancyBeforeEgg(
  saveBeforeAttempt: GameSave,
  saveAfterAttempt: GameSave,
): GameSave {
  const cleanBeforeAttempt = sanitizeImmediatePregnancyEggs(saveBeforeAttempt).save;
  const eggIdsBeforeAttempt = new Set(
    (cleanBeforeAttempt.eggs ?? []).map((egg) => String(egg.eggId)),
  );
  const activePregnancyIds = (saveAfterAttempt.pregnancies ?? [])
    .filter((pregnancy) => pregnancy.status === "pregnant")
    .map((pregnancy) => String(pregnancy.pregnancyId));

  const eggsAfterAttempt = saveAfterAttempt.eggs ?? [];
  const validEggs = eggsAfterAttempt.filter((egg) => {
    const eggId = String(egg.eggId);
    const wasPresentBeforeAttempt = eggIdsBeforeAttempt.has(eggId);
    const isLegacyConceptionEgg = activePregnancyIds.some((pregnancyId) =>
      eggId.includes(pregnancyId),
    );

    return wasPresentBeforeAttempt && !isLegacyConceptionEgg;
  });

  const sanitizedResult = sanitizeImmediatePregnancyEggs({
    ...saveAfterAttempt,
    eggs: validEggs,
    eggIds: validEggs.map((egg) => egg.eggId),
  }).save;
  const removedCount = eggsAfterAttempt.length - (sanitizedResult.eggs ?? []).length;

  if (removedCount <= 0) return sanitizedResult;

  return {
    ...sanitizedResult,
    flags: {
      ...sanitizedResult.flags,
      immediateBreedingEggSuppressed: true,
      immediateBreedingEggSuppressedCount:
        getFlagNumber(saveAfterAttempt.flags.immediateBreedingEggSuppressedCount) +
        removedCount,
    },
  };
}

export function getBreedingPreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  const cleanSave = sanitizeImmediatePregnancyEggs(save).save;
  const preview = core.getBreedingPreview(cleanSave, giverId, receiverId);
  if (!preview) return null;

  const receiver = getReceiver(cleanSave, receiverId);
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

  const deliveryRecovery = getDeliveryRecovery(
    cleanSave,
    receiver.participantId,
  );
  if (deliveryRecovery) {
    return {
      ...preview,
      pregnancyChance: 0,
      canAttempt: false,
      blockedReason: deliveryRecovery.reason,
      receiverCanBecomePregnant: false,
      receiverPregnant: false,
      pregnancyBlockedReason: deliveryRecovery.reason,
      readinessNotes: [
        ...preview.readinessNotes.slice(0, 2),
        deliveryRecovery.reason,
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
  const cleanSave = sanitizeImmediatePregnancyEggs(save).save;
  const preview = getBreedingPreview(cleanSave, giverId, receiverId);
  if (!preview || !preview.canAttempt) return null;

  const participants = getBreedingParticipants(cleanSave);
  const giver = participants.find((participant) => participant.participantId === giverId);
  const receiver = participants.find((participant) => participant.participantId === receiverId);
  if (!giver || !receiver) return null;

  if (receiver.kind !== "player") {
    const result = core.performBreedingAttempt(cleanSave, giverId, receiverId);
    if (!result) return null;
    return {
      attempt: result.attempt,
      save: enforcePregnancyBeforeEgg(cleanSave, result.save),
    };
  }

  const temporaryPregnancy = buildTemporaryPlayerPregnancy(cleanSave, receiverId);
  const validPregnancies = (cleanSave.pregnancies ?? []).filter(
    (pregnancy) =>
      !(
        pregnancy.status === "pregnant" &&
        pregnancy.receiver.kind === "player"
      ),
  );
  const guardedSave: GameSave = {
    ...cleanSave,
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

  return {
    save: enforcePregnancyBeforeEgg(cleanSave, cleanedSave),
    attempt: updatedAttempt,
  };
}
