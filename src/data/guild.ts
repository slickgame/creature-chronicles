export * from "./guildCore";
export * from "./guildServiceAvailability";
export * from "./guildRequesters";
export * from "./guildTrustProgression";

import { applyGuildCareerCompletion } from "@/data/creatureCareerTransactions";
import { addCreatureMemory } from "@/data/creatureMemories";
import {
  donateCreatureToGuildContract as donateCreatureToGuildContractCore,
  ensureCurrentGuildState as ensureCurrentGuildStateCore,
  getEligibleCreaturesForContract as getEligibleCreaturesForContractCore,
} from "./guildCore";
import {
  normalizeGuildContractRequester,
  reconcileGuildRequesterTrust,
} from "./guildRequesters";
import {
  getGuildServiceDurationDays,
  getGuildServiceUnavailableReason,
  normalizeGuildServiceContract,
} from "./guildServiceAvailability";
import {
  applyGuildTrustContractCompletion,
  applyGuildTrustContractPools,
} from "./guildTrustProgression";
import { getTrainingUnavailableReason as getTrainingUnavailableReasonCore } from "./trainingGrounds";
import type { GuildActionResult, GuildContract } from "@/types/guild";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function normalizeLiveGuildContract(contract: GuildContract): GuildContract {
  return normalizeGuildServiceContract(normalizeGuildContractRequester(contract));
}

function activeServiceContractsFrom(save: GameSave): GuildContract[] {
  const dayNumber = save.dayState.dayNumber;
  return (save.guild?.contracts ?? [])
    .map(normalizeLiveGuildContract)
    .filter((contract) =>
      contract.type === "service_creature" &&
      contract.status === "completed" &&
      typeof contract.serviceReturnDayNumber === "number" &&
      contract.serviceReturnDayNumber > dayNumber,
    );
}

/**
 * Guild normalization keeps timed service assignments alive across a weekly
 * board refresh, upgrades legacy role requesters into real town characters,
 * reconciles personal requester Trust exactly once for completed history, and
 * then layers relationship-backed request pools over the ordinary weekly board.
 */
export function ensureCurrentGuildState(save: GameSave): GameSave {
  const activeServices = activeServiceContractsFrom(save);
  const synced = ensureCurrentGuildStateCore(save);
  if (!synced.guild) return synced;

  const normalizedContracts = synced.guild.contracts.map(normalizeLiveGuildContract);
  const knownIds = new Set(normalizedContracts.map((contract) => String(contract.contractId)));
  const retainedServices = activeServices.filter((contract) => !knownIds.has(String(contract.contractId)));
  const normalizedChanged = normalizedContracts.some((contract, index) => contract !== synced.guild?.contracts[index]);
  const withNormalizedContracts = !normalizedChanged && retainedServices.length === 0
    ? synced
    : {
        ...synced,
        guild: {
          ...synced.guild,
          contracts: [...normalizedContracts, ...retainedServices],
        },
      };

  const withTrust = reconcileGuildRequesterTrust(withNormalizedContracts).save;
  return applyGuildTrustContractPools(withTrust);
}

/**
 * Eligible Guild candidates must also be physically present at the ranch.
 * Training and another active Guild service both make the creature unavailable.
 */
export function getEligibleCreaturesForContract(save: GameSave, contractId: string) {
  const synced = ensureCurrentGuildState(save);
  return getEligibleCreaturesForContractCore(synced, contractId).filter((creature) =>
    !getTrainingUnavailableReasonCore(synced, creature.creatureId) &&
    !getGuildServiceUnavailableReason(synced, creature.creatureId),
  );
}

function clearCreatureFromRanchJobs(save: GameSave, creatureId: CreatureId): GameSave {
  if (!save.ranchJobs) return save;
  const assignments = Object.fromEntries(
    Object.entries(save.ranchJobs.assignments).map(([jobId, creatureIds]) => [
      jobId,
      (creatureIds ?? []).filter((id) => id !== creatureId),
    ]),
  ) as typeof save.ranchJobs.assignments;
  return {
    ...save,
    ranchJobs: {
      ...save.ranchJobs,
      assignments,
    },
  };
}

