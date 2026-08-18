import { getCreatureHeirlooms } from "@/data/creatureRetirement";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { HeirloomCategory } from "@/types/legacy";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

export type HeirloomPassiveDefinition = {
  category: HeirloomCategory;
  name: string;
  trigger: string;
  effect: string;
};

export type HeirloomEffectResult = {
  save: GameSave;
  bonus: number;
  note: string | null;
};

const PASSIVES: Record<HeirloomCategory, HeirloomPassiveDefinition> = {
  combat: {
    category: "combat",
    name: "Veteran's Example",
    trigger: "Victorious Coliseum battles",
    effect: "+1 Affection to each participating creature per combat Heirloom, capped at +3 per battle.",
  },
  protection: {
    category: "protection",
    name: "Guardian's Example",
    trigger: "Victorious Coliseum battles",
    effect: "+1 Affection to each participating creature per protection Heirloom, sharing the +3 battle cap.",
  },
  caregiving: {
    category: "caregiving",
    name: "Caregiver's Example",
    trigger: "Completed Training Grounds sessions",
    effect: "+1 Affection to the returning trainee per caregiving Heirloom, capped at +3 per session.",
  },
  guild: {
    category: "guild",
    name: "Envoy's Example",
    trigger: "Completed Guild contracts",
    effect: "+1 Affection to the submitted creature per Guild Heirloom, capped at +3 per contract.",
  },
  work: {
    category: "work",
    name: "Worker's Example",
    trigger: "Successful Ranch jobs",
    effect: "+1 Affection to each successful worker per work Heirloom, capped at +3 per Ranch Day.",
  },
  dynasty: {
    category: "dynasty",
    name: "Founder's Blessing",
    trigger: "A direct descendant hatches",
    effect: "+2 starting Affection for each Founder's Ribbon whose retired source is a direct parent, capped at +4.",
  },
  general: {
    category: "general",
    name: "Legacy Welcome",
    trigger: "Any creature hatches",
    effect: "+1 starting Affection per general Legacy Token on the ranch, capped at +2.",
  },
};

export function getHeirloomPassiveDefinition(category: HeirloomCategory): HeirloomPassiveDefinition {
  return PASSIVES[category];
}

export function getHeirloomPassiveDefinitions(): HeirloomPassiveDefinition[] {
  return Object.values(PASSIVES);
}

