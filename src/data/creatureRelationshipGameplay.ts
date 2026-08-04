import {
  getCreaturePersonalityProfile,
  getPersonalityCompatibility,
  isPreferredRanchJob,
} from "@/data/creaturePersonalities";
import {
  getCreatureRelationship,
  getRelationshipsForCreature,
  recordCreatureRelationshipEvent,
} from "@/data/creatureRelationships";
import type { CreatureId } from "@/types/ids";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

export type BreedingRelationshipCompatibility = {
  creatureIds: [CreatureId, CreatureId];
  personalityScore: number;
  affinity: number;
  score: number;
  label: "Exceptional" | "Strong" | "Steady" | "Uncertain" | "Strained";
  summary: string;
};

export type TrainingRelationshipSupport = {
  supporterId: CreatureId;
  supporterName: string;
  relationshipLabel: string;
};

function clampAffection(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function addAffection(save: GameSave, creatureIds: CreatureId[], amount: number): GameSave {
  if (!amount || !creatureIds.length) return save;
  const ids = new Set(creatureIds.map(String));
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) =>
      ids.has(String(creature.creatureId))
        ? { ...creature, affection: clampAffection(creature.affection + amount) }
        : creature,
    ),
  };
}

function creatureIdFromInput(save: GameSave, input: string): CreatureId | null {
  return (save.creatures ?? []).find((creature) => String(creature.creatureId) === String(input))
    ?.creatureId ?? null;
}

function relationshipScore(affinity: number): number {
  if (affinity >= 70) return 2;
  if (affinity >= 30) return 1;
  if (affinity <= -45) return -2;
  if (affinity <= -15) return -1;
  return 0;
}

function compatibilityLabel(score: number): BreedingRelationshipCompatibility["label"] {
  if (score >= 5) return "Exceptional";
  if (score >= 3) return "Strong";
  if (score >= 1) return "Steady";
  if (score >= 0) return "Uncertain";
  return "Strained";
}

export function getBreedingRelationshipCompatibility(
  save: GameSave,
  giverId: string,
  receiverId: string,
): BreedingRelationshipCompatibility | null {
  const giverCreatureId = creatureIdFromInput(save, giverId);
  const receiverCreatureId = creatureIdFromInput(save, receiverId);
  if (!giverCreatureId || !receiverCreatureId || giverCreatureId === receiverCreatureId) return null;

  const giverProfile = getCreaturePersonalityProfile(save, giverCreatureId);
  const receiverProfile = getCreaturePersonalityProfile(save, receiverCreatureId);
  const personalityScore = getPersonalityCompatibility(giverProfile, receiverProfile);
  const relationship = getCreatureRelationship(save, giverCreatureId, receiverCreatureId);
  const score = Math.max(-4, Math.min(6, personalityScore + relationshipScore(relationship.affinity)));
  const label = compatibilityLabel(score);

  return {
    creatureIds: [giverCreatureId, receiverCreatureId],
    personalityScore,
    affinity: relationship.affinity,
    score,
    label,
    summary:
      score >= 3
        ? `${label} compatibility: established trust and compatible temperaments make the pairing emotionally comfortable.`
        : score >= 0
          ? `${label} compatibility: the pair can work together, but their bond is still developing.`
          : `${label} compatibility: personality friction or a strained bond may make the attempt emotionally difficult.`,
  };
}

export function applyBreedingRelationshipAftermath(
  save: GameSave,
  compatibility: BreedingRelationshipCompatibility | null,
  outcome: string,
  attemptId: string,
  dayNumber: number,
): GameSave {
  if (!compatibility) return save;
  const rewardFlag = `breedingRelationshipAftermath_${attemptId}`;
  if (save.flags[rewardFlag] === true) return save;

  const success = outcome === "pregnancy";
  const affectionDelta = success
    ? compatibility.score >= 3 ? 2 : 1
    : compatibility.score < 0 ? -1 : 0;
  let nextSave = addAffection(save, compatibility.creatureIds, affectionDelta);
  nextSave = recordCreatureRelationshipEvent(nextSave, {
    eventKey: `breeding-compatibility:${attemptId}`,
    creatureIds: compatibility.creatureIds,
    dayNumber,
    affinityDelta: success ? Math.max(1, Math.min(3, compatibility.score)) : compatibility.score < 0 ? -1 : 0,
  });
  return {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      [rewardFlag]: true,
      [`breedingCompatibility_${attemptId}`]: `${compatibility.label}|${compatibility.score}|${affectionDelta}`,
    },
  };
}

