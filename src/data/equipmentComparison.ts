import { calculateBattleStats } from "@/data/battleStats";
import { applyOutfitterStatBonuses, getBattleOutfitterCreatureEffectSummary } from "@/data/battleOutfitterIntegration";
import { getEquipmentSlots, previewEquipmentSave, BATTLE_OUTFITTER_ITEMS, type BattleOutfitterItem } from "@/data/battleOutfitter";
import type { BattleStatKey } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";

export {EQUIPMENT_STAT_NAMES as BATTLE_STAT_LABELS} from './equipmentRules';
import {EQUIPMENT_STAT_NAMES as BATTLE_STAT_LABELS} from './equipmentRules';

export function getEquippedBattleStats(save: GameSave, creature: CreatureRecord) {
  return applyOutfitterStatBonuses(calculateBattleStats(creature), getBattleOutfitterCreatureEffectSummary(save, creature.creatureId));
}

/** Shares both the baseline and bonus application with battle creation. Grades are never written. */
export function compareEquipment(save: GameSave, creature: CreatureRecord, item: BattleOutfitterItem, copyId?: string | null) {
  const base = calculateBattleStats(creature);
  const current = getEquippedBattleStats(save, creature);
  const currentSummary=getBattleOutfitterCreatureEffectSummary(save,creature.creatureId);
  const afterSummary=getBattleOutfitterCreatureEffectSummary(previewEquipmentSave(save, creature.creatureId, item, copyId),creature.creatureId);
  const after = applyOutfitterStatBonuses(base, afterSummary);
  const previousId = item.equipmentSlot ? getEquipmentSlots(save, creature.creatureId)[item.equipmentSlot] : null;
  return {
    previous: BATTLE_OUTFITTER_ITEMS.find(entry => entry.itemId === previousId) ?? null,
    rows: (Object.keys(current) as BattleStatKey[]).map(key => ({ key, label: BATTLE_STAT_LABELS[key], current: current[key], after: after[key], delta: after[key] - current[key] })),
    base, current, after, sets:{current:currentSummary.sets??[],after:afterSummary.sets??[]},
  };
}
