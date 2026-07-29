import {
  deterministicBattleRoll,
  getEffectiveBattleStats,
  getLegalBattleTargetIds,
  getUsableBattleMoves,
  hasBattleStatus,
  validateBattleAction,
} from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
import { REQUIRED_BASIC_BATTLE_MOVE_ID } from "@/data/battleLoadouts";
import { getBattleMoveTagModifier } from "@/data/battleRoundRules";
import { previewBattleDamage, previewBattleHealing } from "@/data/battleStats";
import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleMove,
  BattleMoveEffect,
  BattleSideId,
  BattleState,
  BattleStatusId,
} from "@/types/battle";
import type {
  BattleAiCandidate,
  BattleAiDecision,
  BattleAiDifficulty,
  BattleAiPlan,
} from "@/types/battleAi";

export const BATTLE_AI_DIFFICULTIES: readonly BattleAiDifficulty[] = [
  "basic",
  "tactical",
  "champion",
] as const;

const HARMFUL_STATUSES = new Set<BattleStatusId>([
  "bleed",
  "stun",
  "marked",
  "taunted",
  "exhausted",
  "weakened",
  "slowed",
]);

const POSITIVE_STATUSES = new Set<BattleStatusId>(["guarded", "inspired"]);

type AiReservations = {
  damageByTarget: Map<BattleCombatantId, number>;
  healingByTarget: Map<BattleCombatantId, number>;
  statusKeys: Set<string>;
  teamMoveKeys: Set<string>;
  focusTargetId: BattleCombatantId | null;
};

function opposingSide(sideId: BattleSideId): BattleSideId {
  return sideId === "player" ? "enemy" : "player";
}

function livingCombatants(state: BattleState, sideId: BattleSideId): BattleCombatant[] {
  return state.teams[sideId].combatantIds
    .map((combatantId) => state.combatants[combatantId])
    .filter((combatant): combatant is BattleCombatant => Boolean(combatant) && !combatant.isFainted);
}

function hpRatio(combatant: BattleCombatant): number {
  return combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 0;
}

function energyRatio(combatant: BattleCombatant): number {
  return combatant.maxBattleEnergy > 0
    ? combatant.currentBattleEnergy / combatant.maxBattleEnergy
    : 0;
}

function threatScore(combatant: BattleCombatant): number {
  const stats = getEffectiveBattleStats(combatant);
  return stats.physicalPower + stats.specialPower + stats.statusPower * 0.5 + stats.speed * 0.35;
}

function targetSetsForMove(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
): BattleCombatantId[][] {
  const legalTargetIds = getLegalBattleTargetIds(state, actor, move);
  if (move.targetType === "field") return [[]];
  if (move.targetType === "self") return [[actor.battleCombatantId]];
  if (move.targetType === "all_allies" || move.targetType === "all_enemies") {
    return legalTargetIds.length ? [legalTargetIds] : [];
  }
  return legalTargetIds.map((targetId) => [targetId]);
}

function effectTargetIds(
  state: BattleState,
  actor: BattleCombatant,
  action: BattleAction,
  effect: BattleMoveEffect,
): BattleCombatantId[] {
  if (effect.target === "self") return [actor.battleCombatantId];
  if (effect.target === "allies") {
    return livingCombatants(state, actor.sideId).map((entry) => entry.battleCombatantId);
  }
  if (effect.target === "enemies") {
    return livingCombatants(state, opposingSide(actor.sideId)).map((entry) => entry.battleCombatantId);
  }
  if (effect.target === "field") return [];
  return action.targetIds;
}

function statusForEffect(effect: BattleMoveEffect): BattleStatusId | null {
  if (effect.status) return effect.status;
  if (effect.type === "guard") return "guarded";
  if (effect.type === "mark") return "marked";
  if (effect.type === "taunt") return "taunted";
  if (effect.type === "buff_stat") return "inspired";
  if (effect.type === "debuff_stat") return "weakened";
  return null;
}