function addAffection(save: GameSave, creatureIds: CreatureId[], amount: number): GameSave {
  if (amount <= 0 || !creatureIds.length) return save;
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

function hasFlag(save: GameSave, key: string): boolean {
  return save.flags[key] === true;
}

function withFlag(save: GameSave, key: string, value: boolean | number | string = true): GameSave {
  return { ...save, flags: { ...save.flags, [key]: value } };
}

function countHeirlooms(save: GameSave, categories: HeirloomCategory[]): number {
  const allowed = new Set(categories);
  return getCreatureHeirlooms(save).filter((heirloom) => allowed.has(heirloom.category)).length;
}

export function applyHeirloomBattleEffect(
  save: GameSave,
  battleId: string,
  participantIds: CreatureId[],
  outcome: BattleOutcome | "victory" | "draw" | "defeat",
): HeirloomEffectResult {
  const victory = outcome === "player_won" || outcome === "victory";
  if (!victory || !participantIds.length) return { save, bonus: 0, note: null };
  const eventKey = `heirloomBattleEffect_${battleId}`;
  if (hasFlag(save, eventKey)) return { save, bonus: 0, note: null };
  const bonus = Math.min(3, countHeirlooms(save, ["combat", "protection"]));
  if (!bonus) return { save, bonus: 0, note: null };
  const nextSave = withFlag(addAffection(save, participantIds, bonus), eventKey);
  return {
    save: nextSave,
    bonus,
    note: `Ranch Heirlooms inspired the victorious team: +${bonus} Affection each.`,
  };
}

export function applyHeirloomTrainingEffect(
  save: GameSave,
  assignmentId: string,
  creatureId: CreatureId,
): HeirloomEffectResult {
  const eventKey = `heirloomTrainingEffect_${assignmentId}_${String(creatureId)}`;
  if (hasFlag(save, eventKey)) return { save, bonus: 0, note: null };
  const bonus = Math.min(3, countHeirlooms(save, ["caregiving"]));
  if (!bonus) return { save, bonus: 0, note: null };
  const nextSave = withFlag(addAffection(save, [creatureId], bonus), eventKey);
  return {
    save: nextSave,
    bonus,
    note: `Caregiver Heirlooms encouraged the trainee: +${bonus} Affection.`,
  };
}

export function applyHeirloomGuildEffect(
  save: GameSave,
  contractId: string,
  creatureId: CreatureId,
): HeirloomEffectResult {
  const eventKey = `heirloomGuildEffect_${contractId}_${String(creatureId)}`;
  if (hasFlag(save, eventKey)) return { save, bonus: 0, note: null };
  const bonus = Math.min(3, countHeirlooms(save, ["guild"]));
  if (!bonus) return { save, bonus: 0, note: null };
  const nextSave = withFlag(addAffection(save, [creatureId], bonus), eventKey);
  return {
    save: nextSave,
    bonus,
    note: `Guild Heirlooms honored the completed contract: +${bonus} Affection.`,
  };
}

export function applyHeirloomRanchWorkEffect(
  save: GameSave,
  results: RanchJobResult[],
  dayNumber: number,
): { save: GameSave; results: RanchJobResult[]; bonus: number } {
  const eventKey = `heirloomRanchWorkEffect_${dayNumber}`;
  if (hasFlag(save, eventKey)) return { save, results, bonus: 0 };
  const bonus = Math.min(3, countHeirlooms(save, ["work"]));
  if (!bonus) return { save, results, bonus: 0 };
  const successful = results.filter((result) => result.energyCost > 0);
  if (!successful.length) return { save, results, bonus: 0 };
  const creatureIds = Array.from(new Set(successful.map((result) => result.creatureId)));
  let nextSave = addAffection(save, creatureIds, bonus);
  nextSave = withFlag(nextSave, eventKey);
  return {
    save: nextSave,
    bonus,
    results: results.map((result) =>
      result.energyCost > 0
        ? {
            ...result,
            affectionReward: result.affectionReward + bonus,
            message: `${result.message} Work Heirlooms added +${bonus} Affection.`,
          }
        : result,
    ),
  };
}

export function applyHeirloomHatchEffect(
  save: GameSave,
  creature: { creatureId: CreatureId; lineage?: { parentCreatureIds: CreatureId[] } },
): HeirloomEffectResult {
  const eventKey = `heirloomHatchEffect_${String(creature.creatureId)}`;
  if (hasFlag(save, eventKey)) return { save, bonus: 0, note: null };

  const heirlooms = getCreatureHeirlooms(save);
  const parentIds = new Set((creature.lineage?.parentCreatureIds ?? []).map(String));
  const dynastyBonus = Math.min(
    4,
    heirlooms.filter(
      (heirloom) => heirloom.category === "dynasty" && parentIds.has(String(heirloom.sourceCreatureId)),
    ).length * 2,
  );
  const generalBonus = Math.min(2, heirlooms.filter((heirloom) => heirloom.category === "general").length);
  const bonus = dynastyBonus + generalBonus;
  if (!bonus) return { save, bonus: 0, note: null };

  const nextSave = withFlag(addAffection(save, [creature.creatureId], bonus), eventKey);
  const pieces = [
    dynastyBonus ? `Founder's Blessing +${dynastyBonus}` : null,
    generalBonus ? `Legacy Welcome +${generalBonus}` : null,
  ].filter(Boolean);
  return {
    save: nextSave,
    bonus,
    note: `Heirloom inheritance welcomed the hatchling: ${pieces.join(" · ")} Affection.`,
  };
}
