import { STAT_KEYS } from '@/data/creatures';
import { getCreatureGrowthProjections, getProjectedMaxEnergyForCreature } from '@/data/levelGrowth';
import type { CreatureRecord } from '@/types/creature';

/** Base growth only; the activity-specific safety-growth seed is not known here. */
export function growthLedgerPreview(creature: CreatureRecord) {
  const projections = getCreatureGrowthProjections(creature);
  const uncertain = !STAT_KEYS.some(key => projections[key].statGainNextLevel > 0);
  const stats = { ...creature.stats };
  for (const key of STAT_KEYS) stats[key] += projections[key].statGainNextLevel;
  const nextCreature = { ...creature, level: creature.level + 1, stats };
  const energyMin = getProjectedMaxEnergyForCreature(nextCreature);
  const energyMax = uncertain ? getProjectedMaxEnergyForCreature({ ...nextCreature, stats: { ...stats, STA: stats.STA + 1 } }) : energyMin;
  return { projections, uncertain, stats, energyMin, energyMax, currentEnergy: getProjectedMaxEnergyForCreature(creature) };
}
export type GrowthLedgerPreview = ReturnType<typeof growthLedgerPreview>;
export function rangeText(min: number, max: number) { return min === max ? String(min) : `${min}–${max}`; }