function statusKey(targetId: BattleCombatantId, status: BattleStatusId, stat?: string): string {
  return `${targetId}:${status}:${stat ?? "general"}`;
}

function damageModifierForPreview(
  actor: BattleCombatant,
  target: BattleCombatant,
  move: BattleMove,
): number {
  let modifier = getBattleMoveTagModifier(actor.speciesId, target.speciesId, move).modifier;
  if (hasBattleStatus(target, "guarded")) modifier *= 0.75;
  if (hasBattleStatus(target, "marked")) modifier *= 1.15;
  if (move.tags.includes("pursuit") && hasBattleStatus(target, "slowed")) modifier *= 1.1;
  if (move.tags.includes("pursuit") && hasBattleStatus(target, "exhausted")) modifier *= 1.1;
  if (move.tags.includes("finisher") && hpRatio(target) <= 0.35) modifier *= 1.2;
  if (move.targetType === "all_enemies") modifier *= 0.85;
  return Math.max(0.35, Math.min(1.85, modifier));
}

function createReservations(state: BattleState, sideId: BattleSideId): AiReservations {
  const enemies = livingCombatants(state, opposingSide(sideId));
  const focusTarget = [...enemies].sort((left, right) => (
    hpRatio(left) - hpRatio(right)
    || left.currentHp - right.currentHp
    || threatScore(right) - threatScore(left)
    || left.battleCombatantId.localeCompare(right.battleCombatantId)
  ))[0] ?? null;
  return {
    damageByTarget: new Map(),
    healingByTarget: new Map(),
    statusKeys: new Set(),
    teamMoveKeys: new Set(),
    focusTargetId: focusTarget?.battleCombatantId ?? null,
  };
}

function basicCandidateScore(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  action: BattleAction,
): { score: number; reasons: string[] } {
  let score = 10;
  const reasons: string[] = [];
  const targets = action.targetIds.map((id) => state.combatants[id]).filter(Boolean);
  if (move.effects.some((effect) => effect.type === "damage")) {
    score += move.power;
    reasons.push("Basic AI favors available damage.");
    const lowestTarget = targets.sort((left, right) => hpRatio(left) - hpRatio(right))[0];
    if (lowestTarget) score += Math.round((1 - hpRatio(lowestTarget)) * 8);
  } else if (move.effects.some((effect) => effect.type === "heal")) {
    const missingHp = targets.reduce((total, target) => total + Math.max(0, target.maxHp - target.currentHp), 0);
    score += missingHp > 0 ? 18 : -8;
    reasons.push(missingHp > 0 ? "An ally can be healed." : "No ally currently needs healing.");
  } else if (move.category === "support" || move.category === "status") {
    score += 12;
    reasons.push("Basic AI occasionally uses support and control moves.");
  }
  if (move.targetType === "all_enemies" || move.targetType === "all_allies") score += 5;
  const jitter = deterministicBattleRoll(
    `${state.battleId}:${state.roundNumber}:${actor.battleCombatantId}:${move.id}:${action.targetIds.join(",")}:basic`,
    17,
  );
  return { score: score + jitter, reasons };
}

