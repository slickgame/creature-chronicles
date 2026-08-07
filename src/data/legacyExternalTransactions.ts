import { recordColiseumBattleResult, type ColiseumEncounterId, type ColiseumResult } from "@/data/coliseum";
import { applyBattleCareerResults, applyGuildCareerCompletion, type CareerBattleParticipant } from "@/data/creatureCareerTransactions";
import {
  applyHeirloomBattleEffect,
  applyHeirloomGuildEffect,
} from "@/data/creatureHeirloomEffects";
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
 * with an established friendship receive a small, idempotent morale gain, and
 * combat/guardian Heirlooms provide a separate capped ranch-wide victory aura.
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
  const heirloom = applyHeirloomBattleEffect(
    moraleSave,
    result.historyEntry.historyId,
    teamCreatureIds,
    outcome,
  );

  return { ...result, save: heirloom.save };
}

/**
 * Completes the existing Guild submission transaction and credits the submitted
 * creature with one request completion. Gold-tier contracts count as featured
 * requests for the first Ambitions pass. Guild Heirlooms add a capped Affection
 * reward after the canonical contract and Career transaction have succeeded.
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

  const careerSave = applyGuildCareerCompletion(result.save, {
    requestId: String(contract.contractId),
    dayNumber: syncedSave.dayState.dayNumber,
    participantIds: [creatureId],
    featured: contract.tier === "gold",
  });
  const heirloom = applyHeirloomGuildEffect(careerSave, String(contract.contractId), creatureId);

  return {
    ...result,
    save: heirloom.save,
    message: heirloom.note ? `${result.message} ${heirloom.note}` : result.message,
  };
}
