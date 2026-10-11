import type { ContractId, CreatureId, SpeciesId, VariantId } from "./ids";
import type { CreatureFamily, CreatureStatKey } from "./creature";

export type GuildContractTier = "bronze" | "silver" | "gold";
export type GuildContractStatus = "available" | "accepted" | "completed" | "expired";
export type GuildContractType = "donate_creature" | "service_creature" | "delivery" | "chore_commission" | "battle_bounty";
export type GuildObjective = { kind: "delivery"; resource: "feed" | "materials" | import("@/data/farmResources").ResourceId; amount: number } | { kind: "chore"; jobId: import("./ranchJobs").RanchJobId; amount: number } | { kind: "battle"; amount: number };
export type GuildContractCategory = "general" | "service" | "registry" | "lineage" | "restoration" | "security";
export type GuildContractFilter = "all" | "donation" | "service" | GuildContractCategory | GuildContractTier | "accepted" | "completed" | "delivery" | "chore_commission" | "battle_bounty";
export type GuildContractRequirementKind = "any_creature" | "family" | "variant" | "rarity" | "stat_minimum" | "objective";

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
  objective?: GuildObjective;
  objectiveBaseline?: number;
  objectiveCompletedCount?: number;
  qualityBonusGold?: number;
  qualityBonusGp?: number;
  qualityBonusReasons?: string[];
};

export type GuildState = {
  boardVersion?: number;
  rerollCount?: number;
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

