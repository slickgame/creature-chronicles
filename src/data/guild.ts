export * from "./guildCore";

import { applyGuildCareerCompletion } from "@/data/creatureCareerTransactions";
import { addCreatureMemory } from "@/data/creatureMemories";
import {
  donateCreatureToGuildContract as donateCreatureToGuildContractCore,
  ensureCurrentGuildState,
} from "./guildCore";
import type { GuildActionResult } from "@/types/guild";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

/**
 * Career-aware facade for all live Guild submissions. The original Guild engine
 * remains authoritative for eligibility, rewards, donation/service behavior,
 * trust, and contract completion. Successful submissions additionally update
 * creature Careers, Ambitions, Memories, Prestige rewards, and the Chronicle.
 */
export function donateCreatureToGuildContract(
  save: GameSave,
  contractId: string,
  creatureId: string,
): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const contract = syncedSave.guild?.contracts.find((item) => String(item.contractId) === contractId);
  const creature = (syncedSave.creatures ?? []).find((item) => String(item.creatureId) === creatureId);
  const result = donateCreatureToGuildContractCore(syncedSave, contractId, creatureId);
  if (!result.ok || !contract || !creature) return result;

  const typedCreatureId = creature.creatureId as CreatureId;
  let legacySave = applyGuildCareerCompletion(result.save, {
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
    description: `${creature.nickname} helped complete “${contract.title}” for ${contract.requesterName ?? "the Guild"}.${contract.type === "donate_creature" ? " This service became the creature's final contribution while living at the ranch." : ""}`,
    dayNumber: syncedSave.dayState.dayNumber,
    sourceKey: `guild-request:${String(contract.contractId)}:${String(typedCreatureId)}`,
    tags: ["guild", contract.category, contract.tier, contract.type],
  });

  return { ...result, save: legacySave };
}
