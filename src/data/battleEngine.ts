import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleCooldowns,
  BattleMove,
  BattleMoveEffect,
  BattleMoveId,
  BattleMoveLoadout,
  BattleOutcome,
  BattleResolvedAction,
  BattleRoundResult,
  BattleSideId,
  BattleState,
  BattleStats,
  BattleStatusId,
  BattleStatusStack,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import { getBattleMove } from "@/data/battleMoves";
import { calculateBattleStats, getBattleTurnScore, previewBattleDamage } from "@/data/battleStats";
import { getCreatureDefaultBattleMoveLoadout, normalizeBattleMoveLoadout, REQUIRED_BASIC_BATTLE_MOVE_ID } from "@/data/battleLoadouts";

export type CreateBattleStateInput = {
  battleId: string;
  playerCreatures: CreatureRecord[];
  enemyCreatures: CreatureRecord[];
  playerLoadouts?: Partial<Record<CreatureId, BattleMoveLoadout>>;
  enemyLoadouts?: Partial<Record<CreatureId, BattleMoveLoadout>>;
  playerTeamName?: string;
  enemyTeamName?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % modulo;
}

function chanceSucceeds(chance: number | undefined, seed: string): boolean {
  if (chance === undefined) return true;
  if (chance >= 100) return true;
  if (chance <= 0) return false;
  return deterministicRoll(seed, 100) < chance;
}

function getOpposingSide(sideId: BattleSideId): BattleSideId {
  return sideId === "player" ? "enemy" : "player";
}

function cloneCombatant(combatant: BattleCombatant): BattleCombatant {
  return {
    ...combatant,
    loadout: {
      learnedMoveIds: [...combatant.loadout.learnedMoveIds],
      equippedMoveIds: [...combatant.loadout.equippedMoveIds],
    },
    cooldowns: { ...combatant.cooldowns },
    statuses: combatant.statuses.map((status) => ({ ...status })),
  };
}

function cloneBattleState(state: BattleState): BattleState {
  const combatants = Object.values(state.combatants).reduce(
    (nextCombatants, combatant) => ({ ...nextCombatants, [combatant.battleCombatantId]: cloneCombatant(combatant) }),
    {} as Record<BattleCombatantId, BattleCombatant>,
  );

  return {
    ...state,
    teams: {
      player: { ...state.teams.player, combatantIds: [...state.teams.player.combatantIds] },
      enemy: { ...state.teams.enemy, combatantIds: [...state.teams.enemy.combatantIds] },
    },
    combatants,
    log: [...state.log],
  };
}

function createBattleCombatant(
  creature: CreatureRecord,
  sideId: BattleSideId,
  slotIndex: number,
  loadout?: BattleMoveLoadout,
): BattleCombatant {
  const battleStats = calculateBattleStats(creature);
  const normalizedLoadout = normalizeBattleMoveLoadout(creature.speciesId, loadout ?? getCreatureDefaultBattleMoveLoadout(creature));
  const battleCombatantId = `${sideId}_${slotIndex}_${creature.creatureId}`;

  return {
    battleCombatantId,
    sourceCreatureId: creature.creatureId,
    sideId,
    slotIndex,
    name: creature.nickname || creature.originLabel || creature.creatureId,
    speciesId: creature.speciesId,
    level: creature.level,
    battleStats,
    loadout: normalizedLoadout,
    currentHp: battleStats.maxHp,
    maxHp: battleStats.maxHp,
    currentBattleEnergy: battleStats.battleEnergy,
    maxBattleEnergy: battleStats.battleEnergy,
    cooldowns: {},
    statuses: [],
    isFainted: false,
  };
}

