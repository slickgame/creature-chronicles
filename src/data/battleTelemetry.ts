import type { BattleCombatantId } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { CareerBattleParticipant } from "@/data/creatureCareerTransactions";

export type BattleTelemetryEvent =
  | { type: "damage"; actorId: BattleCombatantId; amount: number; targetFainted?: boolean }
  | { type: "healing"; actorId: BattleCombatantId; amount: number }
  | { type: "protection"; actorId: BattleCombatantId; alliesProtected?: number }
  | { type: "fainted"; combatantId: BattleCombatantId };

export type BattleTelemetryParticipant = CareerBattleParticipant & {
  combatantId: BattleCombatantId;
};

export type BattleTelemetryState = {
  participantsByCombatantId: Record<string, BattleTelemetryParticipant>;
};

function safeAmount(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

export function createBattleTelemetryState(
  participants: Array<{ combatantId: BattleCombatantId; creatureId: CreatureId }>,
): BattleTelemetryState {
  return {
    participantsByCombatantId: Object.fromEntries(
      participants.map(({ combatantId, creatureId }) => [
        String(combatantId),
        {
          combatantId,
          creatureId,
          damageDealt: 0,
          healingDone: 0,
          alliesProtected: 0,
          knockouts: 0,
          fainted: false,
        },
      ]),
    ),
  };
}

export function recordBattleTelemetryEvent(
  state: BattleTelemetryState,
  event: BattleTelemetryEvent,
): BattleTelemetryState {
  const combatantId = event.type === "fainted" ? event.combatantId : event.actorId;
  const current = state.participantsByCombatantId[String(combatantId)];
  if (!current) return state;

  const next = { ...current };
  if (event.type === "damage") {
    next.damageDealt = safeAmount(next.damageDealt) + safeAmount(event.amount);
    next.knockouts = safeAmount(next.knockouts) + (event.targetFainted ? 1 : 0);
  } else if (event.type === "healing") {
    next.healingDone = safeAmount(next.healingDone) + safeAmount(event.amount);
  } else if (event.type === "protection") {
    next.alliesProtected = safeAmount(next.alliesProtected) + Math.max(1, safeAmount(event.alliesProtected ?? 1));
  } else {
    next.fainted = true;
  }

  return {
    participantsByCombatantId: {
      ...state.participantsByCombatantId,
      [String(combatantId)]: next,
    },
  };
}

export function getBattleCareerParticipants(state: BattleTelemetryState): CareerBattleParticipant[] {
  return Object.values(state.participantsByCombatantId).map((participant) => ({
    creatureId: participant.creatureId,
    damageDealt: safeAmount(participant.damageDealt),
    healingDone: safeAmount(participant.healingDone),
    alliesProtected: safeAmount(participant.alliesProtected),
    knockouts: safeAmount(participant.knockouts),
    fainted: Boolean(participant.fainted),
  }));
}
