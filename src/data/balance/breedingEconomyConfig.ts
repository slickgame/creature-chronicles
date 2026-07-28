import rawConfig from "./breedingEconomyConfig.json";

export type BreedingEconomyConfig = typeof rawConfig;

export const BREEDING_ECONOMY_CONFIG: BreedingEconomyConfig = rawConfig;

export const getCreatureXpToNext = (level: number): number =>
  BREEDING_ECONOMY_CONFIG.creatureXpBase + Math.max(1, level) * BREEDING_ECONOMY_CONFIG.creatureXpPerLevel;

export const getBreederXpToNext = (rank: number): number =>
  BREEDING_ECONOMY_CONFIG.breederXpBase + Math.max(1, rank) * BREEDING_ECONOMY_CONFIG.breederXpPerRank;
