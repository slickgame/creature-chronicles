import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type BattleOutfitterItemId =
  | "sparring_wraps"
  | "guard_charm"
  | "focus_manual"
  | "team_tactics_kit"
  | "field_tonic"
  | "revival_salve";

export type BattleOutfitterCategory =
  | "Equipment"
  | "Manual"
  | "Consumable"
  | "Team Prep";

export type BattleLoadoutSlot = "offense" | "defense";
export type BattleReadinessTier = "Unprepared" | "Prepared" | "Ready" | "Elite";

export type BattleOutfitterItem = {
  itemId: BattleOutfitterItemId;
  name: string;
  category: BattleOutfitterCategory;
  description: string;
  costGold: number;
  materialCost: number;
  iconPath: string;
  effectLabel: string;
  flagKey: string;
  maxStock?: number;
  loadoutSlot?: BattleLoadoutSlot;
  readinessValue?: number;
};

export type BattleLoadout = {
  offenseItemId: BattleOutfitterItemId | null;
  defenseItemId: BattleOutfitterItemId | null;
  manualRank: number;
  readinessScore: number;
  readinessTier: BattleReadinessTier;
  labels: string[];
};

export type BattleOutfitterSummary = {
  totalStock: number;
  equipmentStock: number;
  manualStock: number;
  consumableStock: number;
  teamPrepStock: number;
  assignedEquipment: number;
  manualRanks: number;
  readyCreatures: number;
  eliteCreatures: number;
  averageReadiness: number;
  materialStock: number;
};

export type BattleOutfitterResult = {
  save: GameSave;
  ok: boolean;
  message: string;
};

export const DARIAN_VOSS = {
  npcId: "darian_voss",
  name: "Darian Voss",
  title: "Battle Outfitter",
  portraitPath: "/images/npcs/town/darian_voss_portrait.png",
  profilePath: "/images/npcs/town/darian_voss_profile.png",
  intro:
    "Darian Voss keeps the town's combat shelves stocked with safe training gear, manuals, and battle-prep supplies.",
} as const;

export const BATTLE_OUTFITTER_ITEMS: BattleOutfitterItem[] = [
  {
    itemId: "sparring_wraps",
    name: "Sparring Wraps",
    category: "Equipment",
    description: "Basic combat wraps used in future battle loadouts.",
    costGold: 160,
    materialCost: 2,
    iconPath: "/images/ui/icons/icon_training_whistle.png",
    effectLabel:
      "+1 Sparring Wraps stock. Can be assigned to a creature offense slot.",
    flagKey: "battleItem_sparringWraps",
    loadoutSlot: "offense",
    readinessValue: 2,
  },
  {
    itemId: "guard_charm",
    name: "Guard Charm",
    category: "Equipment",
    description: "A defensive charm for future protector builds.",
    costGold: 190,
    materialCost: 3,
    iconPath: "/images/ui/icons/icon_lock_favorite.png",
    effectLabel:
      "+1 Guard Charm stock. Can be assigned to a creature defense slot.",
    flagKey: "battleItem_guardCharms",
    loadoutSlot: "defense",
    readinessValue: 2,
  },
  {
    itemId: "focus_manual",
    name: "Focus Manual",
    category: "Manual",
    description:
      "A printed move-training reference for future skill and loadout changes.",
    costGold: 225,
    materialCost: 4,
    iconPath: "/images/ui/icons/icon_collection_book.png",
    effectLabel: "+1 Focus Manual stock. Can be used for +1 creature manual rank, max 3.",
    flagKey: "battleItem_focusManuals",
    readinessValue: 1,
  },
  {
    itemId: "team_tactics_kit",
    name: "Team Tactics Kit",
    category: "Team Prep",
    description: "A planning kit for future team-role setups.",
    costGold: 275,
    materialCost: 5,
    iconPath: "/images/ui/icons/icon_guild_points.png",
    effectLabel: "+1 Team Tactics Kit stock. Future formation/loadout support.",
    flagKey: "battleItem_tacticsKits",
    readinessValue: 1,
  },
  {
    itemId: "field_tonic",
    name: "Field Tonic",
    category: "Consumable",
    description: "A safe combat-prep tonic intended for future PvE challenge attempts.",
    costGold: 120,
    materialCost: 1,
    iconPath: "/images/ui/icons/icon_energy.png",
    effectLabel: "+1 Field Tonic stock. Future battle consumable.",
    flagKey: "battleItem_fieldTonics",
    maxStock: 12,
    readinessValue: 1,
  },
  {
    itemId: "revival_salve",
    name: "Revival Salve",
    category: "Consumable",
    description: "Emergency salve for future combat recovery rules.",
    costGold: 260,
    materialCost: 6,
    iconPath: "/images/ui/icons/icon_repair_kit.png",
    effectLabel: "+1 Revival Salve stock. Future recovery consumable.",
    flagKey: "battleItem_revivalSalves",
    maxStock: 6,
    readinessValue: 1,
  },
];

function getFlagNumber(
  value: boolean | number | string | undefined,
  fallback = 0,
): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function getFlagString(value: boolean | number | string | undefined): string {
  return typeof value === "string" ? value : "";
}

