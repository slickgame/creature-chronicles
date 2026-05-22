import { getVariantDefinition } from "@/data/creatures";
import type { CreatureRecord } from "@/types/creature";
import type { ContractId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type {
  GuildActionResult,
  GuildContract,
  GuildContractRequirement,
  GuildContractTier,
  GuildState,
} from "@/types/guild";

function seededNumber(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function makeContractId(weekNumber: number, slot: number): ContractId {
  return `guild_contract_${weekNumber}_${slot}` as ContractId;
}

function getTierReward(tier: GuildContractTier, weekNumber: number, slot: number) {
  const roll = seededNumber(weekNumber * 71 + slot * 13);

  if (tier === "bronze") {
    return { goldReward: 80 + Math.round(roll * 45), guildPointReward: 5 + Math.floor(roll * 4) };
  }

  if (tier === "silver") {
    return { goldReward: 155 + Math.round(roll * 70), guildPointReward: 12 + Math.floor(roll * 7) };
  }

  return { goldReward: 285 + Math.round(roll * 115), guildPointReward: 25 + Math.floor(roll * 16) };
}

function createContract(
  save: GameSave,
  slot: number,
  tier: GuildContractTier,
  title: string,
  description: string,
  requirement: GuildContractRequirement,
): GuildContract {
  const rewards = getTierReward(tier, save.dayState.weekNumber, slot);

  return {
    contractId: makeContractId(save.dayState.weekNumber, slot),
    weekNumber: save.dayState.weekNumber,
    tier,
    type: "donate_creature",
    status: "available",
    title,
    description,
    requirement,
    goldReward: rewards.goldReward,
    guildPointReward: rewards.guildPointReward,
    createdAtDayNumber: save.dayState.dayNumber,
    expiresAtWeekNumber: save.dayState.weekNumber + 1,
  };
}

function getWeeklyTemplates(save: GameSave): Array<Omit<GuildContract, "contractId" | "weekNumber" | "type" | "status" | "goldReward" | "guildPointReward" | "createdAtDayNumber" | "expiresAtWeekNumber">> {
  const templates = [
    {
      tier: "bronze" as const,
      title: "Stable Starter Request",
      description: "The guild needs a dependable common ranch creature for a new rural client.",
      requirement: { kind: "any_creature" as const, label: "Donate any creature." },
    },
    {
      tier: "bronze" as const,
      title: "Feline Helper Needed",
      description: "A quiet household wants a reliable feline companion for daily ranch support.",
      requirement: { kind: "family" as const, family: "feline" as const, label: "Donate any feline creature." },
    },
    {
      tier: "bronze" as const,
      title: "Canine Patrol Request",
      description: "A nearby farm wants a loyal canine for basic patrol work.",
      requirement: { kind: "family" as const, family: "canine" as const, label: "Donate any canine creature." },
    },
    {
      tier: "silver" as const,
      title: "Healthy Worker Request",
      description: "The guild is looking for a sturdy creature with strong stamina.",
      requirement: { kind: "stat_minimum" as const, stat: "STA" as const, minimum: 7, label: "Donate any creature with STA 7+." },
    },
    {
      tier: "silver" as const,
      title: "Charming Companion Request",
      description: "A noble client wants a socially gifted creature with strong charm.",
      requirement: { kind: "stat_minimum" as const, stat: "CHA" as const, minimum: 7, label: "Donate any creature with CHA 7+." },
    },
  ];

  const rareGold = seededNumber(save.dayState.weekNumber * 101) > 0.45;

  if (rareGold) {
    templates.push({
      tier: "gold" as const,
      title: "Rare Bloodline Request",
      description: "A prestigious guild patron seeks a rare or better bloodline specimen.",
      requirement: { kind: "rarity" as const, rarity: "Rare" as const, label: "Donate any Rare or Epic creature." },
    });
  } else {
    templates.push({
      tier: "gold" as const,
      title: "Exceptional Dexterity Request",
      description: "A specialist needs a highly agile creature for delicate service work.",
      requirement: { kind: "stat_minimum" as const, stat: "DEX" as const, minimum: 8, label: "Donate any creature with DEX 8+." },
    });
  }

  return templates;
}

function createWeeklyContracts(save: GameSave): GuildContract[] {
  return getWeeklyTemplates(save).map((template, index) =>
    createContract(save, index, template.tier, template.title, template.description, template.requirement),
  );
}

export function createDefaultGuildState(save: GameSave): GuildState {
  return {
    weekNumber: save.dayState.weekNumber,
    lastGeneratedDayNumber: save.dayState.dayNumber,
    contracts: createWeeklyContracts(save),
    completedCount: 0,
    donatedCreatureCount: 0,
    guildRank: 1,
  };
}

export function ensureCurrentGuildState(save: GameSave): GameSave {
  if (!save.guild) {
    return { ...save, guild: createDefaultGuildState(save) };
  }

  if (save.guild.weekNumber === save.dayState.weekNumber && save.guild.contracts.length > 0) {
    return save;
  }

  const retainedContracts = save.guild.contracts
    .filter((contract) => contract.status === "accepted" || contract.status === "completed")
    .map((contract) =>
      contract.status === "accepted" && contract.expiresAtWeekNumber <= save.dayState.weekNumber
        ? { ...contract, status: "expired" as const }
        : contract,
    );

  return {
    ...save,
    guild: {
      ...save.guild,
      weekNumber: save.dayState.weekNumber,
      lastGeneratedDayNumber: save.dayState.dayNumber,
      contracts: [...retainedContracts, ...createWeeklyContracts(save)],
    },
  };
}

export function getContractTierIcon(tier: GuildContractTier): string {
  if (tier === "bronze") return "/images/ui/icons/icon_bronze_contract.png";
  if (tier === "silver") return "/images/ui/icons/icon_silver_contract.png";
  return "/images/ui/icons/icon_gold_contract.png";
}

export function getCreatureRarityRank(rarity: string): number {
  if (rarity === "Epic") return 4;
  if (rarity === "Rare") return 3;
  if (rarity === "Uncommon") return 2;
  return 1;
}

export function doesCreatureMatchContract(creature: CreatureRecord, contract: GuildContract): boolean {
  const variant = getVariantDefinition(creature.variantId);
  const requirement = contract.requirement;

  if (contract.type !== "donate_creature" || contract.status === "completed" || contract.status === "expired") {
    return false;
  }

  if (requirement.kind === "any_creature") return true;
  if (requirement.kind === "family") return variant.family === requirement.family;
  if (requirement.kind === "variant") return creature.variantId === requirement.variantId;
  if (requirement.kind === "rarity") {
    return getCreatureRarityRank(variant.rarity) >= getCreatureRarityRank(requirement.rarity ?? "Rare");
  }
  if (requirement.kind === "stat_minimum" && requirement.stat && requirement.minimum) {
    return creature.stats[requirement.stat] >= requirement.minimum;
  }

  return false;
}

export function getEligibleCreaturesForContract(save: GameSave, contractId: string): CreatureRecord[] {
  const syncedSave = ensureCurrentGuildState(save);
  const contract = syncedSave.guild?.contracts.find((item) => item.contractId === contractId);
  if (!contract) return [];

  return (syncedSave.creatures ?? []).filter((creature) => doesCreatureMatchContract(creature, contract));
}

export function acceptGuildContract(save: GameSave, contractId: string): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave);
  const contract = guild.contracts.find((item) => item.contractId === contractId);

  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract is not available to accept." };

  return {
    save: {
      ...syncedSave,
      guild: {
        ...guild,
        contracts: guild.contracts.map((item) =>
          item.contractId === contractId
            ? { ...item, status: "accepted", acceptedAtDayNumber: syncedSave.dayState.dayNumber }
            : item,
        ),
      },
      flags: { ...syncedSave.flags, m7GuildContractAccepted: true },
    },
    ok: true,
    message: `${contract.title} accepted.`,
  };
}

