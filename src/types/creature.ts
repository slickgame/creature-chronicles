import type { CreatureId, HabitatId, SpeciesId, VariantId } from "./ids";
import type { TalentCategory } from "./talent";
import type { CreatureChoreSkills } from "./choreSkills";

export type CreatureFamily = "feline" | "canine" | "bovine" | "lapine" | "equine";
export type CreatureSex = "female" | "male";
export type CreatureStatKey = "STR" | "DEX" | "STA" | "CHA" | "WIL" | "FER";
export type CreatureStats = Record<CreatureStatKey, number>;
export type StatGrade = "D" | "C" | "B" | "A" | "S";
export type StatGrades = Record<CreatureStatKey, StatGrade>;
export type StatGrowthProfile = Record<CreatureStatKey, number>;
export type CreatureGrowthProgress = Record<CreatureStatKey, number>;
export type AbilityGrade = "F" | "D" | "C" | "B" | "A" | "S";
export type CreatureOrigin = "starter" | "market" | "hatched" | "guild" | "unknown";
export type CreatureInjurySeverity = "Bruised" | "Wounded" | "Badly Hurt";
export type CreatureLineageRisk = "none" | "half-sibling" | "full-sibling" | "parent-child";

export type CreatureLineage = { risk: CreatureLineageRisk; label: string; parentCreatureIds: CreatureId[]; parentNames: string[]; notes: string[]; traits: string[] };

/**
 * Persistent talent instance stored on a creature. Effects live in the central
 * talent-definition registry so old saves only need an id and grade. The
 * CreatureAbility alias is retained for backwards-compatible save data and
 * imports while the player-facing system is now consistently called Talents.
 */
export type CreatureTalent = {
  id: string;
  name: string;
  grade: AbilityGrade;
  source: "general" | "species" | "variant" | "starter" | "future" | "combat" | "chore" | "role";
  description: string;
  category?: TalentCategory;
  tags?: string[];
  definitionVersion?: number;
};
export type CreatureAbility = CreatureTalent;

export type SpeciesDefinition = { speciesId: SpeciesId; family: CreatureFamily; name: string; description: string; baseStats: CreatureStats; baseMaxHearts: number; growthProfile: StatGrowthProfile; exclusiveAbilityPool: CreatureAbility[] };
export type VariantDefinition = { variantId: VariantId; speciesId: SpeciesId; family: CreatureFamily; name: string; rarity: "Common" | "Uncommon" | "Rare" | "Epic"; description: string; statAdjustments: Partial<CreatureStats>; maxEnergyBonus: number; maxHeartsBonus: number; growthProfile: Partial<StatGrowthProfile>; exclusiveAbilityPool: CreatureAbility[]; portraitPath: string; profilePath: string };

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
  growthProgress?: CreatureGrowthProgress;
  abilities: CreatureAbility[];
  /**
   * Persistent domestic and ranch proficiencies. Optional for old saves; the
   * chore-skill engine derives species baselines until the first progression
   * event writes the complete record.
   */
  choreSkills?: CreatureChoreSkills;
  energy: number;
  maxEnergy: number;
  hearts: number;
  maxHearts: number;
  affection: number;
  generation: number;
  sex?: CreatureSex;
  isFavorite?: boolean;
  shiny: boolean;
  cosmeticVariant: string | null;
  origin: CreatureOrigin;
  originLabel: string;
  lineage?: CreatureLineage;
  isLocked: boolean;
  injuredUntilDayNumber?: number;
  injuryLabel?: CreatureInjurySeverity;
  createdAt: string;
  notes: string;
};

export type HabitatRecord = { habitatId: HabitatId; family: CreatureFamily; name: string; level: number; capacity: number; creatureIds: CreatureId[]; unlocked: boolean };