function getItem(itemId: string): BattleOutfitterItem | null {
  return BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === itemId) ?? null;
}

function getSlotFlag(creatureId: CreatureId, slot: BattleLoadoutSlot): string {
  return `battleLoadout_${creatureId}_${slot}`;
}

function getManualFlag(creatureId: CreatureId): string {
  return `battleManualRank_${creatureId}`;
}

function getTier(score: number): BattleReadinessTier {
  if (score >= 7) return "Elite";
  if (score >= 5) return "Ready";
  if (score >= 2) return "Prepared";
  return "Unprepared";
}

export function getBattleOutfitterMaterialStock(save: GameSave): number {
  return getFlagNumber(save.flags.ranchMaterialsStock);
}

export function getBattleOutfitterStock(
  save: GameSave,
  item: BattleOutfitterItem,
): number {
  return getFlagNumber(save.flags[item.flagKey]);
}

export function getBattleOutfitterCostLabel(item: BattleOutfitterItem): string {
  return `${item.costGold} Gold + ${item.materialCost} Materials`;
}

export function getBattleLoadout(
  save: GameSave,
  creatureId: CreatureId,
): BattleLoadout {
  const offenseItem = getItem(getFlagString(save.flags[getSlotFlag(creatureId, "offense")]));
  const defenseItem = getItem(getFlagString(save.flags[getSlotFlag(creatureId, "defense")]));
  const manualRank = Math.min(3, getFlagNumber(save.flags[getManualFlag(creatureId)]));
  const readinessScore =
    (offenseItem?.readinessValue ?? 0) +
    (defenseItem?.readinessValue ?? 0) +
    manualRank;
  const labels = [
    offenseItem?.name,
    defenseItem?.name,
    manualRank > 0 ? `Manual Rank ${manualRank}` : null,
  ].filter(Boolean) as string[];

  return {
    offenseItemId: offenseItem?.itemId ?? null,
    defenseItemId: defenseItem?.itemId ?? null,
    manualRank,
    readinessScore,
    readinessTier: getTier(readinessScore),
    labels,
  };
}

export function getBattleReadinessLabel(
  save: GameSave,
  creatureId: CreatureId,
): string {
  const loadout = getBattleLoadout(save, creatureId);
  return `${loadout.readinessTier} • Readiness ${loadout.readinessScore}${
    loadout.labels.length ? ` • ${loadout.labels.join(" • ")}` : " • No loadout"
  }`;
}

export function getBattleOutfitterSummary(save: GameSave): BattleOutfitterSummary {
  const base = BATTLE_OUTFITTER_ITEMS.reduce(
    (summary, item) => {
      const stock = getBattleOutfitterStock(save, item);
      return {
        ...summary,
        totalStock: summary.totalStock + stock,
        equipmentStock:
          summary.equipmentStock + (item.category === "Equipment" ? stock : 0),
        manualStock: summary.manualStock + (item.category === "Manual" ? stock : 0),
        consumableStock:
          summary.consumableStock + (item.category === "Consumable" ? stock : 0),
        teamPrepStock:
          summary.teamPrepStock + (item.category === "Team Prep" ? stock : 0),
      };
    },
    {
      totalStock: 0,
      equipmentStock: 0,
      manualStock: 0,
      consumableStock: 0,
      teamPrepStock: 0,
      assignedEquipment: 0,
      manualRanks: 0,
      readyCreatures: 0,
      eliteCreatures: 0,
      averageReadiness: 0,
      materialStock: getBattleOutfitterMaterialStock(save),
    },
  );

  const creatures = save.creatures ?? [];
  const withLoadouts = creatures.reduce((summary, creature) => {
    const loadout = getBattleLoadout(save, creature.creatureId);
    return {
      ...summary,
      assignedEquipment:
        summary.assignedEquipment +
        (loadout.offenseItemId ? 1 : 0) +
        (loadout.defenseItemId ? 1 : 0),
      manualRanks: summary.manualRanks + loadout.manualRank,
      readyCreatures: summary.readyCreatures + (loadout.readinessScore >= 5 ? 1 : 0),
      eliteCreatures: summary.eliteCreatures + (loadout.readinessScore >= 7 ? 1 : 0),
      averageReadiness: summary.averageReadiness + loadout.readinessScore,
    };
  }, base);

  return {
    ...withLoadouts,
    averageReadiness: creatures.length
      ? Math.round((withLoadouts.averageReadiness / creatures.length) * 10) / 10
      : 0,
  };
}

export function getBattleOutfitterDailySummaryItems(save: GameSave): string[] {
  const summary = getBattleOutfitterSummary(save);
  if (summary.assignedEquipment <= 0 && summary.manualRanks <= 0) return [];

  const readyText =
    summary.readyCreatures > 0
      ? `${summary.readyCreatures} creature${summary.readyCreatures === 1 ? " is" : "s are"} battle-ready.`
      : "No creature is battle-ready yet.";

  return [
    `Battle prep: ${summary.assignedEquipment} equipment piece${
      summary.assignedEquipment === 1 ? "" : "s"
    } assigned, ${summary.manualRanks} manual rank${
      summary.manualRanks === 1 ? "" : "s"
    } learned. ${readyText}`,
  ];
}

