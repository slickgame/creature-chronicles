import type { GameSave } from "@/types/save";
import type { HabitatRecord } from "@/types/creature";
import type {
  RanchUpgradeDefinition,
  RanchUpgradeEffects,
  RanchUpgradeId,
  RanchUpgradePurchaseResult,
  RanchUpgradeState,
} from "@/types/ranchUpgrades";

export const BASE_FELINE_CAPACITY = 4;
export const BASE_CANINE_CAPACITY = 4;
export const BASE_BOVINE_CAPACITY = 4;
export const BASE_LAPINE_CAPACITY = 4;
export const BASE_EQUINE_CAPACITY = 4;
export const BASE_NURSERY_EGG_CAPACITY = 2;
export const BASE_PREGNANCY_DAYS = 3;
export const BASE_EGG_INCUBATION_DAYS = 6;
export const RANCH_REPAIR_MATERIAL_COST = 5;
export const RANCH_REPAIR_DAMAGE_AMOUNT = 20;

export const DEFAULT_RANCH_UPGRADES: RanchUpgradeState = {
  feline_habitat_capacity: 0,
  canine_habitat_capacity: 0,
  bovine_habitat_capacity: 0,
  lapine_habitat_capacity: 0,
  equine_habitat_capacity: 0,
  nursery_egg_capacity: 0,
  nursery_incubation_speed: 0,
  breeding_pen_comfort: 0,
  ranch_chores_board: 0,
  sleep_recovery: 0,
};

export const RANCH_UPGRADE_ASSETS = {
  officeBuilding: "/images/buildings/ranch/ranch_office.png",
  officeBackground: "/images/backgrounds/ranch/ranch_office_interior.png",
  ranchUpgrade: "/images/ui/icons/icon_ranch_upgrade.png",
  habitatCapacity: "/images/ui/icons/icon_habitat_capacity.png",
  felineHabitat: "/images/ui/icons/icon_feline_habitat_upgrade.png",
  canineHabitat: "/images/ui/icons/icon_canine_habitat_upgrade.png",
  bovineHabitat: "/images/buildings/ranch/bovine_habitat.png",
  lapineHabitat: "/images/buildings/ranch/lapine_habitat.png",
  equineHabitat: "/images/buildings/ranch/equine_habitat.png",
  nurseryUpgrade: "/images/ui/icons/icon_nursery_upgrade.png",
  breedingPenUpgrade: "/images/ui/icons/icon_breeding_pen_upgrade.png",
  choresBoard: "/images/ui/icons/icon_ranch_upgrade.png",
  ranchLedger: "/images/ui/icons/icon_ranch_ledger.png",
  sleepRecovery: "/images/ui/icons/icon_sleep_recovery.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
} as const;

const habitatTiers = [
  { tier: 1, costGold: 350, effectLabel: "+1 capacity" },
  { tier: 2, costGold: 750, costGp: 8, costMaterials: 3, effectLabel: "+2 total capacity" },
  { tier: 3, costGold: 1300, costGp: 20, costMaterials: 6, effectLabel: "+4 total capacity" },
  { tier: 4, costGold: 2200, costGp: 45, costMaterials: 10, effectLabel: "+6 total capacity" },
] as const;

