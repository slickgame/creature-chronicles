import { CREATURE_AMBITIONS, getCreatureAmbitionProgress } from "@/data/creatureAmbitions";
import { addCreatureMemory } from "@/data/creatureMemories";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function getCreatureName(save: GameSave, creatureId: CreatureId): string {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId)?.nickname ?? "A ranch creature";
}

/**
 * Compares career-backed ambition progress before and after a transaction and
 * writes one idempotent Memory/Chronicle entry for every newly crossed milestone.
 * All ambitions are evaluated so a creature's broader life story is retained
 * even when only one ambition is shown as its current primary goal.
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
        recordedSave = addCreatureMemory(recordedSave, {
          creatureId,
          category: "achievement",
          importance: completed ? "major" : milestone >= definition.target / 2 ? "notable" : "minor",
          title: completed
            ? `${creatureName} fulfilled ${definition.name}`
            : `${creatureName} advanced ${definition.name}`,
          description: completed
            ? `${creatureName} completed the ${definition.name} ambition with ${after.progress} ${definition.progressLabel.toLowerCase()}.`
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