function applyTimedServiceAbsence(
  save: GameSave,
  contract: GuildContract,
  creatureId: CreatureId,
  creatureName: string,
): { save: GameSave; message: string } {
  if (contract.type !== "service_creature" || !save.guild) return { save, message: "" };
  const durationDays = getGuildServiceDurationDays(contract);
  const returnDayNumber = save.dayState.dayNumber + durationDays;
  const nextContracts = save.guild.contracts.map((item) =>
    item.contractId === contract.contractId
      ? normalizeLiveGuildContract({
          ...item,
          serviceDurationDays: durationDays,
          serviceReturnDayNumber: returnDayNumber,
        })
      : normalizeLiveGuildContract(item),
  );
  const withoutChore = clearCreatureFromRanchJobs(save, creatureId);
  return {
    save: {
      ...withoutChore,
      guild: { ...save.guild, contracts: nextContracts },
      flags: {
        ...withoutChore.flags,
        m34ServiceContracts: true,
        guildTimedServiceAssignments: true,
      },
    },
    message: `${creatureName} will be away for ${durationDays} ${durationDays === 1 ? "day" : "days"} and returns on Ranch Day ${returnDayNumber}.`,
  };
}

/**
 * Career-aware facade for all live Guild submissions. The original Guild engine
 * remains authoritative for validation and rewards. Service submissions also
 * create a timed physical absence, while every successful completion now earns
 * duplicate-safe personal Trust, can deepen an NPC relationship, and can advance
 * authored Trust-gated personal quest chains.
 */
export function donateCreatureToGuildContract(
  save: GameSave,
  contractId: string,
  creatureId: string,
): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const contract = syncedSave.guild?.contracts.find((item) => String(item.contractId) === contractId);
  const creature = (syncedSave.creatures ?? []).find((item) => String(item.creatureId) === creatureId);
  if (!contract || !creature) {
    return donateCreatureToGuildContractCore(syncedSave, contractId, creatureId);
  }

  const typedCreatureId = creature.creatureId as CreatureId;
  const existingGuildService = getGuildServiceUnavailableReason(syncedSave, typedCreatureId);
  if (existingGuildService) {
    return { save: syncedSave, ok: false, message: `${creature.nickname} is unavailable. ${existingGuildService}` };
  }
  const trainingReason = getTrainingUnavailableReasonCore(syncedSave, typedCreatureId);
  if (trainingReason) {
    return { save: syncedSave, ok: false, message: `${creature.nickname} is unavailable. ${trainingReason}` };
  }

  const result = donateCreatureToGuildContractCore(syncedSave, contractId, creatureId);
  if (!result.ok) return result;

  let transactionSave = result.save;
  let serviceMessage = "";
  if (contract.type === "service_creature") {
    const timed = applyTimedServiceAbsence(transactionSave, contract, typedCreatureId, creature.nickname);
    transactionSave = timed.save;
    serviceMessage = timed.message;
  } else {
    transactionSave = clearCreatureFromRanchJobs(transactionSave, typedCreatureId);
  }

  let legacySave = applyGuildCareerCompletion(transactionSave, {
    requestId: String(contract.contractId),
    dayNumber: syncedSave.dayState.dayNumber,
    participantIds: [typedCreatureId],
    featured: contract.tier === "gold",
  });
  legacySave = addCreatureMemory(legacySave, {
    creatureId: typedCreatureId,
    category: "guild",
    importance: contract.tier === "gold" ? "major" : "notable",
    title: `${creature.nickname} completed a Guild request`,
    description: `${creature.nickname} helped complete “${contract.title}” for ${contract.requesterName ?? "the Guild"}.${contract.type === "donate_creature" ? " This service became the creature's final contribution while living at the ranch." : ` ${serviceMessage}`}`,
    dayNumber: syncedSave.dayState.dayNumber,
    sourceKey: `guild-request:${String(contract.contractId)}:${String(typedCreatureId)}`,
    tags: ["guild", contract.category, contract.tier, contract.type],
  });

  const trustResult = reconcileGuildRequesterTrust(legacySave);
  const trustAward = trustResult.awards.find((award) => award.contractId === String(contract.contractId));
  const trustMessage = trustAward
    ? ` ${trustAward.requesterName} Trust +${trustAward.amount} (${trustAward.tierLabel}, ${trustAward.points} total).`
    : "";
  const levelUpMessage = trustAward && trustAward.level > trustAward.previousLevel
    ? ` Relationship Deepened — ${trustAward.requesterName} now considers the ranch ${trustAward.tierLabel}.${trustAward.unlockLabel ? ` Unlocked: ${trustAward.unlockLabel}.` : ""}`
    : "";

  const personalResult = applyGuildTrustContractCompletion(trustResult.save, contract, typedCreatureId);
  const finalSave = applyGuildTrustContractPools(personalResult.save);

  return {
    ...result,
    save: finalSave,
    message: `${serviceMessage ? `${result.message} ${serviceMessage}` : result.message}${trustMessage}${levelUpMessage}${personalResult.message}`,
  };
}