export const RANCH_UPGRADE_DEFINITIONS: RanchUpgradeDefinition[] = [
  {
    upgradeId: "feline_habitat_capacity",
    category: "habitats",
    name: "Feline Habitat Expansion",
    description: "Adds more comfortable space for feline-family creatures. Base habitats are intentionally tight, so expansion matters once the ranch grows.",
    iconPath: RANCH_UPGRADE_ASSETS.felineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Feline capacity") })),
  },
  {
    upgradeId: "canine_habitat_capacity",
    category: "habitats",
    name: "Canine Habitat Expansion",
    description: "Adds more sturdy lodge space for canine-family creatures. Canine upgrades support future security, patrol, and protection systems.",
    iconPath: RANCH_UPGRADE_ASSETS.canineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Canine capacity") })),
  },
  {
    upgradeId: "bovine_habitat_capacity",
    category: "habitats",
    name: "Bovine Habitat Expansion",
    description: "Adds stable and pasture space for bovine-family creatures. Production lines need space before the feed economy can really scale.",
    iconPath: RANCH_UPGRADE_ASSETS.bovineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Bovine capacity") })),
  },
  {
    upgradeId: "lapine_habitat_capacity",
    category: "habitats",
    name: "Lapine Habitat Expansion",
    description: "Adds burrow, garden, and hutch space for lapine-family creatures. This supports fertility, garden, nursery, and comfort systems.",
    iconPath: RANCH_UPGRADE_ASSETS.lapineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Lapine capacity") })),
  },
  {
    upgradeId: "equine_habitat_capacity",
    category: "habitats",
    name: "Equine Habitat Expansion",
    description: "Adds stall, paddock, and field space for equine-family creatures. This supports hauling, field management, and travel work.",
    iconPath: RANCH_UPGRADE_ASSETS.equineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Equine capacity") })),
  },
  {
    upgradeId: "nursery_egg_capacity",
    category: "nursery",
    name: "Nursery Egg Capacity",
    description: "Adds more incubator space. The base nursery is deliberately cramped, so a serious breeding ranch needs more slots.",
    iconPath: RANCH_UPGRADE_ASSETS.nurseryUpgrade,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 450, effectLabel: "+1 egg slot" },
      { tier: 2, costGold: 900, costGp: 12, costMaterials: 4, effectLabel: "+2 total egg slots" },
      { tier: 3, costGold: 1600, costGp: 28, costMaterials: 7, effectLabel: "+4 total egg slots" },
      { tier: 4, costGold: 2800, costGp: 60, costMaterials: 12, effectLabel: "+6 total egg slots" },
    ],
  },
  {
    upgradeId: "nursery_incubation_speed",
    category: "nursery",
    name: "Nursery Incubators",
    description: "Improves pregnancy care and egg warmth. Base pregnancy and hatching timers are slow until the nursery is upgraded.",
    iconPath: RANCH_UPGRADE_ASSETS.nurseryUpgrade,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 600, costMaterials: 3, effectLabel: "Egg incubation reduced to 5 days" },
      { tier: 2, costGold: 1150, costGp: 12, costMaterials: 6, effectLabel: "Pregnancy 2 days, egg incubation 4 days" },
      { tier: 3, costGold: 1900, costGp: 32, costMaterials: 10, effectLabel: "Pregnancy 2 days, egg incubation 3 days" },
      { tier: 4, costGold: 3200, costGp: 75, costMaterials: 16, effectLabel: "Pregnancy 1 day, egg incubation 2 days" },
    ],
  },
  {
    upgradeId: "breeding_pen_comfort",
    category: "breeding",
    name: "Breeding Pen Comfort",
    description: "Improves breeding efficiency with better bedding, privacy, and comfort fixtures. Base breeding is expensive and unreliable until this is improved.",
    iconPath: RANCH_UPGRADE_ASSETS.breedingPenUpgrade,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 650, effectLabel: "+5% pregnancy chance, +2 XP, -4 energy cost" },
      { tier: 2, costGold: 1100, costGp: 18, costMaterials: 5, effectLabel: "+10% pregnancy chance, +4 XP, -8 energy cost" },
      { tier: 3, costGold: 1800, costGp: 38, costMaterials: 8, effectLabel: "+16% pregnancy chance, +6 XP, -14 energy cost" },
      { tier: 4, costGold: 3100, costGp: 80, costMaterials: 14, effectLabel: "+25% pregnancy chance, +10 XP, -22 energy cost" },
    ],
  },
  {
    upgradeId: "ranch_chores_board",
    category: "chores",
    name: "Ranch Chores Board",
    description: "Upgrades tools, route planning, and chore organization. Base chores are tiring; the board makes daily work cheaper and more productive.",
    iconPath: RANCH_UPGRADE_ASSETS.choresBoard,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 500, costMaterials: 3, effectLabel: "-2 chore energy cost, +1 chore score" },
      { tier: 2, costGold: 950, costGp: 10, costMaterials: 6, effectLabel: "-4 chore energy cost, +2 chore score" },
      { tier: 3, costGold: 1700, costGp: 26, costMaterials: 9, effectLabel: "-7 chore energy cost, +3 chore score" },
      { tier: 4, costGold: 2900, costGp: 55, costMaterials: 14, effectLabel: "-10 chore energy cost, +4 chore score" },
    ],
  },
  {
    upgradeId: "sleep_recovery",
    category: "recovery",
    name: "Ranch Sleep Recovery",
    description: "Improves overnight recovery and makes the ranch feel more restful. This offsets the harsher base energy economy.",
    iconPath: RANCH_UPGRADE_ASSETS.sleepRecovery,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 300, effectLabel: "+5 bonus creature energy after sleep" },
      { tier: 2, costGold: 750, costMaterials: 3, effectLabel: "+10 bonus creature energy after sleep" },
      { tier: 3, costGold: 1400, costGp: 24, costMaterials: 6, effectLabel: "+10 energy and +1 affection after sleep" },
      { tier: 4, costGold: 2400, costGp: 50, costMaterials: 10, effectLabel: "+15 energy and +2 affection after sleep" },
    ],
  },
];

