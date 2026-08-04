export * from "./coliseumC2Core";

import { applyBattleCareerResults } from "@/data/creatureCareerTransactions";
import {
  recordColiseumC2BattleResult as recordColiseumC2BattleResultCore,
  type ColiseumC2EncounterId,
  type ColiseumC2Result,
  type ColiseumCombatPerformanceMap,
} from "./coliseumC2Core";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function toCareerOutcome(outcome: BattleOutcome): "victory" | "draw" | "defeat" {
  if (outcome === "player_won") return "victory";
  if (outcome === "draw") return "draw";
  return "defeat";
}

/**
 * Career-aware facade for the authored C2 Coliseum. The original progression,
 * rewards, XP, duplicate protection, and performance records remain owned by
 * coliseumC2Core; this layer forwards the same authoritative performance map
 * into creature lifetime Careers, Ambitions, Relationships, Memories, and the
 * Chronicle without requiring duplicate UI bookkeeping.
 */
export function recordColiseumC2BattleResult(
  save: GameSave,
  encounterId: ColiseumC2EncounterId,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
  performance: ColiseumCombatPerformanceMap,
  resultId: string,
): ColiseumC2Result {
  const result = recordColiseumC2BattleResultCore(
    save,
    encounterId,
    outcome,
    roundCount,
    teamCreatureIds,
    performance,
    resultId,
  );
  if (result.duplicate) return result;

  const careerSave = applyBattleCareerResults(result.save, {
    battleId: resultId,
    outcome: toCareerOutcome(outcome),
    dayNumber: save.dayState.dayNumber,
    participants: teamCreatureIds.map((creatureId) => {
      const metrics = performance[String(creatureId)];
      return {
        creatureId,
        damageDealt: metrics?.damageDealt ?? 0,
        healingDone: metrics?.healingDone ?? 0,
        alliesProtected: metrics?.alliesProtected ?? 0,
        knockouts: metrics?.knockouts ?? 0,
      };
    }),
  });

  return { ...result, save: careerSave };
}
