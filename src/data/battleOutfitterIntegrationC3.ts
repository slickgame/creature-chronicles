import {getEquipmentSet,equipmentSetProgress,equipmentSetRates,type EquipmentSetProgress} from './equipmentRules';
import { getEquippedCopy } from "./equipmentInstances";
import { equipmentStats } from "./equipmentEnhancement";
import * as active from "./battleOutfitterIntegrationActive";
import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleLoadout,
  getBattleOutfitterStock,
  type BattleOutfitterItemId,
} from "@/data/battleOutfitter";
import type { BattleCombatant, BattleState, BattleStats } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export * from "./battleOutfitterIntegrationActive";

export type BattleOutfitterCreatureEffectSummaryC3 = {
  creatureId: CreatureId;
  labels: string[];
  sets?: EquipmentSetProgress[];
  setPercentBonuses?: Partial<Record<keyof BattleStats,number>>;
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
  const itemIds = Object.values(loadout.equipment).filter((id): id is BattleOutfitterItemId => Boolean(id));
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
    const item = getItem(itemId);
    const copy = getEquippedCopy(save, creatureId, itemId);
    const bonuses = item ? equipmentStats(item, copy).bonuses : undefined;
    if (copy?.level) summary.labels.push(`${item?.name} +${copy.level}`);
    if (bonuses) {
      summary.maxHpBonus += bonuses.maxHp ?? 0;
      summary.physicalPowerBonus += bonuses.physicalPower ?? 0;
      summary.specialPowerBonus += bonuses.specialPower ?? 0;
      summary.defenseBonus += bonuses.defense ?? 0;
      summary.resistanceBonus += bonuses.resistance ?? 0;
      summary.speedBonus += bonuses.speed ?? 0;
      summary.accuracyBonus += bonuses.accuracy ?? 0;
      summary.statusPowerBonus += bonuses.statusPower ?? 0;
      summary.statusResistBonus += bonuses.statusResist ?? 0;
      summary.battleEnergyBonus += bonuses.battleEnergy ?? 0;
    }
  }
  summary.sets=equipmentSetProgress(itemIds.map(id=>{const item=getItem(id)!;return getEquipmentSet(item,getEquippedCopy(save,creatureId,id));}));
  summary.setPercentBonuses=equipmentSetRates(summary.sets);
  for(const set of summary.sets)if(set.activations)summary.labels.push(`${set.name} set ×${set.activations}`);
  return summary;
}

export function applyOutfitterStatBonuses(stats: BattleStats, summary: BattleOutfitterCreatureEffectSummaryC3): BattleStats {
  const set=(key:keyof BattleStats)=>Math.floor(stats[key]*(summary.setPercentBonuses?.[key]??0)/100);
  return {
    ...stats,
    maxHp: stats.maxHp + summary.maxHpBonus + set('maxHp'),
    physicalPower: stats.physicalPower + summary.physicalPowerBonus + set('physicalPower'),
    specialPower: stats.specialPower + summary.specialPowerBonus + set('specialPower'),
    defense: stats.defense + summary.defenseBonus + set('defense'),
    resistance: stats.resistance + summary.resistanceBonus + set('resistance'),
    speed: stats.speed + summary.speedBonus + set('speed'),
    accuracy: stats.accuracy + summary.accuracyBonus + set('accuracy'),
    statusPower: stats.statusPower + summary.statusPowerBonus + set('statusPower'),
    statusResist: stats.statusResist + summary.statusResistBonus + set('statusResist'),
    battleEnergy: stats.battleEnergy + summary.battleEnergyBonus + set('battleEnergy'),
  };
}

export function applySummaryToCombatant(
  combatant: BattleCombatant,
  summary: BattleOutfitterCreatureEffectSummaryC3,
): BattleCombatant {
  const battleStats = applyOutfitterStatBonuses(combatant.battleStats, summary);
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
  return applyEquipmentOpeningPassives(save, { ...state, combatants, log: [...state.log, ...logEntries] });
}

/** Called at battle creation, after gauntlet carryover when applicable. Never reapplied per round. */
export function applyEquipmentOpeningPassives(save: GameSave, state: BattleState): BattleState {
  const log = [...state.log];
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([id, combatant]) => {
    if (combatant.sideId !== "player" || !Object.values(getBattleLoadout(save, combatant.sourceCreatureId).equipment).includes("champion_harness")) return [id, combatant];
    const existing = combatant.statuses.find(s => s.status === "guarded");
    const message = `${combatant.name}: Champion’s Resolve grants Guarded for the opening round.`;
    if (!log.includes(message)) log.push(message);
    return [id, { ...combatant, statuses: [...combatant.statuses.filter(s => s.status !== "guarded"), { ...existing, status: "guarded" as const, duration: Math.max(existing?.duration ?? 0, 1) }] }];
  })) as BattleState["combatants"];
  return { ...state, combatants, log };
}

export const TEAM_TACTICS_KIT_ID = active.TEAM_TACTICS_KIT_ID;
export const FIELD_TONIC_ID = active.FIELD_TONIC_ID;
export const REVIVAL_SALVE_ID = active.REVIVAL_SALVE_ID;
export const applyTeamTacticsKit = active.applyTeamTacticsKit;
export const useFieldTonic = active.useFieldTonic;
export const useRevivalSalve = active.useRevivalSalve;