const habitatCapacityBonusByTier = [0, 1, 2, 4, 6];
const nurseryCapacityBonusByTier = [0, 1, 2, 4, 6];
const nurseryPregnancyDaysByTier = [BASE_PREGNANCY_DAYS, 3, 2, 2, 1];
const nurseryEggDaysByTier = [BASE_EGG_INCUBATION_DAYS, 5, 4, 3, 2];
const breedingChanceBonusByTier = [-8, 5, 10, 16, 25];
const breedingXpBonusByTier = [0, 2, 4, 6, 10];
const breedingEnergyDiscountByTier = [-20, 4, 8, 14, 22];
const choreEnergyDiscountByTier = [0, 2, 4, 7, 10];
const choreScoreBonusByTier = [0, 1, 2, 3, 4];
const sleepEnergyBonusByTier = [0, 5, 10, 10, 15];
const sleepAffectionBonusByTier = [0, 0, 0, 1, 2];
const MAX_RANCH_EVENT_LOG_ENTRIES = 50;

export function getDefaultRanchUpgrades(): RanchUpgradeState {
  return { ...DEFAULT_RANCH_UPGRADES };
}

export function getRanchUpgrades(save: GameSave): RanchUpgradeState {
  return { ...DEFAULT_RANCH_UPGRADES, ...(save.ranchUpgrades ?? {}) };
}

export function getRanchUpgradeDefinition(upgradeId: RanchUpgradeId): RanchUpgradeDefinition {
  const definition = RANCH_UPGRADE_DEFINITIONS.find((upgrade) => upgrade.upgradeId === upgradeId);
  if (!definition) throw new Error(`Unknown ranch upgrade: ${upgradeId}`);
  return definition;
}

export function getNextRanchUpgradeTier(definition: RanchUpgradeDefinition, currentTier: number) {
  return definition.tiers.find((tier) => tier.tier === currentTier + 1) ?? null;
}

export function getTotalRanchUpgradeTiers(save: GameSave): number {
  const upgrades = getRanchUpgrades(save);
  return RANCH_UPGRADE_DEFINITIONS.reduce((total, definition) => total + (upgrades[definition.upgradeId] ?? 0), 0);
}

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function getHabitatCapacity(baseCapacity: number, tier: number): number {
  return baseCapacity + (habitatCapacityBonusByTier[tier] ?? 0);
}