function scoreCandidate(
  state: BattleState,
  actor: BattleCombatant,
  move: BattleMove,
  action: BattleAction,
  difficulty: BattleAiDifficulty,
  reservations: AiReservations,
): BattleAiCandidate {
  if (difficulty === "basic") {
    const basic = basicCandidateScore(state, actor, move, action);
    return {
      action,
      moveId: move.id,
      score: basic.score,
      reasons: basic.reasons,
      projectedDamageByTarget: {},
      projectedHealingByTarget: {},
      plannedStatusKeys: [],
    };
  }

  let score = 12;
  const reasons: string[] = [];
  const projectedDamageByTarget: Partial<Record<BattleCombatantId, number>> = {};
  const projectedHealingByTarget: Partial<Record<BattleCombatantId, number>> = {};
  const plannedStatusKeys: string[] = [];
  const actorStats = getEffectiveBattleStats(actor);

  move.effects.forEach((effect) => {
    const targetIds = effectTargetIds(state, actor, action, effect);
    if (effect.type === "damage") {
      targetIds.forEach((targetId) => {
        const target = state.combatants[targetId];
        if (!target || target.sideId === actor.sideId || target.isFainted) return;
        const preview = previewBattleDamage(
          actorStats,
          getEffectiveBattleStats(target),
          move,
          damageModifierForPreview(actor, target, move),
        );
        projectedDamageByTarget[targetId] = preview.finalDamage;
        const plannedDamage = reservations.damageByTarget.get(targetId) ?? 0;
        const effectiveRemainingHp = Math.max(0, target.currentHp - plannedDamage);
        score += preview.finalDamage * 0.9;
        score += (1 - hpRatio(target)) * 18;
        reasons.push(`Projects about ${preview.finalDamage} damage to ${target.name}.`);
        if (preview.finalDamage >= effectiveRemainingHp && effectiveRemainingHp > 0) {
          score += difficulty === "champion" ? 85 : 55;
          reasons.push(`${target.name} is within projected finishing range.`);
        }
        if (difficulty === "champion") {
          if (reservations.focusTargetId === targetId && effectiveRemainingHp > preview.finalDamage) {
            score += 18;
            reasons.push("Champion AI coordinates pressure on the priority target.");
          }
          if (plannedDamage >= target.currentHp) {
            score -= 55;
            reasons.push("Champion AI avoids wasting damage on an already-covered knockout.");
          }
        }
      });
      return;
    }

    if (effect.type === "heal") {
      targetIds.forEach((targetId) => {
        const target = state.combatants[targetId];
        if (!target || target.sideId !== actor.sideId || target.isFainted) return;
        const preview = previewBattleHealing(actorStats, move, effect.amount ?? move.power);
        const reservedHealing = difficulty === "champion"
          ? reservations.healingByTarget.get(targetId) ?? 0
          : 0;
        const missingHp = Math.max(0, target.maxHp - target.currentHp - reservedHealing);
        const effectiveHealing = Math.min(preview.finalHealing, missingHp);
        projectedHealingByTarget[targetId] = preview.finalHealing;
        score += effectiveHealing * 1.35;
        if (hpRatio(target) <= 0.35 && missingHp > 0) {
          score += difficulty === "champion" ? 48 : 34;
          reasons.push(`${target.name} is in critical condition.`);
        }
        if (missingHp <= 0) {
          score -= difficulty === "champion" ? 60 : 35;
          reasons.push(`${target.name} does not need additional healing.`);
        } else {
          reasons.push(`Can restore about ${effectiveHealing} useful HP to ${target.name}.`);
        }
      });
      return;
    }

    if (effect.type === "restore_battle_energy") {
      targetIds.forEach((targetId) => {
        const target = state.combatants[targetId];
        if (!target || target.sideId !== actor.sideId) return;
        const missingEnergy = Math.max(0, target.maxBattleEnergy - target.currentBattleEnergy);
        const usefulEnergy = Math.min(missingEnergy, Math.max(1, effect.amount ?? 1));
        score += usefulEnergy * 1.2;
        if (energyRatio(target) <= 0.25) score += 18;
        if (missingEnergy <= 0) score -= 18;
        reasons.push(usefulEnergy > 0
          ? `${target.name} can use ${usefulEnergy} Battle Energy.`
          : `${target.name}'s Battle Energy is already full.`);
      });
      return;
    }

    if (effect.type === "cleanse_status") {
      targetIds.forEach((targetId) => {
        const target = state.combatants[targetId];
        if (!target) return;
        const removable = effect.status
          ? target.statuses.filter((entry) => entry.status === effect.status && entry.duration > 0)
          : target.statuses.filter((entry) => HARMFUL_STATUSES.has(entry.status) && entry.duration > 0);
        if (removable.length) {
          score += 28 + removable.length * 8;
          reasons.push(`${target.name} has a removable harmful status.`);
        } else {
          score -= 16;
        }
      });
      return;
    }

    const status = statusForEffect(effect);
    if (!status) return;
    targetIds.forEach((targetId) => {
      const target = state.combatants[targetId];
      if (!target) return;
      const key = statusKey(targetId, status, effect.stat);
      plannedStatusKeys.push(key);
      const alreadyActive = target.statuses.some((entry) => (
        entry.status === status && entry.stat === effect.stat && entry.duration > 0
      ));
      const duplicatePlanned = difficulty === "champion" && reservations.statusKeys.has(key);
      const hostile = target.sideId !== actor.sideId;
      const chanceMultiplier = Math.max(0.05, Math.min(1, (effect.chance ?? 100) / 100));
      if (hostile) {
        score += 18 * chanceMultiplier;
        score += threatScore(target) * 0.08;
        if (alreadyActive) score -= 8;
        if (duplicatePlanned) score -= 22;
        if (effect.type === "taunt") {
          score += hpRatio(actor) >= 0.55 ? 16 : -12;
          reasons.push(`${actor.name} is ${hpRatio(actor) >= 0.55 ? "healthy enough" : "too injured"} to draw pressure.`);
        }
      } else {
        score += POSITIVE_STATUSES.has(status) ? 18 : 10;
        if (hpRatio(target) <= 0.4 && status === "guarded") score += 24;
        if (alreadyActive) score -= 16;
        if (duplicatePlanned) score -= 26;
      }
    });
  });

  for (const hint of move.aiHints ?? []) {
    if (hint === "finisher" && action.targetIds.some((targetId) => hpRatio(state.combatants[targetId]) <= 0.35)) score += 18;
    else if (hint === "heal_lowest") score += 5;
    else if (hint === "buff_team" && move.targetType === "all_allies") score += 7;
    else if (hint === "debuff_threat") score += 5;
    else if (hint === "restore_energy") score += 4;
    else if (hint === "cleanse") score += 4;
    else if (hint === "damage") score += 3;
  }

  if (difficulty === "champion" && (move.targetType === "all_allies" || move.targetType === "all_enemies")) {
    const teamKey = `${move.id}:${move.targetType}`;
    if (reservations.teamMoveKeys.has(teamKey)) {
      score -= 20;
      reasons.push("Champion AI avoids duplicating the same team-wide plan.");
    }
  }

  score -= move.battleEnergyCost * 0.12;
  score -= move.cooldown * 1.25;
  const jitter = deterministicBattleRoll(
    `${state.battleId}:${state.roundNumber}:${actor.battleCombatantId}:${move.id}:${action.targetIds.join(",")}:${difficulty}`,
    difficulty === "champion" ? 4 : 7,
  ) / 10;
  score += jitter;

  return {
    action,
    moveId: move.id,
    score: Math.round(score * 10) / 10,
    reasons: reasons.length ? reasons : ["This is the strongest currently legal option."],
    projectedDamageByTarget,
    projectedHealingByTarget,
    plannedStatusKeys,
  };
}

