import { getBattleMove } from "@/data/battleMoves";
import { getLegalBattleTargetIds } from "@/data/battleEngine";
import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleMove,
  BattleMoveId,
  BattleState,
  BattleTargetType,
} from "@/types/battle";

export type BattleUiTarget =
  | { kind: "combatant"; combatantId: BattleCombatantId }
  | { kind: "field" };

export type BattleUiMoveAvailability = {
  move: BattleMove;
  compatible: boolean;
  usable: boolean;
  reason: string | null;
  normalizedTargetIds: BattleCombatantId[];
};

export function getBattleTargetTypeLabel(targetType: BattleTargetType): string {
  if (targetType === "self") return "Self";
  if (targetType === "single_enemy") return "One Enemy";
  if (targetType === "all_enemies") return "All Enemies";
  if (targetType === "single_ally") return "One Ally";
  if (targetType === "all_allies") return "All Allies";
  return "Field";
}

function targetMatchesMove(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  target: BattleUiTarget,
): boolean {
  if (target.kind === "field") return move.targetType === "field";
  const targetCombatant = state.combatants[target.combatantId];
  if (!targetCombatant || targetCombatant.isFainted) return false;
  if (move.targetType === "self") return targetCombatant.battleCombatantId === actor.battleCombatantId;
  if (move.targetType === "single_enemy" || move.targetType === "all_enemies") {
    return targetCombatant.sideId !== actor.sideId;
  }
  if (move.targetType === "single_ally" || move.targetType === "all_allies") {
    return targetCombatant.sideId === actor.sideId;
  }
  return false;
}

function normalizedTargetsForSelection(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  target: BattleUiTarget,
): BattleCombatantId[] {
  if (move.targetType === "field") return [];
  if (move.targetType === "self") return [actor.battleCombatantId];
  const legalTargets = getLegalBattleTargetIds(state, actor, move);
  if (move.targetType === "all_allies" || move.targetType === "all_enemies") return legalTargets;
  if (target.kind === "combatant" && legalTargets.includes(target.combatantId)) return [target.combatantId];
  return legalTargets.slice(0, 1);
}

export function getBattleUiMoveAvailability(
  state: BattleState,
  actorId: BattleCombatantId,
  moveId: BattleMoveId,
  target: BattleUiTarget,
): BattleUiMoveAvailability {
  const actor = state.combatants[actorId];
  const move = getBattleMove(moveId);
  if (!actor || actor.isFainted) {
    return { move, compatible: false, usable: false, reason: "This creature cannot act.", normalizedTargetIds: [] };
  }
  const compatible = targetMatchesMove(state, actor, move, target);
  const cooldown = actor.cooldowns[move.id] ?? 0;
  const equipped = actor.loadout.equippedMoveIds.includes(move.id);
  const enoughEnergy = actor.currentBattleEnergy >= move.battleEnergyCost;
  let reason: string | null = null;
  if (!compatible) reason = `Select a ${getBattleTargetTypeLabel(move.targetType).toLowerCase()} target.`;
  else if (!equipped) reason = "This move is not equipped.";
  else if (cooldown > 0) reason = `${cooldown} round${cooldown === 1 ? "" : "s"} of cooldown remaining.`;
  else if (!enoughEnergy) reason = `Need ${move.battleEnergyCost} Battle Energy.`;
  return {
    move,
    compatible,
    usable: compatible && equipped && cooldown <= 0 && enoughEnergy,
    reason,
    normalizedTargetIds: compatible ? normalizedTargetsForSelection(state, actor, move, target) : [],
  };
}

export function getBattleUiMoveOptions(
  state: BattleState,
  actorId: BattleCombatantId,
  target: BattleUiTarget | null,
): BattleUiMoveAvailability[] {
  const actor = state.combatants[actorId];
  if (!actor || !target) return [];
  return actor.loadout.equippedMoveIds.map((moveId) =>
    getBattleUiMoveAvailability(state, actorId, moveId, target),
  );
}

export function buildBattleUiAction(
  state: BattleState,
  actorId: BattleCombatantId,
  moveId: BattleMoveId,
  target: BattleUiTarget,
): BattleAction | null {
  const availability = getBattleUiMoveAvailability(state, actorId, moveId, target);
  if (!availability.usable) return null;
  return {
    actorId,
    moveId,
    targetIds: availability.normalizedTargetIds,
  };
}

export function getNextUnqueuedPlayerActorId(
  state: BattleState,
  queuedActions: ReadonlyMap<BattleCombatantId, BattleAction>,
  afterActorId?: BattleCombatantId | null,
): BattleCombatantId | null {
  const living = state.teams.player.combatantIds.filter((combatantId) => {
    const combatant = state.combatants[combatantId];
    return combatant && !combatant.isFainted && !queuedActions.has(combatantId);
  });
  if (!living.length) return null;
  if (!afterActorId) return living[0];
  const ordered = state.teams.player.combatantIds;
  const startIndex = ordered.indexOf(afterActorId);
  for (let offset = 1; offset <= ordered.length; offset += 1) {
    const candidate = ordered[(startIndex + offset) % ordered.length];
    if (living.includes(candidate)) return candidate;
  }
  return living[0];
}
