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

// Keep an explicit reference so tree-shaking never drops the underlying module
// in environments that inspect only named re-exports during development.
export const BREEDING_RECORDS_MODULE_READY = Boolean(records.getBreedingLedgerOverview);