export function createBattleState(input: CreateBattleStateInput): BattleState {
  const playerCombatants = input.playerCreatures.slice(0, 3).map((creature, index) =>
    createBattleCombatant(creature, "player", index, input.playerLoadouts?.[creature.creatureId]),
  );
  const enemyCombatants = input.enemyCreatures.slice(0, 3).map((creature, index) =>
    createBattleCombatant(creature, "enemy", index, input.enemyLoadouts?.[creature.creatureId]),
  );
  const allCombatants = [...playerCombatants, ...enemyCombatants];

  return {
    battleId: input.battleId,
    roundNumber: 1,
    outcome: "ongoing",
    teams: {
      player: { sideId: "player", name: input.playerTeamName ?? "Ranch Team", combatantIds: playerCombatants.map((combatant) => combatant.battleCombatantId) },
      enemy: { sideId: "enemy", name: input.enemyTeamName ?? "Enemy Team", combatantIds: enemyCombatants.map((combatant) => combatant.battleCombatantId) },
    },
    combatants: allCombatants.reduce(
      (combatants, combatant) => ({ ...combatants, [combatant.battleCombatantId]: combatant }),
      {} as Record<BattleCombatantId, BattleCombatant>,
    ),
    log: [`Battle ${input.battleId} begins: ${input.playerTeamName ?? "Ranch Team"} vs ${input.enemyTeamName ?? "Enemy Team"}.`],
  };
}

export function getLivingCombatants(state: BattleState, sideId?: BattleSideId): BattleCombatant[] {
  return Object.values(state.combatants).filter((combatant) => !combatant.isFainted && (!sideId || combatant.sideId === sideId));
}

export function getBattleOutcome(state: BattleState): BattleOutcome {
  const playerAlive = getLivingCombatants(state, "player").length > 0;
  const enemyAlive = getLivingCombatants(state, "enemy").length > 0;
  if (playerAlive && enemyAlive) return "ongoing";
  if (playerAlive) return "player_won";
  if (enemyAlive) return "enemy_won";
  return "draw";
}

function hasStatus(combatant: BattleCombatant, status: BattleStatusId): boolean {
  return combatant.statuses.some((statusStack) => statusStack.status === status && statusStack.duration > 0);
}

export function getEffectiveBattleStats(combatant: BattleCombatant): BattleStats {
  const nextStats: BattleStats = { ...combatant.battleStats };

  combatant.statuses.forEach((statusStack) => {
    const amount = statusStack.amount ?? 0;
    if (statusStack.stat) nextStats[statusStack.stat] += amount;

    if (statusStack.status === "inspired") {
      const inspiredAmount = amount || 3;
      nextStats.physicalPower += inspiredAmount;
      nextStats.specialPower += inspiredAmount;
      nextStats.statusPower += inspiredAmount;
    }

    if (statusStack.status === "weakened") {
      const weakenedAmount = amount || 4;
      nextStats.physicalPower -= weakenedAmount;
      nextStats.specialPower -= weakenedAmount;
    }

    if (statusStack.status === "slowed") {
      const slowedAmount = amount || 6;
      nextStats.speed -= slowedAmount;
      nextStats.evasion -= Math.ceil(slowedAmount / 2);
    }

    if (statusStack.status === "exhausted") nextStats.speed -= amount || 3;
  });

  return {
    maxHp: Math.max(1, Math.round(nextStats.maxHp)),
    physicalPower: Math.max(1, Math.round(nextStats.physicalPower)),
    specialPower: Math.max(1, Math.round(nextStats.specialPower)),
    defense: Math.max(1, Math.round(nextStats.defense)),
    resistance: Math.max(1, Math.round(nextStats.resistance)),
    speed: Math.max(1, Math.round(nextStats.speed)),
    accuracy: Math.max(1, Math.round(nextStats.accuracy)),
    evasion: Math.max(0, Math.round(nextStats.evasion)),
    statusPower: Math.max(1, Math.round(nextStats.statusPower)),
    statusResist: Math.max(1, Math.round(nextStats.statusResist)),
    battleEnergy: Math.max(1, Math.round(nextStats.battleEnergy)),
  };
}

export function getUsableBattleMoves(combatant: BattleCombatant): BattleMove[] {
  return combatant.loadout.equippedMoveIds
    .map((moveId) => getBattleMove(moveId))
    .filter((move) => combatant.currentBattleEnergy >= move.battleEnergyCost && (combatant.cooldowns[move.id] ?? 0) <= 0);
}