export function donateCreatureToGuildContract(save: GameSave, contractId: string, creatureId: string): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave);
  const contract = guild.contracts.find((item) => item.contractId === contractId);
  const creature = (syncedSave.creatures ?? []).find((item) => item.creatureId === creatureId);

  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (!creature) return { save: syncedSave, ok: false, message: "That creature is no longer available." };
  if (creature.isLocked) return { save: syncedSave, ok: false, message: `${creature.nickname} is locked. Unlock them before donating.` };
  if (contract.status !== "accepted" && contract.status !== "available") {
    return { save: syncedSave, ok: false, message: "That contract cannot receive donations." };
  }
  if (!doesCreatureMatchContract(creature, contract)) {
    return { save: syncedSave, ok: false, message: `${creature.nickname} does not meet this contract's requirements.` };
  }

  const nextCompletedCount = guild.completedCount + 1;
  const nextGuildRank = Math.max(guild.guildRank, 1 + Math.floor(nextCompletedCount / 5));
  const nextM9TotalDonated = Number(syncedSave.flags.m9TotalDonated ?? 0) + 1;

  return {
    save: {
      ...syncedSave,
      updatedAt: new Date().toISOString(),
      currencies: {
        ...syncedSave.currencies,
        gold: syncedSave.currencies.gold + contract.goldReward,
        guildPoints: syncedSave.currencies.guildPoints + contract.guildPointReward,
      },
      creatureIds: syncedSave.creatureIds.filter((id) => id !== creature.creatureId),
      creatures: (syncedSave.creatures ?? []).filter((item) => item.creatureId !== creature.creatureId),
      habitats: (syncedSave.habitats ?? []).map((habitat) => ({
        ...habitat,
        creatureIds: habitat.creatureIds.filter((id) => id !== creature.creatureId),
      })),
      guild: {
        ...guild,
        completedCount: nextCompletedCount,
        donatedCreatureCount: guild.donatedCreatureCount + 1,
        guildRank: nextGuildRank,
        contracts: guild.contracts.map((item) =>
          item.contractId === contractId
            ? {
                ...item,
                status: "completed",
                completedAtDayNumber: syncedSave.dayState.dayNumber,
                donatedCreatureId: creature.creatureId,
                donatedCreatureName: creature.nickname,
              }
            : item,
        ),
      },
      flags: { ...syncedSave.flags, m7GuildContractCompleted: true, m9CreatureManagement: true, m9TotalDonated: nextM9TotalDonated },
    },
    ok: true,
    message: `${creature.nickname} donated. Earned ${contract.goldReward} Gold and ${contract.guildPointReward} GP.`,
  };
}
