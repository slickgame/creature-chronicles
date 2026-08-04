import { getColiseumProgress } from "@/data/coliseum";
import {
  applyBattleCareerResults,
  applyGuildCareerCompletion,
} from "@/data/creatureCareerTransactions";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const LEGACY_RECONCILIATION_VERSION = 1 as const;

function toCareerOutcome(outcome: BattleOutcome): "victory" | "draw" | "defeat" {
  if (outcome === "player_won") return "victory";
  if (outcome === "draw") return "draw";
  return "defeat";
}

function isTrackableBattleCreature(save: GameSave, creatureId: CreatureId): boolean {
  if ((save.creatures ?? []).some((creature) => creature.creatureId === creatureId)) return true;
  return Boolean(save.creatureCareers?.recordsByCreatureId?.[String(creatureId)]);
}

function nonNegativeFlagNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

/**
 * Replays persisted external-system history through the idempotent Career layer.
 * This is intentionally safe to call at every save boundary: Coliseum history IDs
 * and Guild contract IDs become stable event keys, so already-accounted activity
 * produces no duplicate statistics, Memories, rewards, or Chronicle entries.
 */
export function reconcileLegacyExternalProgress(save: GameSave): GameSave {
  let nextSave = save;
  let reconciledEvents = 0;

  const coliseumHistory = [...getColiseumProgress(save).history].sort(
    (left, right) => left.completedAtDayNumber - right.completedAtDayNumber,
  );
  for (const entry of coliseumHistory) {
    const participantIds = entry.teamCreatureIds.filter((creatureId) =>
      isTrackableBattleCreature(nextSave, creatureId),
    );
    if (!participantIds.length) continue;
    const before = nextSave;
    nextSave = applyBattleCareerResults(nextSave, {
      battleId: entry.historyId,
      outcome: toCareerOutcome(entry.outcome),
      dayNumber: entry.completedAtDayNumber,
      participants: participantIds.map((creatureId) => ({ creatureId })),
    });
    if (nextSave !== before) reconciledEvents += 1;
  }

  const completedContracts = [...(save.guild?.contracts ?? [])]
    .filter((contract) => contract.status === "completed" && contract.submittedCreatureId)
    .sort(
      (left, right) =>
        (left.completedAtDayNumber ?? save.dayState.dayNumber) -
        (right.completedAtDayNumber ?? save.dayState.dayNumber),
    );
  for (const contract of completedContracts) {
    const creatureId = contract.submittedCreatureId as CreatureId;
    const before = nextSave;
    nextSave = applyGuildCareerCompletion(nextSave, {
      requestId: String(contract.contractId),
      dayNumber: contract.completedAtDayNumber ?? save.dayState.dayNumber,
      participantIds: [creatureId],
      featured: contract.tier === "gold",
    });
    if (nextSave !== before) reconciledEvents += 1;
  }

  return {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      legacyExternalProgressReconciliationVersion: LEGACY_RECONCILIATION_VERSION,
      legacyExternalProgressReconciledAtDay: save.dayState.dayNumber,
      legacyExternalProgressReconciledEvents:
        nonNegativeFlagNumber(nextSave.flags.legacyExternalProgressReconciledEvents) + reconciledEvents,
    },
  };
}

export function getLegacyPrestige(save: GameSave): number {
  const value = Number(save.flags.legacyPrestige ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