export function canUseBattleMove(combatant: BattleCombatant, moveId: BattleMoveId): boolean {
  return getUsableBattleMoves(combatant).some((move) => move.id === moveId);
}

function getFallbackMove(combatant: BattleCombatant): BattleMove {
  const usableMoves = getUsableBattleMoves(combatant);
  return usableMoves[0] ?? getBattleMove(REQUIRED_BASIC_BATTLE_MOVE_ID);
}

function getDefaultTargetIds(state: BattleState, actor: BattleCombatant, move: BattleMove): BattleCombatantId[] {
  if (move.targetType === "self") return [actor.battleCombatantId];

  const allyIds = getLivingCombatants(state, actor.sideId).map((combatant) => combatant.battleCombatantId);
  const enemyIds = getLivingCombatants(state, getOpposingSide(actor.sideId)).map((combatant) => combatant.battleCombatantId);

  if (move.targetType === "all_allies") return allyIds;
  if (move.targetType === "all_enemies") return enemyIds;
  if (move.targetType === "single_ally") return allyIds.slice(0, 1);
  if (move.targetType === "single_enemy") return enemyIds.slice(0, 1);
  return [];
}

function normalizeTargetIds(state: BattleState, actor: BattleCombatant, move: BattleMove, requestedTargetIds: BattleCombatantId[]): BattleCombatantId[] {
  const livingTargets = requestedTargetIds
    .map((targetId) => state.combatants[targetId])
    .filter((target): target is BattleCombatant => Boolean(target) && !target.isFainted);

  const enemySide = getOpposingSide(actor.sideId);

  if (move.targetType === "self") return [actor.battleCombatantId];
  if (move.targetType === "all_allies") return getLivingCombatants(state, actor.sideId).map((target) => target.battleCombatantId);
  if (move.targetType === "all_enemies") return getLivingCombatants(state, enemySide).map((target) => target.battleCombatantId);
  if (move.targetType === "single_ally") {
    const ally = livingTargets.find((target) => target.sideId === actor.sideId);
    return ally ? [ally.battleCombatantId] : getDefaultTargetIds(state, actor, move);
  }
  if (move.targetType === "single_enemy") {
    const enemy = livingTargets.find((target) => target.sideId === enemySide);
    return enemy ? [enemy.battleCombatantId] : getDefaultTargetIds(state, actor, move);
  }
  return [];
}

function normalizeAction(state: BattleState, actor: BattleCombatant, requestedAction?: BattleAction): BattleAction {
  const requestedMoveId = requestedAction?.moveId;
  const move = requestedMoveId && canUseBattleMove(actor, requestedMoveId) ? getBattleMove(requestedMoveId) : getFallbackMove(actor);
  const targetIds = normalizeTargetIds(state, actor, move, requestedAction?.targetIds ?? []);

  return {
    actorId: actor.battleCombatantId,
    moveId: move.id,
    targetIds: targetIds.length > 0 ? targetIds : getDefaultTargetIds(state, actor, move),
  };
}

function getDamageModifier(attacker: BattleCombatant, defender: BattleCombatant, move: BattleMove): number {
  let modifier = 1;
  if (hasStatus(attacker, "inspired")) modifier += 0.1;
  if (hasStatus(attacker, "weakened")) modifier -= 0.15;
  if (hasStatus(defender, "guarded")) modifier -= 0.25;
  if (hasStatus(defender, "marked")) modifier += 0.15;
  if (hasStatus(defender, "exhausted") && move.tags.includes("pursuit")) modifier += 0.1;
  if (hasStatus(defender, "slowed") && move.tags.includes("pursuit")) modifier += 0.1;
  return Math.max(0.5, Math.min(1.5, modifier));
}

function applyDamage(target: BattleCombatant, amount: number): BattleCombatant {
  const currentHp = clamp(target.currentHp - amount, 0, target.maxHp);
  return {
    ...target,
    currentHp,
    isFainted: currentHp <= 0,
  };
}

function applyHealing(target: BattleCombatant, amount: number): BattleCombatant {
  if (target.isFainted) return target;
  return {
    ...target,
    currentHp: clamp(target.currentHp + amount, 0, target.maxHp),
  };
}

