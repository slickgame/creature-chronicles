import * as core from "./battleEngine";
import { BATTLE_MOVES_BY_ID, getBattleMove } from "@/data/battleMoves";
import {
  calculateBattleMoveHitChance,
  calculateBattleRoundEnergyRegen,
  calculateBattleSecondaryEffectChance,
  getBattleMoveTagModifier,
  getBattleStatusStackLimit,
} from "@/data/battleRoundRules";
import {
  getBattleTurnScore,
  previewBattleDamage,
  previewBattleHealing,
} from "@/data/battleStats";
import { REQUIRED_BASIC_BATTLE_MOVE_ID } from "@/data/battleLoadouts";
import type {
  BattleAction,
  BattleActionValidationIssue,
  BattleActionValidationResult,
  BattleCombatant,
  BattleCombatantId,
  BattleCooldowns,
  BattleMove,
  BattleMoveEffect,
  BattleMoveId,
  BattleResolvedAction,
  BattleRoundResult,
  BattleSideId,
  BattleState,
  BattleStats,
  BattleStatusId,
  BattleStatusStack,
} from "@/types/battle";

export * from "./battleEngine";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function deterministicBattleRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return Math.abs(hash) % modulo;
}

function chanceSucceeds(chance: number, seed: string): boolean {
  if (chance >= 100) return true;
  if (chance <= 0) return false;
  return deterministicBattleRoll(seed, 100) < chance;
}

function getOpposingSide(sideId: BattleSideId): BattleSideId {
  return sideId === "player" ? "enemy" : "player";
}

function cloneCombatant(combatant: BattleCombatant): BattleCombatant {
  return {
    ...combatant,
    loadout: {
      ...combatant.loadout,
      learnedMoveIds: [...combatant.loadout.learnedMoveIds],
      equippedMoveIds: [...combatant.loadout.equippedMoveIds],
    },
    cooldowns: { ...combatant.cooldowns },
    statuses: combatant.statuses.map((status) => ({ ...status })),
  };
}

