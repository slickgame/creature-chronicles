import * as core from "./battleOutfitter";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type {
  BattleLoadout,
  BattleLoadoutSlot,
  BattleOutfitterCategory,
  BattleOutfitterItem,
  BattleOutfitterItemId,
  BattleOutfitterResult,
  BattleOutfitterSummary,
  BattleReadinessTier,
} from "./battleOutfitter";

const ACTIVE_ITEM_TEXT = {
  sparring_wraps: {
    description: "Combat wraps that improve striking power and accuracy while assigned to a creature.",
    effectLabel: "+6 Physical Power, +4 Special Power, and +3 Accuracy in battle.",
  },
  guard_charm: {
    description: "A defensive charm that reinforces health, defenses, and resistance to hostile effects.",
    effectLabel: "+12 Max HP, +5 Defense, +5 Resistance, and +3 Status Resist in battle.",
  },
  focus_manual: {
    description: "Permanent combat study. Each rank improves precision, status techniques, and Battle Energy capacity.",
    effectLabel: "Each rank grants +2 Accuracy, +2 Status Power, and +2 maximum Battle Energy. Maximum rank 3.",
  },
  team_tactics_kit: {
    description: "A one-battle team preparation kit that can be armed before entering the arena.",
    effectLabel: "Consumed at battle start: all ranch creatures begin Inspired for 1 round and gain 10 Battle Energy.",
  },
  field_tonic: {
    description: "A once-per-battle restorative used on a living ranch creature between rounds.",
    effectLabel: "Restores 30% maximum HP and 20% maximum Battle Energy to one living ally.",
  },
  revival_salve: {
    description: "An emergency once-per-battle salve for returning a fainted ranch creature to combat.",
    effectLabel: "Revives one fainted ally at 35% HP and 10% Battle Energy, clearing current statuses.",
  },
} as const;

export const DARIA_VOSS = core.DARIA_VOSS;

export const BATTLE_OUTFITTER_ITEMS = core.BATTLE_OUTFITTER_ITEMS.map((item) => ({
  ...item,
  ...ACTIVE_ITEM_TEXT[item.itemId],
}));

export const getBattleLoadout = core.getBattleLoadout;
export const getBattleOutfitterCostLabel = core.getBattleOutfitterCostLabel;
export const getBattleOutfitterDailySummaryItems = core.getBattleOutfitterDailySummaryItems;
export const getBattleOutfitterMaterialStock = core.getBattleOutfitterMaterialStock;
export const getBattleOutfitterStock = core.getBattleOutfitterStock;
export const getBattleOutfitterSummary = core.getBattleOutfitterSummary;
export const getBattleReadinessLabel = core.getBattleReadinessLabel;
export const assignBattleOutfitterEquipment = core.assignBattleOutfitterEquipment;
export const removeBattleOutfitterEquipment = core.removeBattleOutfitterEquipment;

export function purchaseBattleOutfitterItem(save: GameSave, itemId: string) {
  const result = core.purchaseBattleOutfitterItem(save, itemId);
  if (!result.ok) return result;
  const activeItem = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId);
  return {
    ...result,
    message: activeItem
      ? `${activeItem.name} purchased for ${core.getBattleOutfitterCostLabel(activeItem)}. ${activeItem.effectLabel}`
      : result.message,
  };
}

export function useBattleOutfitterManual(save: GameSave, creatureId: CreatureId) {
  const result = core.useBattleOutfitterManual(save, creatureId);
  if (!result.ok) return result;
  const rank = core.getBattleLoadout(result.save, creatureId).manualRank;
  return {
    ...result,
    message: `${result.message} Focus Training rank ${rank} is active in battle: +${rank * 2} Accuracy, +${rank * 2} Status Power, and +${rank * 2} maximum Battle Energy.`,
  };
}