function enumerateCandidates(
  state: BattleState,
  actor: BattleCombatant,
  difficulty: BattleAiDifficulty,
  reservations: AiReservations,
): BattleAiCandidate[] {
  const usableMoves = getUsableBattleMoves(actor);
  const moves = usableMoves.length ? usableMoves : [getBattleMove(REQUIRED_BASIC_BATTLE_MOVE_ID)];
  const candidates: BattleAiCandidate[] = [];

  moves.forEach((move) => {
    targetSetsForMove(state, actor, move).forEach((targetIds) => {
      const requestedAction: BattleAction = {
        actorId: actor.battleCombatantId,
        moveId: move.id,
        targetIds,
      };
      const validation = validateBattleAction(state, requestedAction);
      if (validation.issues.some((issue) => [
        "battle-complete",
        "unknown-actor",
        "actor-fainted",
        "unknown-move",
        "move-not-equipped",
        "insufficient-energy",
        "move-on-cooldown",
      ].includes(issue.code))) return;
      const action: BattleAction = {
        ...requestedAction,
        targetIds: validation.normalizedTargetIds,
      };
      candidates.push(scoreCandidate(state, actor, move, action, difficulty, reservations));
    });
  });

  return candidates;
}

function reserveCandidate(
  candidate: BattleAiCandidate,
  move: BattleMove,
  reservations: AiReservations,
): void {
  Object.entries(candidate.projectedDamageByTarget).forEach(([targetId, amount]) => {
    reservations.damageByTarget.set(
      targetId,
      (reservations.damageByTarget.get(targetId) ?? 0) + (amount ?? 0),
    );
  });
  Object.entries(candidate.projectedHealingByTarget).forEach(([targetId, amount]) => {
    reservations.healingByTarget.set(
      targetId,
      (reservations.healingByTarget.get(targetId) ?? 0) + (amount ?? 0),
    );
  });
  candidate.plannedStatusKeys.forEach((key) => reservations.statusKeys.add(key));
  if (move.targetType === "all_allies" || move.targetType === "all_enemies") {
    reservations.teamMoveKeys.add(`${move.id}:${move.targetType}`);
  }
}