function cloneBattleState(state: BattleState): BattleState {
  const combatants = Object.values(state.combatants).reduce(
    (nextCombatants, combatant) => ({
      ...nextCombatants,
      [combatant.battleCombatantId]: cloneCombatant(combatant),
    }),
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

function getStatusStacks(status: BattleStatusStack): number {
  return Math.max(1, status.stacks ?? 1);
}

export function hasBattleStatus(combatant: BattleCombatant, status: BattleStatusId): boolean {
  return combatant.statuses.some((entry) => entry.status === status && entry.duration > 0);
}

export function getEffectiveBattleStats(combatant: BattleCombatant): BattleStats {
  const nextStats: BattleStats = { ...combatant.battleStats };

  combatant.statuses.forEach((statusStack) => {
    if (statusStack.duration <= 0) return;
    const stacks = getStatusStacks(statusStack);
    const amount = statusStack.amount ?? 0;

    if (statusStack.stat) {
      nextStats[statusStack.stat] += amount * stacks;
      return;
    }

    if (statusStack.status === "inspired") {
      const inspiredAmount = (amount || 3) * stacks;
      nextStats.physicalPower += inspiredAmount;
      nextStats.specialPower += inspiredAmount;
      nextStats.statusPower += inspiredAmount;
    } else if (statusStack.status === "weakened") {
      const weakenedAmount = (Math.abs(amount) || 4) * stacks;
      nextStats.physicalPower -= weakenedAmount;
      nextStats.specialPower -= weakenedAmount;
    } else if (statusStack.status === "slowed") {
      const slowedAmount = (Math.abs(amount) || 6) * stacks;
      nextStats.speed -= slowedAmount;
      nextStats.evasion -= Math.ceil(slowedAmount / 2);
    } else if (statusStack.status === "exhausted") {
      nextStats.speed -= (Math.abs(amount) || 3) * stacks;
    }
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
    .map((moveId) => BATTLE_MOVES_BY_ID[moveId])
    .filter((move): move is BattleMove => Boolean(move))
    .filter((move) => (
      combatant.currentBattleEnergy >= move.battleEnergyCost &&
      (combatant.cooldowns[move.id] ?? 0) <= 0
    ));
}

export function canUseBattleMove(combatant: BattleCombatant, moveId: BattleMoveId): boolean {
  return getUsableBattleMoves(combatant).some((move) => move.id === moveId);
}

function getLivingCombatants(state: BattleState, sideId?: BattleSideId): BattleCombatant[] {
  return Object.values(state.combatants).filter((combatant) => (
    !combatant.isFainted && (!sideId || combatant.sideId === sideId)
  ));
}

function getActiveTauntSource(state: BattleState, actor: BattleCombatant): BattleCombatant | null {
  const taunt = actor.statuses.find((status) => status.status === "taunted" && status.duration > 0);
  if (!taunt?.sourceCombatantId) return null;
  const source = state.combatants[taunt.sourceCombatantId];
  if (!source || source.isFainted || source.sideId === actor.sideId) return null;
  return source;
}

export function getLegalBattleTargetIds(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
): BattleCombatantId[] {
  if (move.targetType === "self") return [actor.battleCombatantId];
  if (move.targetType === "field") return [];

  if (move.targetType === "single_enemy") {
    const tauntSource = getActiveTauntSource(state, actor);
    if (tauntSource) return [tauntSource.battleCombatantId];
    return getLivingCombatants(state, getOpposingSide(actor.sideId)).map((entry) => entry.battleCombatantId);
  }
  if (move.targetType === "all_enemies") {
    return getLivingCombatants(state, getOpposingSide(actor.sideId)).map((entry) => entry.battleCombatantId);
  }
  return getLivingCombatants(state, actor.sideId).map((entry) => entry.battleCombatantId);
}

function normalizeTargetIds(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  requestedTargetIds: readonly BattleCombatantId[],
): BattleCombatantId[] {
  const legalTargetIds = getLegalBattleTargetIds(state, actor, move);
  if (move.targetType === "field") return [];
  if (move.targetType === "self") return [actor.battleCombatantId];
  if (move.targetType === "all_allies" || move.targetType === "all_enemies") return legalTargetIds;
  const requested = requestedTargetIds.find((targetId) => legalTargetIds.includes(targetId));
  return requested ? [requested] : legalTargetIds.slice(0, 1);
}

function validationIssue(
  code: BattleActionValidationIssue["code"],
  message: string,
): BattleActionValidationIssue {
  return { code, message };
}

export function validateBattleAction(
  state: BattleState,
  action: BattleAction,
): BattleActionValidationResult {
  const issues: BattleActionValidationIssue[] = [];
  const actor = state.combatants[action.actorId];
  const move = BATTLE_MOVES_BY_ID[action.moveId];

  if (state.outcome !== "ongoing" || core.getBattleOutcome(state) !== "ongoing") {
    issues.push(validationIssue("battle-complete", "The battle has already ended."));
  }
  if (!actor) {
    issues.push(validationIssue("unknown-actor", `Unknown combatant: ${action.actorId}.`));
  } else if (actor.isFainted) {
    issues.push(validationIssue("actor-fainted", `${actor.name} has fainted and cannot act.`));
  }
  if (!move) {
    issues.push(validationIssue("unknown-move", `Unknown move: ${action.moveId}.`));
  }

  const legalTargetIds = actor && move ? getLegalBattleTargetIds(state, actor, move) : [];
  const normalizedTargetIds = actor && move
    ? normalizeTargetIds(state, actor, move, action.targetIds)
    : [];

  if (actor && move) {
    if (!actor.loadout.equippedMoveIds.includes(move.id)) {
      issues.push(validationIssue("move-not-equipped", `${move.name} is not equipped.`));
    }
    if (actor.currentBattleEnergy < move.battleEnergyCost) {
      issues.push(validationIssue("insufficient-energy", `${actor.name} lacks the Battle Energy for ${move.name}.`));
    }
    const cooldown = actor.cooldowns[move.id] ?? 0;
    if (cooldown > 0) {
      issues.push(validationIssue("move-on-cooldown", `${move.name} has ${cooldown} round${cooldown === 1 ? "" : "s"} of cooldown remaining.`));
    }

    if (move.targetType === "single_enemy" || move.targetType === "single_ally") {
      if (!action.targetIds.length) {
        issues.push(validationIssue("missing-target", `${move.name} requires one target.`));
      } else if (!action.targetIds.some((targetId) => legalTargetIds.includes(targetId))) {
        issues.push(validationIssue("invalid-target", `${move.name} cannot target the selected combatant.`));
      }
    }

    const tauntSource = getActiveTauntSource(state, actor);
    if (
      tauntSource &&
      move.targetType === "single_enemy" &&
      action.targetIds.length > 0 &&
      !action.targetIds.includes(tauntSource.battleCombatantId)
    ) {
      issues.push(validationIssue("taunt-target-enforced", `${actor.name} must target ${tauntSource.name} while taunted.`));
    }
  }

  return {
    valid: issues.length === 0,
    actorId: action.actorId,
    moveId: action.moveId,
    legalTargetIds,
    normalizedTargetIds,
    issues,
  };
}

function getFallbackMove(combatant: BattleCombatant): BattleMove {
  const usable = getUsableBattleMoves(combatant);
  const alwaysUsable = usable.find((move) => move.battleEnergyCost === 0 && move.cooldown === 0);
  return alwaysUsable ?? usable[0] ?? getBattleMove(REQUIRED_BASIC_BATTLE_MOVE_ID);
}

type NormalizedRoundAction = {
  action: BattleAction;
  usedFallback: boolean;
  validationIssues: string[];
};

function normalizeRequestedAction(
  state: BattleState,
  actor: BattleCombatant,
  requestedAction?: BattleAction,
): NormalizedRoundAction {
  const messages: string[] = [];
  let move = requestedAction ? BATTLE_MOVES_BY_ID[requestedAction.moveId] : undefined;
  let usedFallback = false;

  if (!requestedAction) {
    usedFallback = true;
    messages.push("No action was submitted; an available fallback move was selected.");
  } else if (!move) {
    usedFallback = true;
    messages.push(`Unknown move ${requestedAction.moveId}; an available fallback move was selected.`);
  } else if (!actor.loadout.equippedMoveIds.includes(move.id)) {
    usedFallback = true;
    messages.push(`${move.name} is not equipped; an available fallback move was selected.`);
  } else if (!canUseBattleMove(actor, move.id)) {
    usedFallback = true;
    const cooldown = actor.cooldowns[move.id] ?? 0;
    messages.push(cooldown > 0
      ? `${move.name} is on cooldown; an available fallback move was selected.`
      : `${actor.name} lacks the Battle Energy for ${move.name}; an available fallback move was selected.`);
  }

  if (usedFallback || !move) move = getFallbackMove(actor);
  const requestedTargets = requestedAction?.targetIds ?? [];
  const normalizedTargetIds = normalizeTargetIds(state, actor, move, requestedTargets);
  const validation = validateBattleAction(state, {
    actorId: actor.battleCombatantId,
    moveId: move.id,
    targetIds: requestedTargets,
  });
  messages.push(...validation.issues
    .filter((issue) => issue.code === "missing-target" || issue.code === "invalid-target" || issue.code === "taunt-target-enforced")
    .map((issue) => issue.message));

  return {
    action: {
      actorId: actor.battleCombatantId,
      moveId: move.id,
      targetIds: normalizedTargetIds,
    },
    usedFallback,
    validationIssues: Array.from(new Set(messages)),
  };
}

function strongerAmount(existing: number | undefined, incoming: number | undefined): number | undefined {
  if (existing === undefined) return incoming;
  if (incoming === undefined) return existing;
  return Math.abs(incoming) >= Math.abs(existing) ? incoming : existing;
}

export type BattleStatusApplicationResult = {
  combatant: BattleCombatant;
  mode: "applied" | "stacked" | "refreshed";
  status: BattleStatusStack;
};

export function applyBattleStatusStack(
  target: BattleCombatant,
  incoming: BattleStatusStack,
): BattleStatusApplicationResult {
  const maxStacks = getBattleStatusStackLimit(incoming.status, incoming.maxStacks);
  const statusKeyMatches = (entry: BattleStatusStack) => (
    entry.status === incoming.status && entry.stat === incoming.stat
  );
  const existingIndex = target.statuses.findIndex(statusKeyMatches);
  const incomingStacks = Math.max(1, incoming.stacks ?? 1);

  if (existingIndex < 0) {
    const status: BattleStatusStack = {
      ...incoming,
      duration: Math.max(1, incoming.duration),
      stacks: Math.min(maxStacks, incomingStacks),
      maxStacks,
    };
    return {
      combatant: { ...target, statuses: [...target.statuses, status] },
      mode: "applied",
      status,
    };
  }

  const existing = target.statuses[existingIndex];
  const currentStacks = getStatusStacks(existing);
  const nextStacks = Math.min(maxStacks, currentStacks + incomingStacks);
  const status: BattleStatusStack = {
    ...existing,
    ...incoming,
    duration: Math.max(existing.duration, incoming.duration),
    amount: strongerAmount(existing.amount, incoming.amount),
    stacks: nextStacks,
    maxStacks,
  };
  const statuses = target.statuses.map((entry, index) => index === existingIndex ? status : entry);
  return {
    combatant: { ...target, statuses },
    mode: nextStacks > currentStacks ? "stacked" : "refreshed",
    status,
  };
}

function cleanseBattleStatus(
  target: BattleCombatant,
  status: BattleStatusId | undefined,
): { combatant: BattleCombatant; removed: number } {
  if (!status) return { combatant: target, removed: 0 };
  const statuses = target.statuses.filter((entry) => entry.status !== status);
  return {
    combatant: { ...target, statuses },
    removed: target.statuses.length - statuses.length,
  };
}

function applyDamage(target: BattleCombatant, amount: number): BattleCombatant {
  const currentHp = clamp(target.currentHp - amount, 0, target.maxHp);
  return { ...target, currentHp, isFainted: currentHp <= 0 };
}

function applyHealing(target: BattleCombatant, amount: number): BattleCombatant {
  if (target.isFainted) return target;
  return { ...target, currentHp: clamp(target.currentHp + amount, 0, target.maxHp) };
}

function applyBattleEnergy(target: BattleCombatant, amount: number): BattleCombatant {
  return {
    ...target,
    currentBattleEnergy: clamp(target.currentBattleEnergy + amount, 0, target.maxBattleEnergy),
  };
}

function getEffectTargets(
  state: BattleState,
  actor: BattleCombatant,
  actionTargetIds: readonly BattleCombatantId[],
  effect: BattleMoveEffect,
): BattleCombatant[] {
  if (effect.target === "self") {
    const selfTarget = state.combatants[actor.battleCombatantId];
    return selfTarget ? [selfTarget] : [];
  }
  if (effect.target === "allies") return getLivingCombatants(state, actor.sideId);
  if (effect.target === "enemies") return getLivingCombatants(state, getOpposingSide(actor.sideId));
  if (effect.target === "field") return [];
  return actionTargetIds
    .map((targetId) => state.combatants[targetId])
    .filter((target): target is BattleCombatant => Boolean(target) && !target.isFainted);
}

function isHostileEffect(
  actor: BattleCombatant,
  target: BattleCombatant,
  effect: BattleMoveEffect,
): boolean {
  if (actor.sideId === target.sideId) return false;
  return ["damage", "apply_status", "debuff_stat", "mark", "taunt"].includes(effect.type);
}

function getDamageModifier(
  attacker: BattleCombatant,
  defender: BattleCombatant,
  move: BattleMove,
): { modifier: number; notes: string[] } {
  let modifier = 1;
  const notes: string[] = [];
  const tagModifier = getBattleMoveTagModifier(attacker.speciesId, defender.speciesId, move);
  modifier *= tagModifier.modifier;
  notes.push(...tagModifier.notes);

  const guarded = defender.statuses.find((status) => status.status === "guarded" && status.duration > 0);
  if (guarded) {
    const guardPercent = clamp(guarded.amount ?? 25, 5, 65);
    modifier *= 1 - guardPercent / 100;
    notes.push(`Guarded reduces damage by ${guardPercent}%.`);
  }
  if (hasBattleStatus(defender, "marked")) {
    modifier *= 1.15;
    notes.push("Marked increases incoming damage by 15%.");
  }
  if (hasBattleStatus(defender, "exhausted") && move.tags.includes("pursuit")) {
    modifier *= 1.1;
    notes.push("Pursuit gains 10% against Exhausted targets.");
  }
  if (hasBattleStatus(defender, "slowed") && move.tags.includes("pursuit")) {
    modifier *= 1.1;
    notes.push("Pursuit gains 10% against Slowed targets.");
  }
  if (move.tags.includes("finisher") && defender.currentHp <= defender.maxHp * 0.35) {
    modifier *= 1.2;
    notes.push("Finisher gains 20% against a low-HP target.");
  }
  if (move.tags.includes("guard_break") && guarded) {
    modifier *= 1.25;
    notes.push("Guard Break gains 25% against Guarded targets.");
  }
  if (move.targetType === "all_enemies") {
    modifier *= 0.85;
    notes.push("Area damage uses a 0.85x spread modifier.");
  }

  return { modifier: Math.max(0.35, Math.min(1.85, modifier)), notes };
}

function replaceCombatant(state: BattleState, combatant: BattleCombatant): BattleState {
  return {
    ...state,
    combatants: { ...state.combatants, [combatant.battleCombatantId]: combatant },
  };
}

type ResolveEffectInput = {
  state: BattleState;
  actor: BattleCombatant;
  move: BattleMove;
  targetIds: readonly BattleCombatantId[];
  effect: BattleMoveEffect;
  effectIndex: number;
  actionSeed: string;
  hitTargetIds: ReadonlySet<BattleCombatantId>;
};

function resolveEffect(input: ResolveEffectInput): { state: BattleState; log: string[] } {
  let nextState = input.state;
  const log: string[] = [];
  const targets = getEffectTargets(nextState, input.actor, input.targetIds, input.effect);

  targets.forEach((target, targetIndex) => {
    const currentTarget = nextState.combatants[target.battleCombatantId];
    if (!currentTarget) return;
    const hostile = isHostileEffect(input.actor, currentTarget, input.effect);
    if (hostile && !input.hitTargetIds.has(currentTarget.battleCombatantId)) return;

    if (input.effect.chance !== undefined) {
      const chance = hostile
        ? calculateBattleSecondaryEffectChance(
            getEffectiveBattleStats(input.actor),
            getEffectiveBattleStats(currentTarget),
            input.effect.chance,
          )
        : clamp(input.effect.chance, 0, 100);
      if (!chanceSucceeds(chance, `${input.actionSeed}_effect_${input.effectIndex}_${currentTarget.battleCombatantId}_${targetIndex}`)) {
        log.push(`${currentTarget.name} resisted the secondary effect of ${input.move.name}.`);
        return;
      }
    }

    if (input.effect.type === "damage") {
      const damageModifier = getDamageModifier(input.actor, currentTarget, input.move);
      const preview = previewBattleDamage(
        getEffectiveBattleStats(input.actor),
        getEffectiveBattleStats(currentTarget),
        input.move,
        damageModifier.modifier,
      );
      let updatedTarget = applyDamage(currentTarget, preview.finalDamage);
      if (input.move.tags.includes("guard_break") && hasBattleStatus(currentTarget, "guarded")) {
        updatedTarget = cleanseBattleStatus(updatedTarget, "guarded").combatant;
      }
      nextState = replaceCombatant(nextState, updatedTarget);
      log.push(`${input.move.name} hits ${currentTarget.name} for ${preview.finalDamage} damage.`);
      damageModifier.notes.forEach((note) => log.push(note));
      if (input.move.tags.includes("guard_break") && hasBattleStatus(currentTarget, "guarded")) {
        log.push(`${currentTarget.name}'s Guarded status was broken.`);
      }
      if (updatedTarget.isFainted) log.push(`${currentTarget.name} fainted.`);
      return;
    }

    if (input.effect.type === "heal") {
      const preview = previewBattleHealing(
        getEffectiveBattleStats(input.actor),
        input.move,
        input.effect.amount ?? input.move.power,
      );
      const updatedTarget = applyHealing(currentTarget, preview.finalHealing);
      const restored = updatedTarget.currentHp - currentTarget.currentHp;
      nextState = replaceCombatant(nextState, updatedTarget);
      log.push(restored > 0
        ? `${currentTarget.name} recovers ${restored} HP.`
        : `${currentTarget.name} is already at full HP.`);
      return;
    }

    if (input.effect.type === "restore_battle_energy") {
      const amount = Math.max(1, input.effect.amount ?? 1);
      const updatedTarget = applyBattleEnergy(currentTarget, amount);
      const restored = updatedTarget.currentBattleEnergy - currentTarget.currentBattleEnergy;
      nextState = replaceCombatant(nextState, updatedTarget);
      log.push(restored > 0
        ? `${currentTarget.name} restores ${restored} Battle Energy.`
        : `${currentTarget.name}'s Battle Energy is already full.`);
      return;
    }

    if (
      input.effect.type === "apply_status" ||
      input.effect.type === "guard" ||
      input.effect.type === "mark" ||
      input.effect.type === "taunt"
    ) {
      const status = input.effect.status ?? (
        input.effect.type === "guard"
          ? "guarded"
          : input.effect.type === "mark"
            ? "marked"
            : input.effect.type === "taunt"
              ? "taunted"
              : undefined
      );
      if (!status) return;
      const applied = applyBattleStatusStack(currentTarget, {
        status,
        duration: Math.max(1, input.effect.duration ?? 1),
        amount: input.effect.amount,
        stat: input.effect.stat,
        sourceCombatantId: input.actor.battleCombatantId,
        maxStacks: input.effect.maxStacks,
      });
      nextState = replaceCombatant(nextState, applied.combatant);
      const stackLabel = (applied.status.stacks ?? 1) > 1 ? ` (${applied.status.stacks} stacks)` : "";
      log.push(`${currentTarget.name} is ${status}${stackLabel}; the effect was ${applied.mode}.`);
      return;
    }

    if (input.effect.type === "cleanse_status") {
      const cleansed = cleanseBattleStatus(currentTarget, input.effect.status);
      nextState = replaceCombatant(nextState, cleansed.combatant);
      if (input.effect.status && cleansed.removed > 0) {
        log.push(`${currentTarget.name} cleanses ${input.effect.status}.`);
      }
      return;
    }

    if (input.effect.type === "buff_stat" || input.effect.type === "debuff_stat") {
      const amount = input.effect.type === "buff_stat"
        ? Math.abs(input.effect.amount ?? 1)
        : -Math.abs(input.effect.amount ?? 1);
      const status: BattleStatusId = input.effect.type === "buff_stat" ? "inspired" : "weakened";
      const applied = applyBattleStatusStack(currentTarget, {
        status,
        duration: Math.max(1, input.effect.duration ?? 1),
        amount,
        stat: input.effect.stat,
        sourceCombatantId: input.actor.battleCombatantId,
        maxStacks: input.effect.maxStacks ?? 2,
      });
      nextState = replaceCombatant(nextState, applied.combatant);
      log.push(`${currentTarget.name} ${amount > 0 ? "gains" : "loses"} ${Math.abs(amount)} ${input.effect.stat ?? "power"} (${applied.mode}).`);
    }
  });

  return { state: nextState, log };
}

function spendMoveResources(combatant: BattleCombatant, move: BattleMove): BattleCombatant {
  const cooldowns: BattleCooldowns = { ...combatant.cooldowns };
  // Cooldown is stored one step high because every combatant ticks once at the
  // end of the same round. The next round therefore begins at the displayed
  // cooldown declared by the move definition.
  if (move.cooldown > 0) cooldowns[move.id] = move.cooldown + 1;
  return {
    ...combatant,
    currentBattleEnergy: clamp(
      combatant.currentBattleEnergy - move.battleEnergyCost,
      0,
      combatant.maxBattleEnergy,
    ),
    cooldowns,
  };
}

function hostileTargetsForMove(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  targetIds: readonly BattleCombatantId[],
): BattleCombatant[] {
  if (move.targetType !== "single_enemy" && move.targetType !== "all_enemies") return [];
  return targetIds
    .map((targetId) => state.combatants[targetId])
    .filter((target): target is BattleCombatant => Boolean(target) && !target.isFainted && target.sideId !== actor.sideId);
}

function resolveAction(
  state: BattleState,
  queued: NormalizedRoundAction,
  actionIndex: number,
): { state: BattleState; resolvedAction: BattleResolvedAction } {
  let nextState = state;
  const initialActor = nextState.combatants[queued.action.actorId];
  const initialMove = BATTLE_MOVES_BY_ID[queued.action.moveId] ?? getBattleMove(REQUIRED_BASIC_BATTLE_MOVE_ID);
  const actorName = initialActor?.name ?? "Unknown";
  const actionLog: string[] = [...queued.validationIssues];

  if (!initialActor || initialActor.isFainted) {
    actionLog.push(`${actorName} cannot act.`);
    return {
      state: nextState,
      resolvedAction: {
        actorId: queued.action.actorId,
        actorName,
        moveId: initialMove.id,
        moveName: initialMove.name,
        targetIds: queued.action.targetIds,
        targetNames: [],
        turnScore: 0,
        success: false,
        log: actionLog,
        usedFallback: queued.usedFallback,
        validationIssues: queued.validationIssues,
      },
    };
  }

  if (hasBattleStatus(initialActor, "stun")) {
    actionLog.push(`${initialActor.name} is stunned and cannot act.`);
    return {
      state: nextState,
      resolvedAction: {
        actorId: initialActor.battleCombatantId,
        actorName: initialActor.name,
        moveId: initialMove.id,
        moveName: initialMove.name,
        targetIds: queued.action.targetIds,
        targetNames: [],
        turnScore: getBattleTurnScore(getEffectiveBattleStats(initialActor), initialMove),
        success: false,
        log: actionLog,
        usedFallback: queued.usedFallback,
        validationIssues: queued.validationIssues,
      },
    };
  }

  let move = initialMove;
  let usedFallback = queued.usedFallback;
  if (!canUseBattleMove(initialActor, move.id)) {
    move = getFallbackMove(initialActor);
    usedFallback = true;
    actionLog.push(`${initialMove.name} became unavailable; ${move.name} was used instead.`);
  }

  const targetIds = normalizeTargetIds(nextState, initialActor, move, queued.action.targetIds);
  const targetNames = targetIds.map((targetId) => nextState.combatants[targetId]?.name ?? "Unknown");
  const actorAfterCost = spendMoveResources(initialActor, move);
  nextState = replaceCombatant(nextState, actorAfterCost);
  actionLog.push(`${initialActor.name} uses ${move.name}.`);

  const actionSeed = `${nextState.battleId}_${nextState.roundNumber}_${initialActor.battleCombatantId}_${move.id}_${actionIndex}`;
  const hitTargetIds = new Set<BattleCombatantId>();
  const missedTargetIds: BattleCombatantId[] = [];
  hostileTargetsForMove(nextState, actorAfterCost, move, targetIds).forEach((target) => {
    const chance = calculateBattleMoveHitChance(
      getEffectiveBattleStats(actorAfterCost),
      getEffectiveBattleStats(target),
      move,
    );
    if (chanceSucceeds(chance, `${actionSeed}_accuracy_${target.battleCombatantId}`)) {
      hitTargetIds.add(target.battleCombatantId);
    } else {
      missedTargetIds.push(target.battleCombatantId);
      actionLog.push(`${move.name} misses ${target.name} (${chance}% hit chance).`);
    }
  });

  // Friendly and self-targeted effects do not use hostile hit rolls.
  if (!hostileTargetsForMove(nextState, actorAfterCost, move, targetIds).length) {
    targetIds.forEach((targetId) => hitTargetIds.add(targetId));
  }

  move.effects.forEach((effect, effectIndex) => {
    const result = resolveEffect({
      state: nextState,
      actor: actorAfterCost,
      move,
      targetIds,
      effect,
      effectIndex,
      actionSeed,
      hitTargetIds,
    });
    nextState = result.state;
    actionLog.push(...result.log);
  });

  return {
    state: nextState,
    resolvedAction: {
      actorId: initialActor.battleCombatantId,
      actorName: initialActor.name,
      moveId: move.id,
      moveName: move.name,
      targetIds,
      targetNames,
      turnScore: getBattleTurnScore(getEffectiveBattleStats(initialActor), move),
      success: true,
      log: actionLog,
      usedFallback,
      validationIssues: queued.validationIssues,
      hitTargetIds: Array.from(hitTargetIds),
      missedTargetIds,
    },
  };
}

export function tickBattleCooldowns(cooldowns: BattleCooldowns): BattleCooldowns {
  return Object.entries(cooldowns).reduce((nextCooldowns, [moveId, value]) => {
    const nextValue = Math.max(0, (value ?? 0) - 1);
    if (nextValue > 0) nextCooldowns[moveId] = nextValue;
    return nextCooldowns;
  }, {} as BattleCooldowns);
}

export function advanceBattleCombatantEndOfRound(
  combatant: BattleCombatant,
): { combatant: BattleCombatant; log: string[]; energyRecovered: number } {
  let nextCombatant = cloneCombatant(combatant);
  const log: string[] = [];
  const statusesBeforeTick = nextCombatant.statuses.map((status) => ({ ...status }));

  statusesBeforeTick.forEach((statusStack) => {
    if (statusStack.status !== "bleed" || nextCombatant.isFainted) return;
    const stacks = getStatusStacks(statusStack);
    const bleedDamage = Math.max(1, statusStack.amount ?? 5) * stacks;
    nextCombatant = applyDamage(nextCombatant, bleedDamage);
    log.push(`${nextCombatant.name} takes ${bleedDamage} bleed damage${stacks > 1 ? ` from ${stacks} stacks` : ""}.`);
    if (nextCombatant.isFainted) log.push(`${nextCombatant.name} fainted.`);
  });

  nextCombatant = {
    ...nextCombatant,
    cooldowns: tickBattleCooldowns(nextCombatant.cooldowns),
    statuses: nextCombatant.statuses
      .map((statusStack) => ({ ...statusStack, duration: statusStack.duration - 1 }))
      .filter((statusStack) => statusStack.duration > 0),
  };

  const requestedRegen = calculateBattleRoundEnergyRegen(
    nextCombatant.maxBattleEnergy,
    statusesBeforeTick,
    nextCombatant.isFainted,
  );
  const beforeEnergy = nextCombatant.currentBattleEnergy;
  nextCombatant = applyBattleEnergy(nextCombatant, requestedRegen);
  const energyRecovered = nextCombatant.currentBattleEnergy - beforeEnergy;
  if (energyRecovered > 0) {
    log.push(`${nextCombatant.name} regenerates ${energyRecovered} Battle Energy.`);
  }

  return { combatant: nextCombatant, log, energyRecovered };
}

function tickEndOfRound(state: BattleState): { state: BattleState; log: string[] } {
  let nextState = state;
  const log: string[] = [];
  Object.values(nextState.combatants)
    .sort((left, right) => left.sideId.localeCompare(right.sideId) || left.slotIndex - right.slotIndex)
    .forEach((combatant) => {
      const result = advanceBattleCombatantEndOfRound(combatant);
      nextState = replaceCombatant(nextState, result.combatant);
      log.push(...result.log);
    });
  return { state: nextState, log };
}

function buildActionQueue(
  state: BattleState,
  requestedActions: readonly BattleAction[],
): NormalizedRoundAction[] {
  const requestedByActor = new Map<BattleCombatantId, BattleAction>();
  requestedActions.forEach((action) => {
    if (!requestedByActor.has(action.actorId)) requestedByActor.set(action.actorId, action);
  });

  return getLivingCombatants(state)
    .map((actor) => normalizeRequestedAction(state, actor, requestedByActor.get(actor.battleCombatantId)))
    .sort((left, right) => {
      const leftActor = state.combatants[left.action.actorId];
      const rightActor = state.combatants[right.action.actorId];
      const leftMove = getBattleMove(left.action.moveId);
      const rightMove = getBattleMove(right.action.moveId);
      const leftScore = leftActor ? getBattleTurnScore(getEffectiveBattleStats(leftActor), leftMove) : 0;
      const rightScore = rightActor ? getBattleTurnScore(getEffectiveBattleStats(rightActor), rightMove) : 0;
      if (rightScore !== leftScore) return rightScore - leftScore;
      const leftTie = deterministicBattleRoll(`${state.battleId}_${state.roundNumber}_${left.action.actorId}_initiative`, 100000);
      const rightTie = deterministicBattleRoll(`${state.battleId}_${state.roundNumber}_${right.action.actorId}_initiative`, 100000);
      if (rightTie !== leftTie) return rightTie - leftTie;
      return left.action.actorId.localeCompare(right.action.actorId);
    });
}

export function resolveBattleRound(
  state: BattleState,
  requestedActions: BattleAction[] = [],
): { state: BattleState; result: BattleRoundResult } {
  const currentOutcome = core.getBattleOutcome(state);
  if (state.outcome !== "ongoing" || currentOutcome !== "ongoing") {
    const outcome = state.outcome !== "ongoing" ? state.outcome : currentOutcome;
    return {
      state: { ...state, outcome },
      result: {
        roundNumber: state.roundNumber,
        actions: [],
        log: ["The battle is already complete."],
        outcome,
      },
    };
  }

  let nextState = cloneBattleState(state);
  const roundNumber = nextState.roundNumber;
  const actionQueue = buildActionQueue(nextState, requestedActions);
  const resolvedActions: BattleResolvedAction[] = [];
  const roundLog: string[] = [`Round ${roundNumber} begins.`];

  actionQueue.forEach((queued, actionIndex) => {
    if (core.getBattleOutcome(nextState) !== "ongoing") return;
    const result = resolveAction(nextState, queued, actionIndex);
    nextState = result.state;
    resolvedActions.push(result.resolvedAction);
    roundLog.push(...result.resolvedAction.log);
  });

  if (core.getBattleOutcome(nextState) === "ongoing") {
    const endOfRound = tickEndOfRound(nextState);
    nextState = endOfRound.state;
    roundLog.push(...endOfRound.log);
  }

  const outcome = core.getBattleOutcome(nextState);
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