export function purchaseBattleOutfitterItem(
  save: GameSave,
  itemId: string,
): BattleOutfitterResult {
  const item = getItem(itemId);
  if (!item) return { save, ok: false, message: "Darian cannot find that item." };

  const currentStock = getBattleOutfitterStock(save, item);
  const materialStock = getBattleOutfitterMaterialStock(save);

  if (item.maxStock && currentStock >= item.maxStock) {
    return {
      save,
      ok: false,
      message: `${item.name} stock is already full (${currentStock}/${item.maxStock}).`,
    };
  }

  if (save.currencies.gold < item.costGold) {
    return { save, ok: false, message: `Need ${item.costGold} Gold for ${item.name}.` };
  }

  if (materialStock < item.materialCost) {
    return {
      save,
      ok: false,
      message: `Need ${item.materialCost} Materials for ${item.name}. Current stock: ${materialStock}.`,
    };
  }

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      currencies: { ...save.currencies, gold: save.currencies.gold - item.costGold },
      flags: {
        ...save.flags,
        m51BattleOutfitter: true,
        m53CombatReadiness: true,
        m54BattleOutfitterEconomy: true,
        ranchMaterialsStock: Math.max(0, materialStock - item.materialCost),
        [item.flagKey]: currentStock + 1,
      },
    },
    ok: true,
    message: `${item.name} purchased for ${getBattleOutfitterCostLabel(item)}. ${item.effectLabel}`,
  };
}

export function assignBattleOutfitterEquipment(
  save: GameSave,
  creatureId: CreatureId,
  itemId: BattleOutfitterItemId,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for loadout." };

  const item = getItem(itemId);
  if (!item || item.category !== "Equipment" || !item.loadoutSlot) {
    return {
      save,
      ok: false,
      message: "Only equipment can be assigned to combat loadout slots.",
    };
  }

  const stock = getBattleOutfitterStock(save, item);
  if (stock <= 0) return { save, ok: false, message: `No ${item.name} in stock.` };

  const slotFlag = getSlotFlag(creatureId, item.loadoutSlot);
  const previousItem = getItem(getFlagString(save.flags[slotFlag]));
  if (previousItem?.itemId === item.itemId) {
    return { save, ok: false, message: `${creature.nickname} already has ${item.name} assigned.` };
  }

  const previousStock = previousItem ? getBattleOutfitterStock(save, previousItem) : 0;
  const nextFlags = {
    ...save.flags,
    m52BattleLoadouts: true,
    m53CombatReadiness: true,
    [item.flagKey]: stock - 1,
    ...(previousItem ? { [previousItem.flagKey]: previousStock + 1 } : {}),
    [slotFlag]: item.itemId,
  };

  return {
    save: { ...save, updatedAt: new Date().toISOString(), flags: nextFlags },
    ok: true,
    message: `${item.name} assigned to ${creature.nickname}'s ${item.loadoutSlot} slot. ${getBattleReadinessLabel(
      { ...save, flags: nextFlags },
      creatureId,
    )}`,
  };
}

export function removeBattleOutfitterEquipment(
  save: GameSave,
  creatureId: CreatureId,
  slot: BattleLoadoutSlot,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for loadout." };

  const slotFlag = getSlotFlag(creatureId, slot);
  const previousItem = getItem(getFlagString(save.flags[slotFlag]));
  if (!previousItem) {
    return { save, ok: false, message: `${creature.nickname} has no ${slot} equipment assigned.` };
  }

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      flags: {
        ...save.flags,
        m52BattleLoadouts: true,
        m53CombatReadiness: true,
        [previousItem.flagKey]: getBattleOutfitterStock(save, previousItem) + 1,
        [slotFlag]: "",
      },
    },
    ok: true,
    message: `${previousItem.name} removed from ${creature.nickname} and returned to stock.`,
  };
}

export function useBattleOutfitterManual(
  save: GameSave,
  creatureId: CreatureId,
): BattleOutfitterResult {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for manual use." };

  const manual = getItem("focus_manual");
  if (!manual) return { save, ok: false, message: "Focus Manual is missing from Darian's records." };

  const stock = getBattleOutfitterStock(save, manual);
  if (stock <= 0) return { save, ok: false, message: "No Focus Manual in stock." };

  const currentRank = getBattleLoadout(save, creatureId).manualRank;
  if (currentRank >= 3) {
    return {
      save,
      ok: false,
      message: `${creature.nickname}'s manual rank is already maxed at 3.`,
    };
  }

  const nextFlags = {
    ...save.flags,
    m52BattleLoadouts: true,
    m53CombatReadiness: true,
    [manual.flagKey]: stock - 1,
    [getManualFlag(creatureId)]: currentRank + 1,
  };

  return {
    save: { ...save, updatedAt: new Date().toISOString(), flags: nextFlags },
    ok: true,
    message: `${creature.nickname} studied a Focus Manual. ${getBattleReadinessLabel(
      { ...save, flags: nextFlags },
      creatureId,
    )}`,
  };
}
