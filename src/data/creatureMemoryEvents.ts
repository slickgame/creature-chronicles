import { addCreatureMemory } from "@/data/creatureMemories";
import type { CreatureId } from "@/types/ids";
import type { BirthRecord, GameSave } from "@/types/save";

export type BattleMemoryOutcome = "victory" | "draw" | "defeat";

export type BattleMemoryInput = {
  creatureId: CreatureId;
  battleId: string;
  encounterName: string;
  outcome: BattleMemoryOutcome;
  dayNumber: number;
  damageDealt?: number;
  healingDone?: number;
  knockouts?: number;
  protectedAllies?: number;
};

export type GuildMemoryInput = {
  creatureId: CreatureId;
  requestId: string;
  requestTitle: string;
  guildName: string;
  dayNumber: number;
  wasFeatured?: boolean;
};

function creatureName(save: GameSave, creatureId: CreatureId): string {
  return (
    (save.creatures ?? []).find((creature) => creature.creatureId === creatureId)
      ?.nickname ?? "A ranch creature"
  );
}

/**
 * Writes the child's birth memory and parenthood memories for creature parents.
 * Deterministic source keys make the operation safe to repeat after reloads or
 * transaction recovery.
 */
export function recordBirthMemories(
  save: GameSave,
  birth: BirthRecord,
): GameSave {
  let next = addCreatureMemory(save, {
    creatureId: birth.creatureId,
    category: "family",
    importance: birth.shiny ? "major" : "notable",
    title: `${birth.nickname} hatched`,
    description: `${birth.nickname} hatched on Ranch Day ${birth.hatchedAtDayNumber}${
      birth.shiny ? " with a rare shiny appearance" : ""
    }.`,
    dayNumber: birth.hatchedAtDayNumber,
    createdAt: birth.hatchedAt,
    sourceKey: `birth:${String(birth.birthId)}`,
    relatedCreatureIds: [
      birth.parents.giver.creatureId,
      birth.parents.receiver.creatureId,
    ].filter((id): id is CreatureId => Boolean(id)),
    tags: ["birth", birth.rarity.toLowerCase(), `lineage-${birth.lineageRisk}`],
  });

  for (const parent of [birth.parents.giver, birth.parents.receiver]) {
    if (!parent.creatureId) continue;
    const parentName = creatureName(next, parent.creatureId);
    next = addCreatureMemory(next, {
      creatureId: parent.creatureId,
      category: "family",
      importance: "notable",
      title: `${parentName} became a parent`,
      description: `${parentName} became a parent to ${birth.nickname}.`,
      dayNumber: birth.hatchedAtDayNumber,
      createdAt: birth.hatchedAt,
      sourceKey: `parenthood:${String(birth.birthId)}:${String(parent.creatureId)}`,
      relatedCreatureIds: [birth.creatureId],
      tags: ["parenthood", "offspring"],
    });
  }

  return next;
}

/** Records firsts and especially notable Coliseum performances. */
export function recordBattleMemory(
  save: GameSave,
  input: BattleMemoryInput,
): GameSave {
  const name = creatureName(save, input.creatureId);
  const existingBattleMemories =
    save.creatureMemories?.memoriesByCreatureId?.[String(input.creatureId)]?.filter(
      (memory) => memory.category === "battle",
    ) ?? [];
  const hasPriorVictory = existingBattleMemories.some((memory) =>
    memory.tags?.includes("victory"),
  );

  let next = addCreatureMemory(save, {
    creatureId: input.creatureId,
    category: "battle",
    importance: "minor",
    title: `${name} entered the Coliseum`,
    description: `${name} fought in ${input.encounterName} and earned a ${input.outcome}.`,
    dayNumber: input.dayNumber,
    sourceKey: `battle:${input.battleId}:participation:${String(input.creatureId)}`,
    tags: ["coliseum", input.outcome],
  });

  if (input.outcome === "victory" && !hasPriorVictory) {
    next = addCreatureMemory(next, {
      creatureId: input.creatureId,
      category: "achievement",
      importance: "major",
      title: `${name} won a first Coliseum victory`,
      description: `${name} achieved a first recorded victory in ${input.encounterName}.`,
      dayNumber: input.dayNumber,
      sourceKey: `first-coliseum-victory:${String(input.creatureId)}`,
      tags: ["coliseum", "victory", "first"],
    });
  }

  if ((input.knockouts ?? 0) >= 3) {
    next = addCreatureMemory(next, {
      creatureId: input.creatureId,
      category: "achievement",
      importance: "major",
      title: `${name} dominated an arena match`,
      description: `${name} recorded ${input.knockouts} knockouts in ${input.encounterName}.`,
      dayNumber: input.dayNumber,
      sourceKey: `battle:${input.battleId}:three-knockouts:${String(input.creatureId)}`,
      tags: ["coliseum", "knockout", "performance"],
    });
  }

  if ((input.protectedAllies ?? 0) >= 3) {
    next = addCreatureMemory(next, {
      creatureId: input.creatureId,
      category: "relationship",
      importance: "notable",
      title: `${name} stood guard for the team`,
      description: `${name} protected allies ${input.protectedAllies} times during ${input.encounterName}.`,
      dayNumber: input.dayNumber,
      sourceKey: `battle:${input.battleId}:protector:${String(input.creatureId)}`,
      tags: ["coliseum", "guardian", "teamwork"],
    });
  }

  return next;
}

/** Records creature participation in completed guild requests. */
export function recordGuildRequestMemory(
  save: GameSave,
  input: GuildMemoryInput,
): GameSave {
  const name = creatureName(save, input.creatureId);
  return addCreatureMemory(save, {
    creatureId: input.creatureId,
    category: "guild",
    importance: input.wasFeatured ? "major" : "notable",
    title: `${name} completed a ${input.guildName} request`,
    description: `${name} helped complete “${input.requestTitle}.”`,
    dayNumber: input.dayNumber,
    sourceKey: `guild-request:${input.requestId}:${String(input.creatureId)}`,
    tags: ["guild", input.guildName.toLowerCase().replace(/\s+/g, "-")],
  });
}
