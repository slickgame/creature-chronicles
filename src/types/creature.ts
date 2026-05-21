import type { CreatureId, HabitatId, SpeciesId, VariantId } from "./ids";

export type CreatureFamily = "feline" | "canine";

export type CreatureStatKey = "STR" | "DEX" | "STA" | "CHA" | "WIL" | "FER";

export type CreatureStats = Record<CreatureStatKey, number>;

export type StatGrade = "D" | "C" | "B" | "A" | "S";
export type StatGrades = Record<CreatureStatKey, StatGrade>;
export type StatGrowthProfile = Record<CreatureStatKey, number>;

export type AbilityGrade = "F" | "D" | "C" | "B" | "A" | "S";
export type CreatureOrigin = "starter" | "market" | "hatched" | "guild" | "unknown";

export type CreatureAbility = {
  id: string;
  name: string;
  grade: AbilityGrade;
  source: "general" | "species" | "variant" | "starter" | "future";
  description: string;
};

export type SpeciesDefinition = {
  speciesId: SpeciesId;
  family: CreatureFamily;
  name: string;
  description: string;
  baseStats: CreatureStats;
  baseMaxHearts: number;
  growthProfile: StatGrowthProfile;
  exclusiveAbilityPool: CreatureAbility[];
};

export type VariantDefinition = {
  variantId: VariantId;
  speciesId: SpeciesId;
  family: CreatureFamily;
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic";
  description: string;
  statAdjustments: Partial<CreatureStats>;
  maxEnergyBonus: number;
  maxHeartsBonus: number;
  growthProfile: Partial<StatGrowthProfile>;
  exclusiveAbilityPool: CreatureAbility[];
  portraitPath: string;
  profilePath: string;
};

export type CreatureRecord = {
  creatureId: CreatureId;
  ownerSaveId: string;
  speciesId: SpeciesId;
  variantId: VariantId;
  habitatId: HabitatId;
  nickname: string;
  level: number;
  xp: number;
  xpToNext: number;
  stats: CreatureStats;
  statGrades: StatGrades;
  abilities: CreatureAbility[];
  energy: number;
  maxEnergy: number;
  hearts: number;
  maxHearts: number;
  affection: number;
  generation: number;
  shiny: boolean;
  cosmeticVariant: string | null;
  origin: CreatureOrigin;
  originLabel: string;
  isLocked: boolean;
  createdAt: string;
  notes: string;
};

export type HabitatRecord = {
  habitatId: HabitatId;
  family: CreatureFamily;
  name: string;
  level: number;
  capacity: number;
  creatureIds: CreatureId[];
  unlocked: boolean;
};