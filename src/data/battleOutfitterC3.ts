import * as active from "./battleOutfitterActive";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type BattleOutfitterItemId =
  | "sparring_wraps"
  | "guard_charm"
  | "focus_manual"
  | "team_tactics_kit"
  | "field_tonic"
  | "revival_salve"
  | "arena_blade_wraps"
  | "focus_prism"
  | "bastion_badge"
  | "tactician_emblem"
  | "champion_harness";

export type BattleOutfitterCategory = "Equipment" | "Manual" | "Consumable" | "Team Prep";
export const EQUIPMENT_SLOTS = ["weapon", "armor", "head", "handsFeet", "accessory"] as const;
export type EquipmentSlot = typeof EQUIPMENT_SLOTS[number];
export type BattleLoadoutSlot = "offense" | "defense" | "utility" | EquipmentSlot;
export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = { weapon: "Weapon", armor: "Armor", head: "Head", handsFeet: "Hands / Feet", accessory: "Accessory" };
const ITEM_SLOTS: Partial<Record<BattleOutfitterItemId, EquipmentSlot>> = {
  sparring_wraps: "handsFeet", arena_blade_wraps: "weapon", focus_prism: "weapon",
  guard_charm: "accessory", bastion_badge: "armor", tactician_emblem: "accessory", champion_harness: "armor",
};
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
  equipmentSlot?: EquipmentSlot;
  readinessValue?: number;
  coliseumExclusive?: boolean;
};

