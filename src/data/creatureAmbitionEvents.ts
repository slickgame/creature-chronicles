import { CREATURE_AMBITIONS, getCreatureAmbitionProgress, type CreatureAmbitionDefinition } from "@/data/creatureAmbitions";
import { addCreatureMemory } from "@/data/creatureMemories";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type AmbitionCompletionReward = {
  gold: number;
  guildPoints: number;
  prestige: number;
};

function getCreatureName(save: GameSave, creatureId: CreatureId): string {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId)?.nickname ?? "A ranch creature";
}

export function getAmbitionCompletionReward(definition: CreatureAmbitionDefinition): AmbitionCompletionReward {
  if (definition.category === "combat") return { gold: 500, guildPoints: 20, prestige: 3 };
  if (definition.category === "guild") return { gold: 350, guildPoints: 30, prestige: 3 };
  if (definition.category === "family") return { gold: 300, guildPoints: 12, prestige: 2 };
  if (definition.category === "support") return { gold: 400, guildPoints: 16, prestige: 3 };
  return { gold: 300, guildPoints: 10, prestige: 2 };
}

function rewardFlagKey(creatureId: CreatureId, ambitionId: string): string {
  return `ambitionReward:${String(creatureId)}:${ambitionId}`;
}

function applyAmbitionCompletionReward(
  save: GameSave,
  creatureId: CreatureId,
  definition: CreatureAmbitionDefinition,
): GameSave {
  const key = rewardFlagKey(creatureId, definition.ambitionId);
  if (save.flags[key] === true) return save;
  const reward = getAmbitionCompletionReward(definition);
  const currentPrestige = Number(save.flags.legacyPrestige ?? 0);
  return {
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold + reward.gold,
      guildPoints: save.currencies.guildPoints + reward.guildPoints,
    },
    flags: {
      ...save.flags,
      [key]: true,
      legacyPrestige: Math.max(0, Number.isFinite(currentPrestige) ? currentPrestige : 0) + reward.prestige,
      ambitionCompletionRewardEarned: true,
    },
  };
}

/**
 * Compares career-backed ambition progress before and after a transaction and
 * writes one idempotent Memory/Chronicle entry for every newly crossed milestone.
 * Full completion also grants a one-time category-scaled Legacy reward.
 */
export function recordNewAmbitionMilestones(
  previousSave: GameSave,
  nextSave: GameSave,
  creatureIds: CreatureId[],
  dayNumber = nextSave.dayState.dayNumber,
): GameSave {
  let recordedSave = nextSave;
  for (const creatureId of Array.from(new Set(creatureIds))) {
    const creatureName = getCreatureName(nextSave, creatureId);
    for (const definition of CREATURE_AMBITIONS) {
      const before = getCreatureAmbitionProgress(previousSave, creatureId, definition.ambitionId);
      const after = getCreatureAmbitionProgress(recordedSave, creatureId, definition.ambitionId);
      const crossed = definition.milestoneTargets.filter(
        (milestone) => before.progress < milestone && after.progress >= milestone,
      );
      for (const milestone of crossed) {
        const completed = milestone >= definition.target;
        if (completed) recordedSave = applyAmbitionCompletionReward(recordedSave, creatureId, definition);
        const reward = completed ? getAmbitionCompletionReward(definition) : null;
        recordedSave = addCreatureMemory(recordedSave, {
          creatureId,
          category: "achievement",
          importance: completed ? "major" : milestone >= definition.target / 2 ? "notable" : "minor",
          title: completed
            ? `${creatureName} fulfilled ${definition.name}`
            : `${creatureName} advanced ${definition.name}`,
          description: completed
            ? `${creatureName} completed the ${definition.name} ambition with ${after.progress} ${definition.progressLabel.toLowerCase()}. The ranch earned ${reward?.gold ?? 0} Gold, ${reward?.guildPoints ?? 0} GP, and ${reward?.prestige ?? 0} Legacy Prestige.`
            : `${creatureName} reached the ${milestone} ${definition.progressLabel.toLowerCase()} milestone for ${definition.name}.`,
          dayNumber,
          sourceKey: `ambition:${definition.ambitionId}:milestone:${milestone}`,
          tags: ["ambition", definition.ambitionId, completed ? "completed" : "milestone"],
        });
      }
    }
  }
  return recordedSave;
}