function applyBattleEnergy(target: BattleCombatant, amount: number): BattleCombatant {
  return {
    ...target,
    currentBattleEnergy: clamp(target.currentBattleEnergy + amount, 0, target.maxBattleEnergy),
  };
}

function applyStatus(target: BattleCombatant, statusStack: BattleStatusStack): BattleCombatant {
  const otherStatuses = target.statuses.filter((existingStatus) => existingStatus.status !== statusStack.status || existingStatus.stat !== statusStack.stat);
  return {
    ...target,
    statuses: [...otherStatuses, statusStack],
  };
}

function cleanseStatus(target: BattleCombatant, status: BattleStatusId | undefined): BattleCombatant {
  if (!status) return target;
  return {
    ...target,
    statuses: target.statuses.filter((statusStack) => statusStack.status !== status),
  };
}

function getEffectTargets(state: BattleState, actor: BattleCombatant, actionTargetIds: BattleCombatantId[], effect: BattleMoveEffect): BattleCombatant[] {
  if (effect.target === "self") return [state.combatants[actor.battleCombatantId]].filter(Boolean);
  if (effect.target === "allies") return getLivingCombatants(state, actor.sideId);
  if (effect.target === "enemies") return getLivingCombatants(state, getOpposingSide(actor.sideId));
  if (effect.target === "field") return [];
  return actionTargetIds.map((targetId) => state.combatants[targetId]).filter((target): target is BattleCombatant => Boolean(target) && !target.isFainted);
}

function resolveEffect(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  targetIds: BattleCombatantId[],
  effect: BattleMoveEffect,
  actionSeed: string,
): { state: BattleState; log: string[] } {
  let nextState = state;
  const log: string[] = [];
  const targets = getEffectTargets(nextState, actor, targetIds, effect);

  targets.forEach((target, targetIndex) => {
    const currentTarget = nextState.combatants[target.battleCombatantId];
    if (!currentTarget) return;

    if (!chanceSucceeds(effect.chance, `${actionSeed}_${effect.type}_${target.battleCombatantId}_${targetIndex}`)) {
      log.push(`${currentTarget.name} resisted ${move.name}.`);
      return;
    }

    if (effect.type === "damage") {
      const modifier = getDamageModifier(actor, currentTarget, move);
      const preview = previewBattleDamage(getEffectiveBattleStats(actor), getEffectiveBattleStats(currentTarget), move, modifier);
      const updatedTarget = applyDamage(currentTarget, preview.finalDamage);
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      log.push(`${move.name} hits ${currentTarget.name} for ${preview.finalDamage} damage.`);
      if (updatedTarget.isFainted) log.push(`${currentTarget.name} fainted.`);
      return;
    }

    if (effect.type === "heal") {
      const healAmount = Math.max(1, effect.amount ?? move.power);
      const updatedTarget = applyHealing(currentTarget, healAmount);
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      log.push(`${currentTarget.name} recovers ${healAmount} HP.`);
      return;
    }

    if (effect.type === "restore_battle_energy") {
      const energyAmount = Math.max(1, effect.amount ?? 1);
      const updatedTarget = applyBattleEnergy(currentTarget, energyAmount);
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      log.push(`${currentTarget.name} restores ${energyAmount} Battle Energy.`);
      return;
    }

    if (effect.type === "apply_status" || effect.type === "guard" || effect.type === "mark" || effect.type === "taunt") {
      const status = effect.status ?? (effect.type === "guard" ? "guarded" : effect.type === "mark" || effect.type === "taunt" ? "marked" : undefined);
      if (!status) return;
      const updatedTarget = applyStatus(currentTarget, {
        status,
        duration: Math.max(1, effect.duration ?? 1),
        amount: effect.amount,
        stat: effect.stat,
        sourceCombatantId: actor.battleCombatantId,
      });
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      log.push(`${currentTarget.name} is ${status}.`);
      return;
    }

    if (effect.type === "cleanse_status") {
      const updatedTarget = cleanseStatus(currentTarget, effect.status);
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      if (effect.status) log.push(`${currentTarget.name} cleanses ${effect.status}.`);
      return;
    }

    if (effect.type === "buff_stat" || effect.type === "debuff_stat") {
      const amount = effect.type === "buff_stat" ? Math.abs(effect.amount ?? 1) : -Math.abs(effect.amount ?? 1);
      const status = effect.type === "buff_stat" ? "inspired" : "weakened";
      const updatedTarget = applyStatus(currentTarget, {
        status,
        duration: Math.max(1, effect.duration ?? 1),
        amount,
        stat: effect.stat,
        sourceCombatantId: actor.battleCombatantId,
      });
      nextState = {
        ...nextState,
        combatants: { ...nextState.combatants, [updatedTarget.battleCombatantId]: updatedTarget },
      };
      log.push(`${currentTarget.name} ${amount > 0 ? "gains" : "loses"} ${Math.abs(amount)} ${effect.stat ?? "power"}.`);
    }
  });

  return { state: nextState, log };
}

