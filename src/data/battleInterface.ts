import { getBattleMove } from "@/data/battleMoves";
import {
  advanceBattleCombatantEndOfRound,
  deterministicBattleRoll,
  getBattleOutcome,
  getEffectiveBattleStats,
  type BattleActionEffectPreview,
  type BattleStatusApplicationPreview,
} from "@/data/battleEngine";
import { getBattleTurnScore } from "@/data/battleStats";
import { getBattleUiMoveAvailability, type BattleUiTarget } from "@/data/battleUi";
import type { BattleAction, BattleCombatant, BattleCombatantId, BattleMove, BattleMoveId, BattleOrderShiftLogEntry, BattleState, BattleStatusStack } from "@/types/battle";

export const BATTLE_MENU_CATEGORIES = ["All", "Attack", "Support", "Recovery"] as const;
export type BattleMenuCategory = typeof BATTLE_MENU_CATEGORIES[number];

export type BattleMoveBlocker = {
  kind: "target" | "cooldown" | "energy";
  label: string;
  detail: string;
};

const TARGET_BLOCKER_LABELS: Record<BattleMove["targetType"], string> = {
  self: "Select self",
  single_enemy: "Select enemy",
  all_enemies: "Select enemy",
  single_ally: "Select ally",
  all_allies: "Select ally",
  field: "Select field",
};

/** Exclusive groups: damaging hybrids remain attacks; defensive moves stay Support despite small energy refunds. */
export function getBattleMenuCategory(move: BattleMove): Exclude<BattleMenuCategory, "All"> {
  if (move.effects.some(effect => effect.type === "damage") || move.category === "physical" || move.category === "special") return "Attack";
  if (move.tags.some(tag => tag === "guard" || tag === "defensive")) return "Support";
  if (move.effects.some(effect => ["heal", "cleanse_status", "restore_battle_energy"].includes(effect.type)) || move.category === "healing") return "Recovery";
  return "Support";
}

/** All equipped moves are inspectable, even without a target or while unavailable. */
export function getBattleMenuOptions(state: BattleState, actorId: BattleCombatantId | null, target: BattleUiTarget | null) {
  const actor = actorId ? state.combatants[actorId] : null;
  if (!actor || actor.isFainted) return [];
  return actor.loadout.equippedMoveIds.map(id => {
    const move = getBattleMove(id);
    const availability = target ? getBattleUiMoveAvailability(state, actor.battleCombatantId, id, target) : null;
    const blockers: BattleMoveBlocker[] = [];
    if (!target) {
      blockers.push({ kind: "target", label: "Choose target", detail: "Choose a target." });
    } else if (availability && !availability.compatible && availability.reason) {
      blockers.push({
        kind: "target",
        label: availability.reason.startsWith("Taunted:") ? "Taunt target" : TARGET_BLOCKER_LABELS[move.targetType],
        detail: availability.reason,
      });
    }
    const cooldown = actor.cooldowns[id] ?? 0;
    if (cooldown > 0) {
      const remaining = `${cooldown} round${cooldown === 1 ? "" : "s"}`;
      blockers.push({ kind: "cooldown", label: `${remaining} left`, detail: `Cooldown: ${remaining}.` });
    }
    if (actor.currentBattleEnergy < move.battleEnergyCost) {
      blockers.push({
        kind: "energy",
        label: `Need ${move.battleEnergyCost} BE`,
        detail: `Need ${move.battleEnergyCost} Battle Energy.`,
      });
    }
    const reasons = blockers.map(blocker => blocker.detail);
    return { move, category: getBattleMenuCategory(move), usable: availability?.usable ?? false, reasons, blockers, cooldown };
  });
}

/** Always an estimate: unknown actions use priority zero; never read an enemy's requested move. */
export function getBattleOrderPreview(state: BattleState, queued: ReadonlyMap<BattleCombatantId, BattleAction>) {
  return Object.values(state.combatants).filter(c => !c.isFainted).map(c => {
    const action = c.sideId === "player" ? queued.get(c.battleCombatantId) : undefined;
    const stats = getEffectiveBattleStats(c);
    return { actorId: c.battleCombatantId, score: action ? getBattleTurnScore(stats, getBattleMove(action.moveId)) : stats.speed,
      tie: deterministicBattleRoll(`${state.battleId}_${state.roundNumber}_${c.battleCombatantId}_initiative`, 100000) };
  }).sort((a,b) => b.score-a.score || b.tie-a.tie || a.actorId.localeCompare(b.actorId));
}

export type BattleRoundOrderShift = {
  roundNumber: number;
  before: readonly BattleCombatantId[];
  after: readonly BattleCombatantId[];
};

/** Compare opening orders among creatures present in both rounds. */
export function getBattleRoundOrderShift(
  previousOrder: readonly BattleCombatantId[],
  nextOrder: readonly BattleCombatantId[],
  roundNumber: number,
): BattleRoundOrderShift | undefined {
  const previousActors = new Set(previousOrder);
  const nextActors = new Set(nextOrder);
  const before = previousOrder.filter(id => nextActors.has(id));
  const after = nextOrder.filter(id => previousActors.has(id));
  return before.some((id, index) => id !== after[index]) ? { roundNumber, before, after } : undefined;
}

