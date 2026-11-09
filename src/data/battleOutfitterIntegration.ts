import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleLoadout,
  getBattleOutfitterStock,
  type BattleOutfitterItem,
  type BattleOutfitterItemId,
} from "@/data/battleOutfitter";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import { appendBattleLog, type BattleLogEntry } from "@/data/battleLog";
import type {
  BattleCombatant,
  BattleCombatantId,
  BattleState,
  BattleStatusStack,
} from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const TEAM_TACTICS_KIT_ID: BattleOutfitterItemId = "team_tactics_kit";
export const FIELD_TONIC_ID: BattleOutfitterItemId = "field_tonic";
export const REVIVAL_SALVE_ID: BattleOutfitterItemId = "revival_salve";

export type BattleOutfitterCombatResult = {
  state: BattleState;
  save: GameSave;
  ok: boolean;
  message: string;
};

export type BattleOutfitterCreatureEffectSummary = {
  creatureId: CreatureId;
  labels: string[];
  physicalPowerBonus: number;
  specialPowerBonus: number;
  maxHpBonus: number;
  defenseBonus: number;
  resistanceBonus: number;
  accuracyBonus: number;
  statusPowerBonus: number;
  statusResistBonus: number;
  battleEnergyBonus: number;
};

function getItem(itemId: BattleOutfitterItemId): BattleOutfitterItem {
  const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === itemId);
  if (!item) throw new Error(`Battle Outfitter item ${itemId} is not registered.`);
  return item;
}

export function getBattleOutfitterCombatStock(
  save: GameSave,
  itemId: BattleOutfitterItemId,
): number {
  return getBattleOutfitterStock(save, getItem(itemId));
}

function consumeBattleOutfitterItem(
  save: GameSave,
  itemId: BattleOutfitterItemId,
): GameSave | null {
  const item = getItem(itemId);
  const stock = getBattleOutfitterStock(save, item);
  if (stock <= 0) return null;
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [item.flagKey]: stock - 1,
      mBattleOutfitterCombatIntegration: true,
    },
  };
}

export function getBattleOutfitterCreatureEffectSummary(
  save: GameSave,
  creatureId: CreatureId,
): BattleOutfitterCreatureEffectSummary {
  const loadout = getBattleLoadout(save, creatureId);
  const hasWraps = loadout.offenseItemId === "sparring_wraps";
  const hasCharm = loadout.defenseItemId === "guard_charm";
  const manualRank = loadout.manualRank;
  const labels = [
    hasWraps ? "Sparring Wraps" : null,
    hasCharm ? "Guard Charm" : null,
    manualRank > 0 ? `Focus Training ${manualRank}` : null,
  ].filter((label): label is string => Boolean(label));

  return {
    creatureId,
    labels,
    physicalPowerBonus: hasWraps ? 6 : 0,
    specialPowerBonus: hasWraps ? 4 : 0,
    maxHpBonus: hasCharm ? 12 : 0,
    defenseBonus: hasCharm ? 5 : 0,
    resistanceBonus: hasCharm ? 5 : 0,
    accuracyBonus: (hasWraps ? 3 : 0) + manualRank * 2,
    statusPowerBonus: manualRank * 2,
    statusResistBonus: hasCharm ? 3 : 0,
    battleEnergyBonus: manualRank * 2,
  };
}

function applySummaryToCombatant(
  combatant: BattleCombatant,
  summary: BattleOutfitterCreatureEffectSummary,
): BattleCombatant {
  const nextStats = {
    ...combatant.battleStats,
    maxHp: combatant.battleStats.maxHp + summary.maxHpBonus,
    physicalPower: combatant.battleStats.physicalPower + summary.physicalPowerBonus,
    specialPower: combatant.battleStats.specialPower + summary.specialPowerBonus,
    defense: combatant.battleStats.defense + summary.defenseBonus,
    resistance: combatant.battleStats.resistance + summary.resistanceBonus,
    accuracy: combatant.battleStats.accuracy + summary.accuracyBonus,
    statusPower: combatant.battleStats.statusPower + summary.statusPowerBonus,
    statusResist: combatant.battleStats.statusResist + summary.statusResistBonus,
    battleEnergy: combatant.battleStats.battleEnergy + summary.battleEnergyBonus,
  };

  return {
    ...combatant,
    battleStats: nextStats,
    maxHp: nextStats.maxHp,
    currentHp: nextStats.maxHp,
    maxBattleEnergy: nextStats.battleEnergy,
    currentBattleEnergy: nextStats.battleEnergy,
  };
}

export function applyBattleOutfitterLoadouts(
  save: GameSave,
  state: BattleState,
): BattleState {
  const logEntries: string[] = [];
  const combatants = Object.values(state.combatants).reduce(
    (next, combatant) => {
      if (combatant.sideId !== "player") {
        next[combatant.battleCombatantId] = combatant;
        return next;
      }
      const summary = getBattleOutfitterCreatureEffectSummary(
        save,
        combatant.sourceCreatureId,
      );
      next[combatant.battleCombatantId] = applySummaryToCombatant(combatant, summary);
      if (summary.labels.length > 0) {
        logEntries.push(`${combatant.name} enters with ${summary.labels.join(", ")}.`);
      }
      return next;
    },
    {} as BattleState["combatants"],
  );

  return {
    ...state,
    combatants,
    log: [...state.log, ...logEntries],
  };
}

