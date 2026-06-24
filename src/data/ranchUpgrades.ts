import type { GameSave } from "@/types/save";
import type { HabitatRecord } from "@/types/creature";
import type {
  RanchUpgradeDefinition,
  RanchUpgradeEffects,
  RanchUpgradeId,
  RanchUpgradePurchaseResult,
  RanchUpgradeState,
} from "@/types/ranchUpgrades";

export const BASE_FELINE_CAPACITY = 6;
export const BASE_CANINE_CAPACITY = 6;
export const BASE_BOVINE_CAPACITY = 6;
export const BASE_LAPINE_CAPACITY = 6;
export const BASE_EQUINE_CAPACITY = 6;
export const BASE_NURSERY_EGG_CAPACITY = 6;

export const DEFAULT_RANCH_UPGRADES: RanchUpgradeState = {
  feline_habitat_capacity: 0,
  canine_habitat_capacity: 0,
  bovine_habitat_capacity: 0,
  lapine_habitat_capacity: 0,
  equine_habitat_capacity: 0,
  nursery_egg_capacity: 0,
  breeding_pen_comfort: 0,
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
  ranchLedger: "/images/ui/icons/icon_ranch_ledger.png",
  sleepRecovery: "/images/ui/icons/icon_sleep_recovery.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
} as const;

const habitatTiers = [
  { tier: 1, costGold: 350, effectLabel: "+1 capacity" },
  { tier: 2, costGold: 750, costGp: 8, effectLabel: "+2 total capacity" },
  { tier: 3, costGold: 1300, costGp: 20, effectLabel: "+4 total capacity" },
  { tier: 4, costGold: 2200, costGp: 45, effectLabel: "+6 total capacity" },
] as const;

export const RANCH_UPGRADE_DEFINITIONS: RanchUpgradeDefinition[] = [
  {
    upgradeId: "feline_habitat_capacity",
    category: "habitats",
    name: "Feline Habitat Expansion",
    description: "Adds more comfortable space for feline-family creatures. Feline upgrades support future comfort, affection, and quality-breeding systems.",
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
    description: "Adds stable and pasture space for bovine-family creatures. This prepares Cow, Minotaur, and Moon Yak lines for future production, heavy labor, and ranch-income systems.",
    iconPath: RANCH_UPGRADE_ASSETS.bovineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Bovine capacity") })),
  },
  {
    upgradeId: "lapine_habitat_capacity",
    category: "habitats",
    name: "Lapine Habitat Expansion",
    description: "Adds burrow, garden, and hutch space for lapine-family creatures. This prepares Bunny, Antlerhare, and Dream Lop lines for future fertility, garden, nursery, and comfort systems.",
    iconPath: RANCH_UPGRADE_ASSETS.lapineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Lapine capacity") })),
  },
  {
    upgradeId: "equine_habitat_capacity",
    category: "habitats",
    name: "Equine Habitat Expansion",
    description: "Adds stall, paddock, and field space for equine-family creatures. This prepares Horse, Unicorn, and Nightmare lines for future hauling, travel, field-management, and security systems.",
    iconPath: RANCH_UPGRADE_ASSETS.equineHabitat,
    maxTier: 4,
    tiers: habitatTiers.map((tier) => ({ ...tier, effectLabel: tier.effectLabel.replace("capacity", "Equine capacity") })),
  },
  {
    upgradeId: "nursery_egg_capacity",
    category: "nursery",
    name: "Nursery Egg Capacity",
    description: "Adds more incubator space for eggs waiting to hatch. Useful once breeding becomes a regular part of your loop.",
    iconPath: RANCH_UPGRADE_ASSETS.nurseryUpgrade,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 450, effectLabel: "+1 egg slot" },
      { tier: 2, costGold: 900, costGp: 12, effectLabel: "+2 total egg slots" },
      { tier: 3, costGold: 1600, costGp: 28, effectLabel: "+4 total egg slots" },
      { tier: 4, costGold: 2800, costGp: 60, effectLabel: "+6 total egg slots" },
    ],
  },
  {
    upgradeId: "breeding_pen_comfort",
    category: "breeding",
    name: "Breeding Pen Comfort",
    description: "Improves breeding efficiency with better bedding, privacy, and comfort fixtures. This is a mid-game upgrade, not required for basic breeding.",
    iconPath: RANCH_UPGRADE_ASSETS.breedingPenUpgrade,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 650, effectLabel: "+2 creature XP from breeding" },
      { tier: 2, costGold: 1100, costGp: 18, effectLabel: "+3% pregnancy chance and +2 XP" },
      { tier: 3, costGold: 1800, costGp: 38, effectLabel: "+3% chance, +2 XP, -3 energy cost" },
      { tier: 4, costGold: 3100, costGp: 80, effectLabel: "+8% chance, +7 XP, -3 energy cost" },
    ],
  },
  {
    upgradeId: "sleep_recovery",
    category: "recovery",
    name: "Ranch Sleep Recovery",
    description: "Improves overnight recovery and makes the ranch feel more restful. This is a convenience upgrade, not mandatory upkeep.",
    iconPath: RANCH_UPGRADE_ASSETS.sleepRecovery,
    maxTier: 4,
    tiers: [
      { tier: 1, costGold: 300, effectLabel: "+5 bonus creature energy after sleep" },
      { tier: 2, costGold: 750, effectLabel: "+10 bonus creature energy after sleep" },
      { tier: 3, costGold: 1400, costGp: 24, effectLabel: "+10 energy and +1 affection after sleep" },
      { tier: 4, costGold: 2400, costGp: 50, effectLabel: "+15 energy and +2 affection after sleep" },
    ],
  },
];

