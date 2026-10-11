import { getBattleMove } from "@/data/battleMoves";
import { deterministicBattleRoll, getEffectiveBattleStats } from "@/data/battleEngine";
import { getBattleTurnScore } from "@/data/battleStats";
import { getBattleUiMoveAvailability, type BattleUiTarget } from "@/data/battleUi";
import type { BattleAction, BattleCombatantId, BattleMove, BattleState } from "@/types/battle";

export const BATTLE_MENU_CATEGORIES = ["All", "Attack", "Support", "Recovery"] as const;
export type BattleMenuCategory = typeof BATTLE_MENU_CATEGORIES[number];

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
    const reasons: string[] = [];
    if (!target) reasons.push("Choose a target.");
    else if (!availability?.compatible && availability?.reason) reasons.push(availability.reason);
    const cooldown = actor.cooldowns[id] ?? 0;
    if (cooldown > 0) reasons.push(`Cooldown: ${cooldown} round${cooldown === 1 ? "" : "s"}.`);
    if (actor.currentBattleEnergy < move.battleEnergyCost) reasons.push(`Need ${move.battleEnergyCost} Battle Energy.`);
    return { move, category: getBattleMenuCategory(move), usable: availability?.usable ?? false, reasons, cooldown };
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
