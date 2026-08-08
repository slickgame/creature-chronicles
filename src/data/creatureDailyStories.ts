import { addCreatureMemory, addSharedCreatureMemory } from "@/data/creatureMemories";
import {
  getCreaturePersonalityProfile,
  getPersonalityCompatibility,
  isPreferredRanchJob,
} from "@/data/creaturePersonalities";
import {
  getCreatureRelationship,
  getCreatureRelationshipLabel,
  getRelationshipId,
  recordCreatureRelationshipEvent,
} from "@/data/creatureRelationships";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobId, RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

const JOB_LABELS: Record<RanchJobId, string> = {
  security_patrol: "Security Patrol",
  comfort_care: "Comfort Care",
  stable_production: "Stable Production",
  garden_tending: "Garden Tending",
  field_hauling: "Field Hauling",
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function creatureById(save: GameSave, creatureId: CreatureId): CreatureRecord | null {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId) ?? null;
}

function addAffection(save: GameSave, creatureIds: CreatureId[], amount: number): GameSave {
  if (!amount) return save;
  const targetIds = new Set(creatureIds.map(String));
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) =>
      targetIds.has(String(creature.creatureId))
        ? { ...creature, affection: Math.max(0, Math.min(100, creature.affection + amount)) }
        : creature,
    ),
  };
}

function choosePair(save: GameSave, results: RanchJobResult[], dayNumber: number): [CreatureId, CreatureId] | null {
  const byJob = new Map<RanchJobId, CreatureId[]>();
  for (const result of results) {
    const entries = byJob.get(result.jobId) ?? [];
    if (!entries.includes(result.creatureId)) entries.push(result.creatureId);
    byJob.set(result.jobId, entries);
  }
  const sharedJobGroups = Array.from(byJob.entries()).filter(([, creatureIds]) => creatureIds.length >= 2);
  if (sharedJobGroups.length) {
    const [, creatureIds] = sharedJobGroups[stableHash(`shared-job:${dayNumber}`) % sharedJobGroups.length];
    const offset = stableHash(`shared-pair:${dayNumber}:${creatureIds.join(":")}`) % creatureIds.length;
    return [creatureIds[offset], creatureIds[(offset + 1) % creatureIds.length]];
  }

  const workers = Array.from(new Set(results.map((result) => String(result.creatureId))))
    .map((creatureId) => creatureId as CreatureId);
  if (workers.length >= 2) {
    const offset = stableHash(`worker-pair:${dayNumber}`) % workers.length;
    return [workers[offset], workers[(offset + 1) % workers.length]];
  }

  const ranchCreatures = (save.creatures ?? [])
    .filter((creature) => !getTrainingUnavailableReason(save, creature.creatureId))
    .map((creature) => creature.creatureId);
  if (ranchCreatures.length < 2) return null;
  const offset = stableHash(`ranch-pair:${save.saveId}:${dayNumber}`) % ranchCreatures.length;
  return [ranchCreatures[offset], ranchCreatures[(offset + 1) % ranchCreatures.length]];
}

function sharedJobForPair(
  results: RanchJobResult[],
  leftId: CreatureId,
  rightId: CreatureId,
): RanchJobId | null {
  const leftJobs = new Set(results.filter((result) => result.creatureId === leftId).map((result) => result.jobId));
  return results.find((result) => result.creatureId === rightId && leftJobs.has(result.jobId))?.jobId ?? null;
}

function positiveStory(
  left: CreatureRecord,
  right: CreatureRecord,
  jobId: RanchJobId | null,
  relationshipLabel: string,
): { title: string; description: string } {
  if (jobId) {
    return {
      title: `${left.nickname} and ${right.nickname} found their rhythm`,
      description: `${left.nickname} and ${right.nickname} worked ${JOB_LABELS[jobId]} together. Their different habits settled into an easy rhythm, strengthening their ${relationshipLabel.toLowerCase()} bond.`,
    };
  }
  return {
    title: `${left.nickname} and ${right.nickname} shared a quiet moment`,
    description: `${left.nickname} and ${right.nickname} spent time together after the ranch work was done. The small moment made their ${relationshipLabel.toLowerCase()} connection feel more natural.`,
  };
}

function frictionStory(
  left: CreatureRecord,
  right: CreatureRecord,
  jobId: RanchJobId | null,
): { title: string; description: string } {
  if (jobId) {
    return {
      title: `${left.nickname} and ${right.nickname} disagreed over the work`,
      description: `${left.nickname} and ${right.nickname} approached ${JOB_LABELS[jobId]} in completely different ways. The chore was finished, but neither was ready to admit the other might have had a point.`,
    };
  }
  return {
    title: `${left.nickname} and ${right.nickname} tested each other's patience`,
    description: `${left.nickname} and ${right.nickname} misread each other's mood during a quiet ranch moment. The tension passed, but the disagreement will be remembered.`,
  };
}

