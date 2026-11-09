import * as core from "./battleEngine";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import { appendBattleLog, getBattleLogEntryText, type BattleLogEntry } from "@/data/battleLog";
import { BATTLE_MOVES_BY_ID, getBattleMove } from "@/data/battleMoves";
import {
  calculateBattleMoveHitChance,
  calculateBattleRoundEnergyRegen,
  calculateBattleSecondaryEffectChance,
  getBattleMoveHitChanceBreakdown,
  getBattleMoveTagModifier,
  getBattleStatusStackLimit,
  type BattleDamageModifierFactor,
} from "@/data/battleRoundRules";
import {
  getBattleTurnScore,
  previewBattleDamage,
  previewBattleHealing,
} from "@/data/battleStats";
import { REQUIRED_BASIC_BATTLE_MOVE_ID } from "@/data/battleLoadouts";
import type {
  BattleAction,
  BattlePlaybackFrame,
  BattleActionValidationIssue,
  BattleActionValidationResult,
  BattleCombatant,
  BattleCombatantId,
  BattleCooldowns,
  BattleDamageBreakdown,
  BattleDamagePreview,
  BattleHitChanceBreakdown,
  BattleMove,
  BattleMoveEffect,
  BattleMoveId,
  BattleMoveLogGroup,
  BattleMoveLogStatus,
  BattleMoveLogTarget,
  BattleResolvedAction,
  BattleRoundEndEffect,
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

export function getBattleBleedDamage(status: BattleStatusStack): number {
  return Math.max(1, status.amount ?? 5) * getStatusStacks(status);
}

export function getBattleSlowedPenalties(status: BattleStatusStack): { speed: number; evasion: number } {
  const speed = (Math.abs(status.amount ?? 0) || 6) * getStatusStacks(status);
  return { speed, evasion: Math.ceil(speed / 2) };
}

export function hasBattleStatus(combatant: BattleCombatant, status: BattleStatusId): boolean {
  return combatant.statuses.some((entry) => entry.status === status && entry.duration > 0);
}

export type BattleGuardedStatus = {
  damageReductionPercent: number;
  duration: number;
};

export function getBattleGuardedStatus(combatant: BattleCombatant): BattleGuardedStatus | null {
  const guarded = combatant.statuses.find((status) => status.status === "guarded" && status.duration > 0);
  if (!guarded) return null;
  return {
    damageReductionPercent: clamp(guarded.amount ?? 25, 5, 65),
    duration: guarded.duration,
  };
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
      const { speed, evasion } = getBattleSlowedPenalties(statusStack);
      nextStats.speed -= speed;
      nextStats.evasion -= evasion;
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

export function getDamageModifier(
  attacker: BattleCombatant,
  defender: BattleCombatant,
  move: BattleMove,
): { modifier: number; notes: string[]; factors: BattleDamageModifierFactor[] } {
  const tagModifier = getBattleMoveTagModifier(attacker.speciesId, defender.speciesId, move);
  let modifier = tagModifier.modifier;
  const notes = [...tagModifier.notes];
  const factors = [...tagModifier.factors];

  function multiply(kind: BattleDamageModifierFactor["kind"], label: string, factor: number, note: string) {
    const factorBefore = modifier;
    modifier *= factor;
    factors.push({ kind, label, operation: "multiply", percent: Math.round((factor - 1) * 100), factorBefore, factorAfter: modifier });
    notes.push(note);
  }

  const guarded = getBattleGuardedStatus(defender);
  if (guarded) {
    const guardPercent = guarded.damageReductionPercent;
    multiply("guarded", "Guarded", 1 - guardPercent / 100, `Guarded reduces damage by ${guardPercent}%.`);
  }
  if (hasBattleStatus(defender, "marked")) {
    multiply("marked", "Marked", 1.15, "Marked increases incoming damage by 15%.");
  }
  if (hasBattleStatus(defender, "exhausted") && move.tags.includes("pursuit")) {
    multiply("pursuit-exhausted", "Pursuit vs. Exhausted", 1.1, "Pursuit gains 10% against Exhausted targets.");
  }
  if (hasBattleStatus(defender, "slowed") && move.tags.includes("pursuit")) {
    multiply("pursuit-slowed", "Pursuit vs. Slowed", 1.1, "Pursuit gains 10% against Slowed targets.");
  }
  if (move.tags.includes("finisher") && defender.currentHp <= defender.maxHp * 0.35) {
    multiply("finisher", "Finisher", 1.2, "Finisher gains 20% against a low-HP target.");
  }
  if (move.tags.includes("guard_break") && guarded) {
    multiply("guard-break", "Guard Break", 1.25, "Guard Break gains 25% against Guarded targets.");
  }
  if (move.targetType === "all_enemies") {
    multiply("spread", "Area spread", 0.85, "Area damage uses a 0.85x spread modifier.");
  }

  const cappedModifier = Math.max(0.35, Math.min(1.85, modifier));
  if (cappedModifier !== modifier) {
    factors.push({ kind: "cap", label: "Damage modifier cap", operation: "limit", factorBefore: modifier, factorAfter: cappedModifier });
  }
  return { modifier: cappedModifier, notes, factors };
}

function replaceCombatant(state: BattleState, combatant: BattleCombatant): BattleState {
  return {
    ...state,
    combatants: { ...state.combatants, [combatant.battleCombatantId]: combatant },
  };
}

type AppliedBattleStatus = Pick<BattleStatusApplicationResult, "mode" | "status">;
type ResolvedDamage = BattleDamagePreview & { factors: BattleDamageModifierFactor[] };

type MoveLogEffect = Pick<
  BattleMoveLogTarget,
  "hpDelta" | "battleEnergyDelta" | "hpWasFull" | "battleEnergyWasFull" | "knockedOut"
> & { status?: BattleMoveLogStatus };

type ResolveEffectInput = {
  state: BattleState;
  actor: BattleCombatant;
  move: BattleMove;
  targetIds: readonly BattleCombatantId[];
  effect: BattleMoveEffect;
  effectIndex: number;
  actionSeed: string;
  hitTargetIds: ReadonlySet<BattleCombatantId>;
  includeNoopCleanses?: boolean;
  onFrame?: (frame: BattlePlaybackFrame, appliedStatus?: AppliedBattleStatus, damage?: ResolvedDamage) => void;
  onLogEffect?: (target: BattleCombatant, effect: MoveLogEffect, start: number, end: number) => void;
};

function resolveEffect(input: ResolveEffectInput): { state: BattleState; log: BattleLogEntry[] } {
  let nextState = input.state;
  const log: BattleLogEntry[] = [];
  const targets = getEffectTargets(nextState, input.actor, input.targetIds, input.effect);

  targets.forEach((target, targetIndex) => {
    const currentTarget = nextState.combatants[target.battleCombatantId];
    if (!currentTarget) return;
    const hostile = isHostileEffect(input.actor, currentTarget, input.effect);
    if (hostile && !input.hitTargetIds.has(currentTarget.battleCombatantId)) return;

    const before = nextState;
    const logStart = log.length;
    let appliedStatus: AppliedBattleStatus | undefined;
    let clearedStatus: BattleStatusId | undefined;
    let brokeGuard = false;
    let damage: ResolvedDamage | undefined;
    try {
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
      damage = { ...preview, factors: damageModifier.factors };
      let updatedTarget = applyDamage(currentTarget, preview.finalDamage);
      brokeGuard = input.move.tags.includes("guard_break") && hasBattleStatus(currentTarget, "guarded");
      if (brokeGuard) {
        updatedTarget = cleanseBattleStatus(updatedTarget, "guarded").combatant;
      }
      nextState = replaceCombatant(nextState, updatedTarget);
      log.push(`${input.move.name} hits ${currentTarget.name} for ${preview.finalDamage} damage.`);
      damageModifier.notes.forEach((note) => log.push(note));
      if (brokeGuard) {
        log.push({ text: `${currentTarget.name}'s Guarded status was broken.`, category: "status-changes" });
      }
      if (updatedTarget.isFainted && !currentTarget.isFainted) {
        log.push({ text: `${currentTarget.name} fainted.`, category: "knockouts" });
      }
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
      appliedStatus = applied;
      nextState = replaceCombatant(nextState, applied.combatant);
      const stackLabel = (applied.status.stacks ?? 1) > 1 ? ` (${applied.status.stacks} stacks)` : "";
      log.push({
        text: `${currentTarget.name} is ${status}${stackLabel}; the effect was ${applied.mode}.`,
        category: "status-changes",
      });
      return;
    }

    if (input.effect.type === "cleanse_status") {
      const cleansed = cleanseBattleStatus(currentTarget, input.effect.status);
      if (cleansed.removed === 0 && !input.includeNoopCleanses) return;
      nextState = replaceCombatant(nextState, cleansed.combatant);
      if (input.effect.status && cleansed.removed > 0) {
        clearedStatus = input.effect.status;
        log.push({ text: `${currentTarget.name} cleanses ${clearedStatus}.`, category: "status-changes" });
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
      appliedStatus = applied;
      nextState = replaceCombatant(nextState, applied.combatant);
      log.push({
        text: `${currentTarget.name} ${amount > 0 ? "gains" : "loses"} ${Math.abs(amount)} ${input.effect.stat ?? "power"} (${applied.mode}).`,
        category: "status-changes",
      });
    }
    } finally {
      const after = nextState.combatants[currentTarget.battleCombatantId];
      const hp = after.currentHp - currentTarget.currentHp;
      const energy = after.currentBattleEnergy - currentTarget.currentBattleEnergy;
      if (nextState !== before || log.length > logStart) {
        const { effect } = input;
        const knockedOut = after.isFainted && !currentTarget.isFainted;
        if (input.onLogEffect) {
          let status: BattleMoveLogStatus | undefined;
          if (appliedStatus) {
            const { status: stack, mode } = appliedStatus;
            status = {
              status: stack.status,
              result: mode,
              duration: stack.duration,
              stacks: stack.stacks,
              stat: stack.stat,
              amount: stack.amount,
            };
          } else if (clearedStatus || brokeGuard) {
            status = { status: clearedStatus ?? "guarded", result: "cleared" };
          } else if (nextState === before && effect.status) {
            status = {
              status: effect.status,
              result: "failed",
              ...(effect.type === "cleanse_status" ? { attemptedClear: true } : {}),
            };
          }
          input.onLogEffect(currentTarget, {
            hpDelta: hp,
            battleEnergyDelta: energy,
            hpWasFull: effect.type === "heal" && hp === 0 && nextState !== before ? true : undefined,
            battleEnergyWasFull: effect.type === "restore_battle_energy" && energy === 0 && nextState !== before
              ? true
              : undefined,
            knockedOut,
            status,
          }, logStart, log.length);
        }
        const kind = hp < 0 ? "damage" : hp > 0 ? "heal" : energy !== 0 ? "energy" : "status";
        const guardImpact = kind === "damage" && hasBattleStatus(currentTarget, "guarded")
          ? (brokeGuard ? "broken" : "held")
          : undefined;
        const effectLabel = (effect.status ?? effect.stat ?? effect.type).replaceAll("_", " ");
        let label = effect.duration ? `${effectLabel} · ${effect.duration}r` : effectLabel;
        if (hp !== 0) label = `${hp > 0 ? "+" : ""}${hp} HP`;
        else if (energy !== 0) label = `${energy > 0 ? "+" : ""}${energy} BE`;
        else if (clearedStatus) label = `${effectLabel} cleared`;
        else if (nextState === before) label = "Resisted";
        else if (effect.type === "heal") label = "Full HP";
        input.onFrame?.({
          state: nextState,
          actorId: input.actor.battleCombatantId,
          targetIds: [currentTarget.battleCombatantId],
          moveId: input.move.id,
          kind,
          label,
          ...(guardImpact ? { guardImpact } : {}),
          statusOutcome: appliedStatus
            ? { status: appliedStatus.status.status, result: appliedStatus.mode }
            : clearedStatus
              ? { status: clearedStatus, result: "cleared" }
              : nextState === before && effect.type === "apply_status" && effect.status
                ? { status: effect.status, result: "failed" }
                : undefined,
        }, appliedStatus, damage);
        if(knockedOut) input.onFrame?.({state:nextState,actorId:input.actor.battleCombatantId,targetIds:[after.battleCombatantId],moveId:input.move.id,kind:"knockout",label:"K.O."});
      }
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

type MoveLogTargetDraft = Omit<BattleMoveLogTarget, "statuses" | "logIndexes"> & {
  statuses: BattleMoveLogStatus[];
  logIndexes: number[];
};

function resolveAction(
  state: BattleState,
  queued: NormalizedRoundAction,
  actionIndex: number,
  logOffset: number,
  onFrame?: (frame: BattlePlaybackFrame) => void,
): { state: BattleState; resolvedAction: BattleResolvedAction; entries: BattleLogEntry[]; moveLog?: BattleMoveLogGroup } {
  let nextState = state;
  const initialActor = nextState.combatants[queued.action.actorId];
  const initialMove = BATTLE_MOVES_BY_ID[queued.action.moveId] ?? getBattleMove(REQUIRED_BASIC_BATTLE_MOVE_ID);
  const actorName = initialActor?.name ?? "Unknown";
  const actionLog: BattleLogEntry[] = [...queued.validationIssues];

  if (!initialActor || initialActor.isFainted) {
    actionLog.push(`${actorName} cannot act.`);
    return {
      state: nextState,
      entries: actionLog,
      resolvedAction: {
        actorId: queued.action.actorId,
        actorName,
        moveId: initialMove.id,
        moveName: initialMove.name,
        targetIds: queued.action.targetIds,
        targetNames: [],
        turnScore: 0,
        success: false,
        log: actionLog.map(getBattleLogEntryText),
        usedFallback: queued.usedFallback,
        validationIssues: queued.validationIssues,
      },
    };
  }

  if (hasBattleStatus(initialActor, "stun")) {
    actionLog.push(`${initialActor.name} is stunned and cannot act.`);
    return {
      state: nextState,
      entries: actionLog,
      resolvedAction: {
        actorId: initialActor.battleCombatantId,
        actorName: initialActor.name,
        moveId: initialMove.id,
        moveName: initialMove.name,
        targetIds: queued.action.targetIds,
        targetNames: [],
        turnScore: getBattleTurnScore(getEffectiveBattleStats(initialActor), initialMove),
        success: false,
        skipReason: "stun",
        log: actionLog.map(getBattleLogEntryText),
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
  const moveLogIndex = logOffset + actionLog.length;
  actionLog.push(`${initialActor.name} uses ${move.name}.`);
  onFrame?.({state:nextState,actorId:initialActor.battleCombatantId,targetIds,moveId:move.id,kind:"attack",label:move.name});

  const logTargets = new Map<BattleCombatantId, MoveLogTargetDraft>();
  function getLogTarget(target: BattleCombatant): MoveLogTargetDraft {
    const { battleCombatantId: targetId, name: targetName } = target;
    let result = logTargets.get(targetId);
    if (!result) {
      result = { targetId, targetName, hpDelta: 0, battleEnergyDelta: 0, knockedOut: false, statuses: [], logIndexes: [] };
      logTargets.set(targetId, result);
    }
    return result;
  }
  targetIds.forEach(targetId => getLogTarget(state.combatants[targetId]));

  const actionSeed = `${nextState.battleId}_${nextState.roundNumber}_${initialActor.battleCombatantId}_${move.id}_${actionIndex}`;
  const hitTargetIds = new Set<BattleCombatantId>();
  const missedTargetIds: BattleCombatantId[] = [];
  const hostileTargets = hostileTargetsForMove(nextState, actorAfterCost, move, targetIds);
  hostileTargets.forEach((target) => {
    const chance = calculateBattleMoveHitChance(
      getEffectiveBattleStats(actorAfterCost),
      getEffectiveBattleStats(target),
      move,
    );
    const logTarget = getLogTarget(target);
    logTarget.hit = chanceSucceeds(chance, `${actionSeed}_accuracy_${target.battleCombatantId}`);
    if (logTarget.hit) {
      hitTargetIds.add(target.battleCombatantId);
    } else {
      missedTargetIds.push(target.battleCombatantId);
      onFrame?.({state:nextState,actorId:initialActor.battleCombatantId,targetIds:[target.battleCombatantId],moveId:move.id,kind:"miss",label:"Miss"});
      logTarget.logIndexes.push(logOffset + actionLog.length);
      actionLog.push(`${move.name} misses ${target.name} (${chance}% hit chance).`);
    }
  });

  // Friendly and self-targeted effects do not use hostile hit rolls.
  if (!hostileTargets.length) {
    targetIds.forEach((targetId) => hitTargetIds.add(targetId));
  }

  move.effects.forEach((effect, effectIndex) => {
    const effectLogOffset = logOffset + actionLog.length;
    const result = resolveEffect({
      state: nextState,
      actor: actorAfterCost,
      move,
      targetIds,
      effect,
      effectIndex,
      actionSeed,
      hitTargetIds,
      onFrame,
      onLogEffect: (target, result, start, end) => {
        const entry = getLogTarget(target);
        entry.hpDelta += result.hpDelta;
        entry.battleEnergyDelta += result.battleEnergyDelta;
        if (result.hpWasFull) entry.hpWasFull = true;
        if (result.battleEnergyWasFull) entry.battleEnergyWasFull = true;
        if (result.knockedOut) entry.knockedOut = true;
        if (result.status) entry.statuses.push(result.status);
        for (let index = start; index < end; index += 1) {
          entry.logIndexes.push(effectLogOffset + index);
        }
      },
    });
    nextState = result.state;
    actionLog.push(...result.log);
  });

  return {
    state: nextState,
    entries: actionLog,
    moveLog: {
      logIndex: moveLogIndex,
      endLogIndex: logOffset + actionLog.length,
      roundNumber: state.roundNumber,
      actorId: initialActor.battleCombatantId,
      actorName: initialActor.name,
      moveId: move.id,
      moveName: move.name,
      targets: [...logTargets.values()],
    },
    resolvedAction: {
      actorId: initialActor.battleCombatantId,
      actorName: initialActor.name,
      moveId: move.id,
      moveName: move.name,
      targetIds,
      targetNames,
      turnScore: getBattleTurnScore(getEffectiveBattleStats(initialActor), move),
      success: true,
      log: actionLog.map(getBattleLogEntryText),
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

type BattleRoundEndCallback = (
  combatant: BattleCombatant,
  kind: BattlePlaybackFrame["kind"],
  label: string,
  roundEndEffect?: BattleRoundEndEffect,
) => void;

function tickBattleCombatant(
  combatant: BattleCombatant,
  onChange?: BattleRoundEndCallback,
): { combatant: BattleCombatant; entries: BattleLogEntry[]; energyRecovered: number } {
  let nextCombatant = cloneCombatant(combatant);
  const entries: BattleLogEntry[] = [];
  const statusesBeforeTick = nextCombatant.statuses.map((status) => ({ ...status }));

  statusesBeforeTick.forEach((statusStack) => {
    if (statusStack.status !== "bleed" || nextCombatant.isFainted) return;
    const stacks = getStatusStacks(statusStack);
    const bleedDamage = getBattleBleedDamage(statusStack);
    const hpBefore = nextCombatant.currentHp;
    nextCombatant = applyDamage(nextCombatant, bleedDamage);
    const hpLost = hpBefore - nextCombatant.currentHp;
    if (hpLost > 0) {
      onChange?.(nextCombatant, "damage", `−${hpLost} HP · Bleed`, { kind: "bleed", stacks, hpLost });
    }
    if (nextCombatant.isFainted) onChange?.(nextCombatant, "knockout", "K.O.");
    entries.push(`${nextCombatant.name} takes ${bleedDamage} bleed damage${stacks > 1 ? ` from ${stacks} stacks` : ""}.`);
    if (nextCombatant.isFainted) {
      entries.push({ text: `${nextCombatant.name} fainted.`, category: "knockouts" });
    }
  });

  nextCombatant = {
    ...nextCombatant,
    cooldowns: tickBattleCooldowns(nextCombatant.cooldowns),
    statuses: nextCombatant.statuses
      .map((statusStack) => ({ ...statusStack, duration: statusStack.duration - 1 }))
      .filter((statusStack) => statusStack.duration > 0),
  };

  const remainingStatuses = new Set(nextCombatant.statuses.map(statusStack => statusStack.status));
  const expiredStatuses = [...new Set(statusesBeforeTick
    .filter(statusStack => statusStack.duration > 0 && !remainingStatuses.has(statusStack.status))
    .map(statusStack => statusStack.status))];
  if (expiredStatuses.length > 0) {
    onChange?.(nextCombatant, "status", `${expiredStatuses.join(", ")} expired`, {
      kind: "expiry",
      statuses: expiredStatuses,
    });
    const labels = expiredStatuses.map(status => getBattleStatusGlossary(status).label);
    entries.push({ text: `${nextCombatant.name}: ${labels.join(", ")} expired.`, category: "status-changes" });
  }
  const requestedRegen = calculateBattleRoundEnergyRegen(
    nextCombatant.maxBattleEnergy,
    statusesBeforeTick,
    nextCombatant.isFainted,
  );
  const beforeEnergy = nextCombatant.currentBattleEnergy;
  nextCombatant = applyBattleEnergy(nextCombatant, requestedRegen);
  const energyRecovered = nextCombatant.currentBattleEnergy - beforeEnergy;
  if (energyRecovered > 0) {
    onChange?.(nextCombatant, "energy", `+${energyRecovered} BE · Recovery`, {
      kind: "energy",
      before: beforeEnergy,
      after: nextCombatant.currentBattleEnergy,
    });
    entries.push(`${nextCombatant.name} regenerates ${energyRecovered} Battle Energy.`);
  }

  return { combatant: nextCombatant, entries, energyRecovered };
}

export function advanceBattleCombatantEndOfRound(combatant: BattleCombatant, onChange?: BattleRoundEndCallback) {
  const { combatant: updated, entries, energyRecovered } = tickBattleCombatant(combatant, onChange);
  return { combatant: updated, log: entries.map(getBattleLogEntryText), energyRecovered };
}

function tickEndOfRound(state: BattleState, onFrame?: (frame: BattlePlaybackFrame) => void): { state: BattleState; entries: BattleLogEntry[] } {
  let nextState = state;
  const entries: BattleLogEntry[] = [];
  Object.values(nextState.combatants)
    .sort((left, right) => left.sideId.localeCompare(right.sideId) || left.slotIndex - right.slotIndex)
    .forEach((combatant) => {
      const result = tickBattleCombatant(combatant, (updated, kind, label, roundEndEffect) => {
        nextState = replaceCombatant(nextState, updated);
        onFrame?.({ state: nextState, targetIds: [updated.battleCombatantId], kind, label, roundEndEffect });
      });
      nextState = replaceCombatant(nextState, result.combatant);
      entries.push(...result.entries);
    });
  return { state: nextState, entries };
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
): { state: BattleState; result: BattleRoundResult; frames: BattlePlaybackFrame[] } {
  const currentOutcome = core.getBattleOutcome(state);
  if (state.outcome !== "ongoing" || currentOutcome !== "ongoing") {
    const outcome = state.outcome !== "ongoing" ? state.outcome : currentOutcome;
    return {
      state: { ...state, outcome },
      frames: [],
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
  const moveLog: BattleMoveLogGroup[] = [];
  const frames: BattlePlaybackFrame[] = [];
  const onFrame = (frame: BattlePlaybackFrame) => frames.push(frame);
  const roundLog: BattleLogEntry[] = [`Round ${roundNumber} begins.`];

  actionQueue.forEach((queued, actionIndex) => {
    if (core.getBattleOutcome(nextState) !== "ongoing") return;
    const result = resolveAction(nextState, queued, actionIndex, state.log.length + roundLog.length, onFrame);
    if (!result.resolvedAction.success) {
      onFrame({
        state: result.state,
        actorId: queued.action.actorId,
        targetIds: [queued.action.actorId],
        moveId: result.resolvedAction.moveId,
        kind: "status",
        skipReason: result.resolvedAction.skipReason,
        label: result.resolvedAction.log.at(-1) ?? "Cannot act",
      });
    }
    nextState = result.state;
    resolvedActions.push(result.resolvedAction);
    if (result.moveLog) moveLog.push(result.moveLog);
    roundLog.push(...result.entries);
  });

  if (core.getBattleOutcome(nextState) === "ongoing") {
    const endOfRound = tickEndOfRound(nextState, onFrame);
    nextState = endOfRound.state;
    roundLog.push(...endOfRound.entries);
  }

  const outcome = core.getBattleOutcome(nextState);
  if (outcome !== "ongoing") roundLog.push(`Battle ends: ${outcome}.`);
  nextState = {
    ...appendBattleLog(nextState, roundLog),
    ...(moveLog.length ? { moveLog: [...(state.moveLog ?? []), ...moveLog] } : {}),
    roundNumber: roundNumber + 1,
    outcome,
  };

  return {
    state: nextState,
    frames,
    result: {
      roundNumber,
      actions: resolvedActions,
      log: roundLog.map(getBattleLogEntryText),
      outcome,
    },
  };
}

/** Resolve one initiative slot, applying round recovery only after the last living actor. */
export function resolveBattleTurn(
  state: BattleState,
  remaining: readonly BattleCombatantId[],
  requested?: BattleAction,
) {
  const actor = remaining[0] ? state.combatants[remaining[0]] : undefined;
  if (!actor || actor.isFainted || state.outcome !== "ongoing") return null;
  const frames: BattlePlaybackFrame[] = [];
  const onFrame = (frame: BattlePlaybackFrame) => frames.push(frame);
  const turn = resolveAction(
    cloneBattleState(state),
    normalizeRequestedAction(state, actor, requested),
    Object.keys(state.combatants).length - remaining.length,
    state.log.length,
    onFrame,
  );
  if (!turn.resolvedAction.success) {
    onFrame({
      state: turn.state,
      actorId: actor.battleCombatantId,
      targetIds: [actor.battleCombatantId],
      kind: "status",
      skipReason: turn.resolvedAction.skipReason,
      label: turn.resolvedAction.log.at(-1) ?? "Cannot act",
    });
  }
  const nextActors = remaining.slice(1).filter(id => !turn.state.combatants[id].isFainted);
  const roundEnded = !nextActors.length || core.getBattleOutcome(turn.state) !== "ongoing";
  const recovery = roundEnded && core.getBattleOutcome(turn.state) === "ongoing"
    ? tickEndOfRound(turn.state, onFrame) : { state: turn.state, entries: [] };
  const outcome = core.getBattleOutcome(recovery.state);
  const entries = [...turn.entries, ...recovery.entries];
  if (outcome !== "ongoing") entries.push(`Battle ends: ${outcome}.`);
  const log = entries.map(getBattleLogEntryText);
  const result: BattleRoundResult = { roundNumber: state.roundNumber, actions: [turn.resolvedAction], log, outcome };
  return {
    state: {
      ...appendBattleLog(recovery.state, entries),
      ...(turn.moveLog ? { moveLog: [...(state.moveLog ?? []), turn.moveLog] } : {}),
      outcome,
      roundNumber: state.roundNumber + Number(roundEnded),
    },
    remaining: roundEnded ? [] : nextActors,
    result,
    frames,
  };
}

export type BattleStatusApplicationPreview = {
  stack: BattleStatusStack;
  mode: BattleStatusApplicationResult["mode"];
  requiresHit: boolean;
  hitChance: number;
  /** Chance of applying the effect after any required hit. */
  effectChance: number;
};

export type BattleActionEffectPreview = {
  targetId: BattleCombatantId;
  name: string;
  effectType: BattleMoveEffect["type"];
  hitChance: number;
  /** Whether the target must be hit before this effect can resolve. */
  requiresHit: boolean;
  effectChance: number;
  description: string;
  hpAfter: number;
  battleEnergyAfter: number;
  guardedAfter: BattleGuardedStatus | null;
  /** The move's accuracy roll for this target, separate from any secondary effect chance. */
  hitBreakdown?: BattleHitChanceBreakdown;
  /** Actual damage calculation for this effect if it hits. */
  damageBreakdown?: BattleDamageBreakdown;
  /** A status applied by this effect that remains on a living target after the move. */
  statusApplication?: BattleStatusApplicationPreview;
  /** Status IDs this cleanse removes if it applies. Empty when none are removed. */
  cleansedStatuses?: BattleStatusId[];
};

function getDamageBreakdown(damage: ResolvedDamage, hpLost: number): BattleDamageBreakdown {
  const { finalDamage, modifierTotal } = damage;
  const baseDamage = finalDamage > 0 ? damage.baseDamage : 0;
  const roundedDamage = (factor: number) => Math.round(baseDamage * factor);
  const modifiers: BattleDamageBreakdown["modifiers"] = damage.factors.map(({ factorBefore, factorAfter, ...step }) => ({
    ...step,
    damageBefore: roundedDamage(factorBefore),
    damageAfter: roundedDamage(factorAfter),
  }));
  const roundedTotal = roundedDamage(modifierTotal);
  if (finalDamage > roundedTotal) {
    modifiers.push({ kind: "minimum", label: "Minimum damage", operation: "limit", damageBefore: roundedTotal, damageAfter: finalDamage });
  }
  return { baseDamage, modifiers, modifierTotal, finalDamage, hpLost };
}

/** Estimates assuming effects hit and apply. The last row per target reflects its final state. */
export function previewBattleAction(state: BattleState, action: BattleAction): BattleActionEffectPreview[] {
  const actor = state.combatants[action.actorId];
  if (!actor) return [];
  const move = getBattleMove(action.moveId);
  const ids = normalizeTargetIds(state, actor, move, action.targetIds);
  const paidActor = spendMoveResources(actor, move);
  let projected = replaceCombatant(state, paidActor);
  const entries: BattleActionEffectPreview[] = [];
  const actorStats = getEffectiveBattleStats(paidActor);
  const hostileHitBreakdowns = new Map(hostileTargetsForMove(projected, paidActor, move, ids).map(target => [
    target.battleCombatantId,
    getBattleMoveHitChanceBreakdown(actorStats, getEffectiveBattleStats(target), move),
  ]));
  const hitTargetIds = new Set(hostileHitBreakdowns.size ? hostileHitBreakdowns.keys() : ids);
  // Project successful effects in their real order, without consulting hidden rolls or enemy choices.
  move.effects.forEach((effect, effectIndex) => {
    let previousFrame = projected;
    const result = resolveEffect({
      state: projected,
      actor: paidActor,
      move,
      targetIds: ids,
      effect: { ...effect, chance: undefined },
      effectIndex,
      actionSeed: "preview",
      hitTargetIds,
      includeNoopCleanses: true,
      onFrame: (frame, appliedStatus, damage) => {
        if (frame.kind === "knockout") return;
        const targetId = frame.targetIds[0];
        const before = previousFrame.combatants[targetId];
        const after = frame.state.combatants[targetId];
        const targetStats = getEffectiveBattleStats(before);
        const hostile = isHostileEffect(paidActor, before, effect);
        const hitBreakdown = hostile ? hostileHitBreakdowns.get(targetId) : undefined;
        const hitChance = hitBreakdown?.hitChance ?? 100;
        const requiresHit = hitBreakdown !== undefined;
        const effectChance = effect.chance === undefined ? 100 : hostile
          ? calculateBattleSecondaryEffectChance(actorStats, targetStats, effect.chance) : clamp(effect.chance, 0, 100);
        const statusApplication = appliedStatus && !after.isFainted && effectChance > 0 ? {
          stack: appliedStatus.status,
          mode: appliedStatus.mode,
          requiresHit,
          hitChance,
          effectChance,
        } : undefined;
        const guardedAfter = getBattleGuardedStatus(after);
        let description: string;
        let damageBreakdown: BattleDamageBreakdown | undefined;
        let cleansedStatuses: BattleStatusId[] | undefined;
        if (damage) {
          damageBreakdown = getDamageBreakdown(damage, before.currentHp - after.currentHp);
          const breaksGuard = !guardedAfter && getBattleGuardedStatus(before);
          description = `${damage.finalDamage} damage if hit · HP ${before.currentHp} → ${after.currentHp}${breaksGuard ? " · Breaks Guarded" : ""}`;
        } else if (effect.type === "heal") {
          description = after.currentHp > before.currentHp
            ? `Restore ${after.currentHp - before.currentHp} HP · ${before.currentHp} → ${after.currentHp}`
            : "Already at full HP";
        } else if (effect.type === "restore_battle_energy") {
          description = `Restore ${after.currentBattleEnergy - before.currentBattleEnergy} BE · ${before.currentBattleEnergy} → ${after.currentBattleEnergy} (after move cost)`;
        } else if (effect.type === "cleanse_status") {
          const remainingStatuses = new Set(after.statuses.map(stack => stack.status));
          cleansedStatuses = [...new Set(before.statuses.map(stack => stack.status))]
            .filter(status => !remainingStatuses.has(status));
          description = cleansedStatuses.length ? `Clear ${cleansedStatuses.join(", ")}` : "No matching status to clear";
        } else if (guardedAfter && (effect.type === "guard" || effect.type === "apply_status") &&
          (effect.status ?? "guarded") === "guarded") {
          const { damageReductionPercent, duration } = guardedAfter;
          description = `Guarded · −${damageReductionPercent}% damage · ${duration} ${duration === 1 ? "round" : "rounds"}`;
        } else {
          description = `${effect.status ?? effect.type.replaceAll("_", " ")}${effect.stat ? ` · ${effect.stat}` : ""}${effect.amount !== undefined ? ` · ${effect.amount}` : ""} · ${effect.duration ?? 1} round(s)`;
        }
        entries.push({
          targetId,
          name: before.name,
          effectType: effect.type,
          hitChance,
          requiresHit,
          effectChance,
          description,
          hpAfter: after.currentHp,
          battleEnergyAfter: after.currentBattleEnergy,
          guardedAfter,
          ...(hitBreakdown ? { hitBreakdown } : {}),
          ...(damageBreakdown ? { damageBreakdown } : {}),
          statusApplication,
          cleansedStatuses,
        });
        previousFrame = frame.state;
      },
    });
    projected = result.state;
  });
  for (const entry of entries) {
    if (!entry.statusApplication) continue;
    const target = projected.combatants[entry.targetId];
    if (target.isFainted || !target.statuses.includes(entry.statusApplication.stack)) {
      delete entry.statusApplication;
    }
  }
  return entries;
}