export function getBattleAiDifficultyLabel(difficulty: BattleAiDifficulty): string {
  if (difficulty === "basic") return "Basic";
  if (difficulty === "champion") return "Champion";
  return "Tactical";
}

export function getBattleAiDifficultyDescription(difficulty: BattleAiDifficulty): string {
  if (difficulty === "basic") return "Uses legal moves with simple damage and support preferences.";
  if (difficulty === "champion") return "Coordinates focus fire, healing, status coverage, and team-wide plans.";
  return "Evaluates damage, healing, Energy, statuses, threats, and finishing opportunities.";
}

export function buildBattleAiPlan(
  state: BattleState,
  sideId: BattleSideId = "enemy",
  difficulty: BattleAiDifficulty = "tactical",
): BattleAiPlan {
  const reservations = createReservations(state, sideId);
  const decisions: BattleAiDecision[] = [];

  livingCombatants(state, sideId)
    .sort((left, right) => left.slotIndex - right.slotIndex || left.battleCombatantId.localeCompare(right.battleCombatantId))
    .forEach((actor) => {
      const candidates = enumerateCandidates(state, actor, difficulty, reservations)
        .sort((left, right) => (
          right.score - left.score
          || left.moveId.localeCompare(right.moveId)
          || left.action.targetIds.join(",").localeCompare(right.action.targetIds.join(","))
        ));
      const selected = candidates[0];
      if (!selected) return;
      const move = getBattleMove(selected.moveId);
      if (difficulty === "champion") reserveCandidate(selected, move, reservations);
      decisions.push({
        difficulty,
        actorId: actor.battleCombatantId,
        actorName: actor.name,
        action: selected.action,
        moveName: move.name,
        targetNames: selected.action.targetIds.map((targetId) => state.combatants[targetId]?.name ?? "Battlefield"),
        score: selected.score,
        reasons: selected.reasons.slice(0, 4),
      });
    });

  return {
    difficulty,
    sideId,
    actions: decisions.map((decision) => decision.action),
    decisions,
  };
}

export function formatBattleAiDecision(decision: BattleAiDecision): string {
  const targetLabel = decision.targetNames.length ? decision.targetNames.join(", ") : "the battlefield";
  return `AI ${getBattleAiDifficultyLabel(decision.difficulty)}: ${decision.actorName} plans ${decision.moveName} → ${targetLabel}.`;
}
