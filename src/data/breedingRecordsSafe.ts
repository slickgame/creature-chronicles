import * as records from "./breedingRecords";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { BirthRecord, GameSave } from "@/types/save";

export * from "./breedingRecords";

export function getAttemptOffspring(
  save: GameSave,
  attempt: BreedingAttemptRecord,
): BirthRecord[] {
  return (save.birthHistory ?? []).filter((birth) => {
    if (birth.sourceAttemptId) return birth.sourceAttemptId === attempt.attemptId;
    return Boolean(
      attempt.pregnancyId &&
        birth.sourcePregnancyId &&
        birth.sourcePregnancyId === attempt.pregnancyId,
    );
  });
}

export function getBreedingLedgerOverview(
  save: GameSave,
): records.BreedingLedgerOverview {
  const overview = records.getBreedingLedgerOverview(save);
  return {
    ...overview,
    mostSuccessfulPair:
      overview.mostSuccessfulPair?.successfulPregnancies
        ? overview.mostSuccessfulPair
        : null,
    mostProlificCreature:
      overview.mostProlificCreature &&
      (overview.mostProlificCreature.hatchedOffspring > 0 ||
        overview.mostProlificCreature.successfulPregnancies > 0)
        ? overview.mostProlificCreature
        : null,
    longestPairStreak:
      overview.longestPairStreak?.longestStreak
        ? overview.longestPairStreak
        : null,
  };
}

export const BREEDING_RECORDS_MODULE_READY = Boolean(
  records.getBreedingLedgerOverview,
);