function spendMoveResources(combatant: BattleCombatant, move: BattleMove): BattleCombatant {
  const cooldowns: BattleCooldowns = { ...combatant.cooldowns };
  if (move.cooldown > 0) cooldowns[move.id] = move.cooldown;

  return {
    ...combatant,
    currentBattleEnergy: clamp(combatant.currentBattleEnergy - move.battleEnergyCost, 0, combatant.maxBattleEnergy),
    cooldowns,
  };
}

function resolveAction(state: BattleState, action: BattleAction, actionIndex: number): { state: BattleState; resolvedAction: BattleResolvedAction } {
  let nextState = state;
  const actor = nextState.combatants[action.actorId];
  const move = getBattleMove(action.moveId);
  const actorName = actor?.name ?? "Unknown";
  const targetNames = action.targetIds.map((targetId) => nextState.combatants[targetId]?.name ?? "Unknown");
  const actionLog: string[] = [];

  if (!actor || actor.isFainted) {
    actionLog.push(`${actorName} cannot act.`);
    return {
      state: nextState,
      resolvedAction: { actorId: action.actorId, actorName, moveId: action.moveId, moveName: move.name, targetIds: action.targetIds, targetNames, turnScore: 0, success: false, log: actionLog },
    };
  }

  if (hasStatus(actor, "stun")) {
    actionLog.push(`${actor.name} is stunned and cannot act.`);
    return {
      state: nextState,
      resolvedAction: { actorId: actor.battleCombatantId, actorName: actor.name, moveId: move.id, moveName: move.name, targetIds: action.targetIds, targetNames, turnScore: 0, success: false, log: actionLog },
    };
  }

  if (!canUseBattleMove(actor, move.id)) {
    actionLog.push(`${actor.name} could not use ${move.name}.`);
    return {
      state: nextState,
      resolvedAction: { actorId: actor.battleCombatantId, actorName: actor.name, moveId: move.id, moveName: move.name, targetIds: action.targetIds, targetNames, turnScore: getBattleTurnScore(getEffectiveBattleStats(actor), move), success: false, log: actionLog },
    };
  }

  const actorAfterCost = spendMoveResources(actor, move);
  nextState = {
    ...nextState,
    combatants: { ...nextState.combatants, [actorAfterCost.battleCombatantId]: actorAfterCost },
  };
  actionLog.push(`${actor.name} uses ${move.name}.`);

  move.effects.forEach((effect, effectIndex) => {
    const result = resolveEffect(nextState, actorAfterCost, move, action.targetIds, effect, `${nextState.battleId}_${nextState.roundNumber}_${actionIndex}_${effectIndex}`);
    nextState = result.state;
    actionLog.push(...result.log);
  });

  return {
    state: nextState,
    resolvedAction: {
      actorId: actor.battleCombatantId,
      actorName: actor.name,
      moveId: move.id,
      moveName: move.name,
      targetIds: action.targetIds,
      targetNames,
      turnScore: getBattleTurnScore(getEffectiveBattleStats(actor), move),
      success: true,
      log: actionLog,
    },
  };
}

