import { CROP_DATA } from "@/lib/farming/cropData";
import { ITEM_DATA } from "@/lib/items/itemData";
import {
  type GameSeason,
  type GameWeather,
  getCropSeasonModifier,
  getFieldDayModifier,
  getWeatherInfo,
} from "@/lib/game/weather";

export type CropQuality = "standard" | "fine" | "lush" | "pristine";

export type CropQualityInfo = {
  label: string;
  yieldBonus: number;
  valueMultiplier: number;
  description: string;
};

export type FieldPlot = {
  id: number;
  cropId: string | null;
  seedItemId: string | null;
  plantedDay: number | null;
  daysRemaining: number;
  minYield: number;
  maxYield: number;
  wateredToday: boolean;
  wateredDays: number;
  fertilizerItemId: string | null;
  fertilizerYieldBonus: number;
  quality: CropQuality;
  qualityScore: number;
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

export type HarvestOutcome = {
  quantity: number;
  quality: CropQuality;
  qualityInfo: CropQualityInfo;
  valueMultiplier: number;
  bonusSummary: string[];
};

export type FertilizerData = {
  qualityBonus: number;
  yieldBonus: number;
  label: string;
};

export const DEFAULT_FIELD_PLOT_COUNT = 6;
export const DEFAULT_CROP_QUALITY_SCORE = 25;

export const CROP_QUALITY_DATA: Record<CropQuality, CropQualityInfo> = {
  standard: {
    label: "Standard",
    yieldBonus: 0,
    valueMultiplier: 1,
    description: "A clean, dependable harvest.",
  },
  fine: {
    label: "Fine",
    yieldBonus: 1,
    valueMultiplier: 1.15,
    description: "A brighter crop with a little extra promise.",
  },
  lush: {
    label: "Lush",
    yieldBonus: 2,
    valueMultiplier: 1.35,
    description: "Plump, glossy, and hard not to admire.",
  },
  pristine: {
    label: "Pristine",
    yieldBonus: 3,
    valueMultiplier: 1.6,
    description: "A showpiece harvest with real market temptation.",
  },
};

export const FERTILIZER_DATA: Record<string, FertilizerData> = {
  basic_fertilizer: {
    qualityBonus: 18,
    yieldBonus: 1,
    label: "Basic Fertilizer",
  },
  rich_fertilizer: {
    qualityBonus: 32,
    yieldBonus: 2,
    label: "Rich Fertilizer",
  },
};

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
    wateredToday: false,
    wateredDays: 0,
    fertilizerItemId: null,
    fertilizerYieldBonus: 0,
    quality: "standard",
    qualityScore: 0,
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

export function advanceFieldPlotsByDay(
  plots: FieldPlot[],
  weather: GameWeather = "clear",
  season: GameSeason = "spring"
): FieldPlot[] {
  return plots.map((plot) => {
    if (!plot.cropId) return plot;

    const modifier = getFieldDayModifier(
      plot.cropId,
      weather,
      season,
      plot.wateredToday
    );
    const nextQualityScore = clampQualityScore(plot.qualityScore + modifier.qualityDelta);

    return {
      ...plot,
      daysRemaining:
        plot.daysRemaining > 0
          ? Math.max(0, plot.daysRemaining - modifier.growthStep)
          : 0,
      wateredToday: false,
      wateredDays: plot.wateredDays + (modifier.autoWatered ? 1 : 0),
      qualityScore: nextQualityScore,
      quality: getCropQualityFromScore(nextQualityScore),
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

export function getFertilizerData(itemId: string): FertilizerData | null {
  const item = ITEM_DATA[itemId];
  if (!item || !item.useTags.includes("fertilizer")) return null;
  return FERTILIZER_DATA[itemId] ?? null;
}

export function createPlantedPlot(
  plotId: number,
  seedItemId: string,
  plantedDay: number,
  season: GameSeason = "spring",
  weather: GameWeather = "clear"
): FieldPlot | null {
  const seed = getPlantableSeedData(seedItemId);
  if (!seed) return null;
  const seasonModifier = getCropSeasonModifier(seed.seedData.cropId, season);
  const weatherInfo = getWeatherInfo(weather);
  const qualityScore = clampQualityScore(
    DEFAULT_CROP_QUALITY_SCORE + seasonModifier.qualityDelta + Math.max(0, weatherInfo.qualityDelta)
  );

  return {
    id: plotId,
    cropId: seed.seedData.cropId,
    seedItemId,
    plantedDay,
    daysRemaining: Math.max(1, seed.seedData.growDays - Math.max(0, seasonModifier.growthDelta)),
    minYield: seed.seedData.minYield,
    maxYield: seed.seedData.maxYield,
    wateredToday: weatherInfo.autoWaters,
    wateredDays: weatherInfo.autoWaters ? 1 : 0,
    fertilizerItemId: null,
    fertilizerYieldBonus: 0,
    quality: getCropQualityFromScore(qualityScore),
    qualityScore,
  };
}

export function getFieldPlantingCost(profile: FieldWorkProfile): FieldWorkCost {
  const workScore = getFieldWorkScore(profile, 1);

  return {
    minutesSpent: Math.max(10, 30 - Math.floor(workScore / 3)),
    staminaCost: Math.max(
      3,
      8 - Math.floor((profile.endurance + profile.strength) / 8) - profile.staminaDiscount
    ),
    xpGain: 6,
  };
}

export function getFieldWateringCost(profile: FieldWorkProfile): FieldWorkCost {
  const workScore = getFieldWorkScore(profile, 1);

  return {
    minutesSpent: Math.max(6, 18 - Math.floor(workScore / 5)),
    staminaCost: Math.max(
      2,
      6 - Math.floor((profile.endurance + profile.strength) / 10) - profile.staminaDiscount
    ),
    xpGain: 5,
  };
}

export function getFieldFertilizingCost(profile: FieldWorkProfile): FieldWorkCost {
  const workScore = getFieldWorkScore(profile, 1);

  return {
    minutesSpent: Math.max(7, 20 - Math.floor(workScore / 5)),
    staminaCost: Math.max(
      2,
      6 - Math.floor((profile.endurance + profile.strength) / 10) - profile.staminaDiscount
    ),
    xpGain: 5,
  };
}

export function getFieldHarvestCost(profile: FieldWorkProfile): FieldWorkCost {
  const workScore = getFieldWorkScore(profile, 2);

  return {
    minutesSpent: Math.max(15, 45 - Math.floor(workScore / 2)),
    staminaCost: Math.max(
      4,
      12 - Math.floor((profile.endurance + profile.strength) / 7) - profile.staminaDiscount
    ),
    xpGain: 12,
  };
}

export function waterFieldPlot(
  plot: FieldPlot,
  profile: FieldWorkProfile,
  weather: GameWeather = "clear"
): FieldPlot {
  if (!plot.cropId || plot.wateredToday) return plot;
  const weatherInfo = getWeatherInfo(weather);

  const qualityGain =
    9 +
    Math.floor(profile.fieldWorkLevel / 2) +
    Math.floor((profile.industriousBonus + profile.quickBonus) / 2) +
    (weatherInfo.waterPressure === "high" ? 5 : 0);

  const nextQualityScore = clampQualityScore(plot.qualityScore + qualityGain);

  return {
    ...plot,
    wateredToday: true,
    wateredDays: plot.wateredDays + 1,
    qualityScore: nextQualityScore,
    quality: getCropQualityFromScore(nextQualityScore),
  };
}

export function fertilizeFieldPlot(
  plot: FieldPlot,
  fertilizerItemId: string,
  profile: FieldWorkProfile
): FieldPlot {
  const fertilizer = getFertilizerData(fertilizerItemId);
  if (!plot.cropId || plot.fertilizerItemId || !fertilizer) return plot;

  const skillBonus = Math.floor(profile.fieldWorkLevel / 2);
  const traitBonus = Math.floor(profile.industriousBonus / 2);
  const nextQualityScore = clampQualityScore(
    plot.qualityScore + fertilizer.qualityBonus + skillBonus + traitBonus
  );

  return {
    ...plot,
    fertilizerItemId,
    fertilizerYieldBonus: fertilizer.yieldBonus,
    qualityScore: nextQualityScore,
    quality: getCropQualityFromScore(nextQualityScore),
  };
}

export function getHarvestOutcome(
  plot: FieldPlot,
  profile: FieldWorkProfile,
  weather: GameWeather = "clear",
  season: GameSeason = "spring"
): HarvestOutcome {
  const baseQuantity = rollHarvestYield(plot);
  const quality = getCropQualityFromScore(plot.qualityScore);
  const qualityInfo = CROP_QUALITY_DATA[quality];
  const skillYieldBonus = Math.floor(profile.fieldWorkLevel / 3);
  const traitYieldBonus = Math.floor((profile.industriousBonus + profile.quickBonus) / 3);
  const fertilizerYieldBonus = plot.fertilizerYieldBonus;
  const seasonModifier = getCropSeasonModifier(plot.cropId, season);
  const weatherYieldBonus = getWeatherInfo(weather).id === "gentle_rain" ? 1 : 0;
  const seasonYieldBonus = seasonModifier.fit === "favored" ? 1 : 0;
  const quantity =
    baseQuantity +
    qualityInfo.yieldBonus +
    skillYieldBonus +
    traitYieldBonus +
    fertilizerYieldBonus +
    weatherYieldBonus +
    seasonYieldBonus;

  const bonusSummary = [
    qualityInfo.yieldBonus > 0 ? `${qualityInfo.label} quality +${qualityInfo.yieldBonus}` : null,
    skillYieldBonus > 0 ? `Field Work Lv ${profile.fieldWorkLevel} +${skillYieldBonus}` : null,
    traitYieldBonus > 0 ? `trait handling +${traitYieldBonus}` : null,
    fertilizerYieldBonus > 0 ? `fertilizer +${fertilizerYieldBonus}` : null,
    weatherYieldBonus > 0 ? `gentle rain +${weatherYieldBonus}` : null,
    seasonYieldBonus > 0 ? `${seasonModifier.label} +${seasonYieldBonus}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    quantity,
    quality,
    qualityInfo,
    valueMultiplier: qualityInfo.valueMultiplier,
    bonusSummary,
  };
}

export function getCropQualityFromScore(score: number): CropQuality {
  if (score >= 92) return "pristine";
  if (score >= 68) return "lush";
  if (score >= 42) return "fine";
  return "standard";
}

export function getPlotProduceItemId(plot: FieldPlot): string | null {
  if (!plot.cropId) return null;
  return CROP_DATA[plot.cropId]?.produceItemId ?? null;
}

function rollHarvestYield(plot: FieldPlot): number {
  const minYield = Math.max(1, plot.minYield);
  const maxYield = Math.max(minYield, plot.maxYield);
  return minYield + Math.floor(Math.random() * (maxYield - minYield + 1));
}

function getFieldWorkScore(profile: FieldWorkProfile, fieldWorkLevelMultiplier: number) {
  const speciesBonus = profile.speciesName === "Horse" ? 3 : 0;
  return (
    profile.strength +
    profile.endurance +
    profile.fieldWorkLevel * fieldWorkLevelMultiplier +
    speciesBonus +
    profile.industriousBonus +
    profile.quickBonus
  );
}

function clampQualityScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
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

  const qualityScore =
    typeof plot.qualityScore === "number" && Number.isFinite(plot.qualityScore)
      ? clampQualityScore(plot.qualityScore)
      : DEFAULT_CROP_QUALITY_SCORE;

  const fertilizerItemId =
    typeof plot.fertilizerItemId === "string" && getFertilizerData(plot.fertilizerItemId)
      ? plot.fertilizerItemId
      : null;

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
    wateredToday: Boolean(plot.wateredToday),
    wateredDays:
      typeof plot.wateredDays === "number" && Number.isFinite(plot.wateredDays)
        ? Math.max(0, Math.floor(plot.wateredDays))
        : 0,
    fertilizerItemId,
    fertilizerYieldBonus:
      typeof plot.fertilizerYieldBonus === "number" && Number.isFinite(plot.fertilizerYieldBonus)
        ? Math.max(0, Math.floor(plot.fertilizerYieldBonus))
        : fertilizerItemId
        ? getFertilizerData(fertilizerItemId)?.yieldBonus ?? 0
        : 0,
    quality: getCropQualityFromScore(qualityScore),
    qualityScore,
  };
}
