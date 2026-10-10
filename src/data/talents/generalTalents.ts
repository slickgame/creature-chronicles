import type { AbilityGrade, CreatureAbility } from "@/types/creature";
import type { TalentEffect } from "@/types/talent";

export const GENERAL_TALENT_GRADES: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];
// Each launch talent has exactly one benefit. Species and special talents are deferred.
export const GENERAL_TALENT_RULES: Array<{
  id: string; name: string; effect: Omit<TalentEffect, "value">;
  values: number[]; describe: (value: number) => string;
}> = [
  { id: "hot_blooded", name: "Hot-Blooded", effect: { type: "breeding-fertility-flat" }, values: [1, 2, 3, 4, 6, 8], describe: v => `+${v} Fertility during breeding.` },
  { id: "eager_learner", name: "Eager Learner", effect: { type: "chore-xp-percent" }, values: [5, 8, 10, 15, 20, 30], describe: v => `+${v}% chore-skill XP.` },
  { id: "lasting_vigor", name: "Lasting Vigor", effect: { type: "breeding-energy-discount" }, values: [1, 2, 3, 4, 6, 8], describe: v => `${v} less Breeding Energy cost for the pair.` },
  { id: "diligent", name: "Diligent", effect: { type: "chore-score" }, values: [0.25, 0.5, 0.75, 1, 1.5, 2], describe: v => `+${v} score for all chores.` },
  { id: "sure_strike", name: "Sure Strike", effect: { type: "battle-stat-flat", battleStatKey: "physicalPower" }, values: [1, 2, 3, 4, 6, 8], describe: v => `+${v} Physical Power in battle.` },
  { id: "thick_hide", name: "Thick Hide", effect: { type: "battle-stat-flat", battleStatKey: "defense" }, values: [1, 2, 3, 4, 6, 8], describe: v => `+${v} Defense in battle.` },
  { id: "light_footed", name: "Light-Footed", effect: { type: "battle-stat-flat", battleStatKey: "speed" }, values: [1, 2, 3, 4, 6, 8], describe: v => `+${v} Speed in battle.` },
  { id: "sound_sleeper", name: "Sound Sleeper", effect: { type: "recovery-energy-percent" }, values: [5, 8, 10, 15, 20, 30], describe: v => `Recover an extra ${v}% of maximum Energy each day.` },
];

export function getGeneralTalentEffect(id: string, grade: AbilityGrade): TalentEffect | null {
  const rule = GENERAL_TALENT_RULES.find(rule => rule.id === id);
  return rule ? { ...rule.effect, value: rule.values[GENERAL_TALENT_GRADES.indexOf(grade)] } : null;
}

export function createGeneralTalent(id: string, grade: AbilityGrade = "C"): CreatureAbility {
  const rule = GENERAL_TALENT_RULES.find(rule => rule.id === id);
  if (!rule) throw new Error(`Unknown general talent: ${id}`);
  return { id, name: rule.name, grade, source: "general", description: rule.describe(rule.values[GENERAL_TALENT_GRADES.indexOf(grade)]) };
}

export const GENERAL_ABILITY_POOL = GENERAL_TALENT_RULES.map(rule => createGeneralTalent(rule.id));
