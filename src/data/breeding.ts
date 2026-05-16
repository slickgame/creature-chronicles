import { CREATURE_PLACEHOLDER_IMAGE, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import type { BreedingAttemptRecord, BreedingParticipant, BreedingPreview, BreedingState } from "@/types/breeding";
import type { BreedingAttemptId, CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const PLAYER_PARTICIPANT_ID = "player";

export function createDefaultBreedingState(): BreedingState {
  return {
    hearts: 0,
    maxHearts: 0,
    attempts: [],
    streaks: [],
  };
}

export function getPairKey(giverId: string, receiverId: string): string {
  return [giverId, receiverId].sort().join("__");
}

export function getBreedingParticipants(save: GameSave): BreedingParticipant[] {
  const player: BreedingParticipant = {
    participantId: PLAYER_PARTICIPANT_ID,
    kind: "player",
    displayName: save.player.name,
    familyLabel: "Player",
    roleTags: ["giver", "receiver"],
    energy: save.currencies.energy,
    maxEnergy: save.currencies.maxEnergy,
    hearts: save.player.hearts ?? 4,
    maxHearts: save.player.maxHearts ?? 4,
    affection: 65,
    level: save.player.breederRank,
    xp: 0,
    description: "The player character can participate in breeding pair selection and uses personal Hearts.",
    portraitPath: "/images/ui/icons/icon_paw_crest.png",
    profilePath: "/images/ui/icons/icon_paw_crest.png",
  };

  const creatures = (save.creatures ?? []).map((creature) => {
    const variant = getVariantDefinition(creature.variantId);
    const species = getSpeciesDefinition(variant.speciesId);

    return {
      participantId: creature.creatureId,
      kind: "creature" as const,
      creatureId: creature.creatureId as CreatureId,
      displayName: creature.nickname,
      familyLabel: `${variant.name} ${species.name}`,
      roleTags: ["giver", "receiver"] as const,
      energy: creature.energy,
      maxEnergy: creature.maxEnergy,
      hearts: creature.hearts ?? 4,
      maxHearts: creature.maxHearts ?? 4,
      affection: creature.affection,
      level: creature.level,
      xp: creature.xp,
      stats: creature.stats,
      abilities: creature.abilities,
      description: variant.description,
      portraitPath: variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE,
      profilePath: variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE,
    };
  });

  return [player, ...creatures];
}

export function getBreedingPreview(save: GameSave, giverId: string | null, receiverId: string | null): BreedingPreview | null {
  if (!giverId || !receiverId || giverId === receiverId) {
    return null;
  }

  const breeding = save.breeding ?? createDefaultBreedingState();
  const participants = getBreedingParticipants(save);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);

  if (!giver || !receiver) {
    return null;
  }

  const pairKey = getPairKey(giverId, receiverId);
  const streakRecord = breeding.streaks.find((item) => item.pairKey === pairKey);
  const streakCount = streakRecord?.streakCount ?? 0;
  const baseChance = 12;
  const streakBonus = Math.min(30, streakCount * 6);
  const affectionBonus = Math.floor((giver.affection + receiver.affection) / 40);
  const pregnancyChance = Math.min(75, baseChance + streakBonus + affectionBonus);
  const energyCost = 35;
  const heartCost = receiver.kind === "player" || giver.kind === "player" ? 2 : 1;
  const xpGain = 8 + streakCount * 2;

  let blockedReason: string | null = null;

  if (giver.hearts < heartCost || receiver.hearts < heartCost) {
    blockedReason = "Both participants need enough Hearts.";
  } else if (giver.energy < energyCost || receiver.energy < energyCost) {
    blockedReason = "Both participants need enough energy.";
  }

  return {
    pairKey,
    pregnancyChance,
    baseChance,
    streakBonus,
    streakCount,
    energyCost,
    heartCost,
    xpGain,
    canAttempt: blockedReason === null,
    blockedReason,
  };
}

function updateStreaks(state: BreedingState, pairKey: string, giverId: string, receiverId: string, dayNumber: number, outcome: "pregnancy" | "failed") {
  const previous = state.streaks.find((item) => item.pairKey === pairKey);
  const streakAfter = (previous?.streakCount ?? 0) + 1;
  const unrelated = state.streaks.filter(
    (item) =>
      item.pairKey === pairKey ||
      (!item.pairKey.includes(giverId) && !item.pairKey.includes(receiverId)),
  );

  return {
    streakBefore: previous?.streakCount ?? 0,
    streakAfter,
    streaks: [
      ...unrelated.filter((item) => item.pairKey !== pairKey),
      {
        pairKey,
        participantAId: giverId,
        participantBId: receiverId,
        streakCount: streakAfter,
        lastAttemptDayNumber: dayNumber,
        lastOutcome: outcome,
      },
    ],
  };
}

function deterministicRoll(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return hash % 100;
}

export function performBreedingAttempt(save: GameSave, giverId: string, receiverId: string): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const breeding = save.breeding ?? createDefaultBreedingState();
  const preview = getBreedingPreview({ ...save, breeding }, giverId, receiverId);

  if (!preview || !preview.canAttempt) {
    return null;
  }

  const attemptNumber = breeding.attempts.length + 1;
  const attemptId = `breeding_${save.dayState.dayNumber}_${attemptNumber}_${Date.now()}` as BreedingAttemptId;
  const roll = deterministicRoll(`${save.saveId}_${attemptId}_${giverId}_${receiverId}`);
  const outcome = roll < preview.pregnancyChance ? "pregnancy" : "failed";
  const streakUpdate = updateStreaks(breeding, preview.pairKey, giverId, receiverId, save.dayState.dayNumber, outcome);
  const participants = getBreedingParticipants(save);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);
  const resultText = outcome === "pregnancy"
    ? `${receiver?.displayName ?? "Receiver"} shows promising signs. Pregnancy/egg creation will be handled in M5.`
    : `${giver?.displayName ?? "Giver"} and ${receiver?.displayName ?? "Receiver"} bonded, but no pregnancy occurred.`;

  const attempt: BreedingAttemptRecord = {
    attemptId,
    dayNumber: save.dayState.dayNumber,
    giverId,
    receiverId,
    pregnancyChance: preview.pregnancyChance,
    energyCost: preview.energyCost,
    heartCost: preview.heartCost,
    xpGain: preview.xpGain,
    streakBefore: streakUpdate.streakBefore,
    streakAfter: streakUpdate.streakAfter,
    outcome,
    resultText,
    createdAt: new Date().toISOString(),
  };

  const shouldUpdatePlayer = giverId === PLAYER_PARTICIPANT_ID || receiverId === PLAYER_PARTICIPANT_ID;

  return {
    save: {
      ...save,
      player: shouldUpdatePlayer
        ? {
            ...save.player,
            hearts: Math.max(0, (save.player.hearts ?? 4) - preview.heartCost),
          }
        : save.player,
      currencies: {
        ...save.currencies,
        energy: shouldUpdatePlayer ? Math.max(0, save.currencies.energy - preview.energyCost) : save.currencies.energy,
      },
      creatures: (save.creatures ?? []).map((creature) =>
        creature.creatureId === giverId || creature.creatureId === receiverId
          ? {
              ...creature,
              energy: Math.max(0, creature.energy - preview.energyCost),
              hearts: Math.max(0, (creature.hearts ?? 4) - preview.heartCost),
              xp: creature.xp + preview.xpGain,
              affection: Math.min(100, creature.affection + 2),
            }
          : creature,
      ),
      breeding: {
        hearts: 0,
        maxHearts: 0,
        attempts: [attempt, ...breeding.attempts].slice(0, 20),
        streaks: streakUpdate.streaks,
      },
      flags: {
        ...save.flags,
        breedingUnlocked: true,
        m4BreedingAttempted: true,
        lastBreedingOutcome: outcome,
      },
    },
    attempt,
  };
}