function readRanchEventLog(save: GameSave): string[] {
  try {
    const parsed = JSON.parse(String(save.flags.ranchEventLog ?? "[]"));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function appendRanchEventLog(save: GameSave, entry: string): string {
  return JSON.stringify([entry, ...readRanchEventLog(save)].slice(0, MAX_RANCH_EVENT_LOG_ENTRIES));
}

export function getRanchConditionLabelFromDamage(damage: number): string {
  if (damage >= 80) return "Critical";
  if (damage >= 50) return "Damaged";
  if (damage >= 20) return "Worn";
  return "Good";
}

export function getRanchUpgradeEffects(save: GameSave): RanchUpgradeEffects {
  const upgrades = getRanchUpgrades(save);
  const nurseryTier = upgrades.nursery_egg_capacity;
  const incubationTier = upgrades.nursery_incubation_speed;
  const breedingTier = upgrades.breeding_pen_comfort;
  const choresTier = upgrades.ranch_chores_board;
  const sleepTier = upgrades.sleep_recovery;

  return {
    felineCapacity: getHabitatCapacity(BASE_FELINE_CAPACITY, upgrades.feline_habitat_capacity),
    canineCapacity: getHabitatCapacity(BASE_CANINE_CAPACITY, upgrades.canine_habitat_capacity),
    bovineCapacity: getHabitatCapacity(BASE_BOVINE_CAPACITY, upgrades.bovine_habitat_capacity),
    lapineCapacity: getHabitatCapacity(BASE_LAPINE_CAPACITY, upgrades.lapine_habitat_capacity),
    equineCapacity: getHabitatCapacity(BASE_EQUINE_CAPACITY, upgrades.equine_habitat_capacity),
    nurseryEggCapacity: BASE_NURSERY_EGG_CAPACITY + (nurseryCapacityBonusByTier[nurseryTier] ?? 0),
    nurseryPregnancyDays: nurseryPregnancyDaysByTier[incubationTier] ?? BASE_PREGNANCY_DAYS,
    nurseryEggDays: nurseryEggDaysByTier[incubationTier] ?? BASE_EGG_INCUBATION_DAYS,
    breedingPregnancyBonus: breedingChanceBonusByTier[breedingTier] ?? -8,
    breedingXpBonus: breedingXpBonusByTier[breedingTier] ?? 0,
    breedingEnergyDiscount: breedingEnergyDiscountByTier[breedingTier] ?? -20,
    ranchChoreEnergyDiscount: choreEnergyDiscountByTier[choresTier] ?? 0,
    ranchChoreScoreBonus: choreScoreBonusByTier[choresTier] ?? 0,
    sleepCreatureEnergyBonus: sleepEnergyBonusByTier[sleepTier] ?? 0,
    sleepAffectionBonus: sleepAffectionBonusByTier[sleepTier] ?? 0,
  };
}

export function applyRanchUpgradeEffectsToHabitats(save: GameSave): GameSave {
  const upgrades = getRanchUpgrades(save);
  const effects = getRanchUpgradeEffects(save);
  const nextHabitats = (save.habitats ?? []).map((habitat): HabitatRecord => {
    if (habitat.family === "feline") return { ...habitat, capacity: Math.max(effects.felineCapacity, habitat.creatureIds.length), level: 1 + (upgrades.feline_habitat_capacity ?? 0) };
    if (habitat.family === "canine") return { ...habitat, capacity: Math.max(effects.canineCapacity, habitat.creatureIds.length), level: 1 + (upgrades.canine_habitat_capacity ?? 0) };
    if (habitat.family === "bovine") return { ...habitat, capacity: Math.max(effects.bovineCapacity, habitat.creatureIds.length), level: 1 + (upgrades.bovine_habitat_capacity ?? 0) };
    if (habitat.family === "lapine") return { ...habitat, capacity: Math.max(effects.lapineCapacity, habitat.creatureIds.length), level: 1 + (upgrades.lapine_habitat_capacity ?? 0) };
    if (habitat.family === "equine") return { ...habitat, capacity: Math.max(effects.equineCapacity, habitat.creatureIds.length), level: 1 + (upgrades.equine_habitat_capacity ?? 0) };
    return habitat;
  });

  return { ...save, habitats: nextHabitats };
}

export function getNurseryCapacity(save: GameSave): number {
  return getRanchUpgradeEffects(save).nurseryEggCapacity;
}

export function repairRanchDamage(save: GameSave): RanchUpgradePurchaseResult {
  const currentDamage = Math.min(100, getFlagNumber(save.flags.ranchDamage));
  const materialsStock = getFlagNumber(save.flags.ranchMaterialsStock);
  const repairKitStock = getFlagNumber(save.flags.ranchRepairKits);
  const usesRepairKit = repairKitStock > 0;

  if (currentDamage <= 0) {
    return { save, ok: false, message: "The ranch is already in good condition. No repairs needed." };
  }

  if (!usesRepairKit && materialsStock < RANCH_REPAIR_MATERIAL_COST) {
    return {
      save,
      ok: false,
      message: `Not enough repair supplies. Need 1 Repair Kit or ${RANCH_REPAIR_MATERIAL_COST} Materials; you have ${repairKitStock} Repair Kits and ${materialsStock} Materials.`,
    };
  }

  const repairedDamage = Math.min(currentDamage, RANCH_REPAIR_DAMAGE_AMOUNT);
  const nextDamage = Math.max(0, currentDamage - repairedDamage);
  const remainingMaterials = usesRepairKit ? materialsStock : materialsStock - RANCH_REPAIR_MATERIAL_COST;
  const remainingRepairKits = usesRepairKit ? repairKitStock - 1 : repairKitStock;
  const conditionLabel = getRanchConditionLabelFromDamage(nextDamage);
  const costLabel = usesRepairKit ? "1 Repair Kit" : `${RANCH_REPAIR_MATERIAL_COST} Materials`;
  const logEntry = `Day ${save.dayState.dayNumber}: Manual repair fixed ${repairedDamage} ranch damage for ${costLabel}. Condition is ${conditionLabel}.`;

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      flags: {
        ...save.flags,
        ranchDamage: nextDamage,
        ranchConditionToday: conditionLabel,
        ranchMaterialsStock: remainingMaterials,
        ranchRepairKits: remainingRepairKits,
        ranchManualRepairUsed: true,
        ranchManualRepairAmountLast: repairedDamage,
        ranchManualRepairCostLast: usesRepairKit ? 0 : RANCH_REPAIR_MATERIAL_COST,
        ranchManualRepairKitUsedLast: usesRepairKit,
        ranchManualRepairResourceLast: costLabel,
        ranchEventLog: appendRanchEventLog(save, logEntry),
      },
    },
    ok: true,
    message: `Repairs completed: -${repairedDamage} ranch damage for ${costLabel}. Ranch condition is now ${conditionLabel} (${nextDamage}/100 damage).`,
  };
}