export type BattleLoadout = {
  equipment: Record<EquipmentSlot, BattleOutfitterItemId | null>;
  offenseItemId: BattleOutfitterItemId | null;
  defenseItemId: BattleOutfitterItemId | null;
  utilityItemId: BattleOutfitterItemId | null;
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

export type BattleOutfitterResult = { save: GameSave; ok: boolean; message: string };

export const DARIA_VOSS = active.DARIA_VOSS;

const COLISEUM_ITEMS: BattleOutfitterItem[] = [
  {
    itemId: "arena_blade_wraps",
    name: "Arena Blade Wraps",
    category: "Equipment",
    description: "Bronze-circuit wraps balanced for force, speed, and reliable finishing pressure.",
    costGold: 0,
    materialCost: 0,
    iconPath: "/images/ui/icons/icon_ability_trigger.png",
    effectLabel: "+8 Physical Power, +3 Speed, and +3 Accuracy in battle.",
    flagKey: "coliseumGear_arenaBladeWraps",
    loadoutSlot: "offense",
    readinessValue: 4,
    coliseumExclusive: true,
  },
  {
    itemId: "focus_prism",
    name: "Focus Prism",
    category: "Equipment",
    description: "A Silver-circuit lens that channels special techniques and hostile status pressure.",
    costGold: 0,
    materialCost: 0,
    iconPath: "/images/ui/icons/icon_collection_book.png",
    effectLabel: "+8 Special Power, +5 Status Power, and +3 Accuracy in battle.",
    flagKey: "coliseumGear_focusPrisms",
    loadoutSlot: "offense",
    readinessValue: 4,
    coliseumExclusive: true,
  },
  {
    itemId: "bastion_badge",
    name: "Bastion Badge",
    category: "Equipment",
    description: "A reinforced Silver-circuit badge worn by dedicated protectors and endurance specialists.",
    costGold: 0,
    materialCost: 0,
    iconPath: "/images/ui/icons/icon_lock_favorite.png",
    effectLabel: "+18 Max HP, +7 Defense, +5 Resistance, and +4 Status Resist in battle.",
    flagKey: "coliseumGear_bastionBadges",
    loadoutSlot: "defense",
    readinessValue: 4,
    coliseumExclusive: true,
  },
  {
    itemId: "tactician_emblem",
    name: "Tactician Emblem",
    category: "Equipment",
    description: "A utility emblem for quicker turns, stronger support effects, and deeper Battle Energy reserves.",
    costGold: 0,
    materialCost: 0,
    iconPath: "/images/ui/icons/icon_guild_points.png",
    effectLabel: "+3 Speed, +3 Status Power, +2 Status Resist, and +8 maximum Battle Energy.",
    flagKey: "coliseumGear_tacticianEmblems",
    loadoutSlot: "utility",
    readinessValue: 4,
    coliseumExclusive: true,
  },
  {
    itemId: "champion_harness",
    name: "Champion Harness",
    category: "Equipment",
    description: "A one-per-save Crown harness combining offense, defense, precision, and team-command reserves.",
    costGold: 0,
    materialCost: 0,
    iconPath: "/images/ui/icons/icon_upgrade_arrow.png",
    effectLabel: "+12 Max HP, +4 Physical and Special Power, +4 Defense and Resistance, +2 Accuracy, and +10 maximum Battle Energy.",
    flagKey: "coliseumGear_championHarnesses",
    maxStock: 1,
    loadoutSlot: "utility",
    readinessValue: 6,
    coliseumExclusive: true,
  },
];

export const BATTLE_OUTFITTER_ITEMS: BattleOutfitterItem[] = [
  ...(active.BATTLE_OUTFITTER_ITEMS as BattleOutfitterItem[]),
  ...COLISEUM_ITEMS,
].map(item => ({ ...item, equipmentSlot: ITEM_SLOTS[item.itemId], iconPath: `/images/ui/outfitter-v1/${item.itemId}.webp` }));

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function getFlagString(value: boolean | number | string | undefined): string {
  return typeof value === "string" ? value : "";
}

function getItem(itemId: string): BattleOutfitterItem | null {
  return BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

function getSlotFlag(creatureId: CreatureId, slot: BattleLoadoutSlot): string {
  return `battleLoadout_${creatureId}_${slot}`;
}

/** Read-time migration is pure; the next successful transaction persists it once.
 * A collision returns the displaced piece to stock, preserving every owned copy. */
export function normalizeBattleEquipment(save: GameSave): GameSave {
  let changed = false;
  const flags = { ...save.flags };
  for (const creature of save.creatures ?? []) {
    const id = creature.creatureId;
    const marker = `battleEquipmentV1_${id}`;
    if (flags[marker] === true) continue;
    changed = true;
    for (const legacy of ["offense", "defense", "utility"] as const) {
      const oldKey = getSlotFlag(id, legacy);
      const item = getItem(getFlagString(flags[oldKey]));
      if (item?.equipmentSlot) {
        const key = equipmentFlag(id, item.equipmentSlot);
        if (!flags[key]) flags[key] = item.itemId;
        else flags[item.flagKey] = getFlagNumber(flags[item.flagKey]) + 1;
      }
      flags[oldKey] = "";
    }
    flags[marker] = true;
  }
  return changed ? { ...save, flags } : save;
}

function equipmentFlag(id: CreatureId, slot: EquipmentSlot): string {
  return `battleEquipment_${id}_${slot}`;
}

export function getEquipmentSlots(save: GameSave, id: CreatureId): Record<EquipmentSlot, BattleOutfitterItemId | null> {
  const normalized = normalizeBattleEquipment(save);
  return Object.fromEntries(EQUIPMENT_SLOTS.map(slot => {
    const item = getItem(getFlagString(normalized.flags[equipmentFlag(id, slot)]));
    return [slot, item?.equipmentSlot === slot ? item.itemId : null];
  })) as Record<EquipmentSlot, BattleOutfitterItemId | null>;
}

function resolveSlot(save: GameSave, id: CreatureId, slot: BattleLoadoutSlot): EquipmentSlot | undefined {
  if ((EQUIPMENT_SLOTS as readonly string[]).includes(slot)) return slot as EquipmentSlot;
  return EQUIPMENT_SLOTS.find(key => getItem(getEquipmentSlots(save, id)[key] ?? "")?.loadoutSlot === slot);
}

/** Hypothetical replacement for comparisons; never spends stock or mutates a save. */
export function previewEquipmentSave(save: GameSave, id: CreatureId, item: BattleOutfitterItem): GameSave {
  const normalized = normalizeBattleEquipment(save);
  if (!item.equipmentSlot) return normalized;
  return { ...normalized, flags: { ...normalized.flags, [equipmentFlag(id, item.equipmentSlot)]: item.itemId } };
}

function getManualFlag(creatureId: CreatureId): string {
  return `battleManualRank_${creatureId}`;
}

function getTier(score: number): BattleReadinessTier {
  if (score >= 10) return "Elite";
  if (score >= 6) return "Ready";
  if (score >= 2) return "Prepared";
  return "Unprepared";
}

export function getBattleOutfitterMaterialStock(save: GameSave): number {
  return getFlagNumber(save.flags.ranchMaterialsStock);
}

export function getBattleOutfitterStock(save: GameSave, item: BattleOutfitterItem): number {
  return getFlagNumber(save.flags[item.flagKey]);
}

export function getBattleOutfitterCostLabel(item: BattleOutfitterItem): string {
  return item.coliseumExclusive ? "Coliseum Marks Exchange" : `${item.costGold} Gold + ${item.materialCost} Materials`;
}

export function getBattleLoadout(save: GameSave, creatureId: CreatureId): BattleLoadout {
  const equipment = getEquipmentSlots(save, creatureId);
  const items = Object.values(equipment).map(id => getItem(id ?? "")).filter((item): item is BattleOutfitterItem => Boolean(item));
  const manualRank = Math.min(3, getFlagNumber(save.flags[getManualFlag(creatureId)]));
  const readinessScore = items.reduce((sum, item) => sum + (item.readinessValue ?? 0), manualRank);
  return {
    equipment,
    // Legacy projections are retained for older read-only consumers.
    offenseItemId: items.find(item => item.loadoutSlot === "offense")?.itemId ?? null,
    defenseItemId: items.find(item => item.loadoutSlot === "defense")?.itemId ?? null,
    utilityItemId: items.find(item => item.loadoutSlot === "utility")?.itemId ?? null,
    manualRank, readinessScore, readinessTier: getTier(readinessScore),
    labels: [...items.map(item => item.name), ...(manualRank ? [`Focus Training ${manualRank}`] : [])],
  };
}

export function getBattleReadinessLabel(save: GameSave, creatureId: CreatureId): string {
  const loadout = getBattleLoadout(save, creatureId);
  return `${loadout.readinessTier} • Readiness ${loadout.readinessScore}${loadout.labels.length ? ` • ${loadout.labels.join(" • ")}` : " • No loadout"}`;
}

export function getBattleOutfitterSummary(save: GameSave): BattleOutfitterSummary {
  save = normalizeBattleEquipment(save);
  const stockSummary = BATTLE_OUTFITTER_ITEMS.reduce(
    (summary, item) => {
      const stock = getBattleOutfitterStock(save, item);
      summary.totalStock += stock;
      if (item.category === "Equipment") summary.equipmentStock += stock;
      else if (item.category === "Manual") summary.manualStock += stock;
      else if (item.category === "Consumable") summary.consumableStock += stock;
      else if (item.category === "Team Prep") summary.teamPrepStock += stock;
      return summary;
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
  for (const creature of creatures) {
    const loadout = getBattleLoadout(save, creature.creatureId);
    stockSummary.assignedEquipment += Object.values(loadout.equipment).filter(Boolean).length;
    stockSummary.manualRanks += loadout.manualRank;
    stockSummary.readyCreatures += loadout.readinessScore >= 6 ? 1 : 0;
    stockSummary.eliteCreatures += loadout.readinessScore >= 10 ? 1 : 0;
    stockSummary.averageReadiness += loadout.readinessScore;
  }
  stockSummary.averageReadiness = creatures.length ? Math.round((stockSummary.averageReadiness / creatures.length) * 10) / 10 : 0;
  return stockSummary;
}

export function getBattleOutfitterDailySummaryItems(save: GameSave): string[] {
  const summary = getBattleOutfitterSummary(save);
  if (summary.assignedEquipment <= 0 && summary.manualRanks <= 0) return [];
  return [`Battle prep: ${summary.assignedEquipment} equipment pieces assigned across five equipment slots; ${summary.manualRanks} Focus Training ranks learned.`];
}

export function purchaseBattleOutfitterItem(save: GameSave, itemId: string): BattleOutfitterResult {
  const item = getItem(itemId);
  if (!item) return { save, ok: false, message: "Daria cannot find that item." };
  if (item.coliseumExclusive) {
    return { save, ok: false, message: `${item.name} is exclusive to the Coliseum Marks Exchange.` };
  }
  return active.purchaseBattleOutfitterItem(normalizeBattleEquipment(save), itemId);
}

export function assignBattleOutfitterEquipment(
  save: GameSave,
  creatureId: CreatureId,
  itemId: BattleOutfitterItemId,
): BattleOutfitterResult {
  save = normalizeBattleEquipment(save);
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for loadout." };
  const item = getItem(itemId);
  if (!item || item.category !== "Equipment" || !item.equipmentSlot) {
    return { save, ok: false, message: "Only equipment can be assigned to combat loadout slots." };
  }
  const stock = getBattleOutfitterStock(save, item);
  if (stock <= 0) return { save, ok: false, message: `No ${item.name} in stock.` };
  const slotFlag = equipmentFlag(creatureId, item.equipmentSlot);
  const previousItem = getItem(getFlagString(save.flags[slotFlag]));
  if (previousItem?.itemId === item.itemId) return { save, ok: false, message: `${creature.nickname} already has ${item.name} assigned.` };
  const nextFlags = {
    ...save.flags,
    m52BattleLoadouts: true,
    m53CombatReadiness: true,
    mColiseumC3Equipment: true,
    [item.flagKey]: stock - 1,
    ...(previousItem ? { [previousItem.flagKey]: getBattleOutfitterStock(save, previousItem) + 1 } : {}),
    [slotFlag]: item.itemId,
  };
  const nextSave = { ...save, updatedAt: new Date().toISOString(), flags: nextFlags };
  return { save: nextSave, ok: true, message: `${item.name} assigned to ${creature.nickname}'s ${EQUIPMENT_SLOT_LABELS[item.equipmentSlot]} slot. ${getBattleReadinessLabel(nextSave, creatureId)}` };
}

export function removeBattleOutfitterEquipment(
  save: GameSave,
  creatureId: CreatureId,
  slot: BattleLoadoutSlot,
): BattleOutfitterResult {
  save = normalizeBattleEquipment(save);
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found for loadout." };
  const resolved = resolveSlot(save, creatureId, slot);
  if (!resolved) return { save, ok: false, message: "No equipment in that slot." };
  const slotFlag = equipmentFlag(creatureId, resolved);
  const previousItem = getItem(getFlagString(save.flags[slotFlag]));
  if (!previousItem) return { save, ok: false, message: `${creature.nickname} has no ${slot} equipment assigned.` };
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

export function useBattleOutfitterManual(save: GameSave, creatureId: CreatureId): BattleOutfitterResult {
  const result = active.useBattleOutfitterManual(normalizeBattleEquipment(save), creatureId);
  if (!result.ok) return result;
  return { ...result, message: `Focus Manual studied. ${getBattleReadinessLabel(result.save, creatureId)}. This rank adds +2 Accuracy, +2 Status Power and +2 maximum Battle Energy. Innate grades are unchanged.` };
}
