export type GameSeason = "spring" | "summer" | "autumn" | "winter";

export type GameWeather =
  | "clear"
  | "gentle_rain"
  | "heat_wave"
  | "cold_snap"
  | "storm";

export type WeatherInfo = {
  id: GameWeather;
  label: string;
  shortLabel: string;
  description: string;
  fieldNote: string;
  autoWaters: boolean;
  waterPressure: "low" | "normal" | "high";
  growthDelta: number;
  qualityDelta: number;
};

export type SeasonInfo = {
  id: GameSeason;
  label: string;
  description: string;
  fieldNote: string;
  favoredCropIds: string[];
  toughCropIds: string[];
};

export type CropSeasonModifier = {
  cropId: string;
  season: GameSeason;
  fit: "favored" | "neutral" | "tough";
  label: string;
  growthDelta: number;
  qualityDelta: number;
  note: string;
};

export type FieldDayModifier = {
  growthStep: number;
  qualityDelta: number;
  autoWatered: boolean;
  waterPressure: WeatherInfo["waterPressure"];
  notes: string[];
};

export const SEASON_LENGTH_DAYS = 28;

export const SEASON_DATA: Record<GameSeason, SeasonInfo> = {
  spring: {
    id: "spring",
    label: "Spring",
    description: "Soft soil, teasing rain, and fresh starts for tender crops.",
    fieldNote: "Leafy crops and bright roots love this season.",
    favoredCropIds: ["carrot", "lettuce", "berry"],
    toughCropIds: ["apple"],
  },
  summer: {
    id: "summer",
    label: "Summer",
    description: "Long warm days that make fruit swell sweetly when the fields stay watered.",
    fieldNote: "Fruit crops thrive, but thirsty soil wants attention.",
    favoredCropIds: ["apple", "berry", "wheat"],
    toughCropIds: ["lettuce"],
  },
  autumn: {
    id: "autumn",
    label: "Autumn",
    description: "A golden season for sturdy staples and harvest-heavy cooking.",
    fieldNote: "Grain, roots, and apples all settle in nicely.",
    favoredCropIds: ["wheat", "potato", "apple", "carrot"],
    toughCropIds: ["lettuce"],
  },
  winter: {
    id: "winter",
    label: "Winter",
    description: "Cold mornings and stubborn soil, with hardy roots holding their nerve.",
    fieldNote: "Potatoes and wheat handle the chill best.",
    favoredCropIds: ["potato", "wheat"],
    toughCropIds: ["lettuce", "berry", "apple"],
  },
};

export const WEATHER_DATA: Record<GameWeather, WeatherInfo> = {
  clear: {
    id: "clear",
    label: "Clear Skies",
    shortLabel: "Clear",
    description: "Bright, steady weather. Nothing dramatic, just honest field work.",
    fieldNote: "Watering is normal and crop quality gets a tiny steady nudge.",
    autoWaters: false,
    waterPressure: "normal",
    growthDelta: 0,
    qualityDelta: 1,
  },
  gentle_rain: {
    id: "gentle_rain",
    label: "Gentle Rain",
    shortLabel: "Rain",
    description: "A soft rain kisses the soil and saves the watering cans some work.",
    fieldNote: "Plots count as watered today and growth gets a small push.",
    autoWaters: true,
    waterPressure: "low",
    growthDelta: 1,
    qualityDelta: 6,
  },
  heat_wave: {
    id: "heat_wave",
    label: "Heat Wave",
    shortLabel: "Heat",
    description: "The field runs hot and needy, all shimmer and appetite.",
    fieldNote: "Watering matters more. Missed water costs quality.",
    autoWaters: false,
    waterPressure: "high",
    growthDelta: 0,
    qualityDelta: -7,
  },
  cold_snap: {
    id: "cold_snap",
    label: "Cold Snap",
    shortLabel: "Cold",
    description: "A crisp chill slows the soil and makes tender crops sulk.",
    fieldNote: "Growth slows unless the crop likes the season.",
    autoWaters: false,
    waterPressure: "low",
    growthDelta: -1,
    qualityDelta: -4,
  },
  storm: {
    id: "storm",
    label: "Storm",
    shortLabel: "Storm",
    description: "Hard rain rattles the ranch and leaves the fields messy but soaked.",
    fieldNote: "Plots count as watered, but rough weather can bruise quality.",
    autoWaters: true,
    waterPressure: "low",
    growthDelta: 0,
    qualityDelta: -5,
  },
};

export function getSeasonForDay(day: number): GameSeason {
  const safeDay = Math.max(1, Math.floor(day));
  const seasonIndex = Math.floor((safeDay - 1) / SEASON_LENGTH_DAYS) % 4;
  return (["spring", "summer", "autumn", "winter"] as const)[seasonIndex];
}

