import { getSpeciesDefinition, getVariantDefinition } from "./creatures";
import type {
  BreedingAttemptRecord,
  BreedingParticipantSnapshot,
  BreedingSceneFamily,
} from "@/types/breeding";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave, ParentSnapshot, PregnancyRecord } from "@/types/save";

function creatureFor(save: GameSave, participantId: string): CreatureRecord | undefined {
  return (save.creatures ?? []).find(
    (creature) => creature.creatureId === participantId,
  );
}

function sceneFamilyFor(creature: CreatureRecord | undefined): BreedingSceneFamily {
  if (!creature) return "unknown";
  try {
    return getVariantDefinition(creature.variantId).family;
  } catch {
    return "unknown";
  }
}

function buildAttemptSnapshot(
  save: GameSave,
  participantId: string,
  recordedName: string,
  recordedFamily: BreedingSceneFamily,
  existing?: BreedingParticipantSnapshot,
): BreedingParticipantSnapshot {
  if (existing) return existing;
  if (participantId === "player") {
    return {
      participantId,
      kind: "player",
      displayName: recordedName,
      family: "player",
      portraitPath: "/images/ui/icons/icon_breeder_level.png",
    };
  }

  const creature = creatureFor(save, participantId);
  if (!creature) {
    return {
      participantId,
      creatureId: participantId,
      kind: "creature",
      displayName: recordedName,
      family: recordedFamily,
      portraitPath: "/images/ui/icons/icon_parent_compare.png",
    };
  }

  try {
    const variant = getVariantDefinition(creature.variantId);
    const species = getSpeciesDefinition(creature.speciesId);
    return {
      participantId,
      creatureId: creature.creatureId,
      kind: "creature",
      displayName: recordedName,
      family: variant.family,
      speciesId: creature.speciesId,
      speciesName: species.name,
      variantId: creature.variantId,
      variantName: variant.name,
      rarity: variant.rarity,
      sex: creature.sex,
      shiny: creature.shiny,
      portraitPath: variant.portraitPath || variant.profilePath,
    };
  } catch {
    return {
      participantId,
      creatureId: creature.creatureId,
      kind: "creature",
      displayName: recordedName,
      family: sceneFamilyFor(creature),
      speciesId: creature.speciesId,
      variantId: creature.variantId,
      sex: creature.sex,
      shiny: creature.shiny,
      portraitPath: "/images/ui/icons/icon_parent_compare.png",
    };
  }
}

function parentFromSnapshot(
  snapshot: BreedingParticipantSnapshot,
  fallback: ParentSnapshot,
): ParentSnapshot {
  return {
    ...fallback,
    participantId: snapshot.participantId,
    creatureId: snapshot.creatureId,
    displayName: fallback.displayName || snapshot.displayName,
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

function uniquelyLinkedAttempt(
  pregnancy: PregnancyRecord,
  attempts: BreedingAttemptRecord[],
): BreedingAttemptRecord | undefined {
  const candidates = attempts.filter(
    (attempt) =>
      attempt.outcome === "pregnancy" &&
      !attempt.receiverWasPregnant &&
      attempt.dayNumber === pregnancy.createdAtDayNumber &&
      attempt.giverId === pregnancy.giver.participantId &&
      attempt.receiverId === pregnancy.receiver.participantId,
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function normalizeBreedingRecords(save: GameSave): GameSave {
  const rawAttempts = save.breeding?.attempts ?? [];
  let attempts = rawAttempts.map((attempt) => ({
    ...attempt,
    giverSnapshot: buildAttemptSnapshot(
      save,
      attempt.giverId,
      attempt.giverName,
      attempt.giverFamily,
      attempt.giverSnapshot,
    ),
    receiverSnapshot: buildAttemptSnapshot(
      save,
      attempt.receiverId,
      attempt.receiverName,
      attempt.receiverFamily,
      attempt.receiverSnapshot,
    ),
  }));

  const pregnancies = (save.pregnancies ?? []).map((pregnancy) => {
    const linkedAttempt = pregnancy.sourceAttemptId
      ? attempts.find((attempt) => attempt.attemptId === pregnancy.sourceAttemptId)
      : uniquelyLinkedAttempt(pregnancy, attempts);
    if (!linkedAttempt) return pregnancy;

    attempts = attempts.map((attempt) =>
      attempt.attemptId === linkedAttempt.attemptId
        ? { ...attempt, pregnancyId: pregnancy.pregnancyId }
        : attempt,
    );
    const giverSnapshot = linkedAttempt.giverSnapshot;
    const receiverSnapshot = linkedAttempt.receiverSnapshot;
    return {
      ...pregnancy,
      sourceAttemptId: linkedAttempt.attemptId,
      giver: giverSnapshot
        ? parentFromSnapshot(giverSnapshot, pregnancy.giver)
        : pregnancy.giver,
      receiver: receiverSnapshot
        ? parentFromSnapshot(receiverSnapshot, pregnancy.receiver)
        : pregnancy.receiver,
    };
  });

  const eggs = (save.eggs ?? []).map((egg) => {
    const linkedPregnancy = egg.sourcePregnancyId
      ? pregnancies.find((pregnancy) => pregnancy.pregnancyId === egg.sourcePregnancyId)
      : pregnancies.find((pregnancy) =>
          String(egg.eggId).includes(String(pregnancy.pregnancyId)),
        );
    if (!linkedPregnancy) return egg;
    return {
      ...egg,
      sourcePregnancyId: linkedPregnancy.pregnancyId,
      sourceAttemptId: linkedPregnancy.sourceAttemptId,
      parents: {
        giver: linkedPregnancy.giver,
        receiver: linkedPregnancy.receiver,
      },
    };
  });

  const birthHistory = (save.birthHistory ?? []).map((birth) => {
    const egg = eggs.find((candidate) => candidate.eggId === birth.eggId);
    if (!egg) return birth;
    return {
      ...birth,
      sourceAttemptId: egg.sourceAttemptId ?? birth.sourceAttemptId,
      sourcePregnancyId: egg.sourcePregnancyId ?? birth.sourcePregnancyId,
      parents: egg.parents ?? birth.parents,
    };
  });

  return {
    ...save,
    breeding: save.breeding
      ? { ...save.breeding, attempts }
      : save.breeding,
    pregnancies,
    eggs,
    birthHistory,
    flags: {
      ...save.flags,
      breedingRecordsNormalized: true,
      durableBreedingSnapshotsEnabled: true,
    },
  };
}
