import { recordColiseumBattleResult, type ColiseumEncounterId, type ColiseumResult } from "@/data/coliseum";
import { applyBattleCareerResults, applyGuildCareerCompletion, type CareerBattleParticipant } from "@/data/creatureCareerTransactions";
import { applyBattleTeamworkMorale } from "@/data/creatureRelationshipGameplay";
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

function normalizeParticipants(
  teamCreatureIds: CreatureId[],
  telemetry: CareerBattleParticipant[] | undefined,
): CareerBattleParticipant[] {
  const telemetryById = new Map((telemetry ?? []).map((participant) => [String(participant.creatureId), participant]));
  return teamCreatureIds.map((creatureId) => telemetryById.get(String(creatureId)) ?? { creatureId });
}

/**
 * Records the canonical Coliseum result and credits every player creature that
 * entered the match. Optional telemetry forwards damage, healing, protection,
 * knockouts, and fainting into lifetime Career Records. Victorious teammates
 * with an established friendship also receive a small, idempotent morale gain.
 */
export function recordColiseumBattleResultWithCareers(
  save: GameSave,
  encounterId: ColiseumEncounterId,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
  telemetry?: CareerBattleParticipant[],
): ColiseumResult {
  const result = recordColiseumBattleResult(save, encounterId, outcome, roundCount, teamCreatureIds);
  const careerOutcome = toCareerOutcome(outcome);
  const careerSave = applyBattleCareerResults(result.save, {
    battleId: result.historyEntry.historyId,
    outcome: careerOutcome,
    dayNumber: result.historyEntry.completedAtDayNumber,
    participants: normalizeParticipants(teamCreatureIds, telemetry),
  });
  const moraleSave = applyBattleTeamworkMorale(
    careerSave,
    result.historyEntry.historyId,
    teamCreatureIds,
    careerOutcome,
  );

  return { ...result, save: moraleSave };
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
