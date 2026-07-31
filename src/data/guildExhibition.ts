import {
  acceptGuildContract as acceptGuildContractBase,
  calculateContractQualityBonus,
  createDefaultGuildState as createDefaultGuildStateBase,
  doesCreatureMatchContract,
  donateCreatureToGuildContract as donateCreatureToGuildContractBase,
  ensureCurrentGuildState as ensureCurrentGuildStateBase,
  getContractTierIcon,
  getCreatureRarityRank,
  getEligibleCreaturesForContract as getEligibleCreaturesForContractBase,
} from "./guild";
import type { CreatureRecord } from "@/types/creature";
import type { GuildActionResult, GuildContract, GuildState } from "@/types/guild";
import type { GameSave } from "@/types/save";

export {
  calculateContractQualityBonus,
  doesCreatureMatchContract,
  getContractTierIcon,
  getCreatureRarityRank,
};

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function applyRewardBonus(contract: GuildContract, goldPercent: number, guildPointBonus: number): GuildContract {
  if (contract.status === "completed" || contract.status === "expired") return contract;
  const goldReward = Math.round((contract.goldReward * (1 + goldPercent / 100)) / 5) * 5;
  return {
    ...contract,
    goldReward,
    guildPointReward: contract.guildPointReward + guildPointBonus,
  };
}

export function applyGuildExhibitionReputation(save: GameSave): GameSave {
  const goldPercent = numberFlag(save.flags.chapterThreeExhibitionGuildGoldPercent);
  const guildPointBonus = numberFlag(save.flags.chapterThreeExhibitionGuildGpBonus);
  if (goldPercent <= 0 && guildPointBonus <= 0) return save;
  if (!save.guild) return save;

  const appliedWeek = numberFlag(save.flags.chapterThreeExhibitionGuildAppliedWeek);
  if (appliedWeek === save.dayState.weekNumber) return save;

  const contracts = save.guild.contracts.map((contract) => contract.weekNumber === save.dayState.weekNumber
    ? applyRewardBonus(contract, goldPercent, guildPointBonus)
    : contract);

  return {
    ...save,
    guild: { ...save.guild, contracts },
    flags: {
      ...save.flags,
      chapterThreeExhibitionGuildAppliedWeek: save.dayState.weekNumber,
      chapterThreeExhibitionGuildRewardsActive: true,
      m68ChapterThreeGuildRewardBonus: true,
    },
  };
}

export function applyPatronRegistryReputation(save: GameSave): GameSave {
  const goldPercent = numberFlag(save.flags.chapterThreePatronGuildGoldPercent);
  const guildPointBonus = numberFlag(save.flags.chapterThreePatronGuildGpBonus);
  if (goldPercent <= 0 && guildPointBonus <= 0) return save;
  if (!save.guild) return save;

  const appliedWeek = numberFlag(save.flags.chapterThreePatronGuildAppliedWeek);
  if (appliedWeek === save.dayState.weekNumber) return save;

  const contracts = save.guild.contracts.map((contract) => contract.weekNumber === save.dayState.weekNumber
    ? applyRewardBonus(contract, goldPercent, guildPointBonus)
    : contract);

  return {
    ...save,
    guild: { ...save.guild, contracts },
    flags: {
      ...save.flags,
      chapterThreePatronGuildAppliedWeek: save.dayState.weekNumber,
      chapterThreePatronGuildRewardsActive: true,
      m69PatronRegistryRewardBonus: true,
    },
  };
}

function applyAllReputation(save: GameSave): GameSave {
  return applyPatronRegistryReputation(applyGuildExhibitionReputation(save));
}

export function createDefaultGuildState(save: GameSave): GuildState {
  const guild = createDefaultGuildStateBase(save);
  const applied = applyAllReputation({
    ...save,
    guild,
    flags: {
      ...save.flags,
      chapterThreeExhibitionGuildAppliedWeek: 0,
      chapterThreePatronGuildAppliedWeek: 0,
    },
  });
  return applied.guild ?? guild;
}

export function ensureCurrentGuildState(save: GameSave): GameSave {
  return applyAllReputation(ensureCurrentGuildStateBase(save));
}

export function getEligibleCreaturesForContract(save: GameSave, contractId: string): CreatureRecord[] {
  return getEligibleCreaturesForContractBase(ensureCurrentGuildState(save), contractId);
}

export function acceptGuildContract(save: GameSave, contractId: string): GuildActionResult {
  return acceptGuildContractBase(ensureCurrentGuildState(save), contractId);
}

export function donateCreatureToGuildContract(
  save: GameSave,
  contractId: string,
  creatureId: string,
): GuildActionResult {
  return donateCreatureToGuildContractBase(ensureCurrentGuildState(save), contractId, creatureId);
}
