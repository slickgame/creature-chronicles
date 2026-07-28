import * as lifecycle from "./breedingLifecycle";
import { getSpeciesDefinition, getVariantDefinition } from "./creatures";
import {
  createStrategicInheritancePreview,
  formatStrategicGeneticsSummary,
  getStrategicGeneticsPreview,
} from "./genetics";
import {
  applyGeneticsPowerCurve,
  getBalancedStrategicGeneticsPreview,
} from "./geneticsBalance";
import type {
  BreedingAttemptRecord,
  BreedingParticipant,
  BreedingParticipantSnapshot,
  BreedingPreview,
} from "@/types/breeding";
import type { GameSave } from "@/types/save";

export * from "./breedingLifecycle";

export function getBreedingPreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  const preview = lifecycle.getBreedingPreview(save, giverId, receiverId);
  if (!preview || !giverId || !receiverId) return preview;

  const participants = lifecycle.getBreedingParticipants(save);
  const giver = participants.find(
    (participant) => participant.participantId === giverId,
  );
  const receiver = participants.find(
    (participant) => participant.participantId === receiverId,
  );
  if (!giver || !receiver || receiver.kind === "player") return preview;

  const genetics = getBalancedStrategicGeneticsPreview(
    save,
    giver,
    receiver,
    getStrategicGeneticsPreview(save, giver, receiver),
  );
  const geneticsSummary = formatStrategicGeneticsSummary(genetics);

  return {
    ...preview,
    blockedReason: preview.blockedReason,
    readinessNotes: [
      ...preview.readinessNotes,
      geneticsSummary,
      genetics.familyBonusLabel,
      "Trained parent stats contribute only 10%; inherited grades and innate potential matter most.",
    ],
  };
}

function buildSuccessfulGeneticsSave(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): GameSave {
  const pairKey = lifecycle.getPairKey(attempt.giverId, attempt.receiverId);
  const completedFamiliarity = Math.max(1, attempt.streakBefore + 1);
  const breeding = save.breeding ?? lifecycle.createDefaultBreedingState();

  return {
    ...save,
    breeding: {
      ...breeding,
      streaks: [
        ...breeding.streaks.filter((record) => record.pairKey !== pairKey),
        {
          pairKey,
          participantAId: attempt.giverId,
          participantBId: attempt.receiverId,
          streakCount: completedFamiliarity,
          lastAttemptDayNumber: attempt.dayNumber,
          lastOutcome: attempt.outcome,
        },
      ],
    },
  };
}

function resetReceiverStreaks(save: GameSave, receiverId: string): GameSave {
  if (!save.breeding) return save;
  return {
    ...save,
    breeding: {
      ...save.breeding,
      streaks: save.breeding.streaks.map((record) =>
        record.participantAId === receiverId ||
        record.participantBId === receiverId
          ? { ...record, streakCount: 0 }
          : record,
      ),
    },
  };
}

function refreshBreederEnergyCap(save: GameSave): GameSave {
  const maxEnergy = lifecycle.getPlayerMaxEnergyFromStats(save.player.stats);
  return {
    ...save,
    currencies: {
      ...save.currencies,
      maxEnergy,
      energy: Math.min(save.currencies.energy, maxEnergy),
    },
  };
}

function snapshotParticipant(
  save: GameSave,
  participant: BreedingParticipant,
): BreedingParticipantSnapshot {
  const creature = participant.creatureId
    ? (save.creatures ?? []).find(
        (candidate) => candidate.creatureId === participant.creatureId,
      )
    : undefined;
  const variant = creature ? getVariantDefinition(creature.variantId) : undefined;
  const species = creature ? getSpeciesDefinition(creature.speciesId) : undefined;

  return {
    participantId: participant.participantId,
    creatureId: participant.creatureId,
    kind: participant.kind,
    displayName: participant.displayName,
    family: participant.sceneFamily,
    speciesId: creature?.speciesId,
    speciesName: species?.name,
    variantId: creature?.variantId,
    variantName: variant?.name,
    rarity: variant?.rarity,
    sex: creature?.sex,
    shiny: creature?.shiny,
    portraitPath:
      participant.portraitPath || participant.profilePath || variant?.portraitPath || "",
  };
}

