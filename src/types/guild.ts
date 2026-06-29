import type { ContractId, CreatureId, SpeciesId, VariantId } from "./ids";
import type { CreatureFamily, CreatureStatKey } from "./creature";

export type GuildContractTier = "bronze" | "silver" | "gold";
export type GuildContractStatus = "available" | "accepted" | "completed" | "expired";
export type GuildContractType = "donate_creature" | "service_creature";
export type GuildContractCategory = "general" | "service" | "registry" | "lineage" | "restoration" | "security";
export type GuildContractFilter = "all" | "donation" | "service" | GuildContractCategory | GuildContractTier | "accepted" | "completed";
export type GuildContractRequirementKind = "any_creature" | "family" | "variant" | "rarity" | "stat_minimum";

export type GuildContractRequirement = {
  kind: GuildContractRequirementKind;
  family?: CreatureFamily;
  variantId?: VariantId;
  speciesId?: SpeciesId;
  rarity?: "Common" | "Uncommon" | "Rare" | "Epic";
  stat?: CreatureStatKey;
  minimum?: number;
  label: string;
};

export type GuildContract = {
  contractId: ContractId;
  weekNumber: number;
  tier: GuildContractTier;
  type: GuildContractType;
  category: GuildContractCategory;
  requesterId: string;
  requesterName: string;
  trustTarget: string;
  status: GuildContractStatus;
  title: string;
  description: string;
  requirement: GuildContractRequirement;
  goldReward: number;
  guildPointReward: number;
  serviceEnergyCost?: number;
  serviceXpReward?: number;
  serviceAffectionReward?: number;
  createdAtDayNumber: number;
  expiresAtWeekNumber: number;
  acceptedAtDayNumber?: number;
  completedAtDayNumber?: number;
  donatedCreatureId?: CreatureId;
  donatedCreatureName?: string;
  submittedCreatureId?: CreatureId;
  submittedCreatureName?: string;
  qualityBonusGold?: number;
  qualityBonusGp?: number;
  qualityBonusReasons?: string[];
};

export type GuildState = {
  weekNumber: number;
  lastGeneratedDayNumber: number;
  contracts: GuildContract[];
  completedCount: number;
  donatedCreatureCount: number;
  guildRank: number;
};

export type GuildActionResult = {
  save: import("./save").GameSave;
  ok: boolean;
  message: string;
};
