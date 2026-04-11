import { CROP_DATA } from "@/lib/farming/cropData";
import { ITEM_DATA } from "@/lib/items/itemData";

export type FieldPlot = {
  id: number;
  cropId: string | null;
  seedItemId: string | null;
  plantedDay: number | null;
  daysRemaining: number;
  minYield: number;
  maxYield: number;
};

export type FieldWorkProfile = {
  speciesName: string;
  strength: number;
  endurance: number;
  fieldWorkLevel: number;
  staminaDiscount: number;
  industriousBonus: number;
  quickBonus: number;
};

export type FieldWorkCost = {
  minutesSpent: number;
  staminaCost: number;
  xpGain: number;
};

export const DEFAULT_FIELD_PLOT_COUNT = 6;

export function createDefaultFieldPlots(count = DEFAULT_FIELD_PLOT_COUNT): FieldPlot[] {
  return Array.from({ length: count }, (_, index) => createEmptyFieldPlot(index + 1));
}

export function createEmptyFieldPlot(id: number): FieldPlot {
  return {
    id,
    cropId: null,
    seedItemId: null,
    plantedDay: null,
    daysRemaining: 0,
    minYield: 0,
    maxYield: 0,
  };
}

export function normalizeFieldPlots(
  plots?: FieldPlot[],
  minimumCount = DEFAULT_FIELD_PLOT_COUNT
): FieldPlot[] {
  const normalized = Array.isArray(plots)
    ? plots
        .map((plot, index) => normalizeFieldPlot(plot, index + 1))
        .filter((plot): plot is FieldPlot => plot !== null)
    : [];

  const nextPlots = [...normalized];
  const usedIds = new Set(nextPlots.map((plot) => plot.id));

  let nextId = 1;
  while (nextPlots.length < minimumCount) {
    while (usedIds.has(nextId)) nextId += 1;
    nextPlots.push(createEmptyFieldPlot(nextId));
    usedIds.add(nextId);
  }

  return nextPlots.sort((a, b) => a.id - b.id);
}

export function advanceFieldPlotsByDay(plots: FieldPlot[]): FieldPlot[] {
  return plots.map((plot) => {
    if (!plot.cropId || plot.daysRemaining <= 0) return plot;
    return {
      ...plot,
      daysRemaining: Math.max(0, plot.daysRemaining - 1),
    };
  });
}

export function getPlantableSeedData(seedItemId: string) {
  const item = ITEM_DATA[seedItemId];
  const seedData = item?.seedData;
  if (!item || !seedData || !item.useTags.includes("plantable")) return null;

  const crop = CROP_DATA[seedData.cropId];
  if (!crop) return null;

  return {
    item,
    seedData,
    crop,
  };
}

export function createPlantedPlot(
  plotId: number,
  seedItemId: string,
  plantedDay: number
): FieldPlot | null {
  const seed = getPlantableSeedData(seedItemId);
  if (!seed) return null;

  return {
    id: plotId,
    cropId: seed.seedData.cropId,
    seedItemId,
    plantedDay,
    daysRemaining: seed.seedData.growDays,
    minYield: seed.seedData.minYield,
    maxYield: seed.seedData.maxYield,
  };
}

export function getFieldPlantingCost(profile: FieldWorkProfile): FieldWorkCost {
  const speciesBonus = profile.speciesName === "Horse" ? 2 : 0;
  const workScore =
    profile.strength +
    profile.endurance +
    profile.fieldWorkLevel +
    speciesBonus +
    profile.industriousBonus +
    profile.quickBonus;

  return {
    minutesSpent: Math.max(10, 30 - Math.floor(workScore / 3)),
    staminaCost: Math.max(
      3,
      8 - Math.floor((profile.endurance + profile.strength) / 8) - profile.staminaDiscount
    ),
    xpGain: 6,
  };
}

export function getFieldHarvestCost(profile: FieldWorkProfile): FieldWorkCost {
  const speciesBonus = profile.speciesName === "Horse" ? 3 : 0;
  const workScore =
    profile.strength +
    profile.endurance +
    profile.fieldWorkLevel * 2 +
    speciesBonus +
    profile.industriousBonus +
    profile.quickBonus;

  return {
    minutesSpent: Math.max(15, 45 - Math.floor(workScore / 2)),
    staminaCost: Math.max(
      4,
      12 - Math.floor((profile.endurance + profile.strength) / 7) - profile.staminaDiscount
    ),
    xpGain: 12,
  };
}

export function rollHarvestYield(plot: FieldPlot): number {
  const minYield = Math.max(1, plot.minYield);
  const maxYield = Math.max(minYield, plot.maxYield);
  return minYield + Math.floor(Math.random() * (maxYield - minYield + 1));
}

export function getPlotProduceItemId(plot: FieldPlot): string | null {
  if (!plot.cropId) return null;
  return CROP_DATA[plot.cropId]?.produceItemId ?? null;
}

function normalizeFieldPlot(plot: FieldPlot | undefined, fallbackId: number): FieldPlot | null {
  if (!plot || typeof plot !== "object") return null;

  const id = Number.isFinite(plot.id) && plot.id > 0 ? Math.floor(plot.id) : fallbackId;
  const cropId = typeof plot.cropId === "string" && CROP_DATA[plot.cropId] ? plot.cropId : null;
  const seedItemId =
    typeof plot.seedItemId === "string" && getPlantableSeedData(plot.seedItemId)
      ? plot.seedItemId
      : null;

  if (!cropId || !seedItemId) return createEmptyFieldPlot(id);

  return {
    id,
    cropId,
    seedItemId,
    plantedDay:
      typeof plot.plantedDay === "number" && Number.isFinite(plot.plantedDay)
        ? Math.max(1, Math.floor(plot.plantedDay))
        : null,
    daysRemaining:
      typeof plot.daysRemaining === "number" && Number.isFinite(plot.daysRemaining)
        ? Math.max(0, Math.floor(plot.daysRemaining))
        : 0,
    minYield:
      typeof plot.minYield === "number" && Number.isFinite(plot.minYield)
        ? Math.max(1, Math.floor(plot.minYield))
        : 1,
    maxYield:
      typeof plot.maxYield === "number" && Number.isFinite(plot.maxYield)
        ? Math.max(1, Math.floor(plot.maxYield))
        : 1,
  };
}