const habitatCapacityBonusByTier = [0, 1, 2, 4, 6];
const nurseryCapacityBonusByTier = [0, 1, 2, 4, 6];
const breedingChanceBonusByTier = [0, 0, 3, 3, 8];
const breedingXpBonusByTier = [0, 2, 2, 2, 7];
const breedingEnergyDiscountByTier = [0, 0, 0, 3, 3];
const sleepEnergyBonusByTier = [0, 5, 10, 10, 15];
const sleepAffectionBonusByTier = [0, 0, 0, 1, 2];

export function getDefaultRanchUpgrades(): RanchUpgradeState { return { ...DEFAULT_RANCH_UPGRADES }; }
export function getRanchUpgrades(save: GameSave): RanchUpgradeState { return { ...DEFAULT_RANCH_UPGRADES, ...(save.ranchUpgrades ?? {}) }; }
export function getRanchUpgradeDefinition(upgradeId: RanchUpgradeId): RanchUpgradeDefinition {
  const definition = RANCH_UPGRADE_DEFINITIONS.find((upgrade) => upgrade.upgradeId === upgradeId);
  if (!definition) throw new Error(`Unknown ranch upgrade: ${upgradeId}`);
  return definition;
}

export function getNextRanchUpgradeTier(definition: RanchUpgradeDefinition, currentTier: number) { return definition.tiers.find((tier) => tier.tier === currentTier + 1) ?? null; }

export function getTotalRanchUpgradeTiers(save: GameSave): number {
  const upgrades = getRanchUpgrades(save);
  return RANCH_UPGRADE_DEFINITIONS.reduce((total, definition) => total + (upgrades[definition.upgradeId] ?? 0), 0);
}

function getHabitatCapacity(baseCapacity: number, tier: number): number {
  return baseCapacity + (habitatCapacityBonusByTier[tier] ?? 0);
}

