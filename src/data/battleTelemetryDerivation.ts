import { getBattleMove } from "@/data/battleMoves";
import {
  createBattleTelemetryState,
  recordBattleTelemetryEvent,
  type BattleTelemetryState,
} from "@/data/battleTelemetry";
import type {
  BattleCombatantId,
  BattleResolvedAction,
  BattleState,
} from "@/types/battle";

function actionTargets(action: BattleResolvedAction): BattleCombatantId[] {
  const targets = action.hitTargetIds?.length ? action.hitTargetIds : action.targetIds;
  return Array.from(new Set(targets));
}

function lastMatchingAction(
  actions: BattleResolvedAction[],
  targetId: BattleCombatantId,
  effectType: "damage" | "heal",
): BattleResolvedAction | null {
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    const action = actions[index];
    if (!action.success || !actionTargets(action).includes(targetId)) continue;
    if (getBattleMove(action.moveId).effects.some((effect) => effect.type === effectType)) return action;
  }
  return null;
}

/**
 * Derives conservative per-creature telemetry from a completed round. The battle
 * engine currently returns one before/after snapshot for the whole round rather
 * than per-action deltas, so net HP changes are assigned to the final successful
 * matching action. This guarantees no round damage or healing is double-counted
 * while leaving room for exact per-effect telemetry in a future engine revision.
 */
export function deriveRoundBattleTelemetry(
  current: BattleTelemetryState,
  previousState: BattleState,
  nextState: BattleState,
  resolvedActions: BattleResolvedAction[],
): BattleTelemetryState {
  let telemetry = current;
  const playerActions = resolvedActions.filter(
    (action) => previousState.combatants[action.actorId]?.sideId === "player",
  );

  for (const [combatantId, before] of Object.entries(previousState.combatants)) {
    const after = nextState.combatants[combatantId];
    if (!after) continue;

    if (before.sideId === "enemy") {
      const damage = Math.max(0, before.currentHp - after.currentHp);
      if (damage > 0) {
        const action = lastMatchingAction(playerActions, before.battleCombatantId, "damage");
        if (action) {
          telemetry = recordBattleTelemetryEvent(telemetry, {
            type: "damage",
            actorId: action.actorId,
            amount: damage,
            targetFainted: !before.isFainted && after.isFainted,
          });
        }
      }
    }

    if (before.sideId === "player") {
      const healing = Math.max(0, after.currentHp - before.currentHp);
      if (healing > 0) {
        const action = lastMatchingAction(playerActions, before.battleCombatantId, "heal");
        if (action) {
          telemetry = recordBattleTelemetryEvent(telemetry, {
            type: "healing",
            actorId: action.actorId,
            amount: healing,
          });
        }
      }
      if (!before.isFainted && after.isFainted) {
        telemetry = recordBattleTelemetryEvent(telemetry, {
          type: "fainted",
          combatantId: before.battleCombatantId,
        });
      }
    }
  }

  for (const action of playerActions) {
    if (!action.success) continue;
    const move = getBattleMove(action.moveId);
    if (!move.effects.some((effect) => effect.type === "guard")) continue;
    const protectedAllies = actionTargets(action).filter(
      (targetId) => previousState.combatants[targetId]?.sideId === "player",
    ).length;
    if (protectedAllies > 0) {
      telemetry = recordBattleTelemetryEvent(telemetry, {
        type: "protection",
        actorId: action.actorId,
        alliesProtected: protectedAllies,
      });
    }
  }

  return telemetry;
}

export function createTelemetryForPlayerTeam(state: BattleState): BattleTelemetryState {
  return createBattleTelemetryState(
    state.teams.player.combatantIds.map((combatantId) => ({
      combatantId,
      creatureId: state.combatants[combatantId].sourceCreatureId,
    })),
  );
}