function recordSoloPreferenceStory(
  save: GameSave,
  result: RanchJobResult,
  dayNumber: number,
): GameSave {
  const creature = creatureById(save, result.creatureId);
  if (!creature) return save;
  const profile = getCreaturePersonalityProfile(save, creature.creatureId);
  const preferred = isPreferredRanchJob(profile, result.jobId);
  const next = preferred ? addAffection(save, [creature.creatureId], 1) : save;
  return addCreatureMemory(next, {
    creatureId: creature.creatureId,
    category: "ranch",
    importance: "minor",
    title: preferred
      ? `${creature.nickname} felt at home in the work`
      : `${creature.nickname} completed a solitary shift`,
    description: preferred
      ? `${JOB_LABELS[result.jobId]} matched ${creature.nickname}'s ${profile.displayName.toLowerCase()} nature, making the work feel personally satisfying.`
      : `${creature.nickname} handled ${JOB_LABELS[result.jobId]} alone and added another dependable day to the ranch's story.`,
    dayNumber,
    sourceKey: `daily-solo-story:${dayNumber}:${String(creature.creatureId)}`,
    tags: ["daily-story", "personality", profile.archetype, result.jobId],
  });
}

/**
 * Produces at most one deterministic social story per Ranch Day. Shared work is
 * preferred, but quiet off-duty interactions ensure present creatures still
 * develop relationships on days without multi-creature chores. Creatures away
 * for Training Grounds or Guild service cannot appear in Ranch social scenes.
 */
export function processDailyCreatureStories(
  save: GameSave,
  results: RanchJobResult[],
  dayNumber = save.dayState.dayNumber,
): GameSave {
  if (Number(save.flags.creatureDailyStoryDayNumber ?? 0) === dayNumber) return save;

  const presentResults = results.filter((result) => !getTrainingUnavailableReason(save, result.creatureId));
  const pair = choosePair(save, presentResults, dayNumber);
  if (!pair) {
    const solo = presentResults[0] ? recordSoloPreferenceStory(save, presentResults[0], dayNumber) : save;
    return {
      ...solo,
      flags: { ...solo.flags, creatureDailyStoryDayNumber: dayNumber },
    };
  }

  const [leftId, rightId] = pair;
  const left = creatureById(save, leftId);
  const right = creatureById(save, rightId);
  if (!left || !right) return save;

  const leftProfile = getCreaturePersonalityProfile(save, leftId);
  const rightProfile = getCreaturePersonalityProfile(save, rightId);
  const compatibility = getPersonalityCompatibility(leftProfile, rightProfile);
  const eventRoll = stableHash(`daily-social:${dayNumber}:${getRelationshipId(leftId, rightId)}`) % 5;
  const friction = compatibility < 0 && eventRoll === 0;
  const affinityDelta = friction ? -2 : Math.max(1, Math.min(5, 2 + compatibility));
  const jobId = sharedJobForPair(presentResults, leftId, rightId);

  let nextSave = recordCreatureRelationshipEvent(save, {
    eventKey: `daily-relationship:${dayNumber}:${getRelationshipId(leftId, rightId)}`,
    creatureIds: [leftId, rightId],
    dayNumber,
    affinityDelta,
  });
  const relationship = getCreatureRelationship(nextSave, leftId, rightId);
  const story = friction
    ? frictionStory(left, right, jobId)
    : positiveStory(left, right, jobId, getCreatureRelationshipLabel(relationship));

  if (!friction) nextSave = addAffection(nextSave, [leftId, rightId], 1);
  nextSave = addSharedCreatureMemory(nextSave, {
    creatureIds: [leftId, rightId],
    category: "relationship",
    importance: Math.abs(relationship.affinity) >= 70 ? "notable" : "minor",
    title: story.title,
    description: story.description,
    dayNumber,
    sourceKey: `daily-story:${dayNumber}:${getRelationshipId(leftId, rightId)}`,
    tags: [
      "daily-story",
      friction ? "friction" : "bonding",
      leftProfile.archetype,
      rightProfile.archetype,
      ...(jobId ? [jobId] : []),
    ],
  });

  return {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      creatureDailyStoryDayNumber: dayNumber,
      creatureDailyStoriesCreated: Number(nextSave.flags.creatureDailyStoriesCreated ?? 0) + 1,
    },
  };
}