/** Append one settled shift after recovery and before the first action of the new round. */
export function recordBattleOrderShift(state: BattleState, shift?: BattleRoundOrderShift): BattleState {
  if (!shift || state.outcome !== "ongoing" || state.roundNumber !== shift.roundNumber ||
      state.orderShiftLog?.some(entry => entry.roundNumber === shift.roundNumber)) return state;

  const moves = shift.after.flatMap((actorId, to) => {
    const from = shift.before.indexOf(actorId);
    return from >= 0 && from !== to ? [{ actorId, from: from + 1, to: to + 1 }] : [];
  });
  if (!moves.length) return state;

  const entry: BattleOrderShiftLogEntry = { logIndex: state.log.length, roundNumber: shift.roundNumber, moves };
  const summary = moves.map(({ actorId, from, to }) => `${state.combatants[actorId].name} ${from} → ${to}`).join(" · ");
  return {
    ...state,
    log: [...state.log, `Round ${shift.roundNumber} · Order shift · ${summary}`],
    orderShiftLog: [...(state.orderShiftLog ?? []), entry],
  };
}

export type BattleSlowedOrderEntry = {
  actorId: BattleCombatantId;
  slot: number;
  speed: number;
};

export type BattleSlowedOrderForecast = {
  roundNumber: number;
  baseline: BattleSlowedOrderEntry[];
  slowed: BattleSlowedOrderEntry[];
  targets: (Pick<BattleStatusApplicationPreview, "requiresHit" | "hitChance" | "effectChance"> & {
    actorId: BattleCombatantId;
  })[];
};

function withProjectedStatus(combatant: BattleCombatant, stack: BattleStatusStack): BattleCombatant {
  const otherStacks = combatant.statuses.filter(status => status.status !== stack.status || status.stat !== stack.stat);
  return { ...combatant, statuses: [...otherStacks, stack] };
}

/** Compare the same projected move results with and without the new Slowed effects. */
export function getBattleSlowedOrderForecast(
  state: BattleState,
  effects: readonly BattleActionEffectPreview[],
): BattleSlowedOrderForecast | null {
  if (state.outcome !== "ongoing") return null;

  const applications = new Map<BattleCombatantId, BattleStatusApplicationPreview>();
  for (const effect of effects) {
    const application = effect.statusApplication;
    if (application?.stack.status === "slowed" && application.stack.duration > 1 &&
        application.effectChance > 0 && (!application.requiresHit || application.hitChance > 0)) {
      applications.set(effect.targetId, application);
    }
  }
  if (!applications.size) return null;

  const afterMove = { ...state, combatants: { ...state.combatants } };
  for (const effect of effects) {
    const combatant = afterMove.combatants[effect.targetId];
    const { statusApplication, cleansedStatuses } = effect;
    const projected = {
      ...combatant,
      currentHp: effect.hpAfter,
      isFainted: combatant.isFainted || effect.hpAfter <= 0,
      statuses: cleansedStatuses?.length
        ? combatant.statuses.filter(status => !cleansedStatuses.includes(status.status))
        : combatant.statuses,
    };
    afterMove.combatants[effect.targetId] = statusApplication && statusApplication.stack.status !== "slowed"
      ? withProjectedStatus(projected, statusApplication.stack)
      : projected;
  }
  if (getBattleOutcome(afterMove) !== "ongoing") return null;

  const roundNumber = state.roundNumber + 1;
  const baseline = { ...afterMove, roundNumber, combatants: { ...afterMove.combatants } };
  for (const combatant of Object.values(afterMove.combatants)) {
    baseline.combatants[combatant.battleCombatantId] = advanceBattleCombatantEndOfRound(combatant).combatant;
  }
  if (getBattleOutcome(baseline) !== "ongoing") return null;

  const slowed = { ...baseline, combatants: { ...baseline.combatants } };
  const targets: BattleSlowedOrderForecast["targets"] = [];
  for (const [actorId, { stack, requiresHit, hitChance, effectChance }] of applications) {
    if (baseline.combatants[actorId].isFainted) continue;
    const combatant = withProjectedStatus(afterMove.combatants[actorId], stack);
    slowed.combatants[actorId] = advanceBattleCombatantEndOfRound(combatant).combatant;
    targets.push({ actorId, requiresHit, hitChance, effectChance });
  }
  if (!targets.length) return null;

  const order = (branch: BattleState) => getBattleOrderPreview(branch, new Map()).map(({ actorId, score }, index) => ({
    actorId,
    slot: index + 1,
    speed: score,
  }));
  return { roundNumber, baseline: order(baseline), slowed: order(slowed), targets };
}

/** Notices follow the settled round state and survive until their owner's playable turn resolves. */
export function updateBattleCooldownNotices(
  pending: ReadonlyMap<BattleCombatantId, readonly BattleMoveId[]>,
  before: BattleState,
  after: BattleState,
  actedPlayerId: BattleCombatantId | null,
): ReadonlyMap<BattleCombatantId, readonly BattleMoveId[]> {
  const next = new Map<BattleCombatantId, readonly BattleMoveId[]>();
  if (before.battleId !== after.battleId || before.outcome !== "ongoing" || after.outcome !== "ongoing") return next;

  const roundAdvanced = after.roundNumber > before.roundNumber;
  for (const id of after.teams.player.combatantIds) {
    const actor = after.combatants[id];
    if (!actor || actor.isFainted) continue;
    const retained = id === actedPlayerId ? undefined : pending.get(id);
    const priorCooldowns = roundAdvanced ? before.combatants[id]?.cooldowns : undefined;
    const ready = actor.loadout.equippedMoveIds.filter(moveId =>
      (actor.cooldowns[moveId] ?? 0) <= 0 &&
      (retained?.includes(moveId) || (priorCooldowns?.[moveId] ?? 0) > 0));
    if (ready.length > 0) next.set(id, ready);
  }
  return next;
}