function replaceAttemptRecord(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): GameSave {
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
  const participantsBefore = lifecycle.getBreedingParticipants(save);
  const giverBefore = participantsBefore.find(
    (participant) => participant.participantId === giverId,
  );
  const receiverBefore = participantsBefore.find(
    (participant) => participant.participantId === receiverId,
  );
  const result = lifecycle.performBreedingAttempt(save, giverId, receiverId);
  if (!result) return null;

  const previousPregnancyIds = new Set(
    (save.pregnancies ?? []).map((pregnancy) => pregnancy.pregnancyId),
  );
  const firstNewPregnancy = (result.save.pregnancies ?? []).find(
    (pregnancy) => !previousPregnancyIds.has(pregnancy.pregnancyId),
  );
  const attempt: BreedingAttemptRecord = {
    ...result.attempt,
    giverSnapshot: giverBefore
      ? snapshotParticipant(save, giverBefore)
      : result.attempt.giverSnapshot,
    receiverSnapshot: receiverBefore
      ? snapshotParticipant(save, receiverBefore)
      : result.attempt.receiverSnapshot,
    pregnancyId:
      firstNewPregnancy?.status === "pregnant"
        ? firstNewPregnancy.pregnancyId
        : result.attempt.pregnancyId,
  };

  let linkedSave = refreshBreederEnergyCap(result.save);
  linkedSave = {
    ...linkedSave,
    pregnancies: (linkedSave.pregnancies ?? []).map((pregnancy) =>
      pregnancy.pregnancyId === attempt.pregnancyId
        ? { ...pregnancy, sourceAttemptId: attempt.attemptId }
        : pregnancy,
    ),
    flags: {
      ...linkedSave.flags,
      durableBreedingSnapshotsEnabled: true,
      breedingLifecycleLinksEnabled: true,
    },
  };
  linkedSave = replaceAttemptRecord(linkedSave, attempt);

  const normalizedResult = { attempt, save: linkedSave };
  const newPregnancy = (linkedSave.pregnancies ?? []).find(
    (pregnancy) => pregnancy.pregnancyId === attempt.pregnancyId,
  );
  if (!newPregnancy || newPregnancy.status !== "pregnant") {
    return normalizedResult;
  }

  const geneticsSave = buildSuccessfulGeneticsSave(linkedSave, attempt);
  const participants = lifecycle.getBreedingParticipants(geneticsSave);
  const giver = participants.find(
    (participant) => participant.participantId === giverId,
  );
  const receiver = participants.find(
    (participant) => participant.participantId === receiverId,
  );
  if (!giver || !receiver || receiver.kind === "player") {
    return normalizedResult;
  }

  const geneticsSeed = `${attempt.attemptId}_pregnancy`;
  const rawInheritance = createStrategicInheritancePreview(
    geneticsSave,
    giver,
    receiver,
    geneticsSeed,
  );
  const inheritance = applyGeneticsPowerCurve(
    geneticsSave,
    giver,
    receiver,
    rawInheritance,
    geneticsSeed,
  );
  const pregnancies = (linkedSave.pregnancies ?? []).map((pregnancy) =>
    pregnancy.pregnancyId === newPregnancy.pregnancyId
      ? { ...pregnancy, sourceAttemptId: attempt.attemptId, inheritance }
      : pregnancy,
  );
  const pregnancySave = resetReceiverStreaks(
    { ...linkedSave, pregnancies },
    receiverId,
  );

  return {
    attempt,
    save: replaceAttemptRecord(
      {
        ...pregnancySave,
        flags: {
          ...pregnancySave.flags,
          strategicGeneticsEnabled: true,
          weightedInheritanceEnabled: true,
          geneticPotentialSeparatedFromTraining: true,
          levelOneOffspringStatCeilingsEnabled: true,
          familyInheritanceBonusesEnabled: true,
          affectionInheritanceStabilityEnabled: true,
          pairStreakGeneticsEnabled: true,
          pairStreakResetsAfterPregnancy: true,
          receiverPairStreaksResetAfterPregnancy: true,
          shinyBreedingOutcomesEnabled: true,
          breederEnergyCapRefreshEnabled: true,
          durableBreedingSnapshotsEnabled: true,
          breedingLifecycleLinksEnabled: true,
        },
      },
      attempt,
    ),
  };
}