function upsertInspiredStatus(
  statuses: BattleStatusStack[],
): BattleStatusStack[] {
  const existing = statuses.find((status) => status.status === "inspired");
  const next: BattleStatusStack = {
    status: "inspired",
    duration: Math.max(1, existing?.duration ?? 0),
    amount: Math.max(3, existing?.amount ?? 0),
    stacks: Math.max(1, existing?.stacks ?? 1),
    maxStacks: Math.max(2, existing?.maxStacks ?? 2),
  };
  return [...statuses.filter((status) => status.status !== "inspired"), next];
}

export function applyTeamTacticsKit(
  save: GameSave,
  state: BattleState,
): BattleOutfitterCombatResult {
  const nextSave = consumeBattleOutfitterItem(save, TEAM_TACTICS_KIT_ID);
  if (!nextSave) {
    return {
      save,
      state,
      ok: false,
      message: "No Team Tactics Kit is available.",
    };
  }

  const combatants = Object.values(state.combatants).reduce(
    (next, combatant) => {
      if (combatant.sideId !== "player" || combatant.isFainted) {
        next[combatant.battleCombatantId] = combatant;
        return next;
      }
      next[combatant.battleCombatantId] = {
        ...combatant,
        currentBattleEnergy: Math.min(
          combatant.maxBattleEnergy,
          combatant.currentBattleEnergy + 10,
        ),
        statuses: upsertInspiredStatus(combatant.statuses),
      };
      return next;
    },
    {} as BattleState["combatants"],
  );

  return {
    save: nextSave,
    state: appendBattleLog({ ...state, combatants }, [{
      text: "Team Tactics Kit activated: the ranch team starts Inspired and gains 10 Battle Energy.",
      category: "status-changes",
    }]),
    ok: true,
    message: "Team Tactics Kit activated for this battle.",
  };
}

export function getSupportItemVitals(target: BattleCombatant, item: "tonic" | "revival") {
  const reviving = item === "revival";
  const hp = Math.max(1, Math.round(target.maxHp * (reviving ? 0.35 : 0.3)));
  const energy = Math.max(1, Math.round(target.maxBattleEnergy * (reviving ? 0.1 : 0.2)));
  return {
    currentHp: reviving ? hp : Math.min(target.maxHp, target.currentHp + hp),
    currentBattleEnergy: reviving ? energy : Math.min(target.maxBattleEnergy, target.currentBattleEnergy + energy),
  };
}

export function useFieldTonic(
  save: GameSave,
  state: BattleState,
  targetId: BattleCombatantId,
): BattleOutfitterCombatResult {
  const target = state.combatants[targetId];
  if (!target || target.sideId !== "player") {
    return { save, state, ok: false, message: "Select a ranch-team creature for the Field Tonic." };
  }
  if (target.isFainted) {
    return { save, state, ok: false, message: "Field Tonic cannot revive a fainted creature." };
  }
  if (
    target.currentHp >= target.maxHp &&
    target.currentBattleEnergy >= target.maxBattleEnergy
  ) {
    return { save, state, ok: false, message: `${target.name} is already fully restored.` };
  }

  const nextSave = consumeBattleOutfitterItem(save, FIELD_TONIC_ID);
  if (!nextSave) {
    return { save, state, ok: false, message: "No Field Tonic is available." };
  }

  const nextTarget = { ...target, ...getSupportItemVitals(target, "tonic") };
  const hpGain = nextTarget.currentHp - target.currentHp;

  return {
    save: nextSave,
    state: {
      ...state,
      combatants: { ...state.combatants, [targetId]: nextTarget },
      log: [
        ...state.log,
        `${target.name} used a Field Tonic and restored HP and Battle Energy.`,
      ],
    },
    ok: true,
    message: `Field Tonic restored ${target.name}.${hpGain > 0 ? ` +${hpGain} HP` : ""}`,
  };
}

export function useRevivalSalve(
  save: GameSave,
  state: BattleState,
  targetId: BattleCombatantId,
): BattleOutfitterCombatResult {
  const target = state.combatants[targetId];
  if (!target || target.sideId !== "player") {
    return { save, state, ok: false, message: "Select a ranch-team creature for the Revival Salve." };
  }
  if (!target.isFainted) {
    return { save, state, ok: false, message: "Revival Salve can only target a fainted creature." };
  }

  const nextSave = consumeBattleOutfitterItem(save, REVIVAL_SALVE_ID);
  if (!nextSave) {
    return { save, state, ok: false, message: "No Revival Salve is available." };
  }

  const nextTarget = {
    ...target,
    ...getSupportItemVitals(target, "revival"),
    statuses: [],
    isFainted: false,
  };
  const entries: BattleLogEntry[] = [`${target.name} was revived with a Revival Salve at 35% HP.`];
  const clearedStatuses = [...new Set(target.statuses.filter(status => status.duration > 0).map(status => status.status))];
  if (clearedStatuses.length) {
    const labels = clearedStatuses.map(status => getBattleStatusGlossary(status).label);
    entries.push({ text: `${target.name}: Revival Salve cleared ${labels.join(", ")}.`, category: "status-changes" });
  }

  return {
    save: nextSave,
    state: appendBattleLog({
      ...state,
      outcome: "ongoing",
      combatants: { ...state.combatants, [targetId]: nextTarget },
    }, entries),
    ok: true,
    message: `${target.name} returned to the battle. +${nextTarget.currentHp - target.currentHp} HP`,
  };
}