export function getSeasonInfo(season: GameSeason) {
  return SEASON_DATA[season] ?? SEASON_DATA.spring;
}

export function getWeatherInfo(weather: GameWeather) {
  return WEATHER_DATA[weather] ?? WEATHER_DATA.clear;
}

export function normalizeWeather(weather: unknown, day: number): GameWeather {
  if (typeof weather === "string" && weather in WEATHER_DATA) {
    return weather as GameWeather;
  }

  return generateWeatherForDay(day);
}

export function generateWeatherForDay(day: number): GameWeather {
  const season = getSeasonForDay(day);
  const roll = seededDayRoll(day);

  if (season === "spring") {
    if (roll < 38) return "gentle_rain";
    if (roll < 72) return "clear";
    if (roll < 88) return "storm";
    return "cold_snap";
  }

  if (season === "summer") {
    if (roll < 44) return "clear";
    if (roll < 72) return "heat_wave";
    if (roll < 88) return "gentle_rain";
    return "storm";
  }

  if (season === "autumn") {
    if (roll < 42) return "clear";
    if (roll < 68) return "gentle_rain";
    if (roll < 84) return "cold_snap";
    return "storm";
  }

  if (roll < 44) return "cold_snap";
  if (roll < 74) return "clear";
  if (roll < 88) return "storm";
  return "gentle_rain";
}

export function getCropSeasonModifier(cropId: string | null | undefined, season: GameSeason): CropSeasonModifier {
  if (!cropId) {
    return {
      cropId: "",
      season,
      fit: "neutral",
      label: "No crop",
      growthDelta: 0,
      qualityDelta: 0,
      note: "Empty soil is waiting for a choice.",
    };
  }

  const seasonInfo = getSeasonInfo(season);

  if (seasonInfo.favoredCropIds.includes(cropId)) {
    return {
      cropId,
      season,
      fit: "favored",
      label: "In season",
      growthDelta: 1,
      qualityDelta: 8,
      note: "This crop is in season and eager to show off.",
    };
  }

  if (seasonInfo.toughCropIds.includes(cropId)) {
    return {
      cropId,
      season,
      fit: "tough",
      label: "Out of season",
      growthDelta: -1,
      qualityDelta: -8,
      note: "This crop can grow, but the season is making it work for every inch.",
    };
  }

  return {
    cropId,
    season,
    fit: "neutral",
    label: "Season neutral",
    growthDelta: 0,
    qualityDelta: 0,
    note: "This crop is steady in the current season.",
  };
}

export function getFieldDayModifier(
  cropId: string | null | undefined,
  weather: GameWeather,
  season: GameSeason,
  wateredToday: boolean,
  protectedPlot = false
): FieldDayModifier {
  const weatherInfo = getWeatherInfo(weather);
  const seasonModifier = getCropSeasonModifier(cropId, season);
  const isWatered = wateredToday || weatherInfo.autoWaters;
  let growthStep =
    1 +
    (protectedPlot ? Math.max(0, weatherInfo.growthDelta) : weatherInfo.growthDelta) +
    seasonModifier.growthDelta;
  let qualityDelta =
    (protectedPlot ? Math.max(0, weatherInfo.qualityDelta) : weatherInfo.qualityDelta) +
    seasonModifier.qualityDelta +
    (protectedPlot ? 5 : 0);
  const notes = [
    protectedPlot
      ? `${weatherInfo.shortLabel}: protected glass softened the weather pressure.`
      : `${weatherInfo.shortLabel}: ${weatherInfo.fieldNote}`,
    `${seasonModifier.label}: ${seasonModifier.note}`,
  ];

  if (isWatered) {
    qualityDelta += weatherInfo.waterPressure === "high" ? 8 : 4;
    notes.push(weatherInfo.autoWaters ? "Weather watered the plot." : "Manual watering supported the crop.");
  } else {
    if (weatherInfo.waterPressure === "high") {
      qualityDelta -= 12;
      growthStep -= 1;
      notes.push("Heat-stressed soil slowed growth and hurt quality.");
    } else {
      qualityDelta -= 4;
      notes.push("Dry soil cost a little quality.");
    }
  }

  return {
    growthStep: Math.max(0, growthStep),
    qualityDelta,
    autoWatered: weatherInfo.autoWaters,
    waterPressure: weatherInfo.waterPressure,
    notes,
  };
}

function seededDayRoll(day: number) {
  const safeDay = Math.max(1, Math.floor(day));
  return (safeDay * 73 + Math.floor(safeDay / 3) * 19 + 17) % 100;
}
