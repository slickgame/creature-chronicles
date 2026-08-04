import { recordColiseumBattleResult, type ColiseumEncounterId, type ColiseumResult } from "@/data/coliseum";
import { applyBattleCareerResults, applyGuildCareerCompletion } from "@/data/creatureCareerTransactions";
import { donateCreatureToGuildContract, ensureCurrentGuildState } from "@/data/guild";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { GuildActionResult } from "@/types/guild";

function toCareerOutcome(outcome: BattleOutcome): "victory" | "draw" | "defeat" {
  if (outcome === "player_won") return "victory";
  if (outcome === "draw") return "draw";
  return "defeat";
}

/**
 * Records the canonical Coliseum result and then credits every player creature
 * that entered the match. Detailed damage/healing metrics can be supplied by a
 * future battle telemetry pass without changing the lifetime record contract.
 */
export function recordColiseumBattleResultWithCareers(
  save: GameSave,
  encounterId: ColiseumEncounterId,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
): ColiseumResult {
  const result = recordColiseumBattleResult(save, encounterId, outcome, roundCount, teamCreatureIds);
  const careerSave = applyBattleCareerResults(result.save, {
    battleId: result.historyEntry.historyId,
    outcome: toCareerOutcome(outcome),
    dayNumber: result.historyEntry.completedAtDayNumber,
    participants: teamCreatureIds.map((creatureId) => ({ creatureId })),
  });

  return { ...result, save: careerSave };
}

/**
 * Completes the existing Guild submission transaction and credits the submitted
 * creature with one request completion. Gold-tier contracts count as featured
 * requests for the first Ambitions pass.
 */
export function submitGuildContractWithCareer(
  save: GameSave,
  contractId: string,
  creatureId: CreatureId,
): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const contract = syncedSave.guild?.contracts.find((item) => item.contractId === contractId);
  const result = donateCreatureToGuildContract(syncedSave, contractId, creatureId);
  if (!result.ok || !contract) return result;

  return {
    ...result,
    save: applyGuildCareerCompletion(result.save, {
      requestId: String(contract.contractId),
      dayNumber: syncedSave.dayState.dayNumber,
      participantIds: [creatureId],
      featured: contract.tier === "gold",
    }),
  };
}
