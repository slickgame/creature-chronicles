import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const CREATURE_MEMORY_VERSION = 1 as const;

export type CreatureMemoryCategory =
  | "origin"
  | "family"
  | "battle"
  | "ranch"
  | "guild"
  | "exploration"
  | "relationship"
  | "achievement"
  | "hardship";

export type CreatureMemoryImportance = "minor" | "notable" | "major" | "legendary";

export type CreatureMemory = {
  memoryId: string;
  version: typeof CREATURE_MEMORY_VERSION;
  creatureId: CreatureId;
  category: CreatureMemoryCategory;
  importance: CreatureMemoryImportance;
  title: string;
  description: string;
  dayNumber: number;
  createdAt: string;
  sourceKey: string;
  relatedCreatureIds?: CreatureId[];
  tags?: string[];
};

export type ChronicleEntry = {
  entryId: string;
  version: typeof CREATURE_MEMORY_VERSION;
  category: CreatureMemoryCategory;
  importance: CreatureMemoryImportance;
  title: string;
  description: string;
  dayNumber: number;
  createdAt: string;
  sourceKey: string;
  creatureIds: CreatureId[];
  tags?: string[];
};

export type CreatureMemorySaveState = {
  version: typeof CREATURE_MEMORY_VERSION;
  memoriesByCreatureId: Record<string, CreatureMemory[]>;
  chronicle: ChronicleEntry[];
};

type MemoryAwareSave = GameSave & {
  creatureMemories?: CreatureMemorySaveState;
};

export type AddCreatureMemoryInput = Omit<
  CreatureMemory,
  "memoryId" | "version" | "createdAt"
> & {
  createdAt?: string;
};

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function memoryIdFor(input: Pick<AddCreatureMemoryInput, "creatureId" | "sourceKey">): string {
  return `memory_${hashString(`${String(input.creatureId)}:${input.sourceKey}`)}`;
}

function chronicleIdFor(memory: CreatureMemory): string {
  return `chronicle_${hashString(`${memory.memoryId}:${memory.sourceKey}`)}`;
}

function sortEntries<T extends { dayNumber: number; createdAt: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    if (left.dayNumber !== right.dayNumber) return right.dayNumber - left.dayNumber;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function createEmptyCreatureMemoryState(): CreatureMemorySaveState {
  return {
    version: CREATURE_MEMORY_VERSION,
    memoriesByCreatureId: {},
    chronicle: [],
  };
}

export function getCreatureMemoryState(save: GameSave): CreatureMemorySaveState {
  const candidate = (save as MemoryAwareSave).creatureMemories;
  if (!candidate || typeof candidate !== "object") return createEmptyCreatureMemoryState();

  const memoriesByCreatureId =
    candidate.memoriesByCreatureId && typeof candidate.memoriesByCreatureId === "object"
      ? candidate.memoriesByCreatureId
      : {};
  const chronicle = Array.isArray(candidate.chronicle) ? candidate.chronicle : [];

  return {
    version: CREATURE_MEMORY_VERSION,
    memoriesByCreatureId,
    chronicle,
  };
}

export function getCreatureMemories(
  save: GameSave,
  creatureId: CreatureId,
): CreatureMemory[] {
  return sortEntries(getCreatureMemoryState(save).memoriesByCreatureId[String(creatureId)] ?? []);
}

export function getChronicleEntries(save: GameSave): ChronicleEntry[] {
  return sortEntries(getCreatureMemoryState(save).chronicle);
}

export function addCreatureMemory(
  save: GameSave,
  input: AddCreatureMemoryInput,
): GameSave {
  const state = getCreatureMemoryState(save);
  const key = String(input.creatureId);
  const existing = state.memoriesByCreatureId[key] ?? [];
  const memoryId = memoryIdFor(input);

  if (existing.some((memory) => memory.memoryId === memoryId || memory.sourceKey === input.sourceKey)) {
    return save;
  }

  const memory: CreatureMemory = {
    ...input,
    memoryId,
    version: CREATURE_MEMORY_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const chronicleEntry: ChronicleEntry = {
    entryId: chronicleIdFor(memory),
    version: CREATURE_MEMORY_VERSION,
    category: memory.category,
    importance: memory.importance,
    title: memory.title,
    description: memory.description,
    dayNumber: memory.dayNumber,
    createdAt: memory.createdAt,
    sourceKey: memory.sourceKey,
    creatureIds: [memory.creatureId, ...(memory.relatedCreatureIds ?? [])],
    tags: memory.tags,
  };

  const updated: MemoryAwareSave = {
    ...save,
    creatureMemories: {
      version: CREATURE_MEMORY_VERSION,
      memoriesByCreatureId: {
        ...state.memoriesByCreatureId,
        [key]: sortEntries([...existing, memory]),
      },
      chronicle: state.chronicle.some((entry) => entry.entryId === chronicleEntry.entryId)
        ? state.chronicle
        : sortEntries([...state.chronicle, chronicleEntry]),
    },
  };

  return updated;
}

function originMemoryFor(creature: CreatureRecord, dayNumber: number): AddCreatureMemoryInput {
  const wasHatched = creature.origin === "hatched";
  return {
    creatureId: creature.creatureId,
    category: wasHatched ? "family" : "origin",
    importance: wasHatched ? "notable" : "minor",
    title: wasHatched ? `${creature.nickname} hatched` : `${creature.nickname} joined the ranch`,
    description: wasHatched
      ? `${creature.nickname} hatched as a generation ${creature.generation} creature.`
      : `${creature.nickname} joined the ranch through ${creature.originLabel || creature.origin}.`,
    dayNumber,
    sourceKey: `origin:${String(creature.creatureId)}`,
    relatedCreatureIds: creature.lineage?.parentCreatureIds ?? [],
    tags: [creature.origin, `generation-${creature.generation}`],
  };
}

export function normalizeCreatureMemorySave(save: GameSave): GameSave {
  let normalized: GameSave = {
    ...save,
    creatureMemories: getCreatureMemoryState(save),
  } as MemoryAwareSave;

  for (const creature of save.creatures ?? []) {
    const recordedDay = Math.max(1, Number(save.dayState?.dayNumber ?? 1));
    normalized = addCreatureMemory(normalized, originMemoryFor(creature, recordedDay));

    if (creature.level >= 10) {
      const milestone = Math.floor(creature.level / 10) * 10;
      normalized = addCreatureMemory(normalized, {
        creatureId: creature.creatureId,
        category: "achievement",
        importance: creature.level >= 50 ? "major" : "notable",
        title: `${creature.nickname} reached level ${milestone}`,
        description: `${creature.nickname} grew into an experienced member of the ranch.`,
        dayNumber: recordedDay,
        sourceKey: `level-milestone:${milestone}`,
        tags: ["level", "growth"],
      });
    }
  }

  return {
    ...normalized,
    flags: {
      ...normalized.flags,
      creatureMemoryVersion: CREATURE_MEMORY_VERSION,
      creatureMemoriesMigrated: true,
    },
  };
}
