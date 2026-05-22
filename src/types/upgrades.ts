export type TownUpgradeCategory = "market" | "guild";

export type TownUpgradeId =
  | "market_listing_capacity"
  | "market_variant_access"
  | "market_quality_screening"
  | "market_reroll_discount"
  | "guild_contract_slots"
  | "guild_contract_quality"
  | "guild_donation_rewards";

export type TownUpgradeState = Record<TownUpgradeId, number>;

export type TownUpgradeTier = {
  tier: number;
  costGp: number;
  effectLabel: string;
};

export type TownUpgradeDefinition = {
  upgradeId: TownUpgradeId;
  category: TownUpgradeCategory;
  name: string;
  description: string;
  iconPath: string;
  maxTier: number;
  tiers: TownUpgradeTier[];
};

export type TownUpgradeEffects = {
  marketListingCount: number;
  marketVariantChance: number;
  marketQualityTier: number;
  marketRerollDiscount: number;
  guildContractCount: number;
  guildContractQualityTier: number;
  guildGoldRewardMultiplier: number;
  guildBonusGp: number;
};

export type TownUpgradePurchaseResult = {
  save: import("./save").GameSave;
  ok: boolean;
  message: string;
};
