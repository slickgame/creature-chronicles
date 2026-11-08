import { getBattleMove } from "@/data/battleMoves";
import { deterministicBattleRoll, getEffectiveBattleStats } from "@/data/battleEngine";
import { getBattleTurnScore } from "@/data/battleStats";
import { getBattleUiMoveAvailability, type BattleUiTarget } from "@/data/battleUi";
import type { BattleAction, BattleCombatantId, BattleMove, BattleMoveId, BattleState } from "@/types/battle";

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
