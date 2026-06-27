import { DEFAULT_STAT_GRADES, STAT_KEYS, getCombinedGrowthProfile, getCreatureMaxEnergyFromStats } from "@/data/creatures";
import type { CreatureGrowthProgress, CreatureRecord, CreatureStatKey, CreatureStats, StatGrade, StatGrades } from "@/types/creature";

export const STAT_GROWTH_MULTIPLIERS: Record<StatGrade, number> = { D: 0.7, C: 1, B: 1.25, A: 1.55, S: 1.9 };
export const ENERGY_PER_LEVEL_BY_STA_GRADE: Record<StatGrade, number> = { D: 0.75, C: 1.25, B: 1.75, A: 2.25, S: 3 };
export const EMPTY_GROWTH_PROGRESS: CreatureGrowthProgress = { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 };

export type StatGrowthProjection = {
  statKey: CreatureStatKey;
  currentProgress: number;
  currentProgressPercent: number;
  nextLevelGain: number;
  nextLevelGainPercent: number;
  projectedProgress: number;
  projectedProgressPercent: number;
  statGainNextLevel: number;
  statPercentIncreaseNextLevel: number;
  levelsUntilIncrease: number;
  willIncreaseNextLevel: boolean;
};

export type CreatureLevelUpGrowthResult = {
  stats: CreatureStats;
  growthProgress: CreatureGrowthProgress;
  statGrowth: Partial<CreatureStats>;
  notes: string[];
};

function clampProgress(value: number): number { return Math.max(0, Math.min(0.9999, Number.isFinite(value) ? value : 0)); }
export function normalizeGrowthProgress(progress?: Partial<CreatureGrowthProgress>): CreatureGrowthProgress { return STAT_KEYS.reduce((next, key) => ({ ...next, [key]: clampProgress(progress?.[key] ?? 0) }), {} as CreatureGrowthProgress); }
export function getStatGrowthGainPerLevel(creature: Pick<CreatureRecord, "speciesId" | "variantId" | "statGrades">, statKey: CreatureStatKey, biases: CreatureStatKey[] = []): number { const profile = getCombinedGrowthProfile(creature.speciesId, creature.variantId); const grade = creature.statGrades?.[statKey] ?? DEFAULT_STAT_GRADES[statKey]; const biasedProfile = Math.max(1, profile[statKey] + (biases.includes(statKey) ? 25 : 0)); return (biasedProfile / 100) * (STAT_GROWTH_MULTIPLIERS[grade] ?? 1); }
export function projectStatGrowth(creature: Pick<CreatureRecord, "speciesId" | "variantId" | "statGrades" | "growthProgress" | "stats">, statKey: CreatureStatKey, biases: CreatureStatKey[] = []): StatGrowthProjection { const progress = normalizeGrowthProgress(creature.growthProgress); const currentProgress = progress[statKey]; const nextLevelGain = getStatGrowthGainPerLevel(creature, statKey, biases); const projectedTotal = currentProgress + nextLevelGain; const statGainNextLevel = Math.floor(projectedTotal); const projectedProgress = projectedTotal % 1; const currentStat = Math.max(1, creature.stats?.[statKey] ?? 1); return { statKey, currentProgress, currentProgressPercent: Math.round(currentProgress * 100), nextLevelGain, nextLevelGainPercent: Math.round(nextLevelGain * 100), projectedProgress, projectedProgressPercent: Math.round(projectedProgress * 100), statGainNextLevel, statPercentIncreaseNextLevel: statGainNextLevel > 0 ? Math.round((statGainNextLevel / currentStat) * 1000) / 10 : 0, levelsUntilIncrease: nextLevelGain > 0 ? Math.max(1, Math.ceil((1 - currentProgress) / nextLevelGain)) : 99, willIncreaseNextLevel: statGainNextLevel > 0 }; }
export function getCreatureGrowthProjections(creature: Pick<CreatureRecord, "speciesId" | "variantId" | "statGrades" | "growthProgress" | "stats">, biases: CreatureStatKey[] = []): Record<CreatureStatKey, StatGrowthProjection> { return STAT_KEYS.reduce((next, key) => ({ ...next, [key]: projectStatGrowth(creature, key, biases) }), {} as Record<CreatureStatKey, StatGrowthProjection>); }
function pickGuaranteedGrowthStat(creature: CreatureRecord, progress: CreatureGrowthProgress, biases: CreatureStatKey[], seed: string): CreatureStatKey { const projections = getCreatureGrowthProjections({ ...creature, growthProgress: progress }, biases); const sorted = [...STAT_KEYS].sort((a, b) => { const aScore = projections[a].currentProgress + projections[a].nextLevelGain; const bScore = projections[b].currentProgress + projections[b].nextLevelGain; if (bScore !== aScore) return bScore - aScore; return a.localeCompare(b); }); return sorted[Math.abs(seed.length) % sorted.length] ?? "STA"; }
export function applyCreatureLevelGrowth(creature: CreatureRecord, levelUps: number, biases: CreatureStatKey[] = [], seed = "level_growth"): CreatureLevelUpGrowthResult { let stats = { ...creature.stats }; let progress = normalizeGrowthProgress(creature.growthProgress); const statGrowth: Partial<CreatureStats> = {}; const notes: string[] = []; for (let levelIndex = 0; levelIndex < levelUps; levelIndex += 1) { let gainsThisLevel = 0; for (const statKey of STAT_KEYS) { const gain = getStatGrowthGainPerLevel({ ...creature, stats, growthProgress: progress }, statKey, biases); const total = progress[statKey] + gain; const statIncrease = Math.floor(total); progress = { ...progress, [statKey]: total % 1 }; if (statIncrease > 0) { stats = { ...stats, [statKey]: stats[statKey] + statIncrease }; statGrowth[statKey] = (statGrowth[statKey] ?? 0) + statIncrease; gainsThisLevel += statIncrease; notes.push(`${statKey} gained +${statIncrease} from ${creature.statGrades[statKey]} grade growth.`); } } if (gainsThisLevel === 0) { const guaranteedStat = pickGuaranteedGrowthStat({ ...creature, stats, growthProgress: progress }, progress, biases, `${seed}_${levelIndex}`); stats = { ...stats, [guaranteedStat]: stats[guaranteedStat] + 1 }; statGrowth[guaranteedStat] = (statGrowth[guaranteedStat] ?? 0) + 1; progress = { ...progress, [guaranteedStat]: 0 }; notes.push(`${guaranteedStat} gained +1 from the level-up safety growth rule.`); } } return { stats, growthProgress: progress, statGrowth, notes }; }
export function getProjectedMaxEnergyForCreature(creature: Pick<CreatureRecord, "stats" | "variantId" | "level" | "statGrades">): number { return getCreatureMaxEnergyFromStats(creature.stats, creature.variantId, creature.level, creature.statGrades); }
export function getProjectedEnergyGainNextLevel(creature: CreatureRecord): { currentMaxEnergy: number; nextLevelMaxEnergy: number; delta: number } { const growth = applyCreatureLevelGrowth(creature, 1, [], `${creature.creatureId}_energy_preview`); const nextLevelCreature = { ...creature, level: creature.level + 1, stats: growth.stats, growthProgress: growth.growthProgress }; const currentMaxEnergy = getProjectedMaxEnergyForCreature(creature); const nextLevelMaxEnergy = getProjectedMaxEnergyForCreature(nextLevelCreature); return { currentMaxEnergy, nextLevelMaxEnergy, delta: nextLevelMaxEnergy - currentMaxEnergy }; }
