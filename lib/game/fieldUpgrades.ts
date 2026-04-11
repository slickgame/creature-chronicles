import { DEFAULT_FIELD_PLOT_COUNT } from "@/lib/game/farming";

export type FieldUpgradeId =
  | "extra_plots_1"
  | "extra_plots_2"
  | "watering_can_1"
  | "watering_can_2"
  | "greenhouse_1"
  | "greenhouse_2";

export type FieldUpgradeCategory = "plots" | "tools" | "protection";

export type FieldUpgradeState = {
  unlockedIds: FieldUpgradeId[];
};

export type FieldUpgradeData = {
  id: FieldUpgradeId;
  category: FieldUpgradeCategory;
  title: string;
  shortLabel: string;
  description: string;
  effectSummary: string;
  cost: number;
  requires?: FieldUpgradeId[];
  plotBonus?: number;
  wateringLevelBonus?: number;
  protectedPlotBonus?: number;
};

export type FieldUpgradeEffects = {
  unlockedPlotCount: number;
  wateringToolLevel: number;
  wateringStaminaDiscount: number;
  wateringMinuteDiscount: number;
  wateringQualityBonus: number;
  protectedPlotCount: number;
};

export const DEFAULT_FIELD_UPGRADES: FieldUpgradeState = {
  unlockedIds: [],
};

export const FIELD_UPGRADE_DATA: Record<FieldUpgradeId, FieldUpgradeData> = {
  extra_plots_1: {
    id: "extra_plots_1",
    category: "plots",
    title: "Fresh-Turned Plot Pair",
    shortLabel: "+2 Plots",
    description: "Open two more beds beside the main field so the ranch has a little more room to stretch.",
    effectSummary: "Unlocks 2 extra crop plots.",
    cost: 180,
    plotBonus: 2,
  },
  extra_plots_2: {
    id: "extra_plots_2",
    category: "plots",
    title: "Lower Field Expansion",
    shortLabel: "+2 Plots",
    description: "Clear a lower strip of soil for another pair of plantable plots.",
    effectSummary: "Unlocks 2 more crop plots.",
    cost: 340,
    requires: ["extra_plots_1"],
    plotBonus: 2,
  },
  watering_can_1: {
    id: "watering_can_1",
    category: "tools",
    title: "Balanced Watering Can",
    shortLabel: "Water I",
    description: "A better-balanced can that lets field partners water faster without wearing themselves out.",
    effectSummary: "Watering costs 1 less stamina, takes 3 fewer minutes, and gives +4 quality.",
    cost: 220,
    wateringLevelBonus: 1,
  },
  watering_can_2: {
    id: "watering_can_2",
    category: "tools",
    title: "Silver-Spout Watering Can",
    shortLabel: "Water II",
    description: "A fine spout that lays water exactly where the crop wants it, slow and confident.",
    effectSummary: "Adds another watering discount and raises total watering quality bonus to +9.",
    cost: 420,
    requires: ["watering_can_1"],
    wateringLevelBonus: 1,
  },
  greenhouse_1: {
    id: "greenhouse_1",
    category: "protection",
    title: "Glass Row Covers",
    shortLabel: "Protect 2",
    description: "Low glass covers for the first two plots, shielding tender crops from the worst weather moods.",
    effectSummary: "Protects the first 2 plots from negative weather and auto-waters them during rain.",
    cost: 380,
    protectedPlotBonus: 2,
  },
  greenhouse_2: {
    id: "greenhouse_2",
    category: "protection",
    title: "Greenhouse Corner",
    shortLabel: "Protect 4",
    description: "A proper little glass-warmed corner where four plots can ignore most ugly weather.",
    effectSummary: "Protects 2 additional plots, for 4 protected plots total.",
    cost: 760,
    requires: ["greenhouse_1"],
    protectedPlotBonus: 2,
  },
};

export const FIELD_UPGRADE_ORDER: FieldUpgradeId[] = [
  "extra_plots_1",
  "extra_plots_2",
  "watering_can_1",
  "watering_can_2",
  "greenhouse_1",
  "greenhouse_2",
];

export function normalizeFieldUpgrades(upgrades?: FieldUpgradeState): FieldUpgradeState {
  if (!upgrades || typeof upgrades !== "object" || !Array.isArray(upgrades.unlockedIds)) {
    return DEFAULT_FIELD_UPGRADES;
  }

  const unlockedIds = FIELD_UPGRADE_ORDER.filter((upgradeId) =>
    upgrades.unlockedIds.includes(upgradeId)
  );

  return {
    unlockedIds,
  };
}

export function hasFieldUpgrade(upgrades: FieldUpgradeState, upgradeId: FieldUpgradeId) {
  return upgrades.unlockedIds.includes(upgradeId);
}

export function getFieldUpgradeEffects(upgrades: FieldUpgradeState): FieldUpgradeEffects {
  const normalized = normalizeFieldUpgrades(upgrades);
  let plotBonus = 0;
  let wateringToolLevel = 0;
  let protectedPlotCount = 0;

  for (const upgradeId of normalized.unlockedIds) {
    const upgrade = FIELD_UPGRADE_DATA[upgradeId];
    plotBonus += upgrade.plotBonus ?? 0;
    wateringToolLevel += upgrade.wateringLevelBonus ?? 0;
    protectedPlotCount += upgrade.protectedPlotBonus ?? 0;
  }

  return {
    unlockedPlotCount: DEFAULT_FIELD_PLOT_COUNT + plotBonus,
    wateringToolLevel,
    wateringStaminaDiscount: wateringToolLevel,
    wateringMinuteDiscount: wateringToolLevel * 3,
    wateringQualityBonus: wateringToolLevel === 0 ? 0 : wateringToolLevel === 1 ? 4 : 9,
    protectedPlotCount,
  };
}

export function isFieldUpgradeUnlocked(upgrades: FieldUpgradeState, upgradeId: FieldUpgradeId) {
  return normalizeFieldUpgrades(upgrades).unlockedIds.includes(upgradeId);
}

export function isFieldUpgradeAvailable(upgrades: FieldUpgradeState, upgradeId: FieldUpgradeId) {
  const normalized = normalizeFieldUpgrades(upgrades);
  const upgrade = FIELD_UPGRADE_DATA[upgradeId];
  if (!upgrade || isFieldUpgradeUnlocked(normalized, upgradeId)) return false;

  return (upgrade.requires ?? []).every((requiredId) =>
    isFieldUpgradeUnlocked(normalized, requiredId)
  );
}

export function canPurchaseFieldUpgrade(
  upgrades: FieldUpgradeState,
  upgradeId: FieldUpgradeId,
  gold: number
) {
  const upgrade = FIELD_UPGRADE_DATA[upgradeId];
  return Boolean(upgrade && isFieldUpgradeAvailable(upgrades, upgradeId) && gold >= upgrade.cost);
}

export function unlockFieldUpgrade(
  upgrades: FieldUpgradeState,
  upgradeId: FieldUpgradeId
): FieldUpgradeState {
  const normalized = normalizeFieldUpgrades(upgrades);
  if (!FIELD_UPGRADE_DATA[upgradeId] || isFieldUpgradeUnlocked(normalized, upgradeId)) {
    return normalized;
  }

  return {
    unlockedIds: FIELD_UPGRADE_ORDER.filter((id) =>
      id === upgradeId || normalized.unlockedIds.includes(id)
    ),
  };
}

export function isPlotProtected(plotId: number, effects: FieldUpgradeEffects) {
  return plotId > 0 && plotId <= effects.protectedPlotCount;
}
