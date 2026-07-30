import * as active from "./battleOutfitterIntegrationActive";
import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleLoadout,
  getBattleOutfitterStock,
  type BattleOutfitterItemId,
} from "@/data/battleOutfitter";
import type { BattleCombatant, BattleState } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export * from "./battleOutfitterIntegrationActive";

export type BattleOutfitterCreatureEffectSummaryC3 = {
  creatureId: CreatureId;
  labels: string[];
  physicalPowerBonus: number;
  specialPowerBonus: number;
  maxHpBonus: number;
  defenseBonus: number;
  resistanceBonus: number;
  speedBonus: number;
  accuracyBonus: number;
  statusPowerBonus: number;
  statusResistBonus: number;
  battleEnergyBonus: number;
};

function getItem(itemId: BattleOutfitterItemId | null) {
  return itemId ? BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId) ?? null : null;
}

export function getBattleOutfitterCombatStock(save: GameSave, itemId: BattleOutfitterItemId): number {
  const item = getItem(itemId);
  return item ? getBattleOutfitterStock(save, item) : 0;
}

export function getBattleOutfitterCreatureEffectSummary(
  save: GameSave,
  creatureId: CreatureId,
): BattleOutfitterCreatureEffectSummaryC3 {
  const loadout = getBattleLoadout(save, creatureId);
  const itemIds = [loadout.offenseItemId, loadout.defenseItemId, loadout.utilityItemId].filter((id): id is BattleOutfitterItemId => Boolean(id));
  const summary: BattleOutfitterCreatureEffectSummaryC3 = {
    creatureId,
    labels: itemIds.map((id) => getItem(id)?.name ?? id),
    physicalPowerBonus: 0,
    specialPowerBonus: 0,
    maxHpBonus: 0,
    defenseBonus: 0,
    resistanceBonus: 0,
    speedBonus: 0,
    accuracyBonus: loadout.manualRank * 2,
    statusPowerBonus: loadout.manualRank * 2,
    statusResistBonus: 0,
    battleEnergyBonus: loadout.manualRank * 2,
  };
  if (loadout.manualRank > 0) summary.labels.push(`Focus Training ${loadout.manualRank}`);

  for (const itemId of itemIds) {
    if (itemId === "sparring_wraps") {
      summary.physicalPowerBonus += 6;
      summary.specialPowerBonus += 4;
      summary.accuracyBonus += 3;
    } else if (itemId === "guard_charm") {
      summary.maxHpBonus += 12;
      summary.defenseBonus += 5;
      summary.resistanceBonus += 5;
      summary.statusResistBonus += 3;
    } else if (itemId === "arena_blade_wraps") {
      summary.physicalPowerBonus += 8;
      summary.speedBonus += 3;
      summary.accuracyBonus += 3;
    } else if (itemId === "focus_prism") {
      summary.specialPowerBonus += 8;
      summary.statusPowerBonus += 5;
      summary.accuracyBonus += 3;
    } else if (itemId === "bastion_badge") {
      summary.maxHpBonus += 18;
      summary.defenseBonus += 7;
      summary.resistanceBonus += 5;
      summary.statusResistBonus += 4;
    } else if (itemId === "tactician_emblem") {
      summary.speedBonus += 3;
      summary.statusPowerBonus += 3;
      summary.statusResistBonus += 2;
      summary.battleEnergyBonus += 8;
    } else if (itemId === "champion_harness") {
      summary.maxHpBonus += 12;
      summary.physicalPowerBonus += 4;
      summary.specialPowerBonus += 4;
      summary.defenseBonus += 4;
      summary.resistanceBonus += 4;
      summary.accuracyBonus += 2;
      summary.battleEnergyBonus += 10;
    }
  }
  return summary;
}

function applySummaryToCombatant(
  combatant: BattleCombatant,
  summary: BattleOutfitterCreatureEffectSummaryC3,
): BattleCombatant {
  const battleStats = {
    ...combatant.battleStats,
    maxHp: combatant.battleStats.maxHp + summary.maxHpBonus,
    physicalPower: combatant.battleStats.physicalPower + summary.physicalPowerBonus,
    specialPower: combatant.battleStats.specialPower + summary.specialPowerBonus,
    defense: combatant.battleStats.defense + summary.defenseBonus,
    resistance: combatant.battleStats.resistance + summary.resistanceBonus,
    speed: combatant.battleStats.speed + summary.speedBonus,
    accuracy: combatant.battleStats.accuracy + summary.accuracyBonus,
    statusPower: combatant.battleStats.statusPower + summary.statusPowerBonus,
    statusResist: combatant.battleStats.statusResist + summary.statusResistBonus,
    battleEnergy: combatant.battleStats.battleEnergy + summary.battleEnergyBonus,
  };
  return {
    ...combatant,
    battleStats,
    maxHp: battleStats.maxHp,
    currentHp: battleStats.maxHp,
    maxBattleEnergy: battleStats.battleEnergy,
    currentBattleEnergy: battleStats.battleEnergy,
  };
}

export function applyBattleOutfitterLoadouts(save: GameSave, state: BattleState): BattleState {
  const logEntries: string[] = [];
  const combatants = Object.values(state.combatants).reduce((next, combatant) => {
    if (combatant.sideId !== "player") {
      next[combatant.battleCombatantId] = combatant;
      return next;
    }
    const summary = getBattleOutfitterCreatureEffectSummary(save, combatant.sourceCreatureId);
    next[combatant.battleCombatantId] = applySummaryToCombatant(combatant, summary);
    if (summary.labels.length) logEntries.push(`${combatant.name} enters with ${summary.labels.join(", ")}.`);
    return next;
  }, {} as BattleState["combatants"]);
  return { ...state, combatants, log: [...state.log, ...logEntries] };
}

export const TEAM_TACTICS_KIT_ID = active.TEAM_TACTICS_KIT_ID;
export const FIELD_TONIC_ID = active.FIELD_TONIC_ID;
export const REVIVAL_SALVE_ID = active.REVIVAL_SALVE_ID;
export const applyTeamTacticsKit = active.applyTeamTacticsKit;
export const useFieldTonic = active.useFieldTonic;
export const useRevivalSalve = active.useRevivalSalve;
