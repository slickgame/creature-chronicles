import { getVariantDefinition } from './creatures';
import { getCreatureChoreSkillProgress, getFamilyChoreBaselineLevel } from './choreSkills';
import type { ChoreSkillId } from '@/types/choreSkills';
import type { CreatureRecord } from '@/types/creature';

export const WORK_SKILL_FILTERS = [
  { id: 'all', label: 'All skills', icon: 'all' },
  { id: 'gathering', label: 'Gathering', icon: 'harvesting' },
  { id: 'making', label: 'Crafting & Cooking', icon: 'crafting' },
  { id: 'care', label: 'Breeding & Care', icon: 'breeding' },
] as const;
export type WorkSkillFilter = typeof WORK_SKILL_FILTERS[number]['id'];
type SkillDefinition = {
  id: string; skillId: ChoreSkillId | null; title: string; purpose: string;
  group: Exclude<WorkSkillFilter, 'all'>; icon: number; planned?: string; training: string;
};
export const WORK_SKILL_LEDGER: readonly SkillDefinition[] = [
  { id: 'harvesting', skillId: 'harvesting', title: 'Harvesting', purpose: 'Crops and vegetables', group: 'gathering', icon: 0, training: 'Complete work at the Kitchen garden or Wheat patch to gain Harvesting XP.' },
  { id: 'materials', skillId: 'hauling', title: 'Material Gathering', purpose: 'Wood, stone and ore', group: 'gathering', icon: 1, training: 'Complete work at the Woodlot, Quarry or Iron deposit to gain Material Gathering XP. Your previous Hauling progress is retained.' },
  { id: 'husbandry', skillId: 'production', title: 'Husbandry', purpose: 'Milk and animal resources', group: 'gathering', icon: 2, training: 'Complete Milk production work to gain Husbandry XP. Milk production requires a female bovine. Your previous Production progress is retained.' },
  { id: 'hunting', skillId: 'hunting', title: 'Hunting', purpose: 'Gather meat', group: 'gathering', icon: 3, training: 'Complete work on the Hunting trail to gain Hunting XP. Older saves begin with their previous shared Production proficiency; future Hunting and Husbandry work train independently.' },
  { id: 'crafting', skillId: 'crafting', title: 'Crafting', purpose: 'Planks, ingots and components', group: 'making', icon: 4, training: 'Select this creature in Workbench and complete recipes to gain Crafting XP. Levels 6, 11 and 16 each reduce Energy per batch by 1. Material ratios stay unchanged.' },
  { id: 'cooking', skillId: 'cooking', title: 'Cooking', purpose: 'Rations and food recipes', group: 'making', icon: 5, training: 'Select this creature in Kitchen and prepare rations or meals to gain Cooking XP. Levels 6, 11 and 16 each reduce Energy per batch by 1. Serving or eating a meal does not grant Cooking XP.' },
  { id: 'breeding', skillId: null, title: 'Breeding', purpose: 'Breeding proficiency', group: 'care', icon: 6, planned: 'To be defined', training: 'Breeding skill benefits and progression are still to be defined. Fertility remains a separate creature attribute. No skill level, XP or bonus is invented here.' },
  { id: 'cleaning', skillId: 'cleaning', title: 'Cleaning', purpose: 'Habitat cleanliness', group: 'care', icon: 7, planned: 'Planned habitat action', training: 'A future habitat action will let creatures reduce habitat dirtiness. Dirtiness ranges may increase illness risk; sick creatures will need a few days of rest before performing actions. Exact rates, costs and recovery times remain undecided. This system is not active yet.' },
];
export function getWorkSkillLedger(creature: CreatureRecord) {
  const family = getVariantDefinition(creature.variantId).family;
  return WORK_SKILL_LEDGER.map(definition => ({ ...definition,
    progress: definition.skillId ? getCreatureChoreSkillProgress(creature, definition.skillId) : null,
    baseline: definition.skillId ? getFamilyChoreBaselineLevel(family, definition.skillId) : null,
  }));
}
export type WorkSkillEntry = ReturnType<typeof getWorkSkillLedger>[number];
