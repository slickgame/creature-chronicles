import type { ContractId, CreatureId, SpeciesId, VariantId } from "./ids";
import type { CreatureStatKey } from "./creature";

export type GuildContractTier = "bronze" | "silver" | "gold";
export type GuildContractStatus = "available" | "accepted" | "completed" | "expired";
export type GuildContractFilter = "all" | GuildContractTier | "accepted" | "completed";
export type GuildContractType = "donate_creature";
export type GuildContractRequirementKind = "any_creature" | "family" | "variant" | "rarity" | "stat_minimum";

export type GuildContractRequirement = {
  kind: GuildContractRequirementKind;
  family?: "feline" | "canine";
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
  status: GuildContractStatus;
  title: string;
  description: string;
  requirement: GuildContractRequirement;
  goldReward: number;
  guildPointReward: number;
  createdAtDayNumber: number;
  expiresAtWeekNumber: number;
  acceptedAtDayNumber?: number;
  completedAtDayNumber?: number;
  donatedCreatureId?: CreatureId;
  donatedCreatureName?: string;
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