function tickCooldowns(cooldowns: BattleCooldowns): BattleCooldowns {
  return Object.entries(cooldowns).reduce((nextCooldowns, [moveId, value]) => {
    const nextValue = Math.max(0, (value ?? 0) - 1);
    if (nextValue > 0) return { ...nextCooldowns, [moveId]: nextValue };
    return nextCooldowns;
  }, {} as BattleCooldowns);
}

function tickStatuses(combatant: BattleCombatant): { combatant: BattleCombatant; log: string[] } {
  let nextCombatant = cloneCombatant(combatant);
  const log: string[] = [];

  nextCombatant.statuses.forEach((statusStack) => {
    if (statusStack.status === "bleed" && !nextCombatant.isFainted) {
      const bleedDamage = Math.max(1, statusStack.amount ?? 5);
      nextCombatant = applyDamage(nextCombatant, bleedDamage);
      log.push(`${nextCombatant.name} takes ${bleedDamage} bleed damage.`);
      if (nextCombatant.isFainted) log.push(`${nextCombatant.name} fainted.`);
    }
  });

  return {
    combatant: {
      ...nextCombatant,
      cooldowns: tickCooldowns(nextCombatant.cooldowns),
      statuses: nextCombatant.statuses
        .map((statusStack) => ({ ...statusStack, duration: statusStack.duration - 1 }))
        .filter((statusStack) => statusStack.duration > 0),
    },
    log,
  };
}

function tickEndOfRound(state: BattleState): { state: BattleState; log: string[] } {
  let nextState = state;
  const log: string[] = [];

  Object.values(nextState.combatants).forEach((combatant) => {
    const result = tickStatuses(combatant);
    nextState = {
      ...nextState,
      combatants: { ...nextState.combatants, [result.combatant.battleCombatantId]: result.combatant },
    };
    log.push(...result.log);
  });

  return { state: nextState, log };
}

function buildActionQueue(state: BattleState, requestedActions: BattleAction[]): BattleAction[] {
  const requestedByActor = requestedActions.reduce(
    (actionsByActor, action) => ({ ...actionsByActor, [action.actorId]: action }),
    {} as Partial<Record<BattleCombatantId, BattleAction>>,
  );

  return getLivingCombatants(state)
    .map((actor) => normalizeAction(state, actor, requestedByActor[actor.battleCombatantId]))
    .sort((left, right) => {
      const leftActor = state.combatants[left.actorId];
      const rightActor = state.combatants[right.actorId];
      const leftMove = getBattleMove(left.moveId);
      const rightMove = getBattleMove(right.moveId);
      const leftScore = leftActor ? getBattleTurnScore(getEffectiveBattleStats(leftActor), leftMove) : 0;
      const rightScore = rightActor ? getBattleTurnScore(getEffectiveBattleStats(rightActor), rightMove) : 0;
      return rightScore - leftScore;
    });
}

export function resolveBattleRound(state: BattleState, requestedActions: BattleAction[] = []): { state: BattleState; result: BattleRoundResult } {
  let nextState = cloneBattleState(state);
  const roundNumber = nextState.roundNumber;
  const actionQueue = buildActionQueue(nextState, requestedActions);
  const resolvedActions: BattleResolvedAction[] = [];
  const roundLog: string[] = [`Round ${roundNumber} begins.`];

  actionQueue.forEach((action, actionIndex) => {
    if (getBattleOutcome(nextState) !== "ongoing") return;
    const result = resolveAction(nextState, action, actionIndex);
    nextState = result.state;
    resolvedActions.push(result.resolvedAction);
    roundLog.push(...result.resolvedAction.log);
  });

  const endOfRound = tickEndOfRound(nextState);
  nextState = endOfRound.state;
  roundLog.push(...endOfRound.log);

  const outcome = getBattleOutcome(nextState);
  if (outcome !== "ongoing") roundLog.push(`Battle ends: ${outcome}.`);

  nextState = {
    ...nextState,
    roundNumber: roundNumber + 1,
    outcome,
    log: [...nextState.log, ...roundLog],
  };

  return {
    state: nextState,
    result: {
      roundNumber,
      actions: resolvedActions,
      log: roundLog,
      outcome,
    },
  };
}
