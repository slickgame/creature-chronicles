import * as lifecycle from "./breedingLifecycle";
import {
  createStrategicInheritancePreview,
  formatStrategicGeneticsSummary,
  getStrategicGeneticsPreview,
} from "./genetics";
import type { BreedingAttemptRecord, BreedingPreview } from "@/types/breeding";
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

  const genetics = getStrategicGeneticsPreview(save, giver, receiver);
  const geneticsSummary = formatStrategicGeneticsSummary(genetics);

  return {
    ...preview,
    blockedReason:
      preview.canAttempt && !preview.blockedReason
        ? geneticsSummary
        : preview.blockedReason,
    readinessNotes: [
      ...preview.readinessNotes,
      geneticsSummary,
      genetics.familyBonusLabel,
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

function resetReceiverStreaks(
  save: GameSave,
  receiverId: string,
): GameSave {
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

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const result = lifecycle.performBreedingAttempt(save, giverId, receiverId);
  if (!result) return null;

  const previousPregnancyIds = new Set(
    (save.pregnancies ?? []).map((pregnancy) => pregnancy.pregnancyId),
  );
  const newPregnancy = (result.save.pregnancies ?? []).find(
    (pregnancy) => !previousPregnancyIds.has(pregnancy.pregnancyId),
  );
  if (!newPregnancy || newPregnancy.status !== "pregnant") return result;

  // Pregnancy chance streaks reset on conception, but the successful session's
  // completed familiarity still influences this offspring's genetics once.
  const geneticsSave = buildSuccessfulGeneticsSave(result.save, result.attempt);
  const participants = lifecycle.getBreedingParticipants(geneticsSave);
  const giver = participants.find(
    (participant) => participant.participantId === giverId,
  );
  const receiver = participants.find(
    (participant) => participant.participantId === receiverId,
  );
  if (!giver || !receiver || receiver.kind === "player") return result;

  const inheritance = createStrategicInheritancePreview(
    geneticsSave,
    giver,
    receiver,
    `${result.attempt.attemptId}_pregnancy`,
  );
  const pregnancies = (result.save.pregnancies ?? []).map((pregnancy) =>
    pregnancy.pregnancyId === newPregnancy.pregnancyId
      ? { ...pregnancy, inheritance }
      : pregnancy,
  );
  const pregnancySave = resetReceiverStreaks(
    { ...result.save, pregnancies },
    receiverId,
  );

  return {
    attempt: result.attempt,
    save: {
      ...pregnancySave,
      flags: {
        ...pregnancySave.flags,
        strategicGeneticsEnabled: true,
        weightedInheritanceEnabled: true,
        familyInheritanceBonusesEnabled: true,
        affectionInheritanceStabilityEnabled: true,
        pairStreakGeneticsEnabled: true,
        pairStreakResetsAfterPregnancy: true,
        receiverPairStreaksResetAfterPregnancy: true,
        shinyBreedingOutcomesEnabled: true,
      },
    },
  };
}