export function purchaseRanchUpgrade(save: GameSave, upgradeId: RanchUpgradeId): RanchUpgradePurchaseResult {
  const upgrades = getRanchUpgrades(save);
  const definition = getRanchUpgradeDefinition(upgradeId);
  const currentTier = upgrades[upgradeId] ?? 0;
  const nextTier = getNextRanchUpgradeTier(definition, currentTier);

  if (!nextTier) return { save, ok: false, message: `${definition.name} is already maxed.` };

  const costGp = nextTier.costGp ?? 0;
  const costMaterials = nextTier.costMaterials ?? 0;
  const materialsStock = getFlagNumber(save.flags.ranchMaterialsStock);

  if (save.currencies.gold < nextTier.costGold) {
    return { save, ok: false, message: `Not enough Gold for ${definition.name} Tier ${nextTier.tier}. Need ${nextTier.costGold} Gold; you have ${save.currencies.gold}.` };
  }

  if (save.currencies.guildPoints < costGp) {
    return { save, ok: false, message: `Not enough GP for ${definition.name} Tier ${nextTier.tier}. Need ${costGp} GP; you have ${save.currencies.guildPoints}.` };
  }

  if (materialsStock < costMaterials) {
    return { save, ok: false, message: `Not enough Materials for ${definition.name} Tier ${nextTier.tier}. Need ${costMaterials} Materials; you have ${materialsStock}. Assign Field Hauling to gather more.` };
  }

  const remainingGold = save.currencies.gold - nextTier.costGold;
  const remainingGp = save.currencies.guildPoints - costGp;
  const remainingMaterials = materialsStock - costMaterials;
  const nextSave = applyRanchUpgradeEffectsToHabitats({
    ...save,
    updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: remainingGold, guildPoints: remainingGp },
    ranchUpgrades: { ...upgrades, [upgradeId]: nextTier.tier },
    flags: {
      ...save.flags,
      ranchMaterialsStock: remainingMaterials,
      m11RanchOfficeUsed: true,
      m11RanchUpgradePurchased: true,
      m125BalancePass: true,
      m135M13HabitatUpgradePurchased: definition.category === "habitats" || save.flags.m135M13HabitatUpgradePurchased === true,
      m14MaterialsSpentOnUpgrade: costMaterials > 0 || save.flags.m14MaterialsSpentOnUpgrade === true,
      m16RanchConstruction: true,
      m16RanchUpgradePurchased: true,
    },
  });

  return {
    save: nextSave,
    ok: true,
    message: `${definition.name} upgraded from Tier ${currentTier} to Tier ${nextTier.tier}. ${nextTier.effectLabel}. Ranch effects applied immediately.`,
    summary: {
      upgradeId,
      upgradeName: definition.name,
      category: definition.category,
      oldTier: currentTier,
      newTier: nextTier.tier,
      effectLabel: nextTier.effectLabel,
      costGold: nextTier.costGold,
      costGp,
      costMaterials,
      remainingGold,
      remainingGp,
      remainingMaterials,
      immediateEffectLabel: "Ranch effects applied immediately.",
    },
  };
}

export function getRanchUpgradeCategoryLabel(category: RanchUpgradeDefinition["category"]): string {
  if (category === "habitats") return "Habitat Upgrades";
  if (category === "nursery") return "Nursery Upgrades";
  if (category === "breeding") return "Breeding Pen";
  if (category === "chores") return "Chores Board";
  if (category === "recovery") return "Sleep Recovery";
  return "Ranch Ledger";
}
