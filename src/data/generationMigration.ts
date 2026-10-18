import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function resolveGeneration(
  creature: CreatureRecord,
  creatureMap: Map<CreatureId, CreatureRecord>,
  cache: Map<CreatureId, number>,
  visiting: Set<CreatureId>,
  archive: NonNullable<GameSave['familyArchive']>['records'],
): number {
  const cached = cache.get(creature.creatureId);
  if (cached) return cached;

  if (visiting.has(creature.creatureId)) {
    return Math.max(1, creature.generation || 1);
  }

  const parentIds = creature.lineage?.parentCreatureIds ?? [];
  if (!parentIds.length) {
    const generation = Math.max(1, creature.generation || 1);
    cache.set(creature.creatureId, generation);
    return generation;
  }

  visiting.add(creature.creatureId);
  const parentGenerations = parentIds
    .map((parentId) => {
      const parent = creatureMap.get(parentId);
      return parent ? resolveGeneration(parent, creatureMap, cache, visiting, archive) : archive[`creature:${parentId}`]?.generation;
    })
    .filter((generation): generation is number => typeof generation === 'number' && Number.isFinite(generation));
  visiting.delete(creature.creatureId);

  const calculated = Math.max(1, ...parentGenerations) + 1;
  const generation = parentGenerations.length < parentIds.length ? Math.max(creature.generation || 1, archive[`creature:${creature.creatureId}`]?.generation ?? 1, calculated) : calculated;
  cache.set(creature.creatureId, generation);
  return generation;
}

export function normalizeTrackedCreatureGenerations(save: GameSave): GameSave {
  const creatures = save.creatures ?? [];
  if (!creatures.length) return save;

  const creatureMap = new Map(
    creatures.map((creature) => [creature.creatureId, creature] as const),
  );
  const cache = new Map<CreatureId, number>();
  let changed = false;
  const normalizedCreatures = creatures.map((creature) => {
    const generation = resolveGeneration(
      creature,
      creatureMap,
      cache,
      new Set<CreatureId>(),
      save.familyArchive?.records ?? {},
    );
    if (generation === creature.generation) return creature;
    changed = true;
    return { ...creature, generation };
  });

  if (!changed) return save;

  return {
    ...save,
    creatures: normalizedCreatures,
    flags: {
      ...save.flags,
      offspringGenerationMigrationApplied: true,
    },
  };
}