export function applyTrainingRelationshipSupport(
  save: GameSave,
  creatureId: CreatureId,
  assignmentId: string,
  dayNumber: number,
): { save: GameSave; support: TrainingRelationshipSupport | null } {
  const relationship = getRelationshipsForCreature(save, creatureId)
    .filter((entry) => entry.affinity >= 30)
    .sort((left, right) => right.affinity - left.affinity)[0];
  if (!relationship) return { save, support: null };

  const supporterId = relationship.creatureIds.find((id) => id !== creatureId);
  if (!supporterId) return { save, support: null };
  const supporter = (save.creatures ?? []).find((creature) => creature.creatureId === supporterId);
  if (!supporter) return { save, support: null };

  const support: TrainingRelationshipSupport = {
    supporterId,
    supporterName: supporter.nickname,
    relationshipLabel: relationship.family ? "family bond" : "friendship",
  };
  const rewardFlag = `trainingSupportReward_${assignmentId}_${String(creatureId)}`;
  if (save.flags[rewardFlag] === true) return { save, support };

  let nextSave = recordCreatureRelationshipEvent(save, {
    eventKey: `training-support:${assignmentId}:${String(creatureId)}:${String(supporterId)}`,
    creatureIds: [creatureId, supporterId],
    dayNumber,
    affinityDelta: 1,
  });
  nextSave = addAffection(nextSave, [creatureId], 1);
  nextSave = {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      [rewardFlag]: true,
    },
  };

  return { save: nextSave, support };
}

export function applyBattleTeamworkMorale(
  save: GameSave,
  battleId: string,
  participantIds: CreatureId[],
  outcome: "victory" | "draw" | "defeat",
): GameSave {
  const rewardFlag = `battleTeamworkMorale_${battleId}`;
  if (save.flags[rewardFlag] === true || outcome !== "victory") return save;

  const uniqueIds = Array.from(new Set(participantIds.map(String))).map((id) => id as CreatureId);
  const rewarded = uniqueIds.filter((creatureId) =>
    uniqueIds.some((otherId) =>
      otherId !== creatureId && getCreatureRelationship(save, creatureId, otherId).affinity >= 30,
    ),
  );
  const nextSave = addAffection(save, rewarded, 1);
  return {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      [rewardFlag]: true,
      [`battleTeamworkMoraleCount_${battleId}`]: rewarded.length,
    },
  };
}

export function applyRanchWorkRelationshipEffects(
  save: GameSave,
  results: RanchJobResult[],
  dayNumber: number,
): { save: GameSave; results: RanchJobResult[] } {
  if (Number(save.flags.relationshipWorkEffectsDayNumber ?? 0) === dayNumber) {
    return { save, results };
  }

  const successful = results.filter((result) => result.energyCost > 0);
  const byJob = new Map<string, RanchJobResult[]>();
  for (const result of successful) {
    const entries = byJob.get(result.jobId) ?? [];
    entries.push(result);
    byJob.set(result.jobId, entries);
  }

  let nextSave = save;
  const affectionDeltaByCreature = new Map<string, number>();

  for (const result of successful) {
    const profile = getCreaturePersonalityProfile(nextSave, result.creatureId);
    let delta = isPreferredRanchJob(profile, result.jobId)
      ? 1
      : profile.dislikedJobId === result.jobId ? -1 : 0;
    const coworkers = (byJob.get(result.jobId) ?? []).filter(
      (entry) => entry.creatureId !== result.creatureId,
    );
    const coworkerAffinities = coworkers.map(
      (entry) => getCreatureRelationship(nextSave, result.creatureId, entry.creatureId).affinity,
    );
    if (coworkerAffinities.some((affinity) => affinity >= 30)) delta += 1;
    else if (coworkerAffinities.some((affinity) => affinity <= -15)) delta -= 1;
    affectionDeltaByCreature.set(String(result.creatureId), Math.max(-2, Math.min(2, delta)));
  }

  for (const entries of byJob.values()) {
    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
        const left = entries[leftIndex];
        const right = entries[rightIndex];
        const leftProfile = getCreaturePersonalityProfile(nextSave, left.creatureId);
        const rightProfile = getCreaturePersonalityProfile(nextSave, right.creatureId);
        const compatibility = getPersonalityCompatibility(leftProfile, rightProfile);
        const relationship = getCreatureRelationship(nextSave, left.creatureId, right.creatureId);
        nextSave = recordCreatureRelationshipEvent(nextSave, {
          eventKey: `shared-work:${dayNumber}:${left.jobId}:${String(left.creatureId)}:${String(right.creatureId)}`,
          creatureIds: [left.creatureId, right.creatureId],
          dayNumber,
          affinityDelta: compatibility < 0 && relationship.affinity < 0 ? -1 : 1,
        });
      }
    }
  }

  for (const [creatureId, delta] of affectionDeltaByCreature) {
    nextSave = addAffection(nextSave, [creatureId as CreatureId], delta);
  }

  return {
    save: {
      ...nextSave,
      flags: {
        ...nextSave.flags,
        relationshipWorkEffectsDayNumber: dayNumber,
      },
    },
    results: results.map((result) => {
      const delta = affectionDeltaByCreature.get(String(result.creatureId)) ?? 0;
      if (!delta) return result;
      return {
        ...result,
        affectionReward: result.affectionReward + delta,
        message: `${result.message} Relationship satisfaction ${delta > 0 ? "+" : ""}${delta} Affection.`,
      };
    }),
  };
}
