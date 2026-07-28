import * as geneticsLifecycle from "./breedingGeneticsLifecycle";
import type {
  BreedingAttemptRecord,
  BreedingParticipantSnapshot,
} from "@/types/breeding";
import type { GameSave, ParentSnapshot } from "@/types/save";

export * from "./breedingGeneticsLifecycle";

function parentSnapshot(
  snapshot: BreedingParticipantSnapshot | undefined,
  fallback: ParentSnapshot,
): ParentSnapshot {
  if (!snapshot) return fallback;
  return {
    ...fallback,
    participantId: snapshot.participantId,
    creatureId: snapshot.creatureId,
    displayName: snapshot.displayName,
    kind: snapshot.kind,
    speciesId: snapshot.speciesId,
    variantId: snapshot.variantId,
    family:
      snapshot.family === "feline" ||
      snapshot.family === "canine" ||
      snapshot.family === "bovine" ||
      snapshot.family === "lapine" ||
      snapshot.family === "equine"
        ? snapshot.family
        : fallback.family,
    rarity: snapshot.rarity,
    sex: snapshot.sex,
    shiny: snapshot.shiny,
    portraitPath: snapshot.portraitPath,
  };
}

function preserveAttemptHistory(
  previousSave: GameSave,
  nextSave: GameSave,
  attempt: BreedingAttemptRecord,
): GameSave {
  const previousAttempts = previousSave.breeding?.attempts ?? [];
  const attempts = [
    attempt,
    ...previousAttempts.filter(
      (record) => record.attemptId !== attempt.attemptId,
    ),
  ];
  const pregnancies = (nextSave.pregnancies ?? []).map((pregnancy) =>
    pregnancy.pregnancyId === attempt.pregnancyId
      ? {
          ...pregnancy,
          sourceAttemptId: attempt.attemptId,
          giver: parentSnapshot(attempt.giverSnapshot, pregnancy.giver),
          receiver: parentSnapshot(attempt.receiverSnapshot, pregnancy.receiver),
        }
      : pregnancy,
  );

  return {
    ...nextSave,
    breeding: nextSave.breeding
      ? {
          ...nextSave.breeding,
          attempts,
        }
      : nextSave.breeding,
    pregnancies,
    flags: {
      ...nextSave.flags,
      completeBreedingAttemptHistoryEnabled: true,
      durableBreedingSnapshotsEnabled: true,
      breedingLifecycleLinksEnabled: true,
    },
  };
}

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const result = geneticsLifecycle.performBreedingAttempt(
    save,
    giverId,
    receiverId,
  );
  if (!result) return null;
  return {
    attempt: result.attempt,
    save: preserveAttemptHistory(save, result.save, result.attempt),
  };
}