export function getRanchUpgradeEffects(save: GameSave): RanchUpgradeEffects {
  const upgrades = getRanchUpgrades(save);
  const felineTier = upgrades.feline_habitat_capacity;
  const canineTier = upgrades.canine_habitat_capacity;
  const bovineTier = upgrades.bovine_habitat_capacity;
  const lapineTier = upgrades.lapine_habitat_capacity;
  const equineTier = upgrades.equine_habitat_capacity;
  const nurseryTier = upgrades.nursery_egg_capacity;
  const breedingTier = upgrades.breeding_pen_comfort;
  const sleepTier = upgrades.sleep_recovery;

  return {
    felineCapacity: getHabitatCapacity(BASE_FELINE_CAPACITY, felineTier),
    canineCapacity: getHabitatCapacity(BASE_CANINE_CAPACITY, canineTier),
    bovineCapacity: getHabitatCapacity(BASE_BOVINE_CAPACITY, bovineTier),
    lapineCapacity: getHabitatCapacity(BASE_LAPINE_CAPACITY, lapineTier),
    equineCapacity: getHabitatCapacity(BASE_EQUINE_CAPACITY, equineTier),
    nurseryEggCapacity: BASE_NURSERY_EGG_CAPACITY + (nurseryCapacityBonusByTier[nurseryTier] ?? 0),
    breedingPregnancyBonus: breedingChanceBonusByTier[breedingTier] ?? 0,
    breedingXpBonus: breedingXpBonusByTier[breedingTier] ?? 0,
    breedingEnergyDiscount: breedingEnergyDiscountByTier[breedingTier] ?? 0,
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

export function getNurseryCapacity(save: GameSave): number { return getRanchUpgradeEffects(save).nurseryEggCapacity; }

export function purchaseRanchUpgrade(save: GameSave, upgradeId: RanchUpgradeId): RanchUpgradePurchaseResult {
  const upgrades = getRanchUpgrades(save);
  const definition = getRanchUpgradeDefinition(upgradeId);
  const currentTier = upgrades[upgradeId] ?? 0;
  const nextTier = getNextRanchUpgradeTier(definition, currentTier);
  if (!nextTier) return { save, ok: false, message: `${definition.name} is already maxed.` };

  const costGp = nextTier.costGp ?? 0;
  if (save.currencies.gold < nextTier.costGold) return { save, ok: false, message: `Not enough Gold for ${definition.name} Tier ${nextTier.tier}. Need ${nextTier.costGold} Gold; you have ${save.currencies.gold}.` };
  if (save.currencies.guildPoints < costGp) return { save, ok: false, message: `Not enough GP for ${definition.name} Tier ${nextTier.tier}. Need ${costGp} GP; you have ${save.currencies.guildPoints}.` };

  const remainingGold = save.currencies.gold - nextTier.costGold;
  const remainingGp = save.currencies.guildPoints - costGp;
  const nextSave = applyRanchUpgradeEffectsToHabitats({
    ...save,
    updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: remainingGold, guildPoints: remainingGp },
    ranchUpgrades: { ...upgrades, [upgradeId]: nextTier.tier },
    flags: { ...save.flags, m11RanchOfficeUsed: true, m11RanchUpgradePurchased: true, m125BalancePass: true, m135M13HabitatUpgradePurchased: true },
  });

  return {
    save: nextSave,
    ok: true,
    message: `${definition.name} upgraded from Tier ${currentTier} to Tier ${nextTier.tier}. ${nextTier.effectLabel}. Ranch effects applied immediately.`,
    summary: { upgradeId, upgradeName: definition.name, category: definition.category, oldTier: currentTier, newTier: nextTier.tier, effectLabel: nextTier.effectLabel, costGold: nextTier.costGold, costGp, remainingGold, remainingGp, immediateEffectLabel: "Ranch effects applied immediately." },
  };
}

export function getRanchUpgradeCategoryLabel(category: RanchUpgradeDefinition["category"]): string {
  if (category === "habitats") return "Habitat Upgrades";
  if (category === "nursery") return "Nursery Upgrades";
  if (category === "breeding") return "Breeding Pen";
  if (category === "recovery") return "Sleep Recovery";
  return "Ranch Ledger";
}
