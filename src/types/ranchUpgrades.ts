import type { GameSave } from "./save";

export type RanchUpgradeCategory = "habitats" | "nursery" | "breeding" | "recovery" | "ledger";

export type RanchUpgradeId =
  | "feline_habitat_capacity"
  | "canine_habitat_capacity"
  | "bovine_habitat_capacity"
  | "lapine_habitat_capacity"
  | "equine_habitat_capacity"
  | "nursery_egg_capacity"
  | "breeding_pen_comfort"
  | "sleep_recovery";

export type RanchUpgradeState = Record<RanchUpgradeId, number>;

export type RanchUpgradeTier = {
  tier: number;
  costGold: number;
  costGp?: number;
  costMaterials?: number;
  effectLabel: string;
};

export type RanchUpgradeDefinition = {
  upgradeId: RanchUpgradeId;
  category: RanchUpgradeCategory;
  name: string;
  description: string;
  iconPath: string;
  maxTier: number;
  tiers: RanchUpgradeTier[];
};

export type RanchUpgradeEffects = {
  felineCapacity: number;
  canineCapacity: number;
  bovineCapacity: number;
  lapineCapacity: number;
  equineCapacity: number;
  nurseryEggCapacity: number;
  breedingPregnancyBonus: number;
  breedingXpBonus: number;
  breedingEnergyDiscount: number;
  sleepCreatureEnergyBonus: number;
  sleepAffectionBonus: number;
};

export type RanchUpgradePurchaseSummary = {
  upgradeId: RanchUpgradeId;
  upgradeName: string;
  category: RanchUpgradeCategory;
  oldTier: number;
  newTier: number;
  effectLabel: string;
  costGold: number;
  costGp: number;
  costMaterials: number;
  remainingGold: number;
  remainingGp: number;
  remainingMaterials: number;
  immediateEffectLabel: string;
};

export type RanchUpgradePurchaseResult = {
  save: GameSave;
  ok: boolean;
  message: string;
  summary?: RanchUpgradePurchaseSummary;
};
