import { calculateBattleStats } from "@/data/battleStats";
import { applyOutfitterStatBonuses, getBattleOutfitterCreatureEffectSummary } from "@/data/battleOutfitterIntegration";
import { getEquipmentSlots, previewEquipmentSave, BATTLE_OUTFITTER_ITEMS, type BattleOutfitterItem } from "@/data/battleOutfitter";
import type { BattleStatKey } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";

export const BATTLE_STAT_LABELS: Record<BattleStatKey, string> = {
  maxHp: "Max HP", physicalPower: "Physical Power", specialPower: "Special Power", defense: "Defense",
  resistance: "Resistance", speed: "Speed", accuracy: "Accuracy", evasion: "Evasion",
  statusPower: "Status Power", statusResist: "Status Resist", battleEnergy: "Max Battle Energy",
};

/** Shares both the baseline and bonus application with battle creation. Grades are never written. */
export function compareEquipment(save: GameSave, creature: CreatureRecord, item: BattleOutfitterItem) {
  const base = calculateBattleStats(creature);
  const current = applyOutfitterStatBonuses(base, getBattleOutfitterCreatureEffectSummary(save, creature.creatureId));
  const after = applyOutfitterStatBonuses(base, getBattleOutfitterCreatureEffectSummary(previewEquipmentSave(save, creature.creatureId, item), creature.creatureId));
  const previousId = item.equipmentSlot ? getEquipmentSlots(save, creature.creatureId)[item.equipmentSlot] : null;
  return {
    previous: BATTLE_OUTFITTER_ITEMS.find(entry => entry.itemId === previousId) ?? null,
    rows: (Object.keys(current) as BattleStatKey[]).map(key => ({ key, label: BATTLE_STAT_LABELS[key], current: current[key], after: after[key], delta: after[key] - current[key] })),
    base, current, after,
  };
}
