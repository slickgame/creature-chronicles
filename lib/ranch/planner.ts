export type RanchShift = "morning" | "afternoon" | "evening";

export type RanchTaskId =
  | "house_cleaning"
  | "kitchen_prep"
  | "nursery_care"
  | "field_labor"
  | "hauling"
  | "garden_tending"
  | "pasture_watch"
  | "coop_care"
  | "rest";

export type WorkerRoleTag =
  | "caretaker"
  | "hauler"
  | "breeder"
  | "scout"
  | "producer"
  | "cleaner"
  | "cook"
  | "laborer"
  | "comfort";

export type CreatureStats = {
  strength: number;
  endurance: number;
  intelligence: number;
  speed: number;
  fertility: number;
  vitality: number;
};

export type SkillProgress = {
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export type CreatureSkills = {
  cooking: SkillProgress;
  cleaning: SkillProgress;
  breedingCare: SkillProgress;
  fieldWork: SkillProgress;
  hauling: SkillProgress;
};

export type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

export type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

export type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

export type PlannerCreature = {
  id: number;
  name: string;
  nickname: string;
  level: number;
  happiness: number;
  breedingStamina: number;
  maxBreedingStamina: number;
  stats: CreatureStats;
  skills: CreatureSkills;
  traits: CreatureTraitEntry[];
};

export type RanchTaskDefinition = {
  id: RanchTaskId;
  title: string;
  location: string;
  description: string;
  slotCount: number;
  baseStaminaCost: number;
  outputLabel: string;
  baseOutputMin: number;
  baseOutputMax: number;
  favoredSpecies: string[];
  favoredTraits: CreatureTrait[];
  favoredRoles: WorkerRoleTag[];
  buildingKey: "barn" | "kitchen" | "nursery" | "training_yard" | "garden" | "house";
};

export type RanchBuildingLevels = {
  barn: number;
  kitchen: number;
  nursery: number;
  training_yard: number;
  garden: number;
  house: number;
};

export type FeedQuality = "poor" | "standard" | "quality" | "luxury";
export type RanchWeather = "clear" | "rain" | "heat" | "cold" | "storm";

export type TaskAssignmentMap = Record<RanchShift, Record<RanchTaskId, number[]>>;

export type CreatureTaskProjection = {
  creatureId: number;
  score: number;
  projectedStaminaCost: number;
  projectedRemainingStamina: number;
  breedingLocked: boolean;
  projectedOutputMin: number;
  projectedOutputMax: number;
  moodDelta: number;
  cleanlinessDelta: number;
  injuryRisk: "low" | "medium" | "high";
  roleTags: WorkerRoleTag[];
  notes: string[];
};

export type RanchRecapSlide = {
  id: string;
  image: string;
  headline: string;
  body: string;
  resultLine: string;
  shift: RanchShift;
  taskId: RanchTaskId;
};

export const SHIFTS: RanchShift[] = ["morning", "afternoon", "evening"];

export const DEFAULT_BUILDINGS: RanchBuildingLevels = {
  barn: 1,
  kitchen: 1,
  nursery: 1,
  training_yard: 1,
  garden: 1,
  house: 1,
};

export const RANCH_TASKS: RanchTaskDefinition[] = [
  {
    id: "house_cleaning",
    title: "House Cleaning",
    location: "House",
    description: "Tidying rooms, bathing spaces, sheets, and guest areas.",
    slotCount: 2,
    baseStaminaCost: 7,
    outputLabel: "Cleanliness",
    baseOutputMin: 8,
    baseOutputMax: 16,
    favoredSpecies: ["Cat", "Dog"],
    favoredTraits: ["domestic", "affectionate", "graceful"],
    favoredRoles: ["cleaner", "caretaker", "comfort"],
    buildingKey: "house",
  },
  {
    id: "kitchen_prep",
    title: "Kitchen Prep",
    location: "Kitchen",
    description: "Meal prep, pantry handling, and warm domestic service.",
    slotCount: 2,
    baseStaminaCost: 8,
    outputLabel: "Meals",
    baseOutputMin: 1,
    baseOutputMax: 3,
    favoredSpecies: ["Cat", "Chicken", "Cow"],
    favoredTraits: ["domestic", "calm", "affectionate"],
    favoredRoles: ["cook", "caretaker", "comfort"],
    buildingKey: "kitchen",
  },
  {
    id: "nursery_care",
    title: "Nursery Care",
    location: "Nursery",
    description: "Egg tending, warming, bedding changes, and careful support.",
    slotCount: 2,
    baseStaminaCost: 6,
    outputLabel: "Nursery Support",
    baseOutputMin: 6,
    baseOutputMax: 14,
    favoredSpecies: ["Cat", "Cow", "Bunny", "Sheep"],
    favoredTraits: ["calm", "fertile", "affectionate"],
    favoredRoles: ["breeder", "caretaker", "comfort"],
    buildingKey: "nursery",
  },
  {
    id: "field_labor",
    title: "Field Labor",
    location: "Field",
    description: "Heavy outdoor work, soil prep, and crop handling.",
    slotCount: 2,
    baseStaminaCost: 12,
    outputLabel: "Field Yield",
    baseOutputMin: 5,
    baseOutputMax: 12,
    favoredSpecies: ["Horse", "Dog", "Pig"],
    favoredTraits: ["industrious", "sturdy", "barnwise"],
    favoredRoles: ["laborer", "hauler"],
    buildingKey: "barn",
  },
  {
    id: "hauling",
    title: "Hauling",
    location: "Barn",
    description: "Crates, sacks, feed runs, and heavier ranch transport.",
    slotCount: 2,
    baseStaminaCost: 10,
    outputLabel: "Hauling Output",
    baseOutputMin: 6,
    baseOutputMax: 13,
    favoredSpecies: ["Horse", "Dog"],
    favoredTraits: ["industrious", "sturdy", "surefooted"],
    favoredRoles: ["hauler", "laborer"],
    buildingKey: "barn",
  },
  {
    id: "garden_tending",
    title: "Garden Tending",
    location: "Garden",
    description: "Soft field work, produce tending, and harvesting.",
    slotCount: 2,
    baseStaminaCost: 7,
    outputLabel: "Produce",
    baseOutputMin: 2,
    baseOutputMax: 6,
    favoredSpecies: ["Bunny", "Pig", "Chicken", "Cat"],
    favoredTraits: ["quick", "keen", "fertile"],
    favoredRoles: ["producer", "scout", "caretaker"],
    buildingKey: "garden",
  },
  {
    id: "pasture_watch",
    title: "Pasture Watch",
    location: "Pasture",
    description: "Fence checks, herd watch, and outdoor patrol.",
    slotCount: 1,
    baseStaminaCost: 6,
    outputLabel: "Safety",
    baseOutputMin: 6,
    baseOutputMax: 12,
    favoredSpecies: ["Dog", "Horse", "Cat"],
    favoredTraits: ["keen", "surefooted", "night_prawler"],
    favoredRoles: ["scout", "caretaker"],
    buildingKey: "barn",
  },
  {
    id: "coop_care",
    title: "Coop & Pen Care",
    location: "Coop / Pen",
    description: "Collecting ingredients, pen upkeep, and smaller livestock care.",
    slotCount: 2,
    baseStaminaCost: 7,
    outputLabel: "Ingredient Yield",
    baseOutputMin: 2,
    baseOutputMax: 5,
    favoredSpecies: ["Dog", "Chicken", "Pig"],
    favoredTraits: ["industrious", "keen", "calm"],
    favoredRoles: ["producer", "caretaker", "cleaner"],
    buildingKey: "house",
  },
  {
    id: "rest",
    title: "Rest & Recovery",
    location: "Quarters",
    description: "Baths, naps, pampering, and preserving energy for breeding.",
    slotCount: 3,
    baseStaminaCost: -10,
    outputLabel: "Recovery",
    baseOutputMin: 8,
    baseOutputMax: 14,
    favoredSpecies: ["Cat", "Cow", "Sheep", "Bunny"],
    favoredTraits: ["calm", "affectionate", "graceful"],
    favoredRoles: ["comfort", "caretaker"],
    buildingKey: "house",
  },
];

export function createEmptyAssignments(): TaskAssignmentMap {
  return {
    morning: Object.fromEntries(RANCH_TASKS.map((task) => [task.id, []])) as Record<RanchTaskId, number[]>,
    afternoon: Object.fromEntries(RANCH_TASKS.map((task) => [task.id, []])) as Record<RanchTaskId, number[]>,
    evening: Object.fromEntries(RANCH_TASKS.map((task) => [task.id, []])) as Record<RanchTaskId, number[]>,
  };
}

export function getTaskById(taskId: RanchTaskId) {
  return RANCH_TASKS.find((task) => task.id === taskId)!;
}

export function getWeatherForDay(day: number): RanchWeather {
  const cycle = day % 7;
  if (cycle === 1) return "clear";
  if (cycle === 2) return "rain";
  if (cycle === 3) return "clear";
  if (cycle === 4) return "heat";
  if (cycle === 5) return "cold";
  if (cycle === 6) return "clear";
  return "storm";
}

export function getWeatherLabel(weather: RanchWeather) {
  if (weather === "clear") return "Clear";
  if (weather === "rain") return "Rain";
  if (weather === "heat") return "Heat";
  if (weather === "cold") return "Cold";
  return "Storm";
}

export function getFeedQualityLabel(feed: FeedQuality) {
  if (feed === "poor") return "Poor Feed";
  if (feed === "standard") return "Standard Feed";
  if (feed === "quality") return "Quality Feed";
  return "Luxury Feed";
}

export function getCreaturePortrait(species: string) {
  if (species === "Cat") return "🐈";
  if (species === "Dog") return "🐕";
  if (species === "Horse") return "🐎";
  if (species === "Cow") return "🐄";
  if (species === "Chicken") return "🐔";
  if (species === "Pig") return "🐖";
  if (species === "Sheep") return "🐑";
  if (species === "Bunny") return "🐇";
  return "🩷";
}

function getGradeMultiplier(grade: TraitGrade) {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

function traitFlatBonus(creature: PlannerCreature, trait: CreatureTrait, base: number) {
  const entry = creature.traits.find((item) => item.trait === trait);
  if (!entry) return 0;
  return Math.max(1, Math.round(base * getGradeMultiplier(entry.grade)));
}

function hasTrait(creature: PlannerCreature, trait: CreatureTrait) {
  return creature.traits.some((entry) => entry.trait === trait);
}

export function getCreatureRoleTags(creature: PlannerCreature): WorkerRoleTag[] {
  const tags = new Set<WorkerRoleTag>();

  if (creature.skills.cleaning.level >= 2 || hasTrait(creature, "domestic")) tags.add("cleaner");
  if (creature.skills.cooking.level >= 2 || hasTrait(creature, "domestic")) tags.add("cook");
  if (creature.skills.breedingCare.level >= 2 || hasTrait(creature, "calm") || hasTrait(creature, "fertile")) tags.add("breeder");
  if (creature.skills.hauling.level >= 2 || creature.stats.strength >= 8 || creature.name === "Horse") tags.add("hauler");
  if (creature.skills.fieldWork.level >= 2 || hasTrait(creature, "industrious")) tags.add("laborer");
  if (hasTrait(creature, "keen") || hasTrait(creature, "night_prawler") || creature.stats.speed >= 8) tags.add("scout");
  if (hasTrait(creature, "affectionate") || hasTrait(creature, "graceful") || creature.happiness >= 75) tags.add("comfort");
  if (hasTrait(creature, "calm") || hasTrait(creature, "affectionate")) tags.add("caretaker");
  if (["Cow", "Chicken", "Pig", "Sheep", "Bunny"].includes(creature.name)) tags.add("producer");

  return Array.from(tags);
}

export function calculateTaskProjection(
  creature: PlannerCreature,
  task: RanchTaskDefinition,
  weather: RanchWeather,
  feedQuality: FeedQuality,
  cleanliness: number,
  buildingLevels: RanchBuildingLevels
): CreatureTaskProjection {
  const roleTags = getCreatureRoleTags(creature);
  const notes: string[] = [];
  let score = 10;

  const favoredSpeciesMatch = task.favoredSpecies.includes(creature.name);
  if (favoredSpeciesMatch) {
    score += 12;
    notes.push(`${creature.name} has a natural species fit here.`);
  }

  const roleMatches = roleTags.filter((tag) => task.favoredRoles.includes(tag)).length;
  if (roleMatches > 0) {
    score += roleMatches * 5;
    notes.push(`Role fit: ${roleTags.filter((tag) => task.favoredRoles.includes(tag)).join(", ")}.`);
  }

  const traitMatches = creature.traits.filter((entry) => task.favoredTraits.includes(entry.trait));
  if (traitMatches.length > 0) {
    const traitScore = traitMatches.reduce((sum, entry) => sum + Math.round(5 * getGradeMultiplier(entry.grade)), 0);
    score += traitScore;
    notes.push(`Helpful traits: ${traitMatches.map((entry) => entry.trait).join(", ")}.`);
  }

  if (task.id === "house_cleaning") {
    score += creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level * 2;
  } else if (task.id === "kitchen_prep") {
    score += creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level * 2;
  } else if (task.id === "nursery_care") {
    score += creature.stats.intelligence + creature.stats.fertility + creature.skills.breedingCare.level * 2;
  } else if (task.id === "field_labor") {
    score += creature.stats.strength + creature.stats.endurance + creature.skills.fieldWork.level * 2;
  } else if (task.id === "hauling") {
    score += creature.stats.strength + creature.stats.endurance + creature.skills.hauling.level * 2;
  } else if (task.id === "garden_tending") {
    score += creature.stats.speed + creature.stats.intelligence + creature.skills.fieldWork.level;
  } else if (task.id === "pasture_watch") {
    score += creature.stats.speed + creature.stats.intelligence + creature.skills.hauling.level;
  } else if (task.id === "coop_care") {
    score += creature.stats.intelligence + creature.stats.endurance + creature.skills.cleaning.level;
  } else if (task.id === "rest") {
    score += creature.stats.vitality + creature.happiness / 8;
  }

  score += buildingLevels[task.buildingKey] * 3;

  if (feedQuality === "quality") score += 3;
  if (feedQuality === "luxury") score += 6;
  if (feedQuality === "poor") {
    score -= 4;
    notes.push("Poor feed lowers performance.");
  }

  if (cleanliness < 40 && task.id !== "house_cleaning" && task.id !== "rest") {
    score -= 4;
    notes.push("Low ranch cleanliness is dragging results down.");
  }

  if ((weather === "rain" || weather === "storm") && ["field_labor", "hauling", "pasture_watch", "garden_tending"].includes(task.id)) {
    score -= 6;
    notes.push("Bad weather is making outdoor work harder.");
  }
  if (weather === "heat" && ["field_labor", "hauling"].includes(task.id)) {
    score -= 5;
    notes.push("Heat is pushing stamina drain higher.");
  }
  if (weather === "cold" && task.id === "nursery_care") {
    score += 2;
    notes.push("Indoor nursery work is steadier in cold weather.");
  }
  if (task.id === "rest" && (weather === "storm" || weather === "cold")) {
    score += 4;
    notes.push("Resting indoors is especially good today.");
  }

  let projectedStaminaCost = task.baseStaminaCost;
  if (task.id !== "rest") {
    projectedStaminaCost += Math.max(0, 5 - Math.floor((creature.stats.endurance + creature.stats.vitality) / 6));
    projectedStaminaCost -= traitFlatBonus(creature, "sturdy", 3);
    if (weather === "heat" && ["field_labor", "hauling"].includes(task.id)) projectedStaminaCost += 2;
    if (weather === "storm" && ["field_labor", "hauling", "pasture_watch"].includes(task.id)) projectedStaminaCost += 2;
    if (feedQuality === "quality") projectedStaminaCost -= 1;
    if (feedQuality === "luxury") projectedStaminaCost -= 2;
    projectedStaminaCost = Math.max(3, projectedStaminaCost);
  } else {
    projectedStaminaCost = Math.min(-6, task.baseStaminaCost - Math.floor(creature.stats.vitality / 3));
  }

  const projectedRemainingStamina = Math.max(0, Math.min(creature.maxBreedingStamina, creature.breedingStamina - projectedStaminaCost));
  const breedingLocked = projectedRemainingStamina < 12;

  const outputBase = Math.max(1, Math.round(score / 8));
  const projectedOutputMin = Math.max(1, task.baseOutputMin + Math.floor(outputBase / 2));
  const projectedOutputMax = Math.max(projectedOutputMin, task.baseOutputMax + outputBase);

  let moodDelta = 0;
  if (favoredSpeciesMatch || roleMatches > 0 || traitMatches.length > 0) moodDelta += 2;
  if (weather === "storm" && ["field_labor", "hauling", "pasture_watch"].includes(task.id)) moodDelta -= 2;
  if (task.id === "rest") moodDelta += 4;
  if (feedQuality === "luxury") moodDelta += 2;
  if (feedQuality === "poor") moodDelta -= 2;

  let cleanlinessDelta = 0;
  if (task.id === "house_cleaning") cleanlinessDelta += projectedOutputMin;
  if (task.id === "field_labor" || task.id === "hauling") cleanlinessDelta -= 3;
  if (task.id === "coop_care") cleanlinessDelta -= 1;
  if (task.id === "rest") cleanlinessDelta += 1;

  let injuryRisk: "low" | "medium" | "high" = "low";
  let riskScore = 0;
  if (["field_labor", "hauling"].includes(task.id)) riskScore += 3;
  if (weather === "storm") riskScore += 2;
  if (weather === "heat") riskScore += 1;
  if (creature.stats.endurance < 6) riskScore += 1;
  if (creature.stats.vitality < 6) riskScore += 1;
  if (projectedRemainingStamina < 10) riskScore += 2;
  if (task.id === "rest") riskScore = 0;

  if (riskScore >= 5) injuryRisk = "high";
  else if (riskScore >= 3) injuryRisk = "medium";

  if (breedingLocked) notes.push("Projected stamina is too low for breeding afterward.");
  else notes.push("Enough projected stamina remains for breeding.");

  return {
    creatureId: creature.id,
    score,
    projectedStaminaCost,
    projectedRemainingStamina,
    breedingLocked,
    projectedOutputMin,
    projectedOutputMax,
    moodDelta,
    cleanlinessDelta,
    injuryRisk,
    roleTags,
    notes,
  };
}

export function getShiftTaskProjection(
  shift: RanchShift,
  task: RanchTaskDefinition,
  assignments: TaskAssignmentMap,
  creatures: PlannerCreature[],
  weather: RanchWeather,
  feedQuality: FeedQuality,
  cleanliness: number,
  buildingLevels: RanchBuildingLevels
) {
  const assignedIds = assignments[shift][task.id];
  const assignedCreatures = creatures.filter((creature) => assignedIds.includes(creature.id));
  const projections = assignedCreatures.map((creature) =>
    calculateTaskProjection(creature, task, weather, feedQuality, cleanliness, buildingLevels)
  );

  return {
    taskId: task.id,
    shift,
    assignedCreatureIds: assignedIds,
    projectedOutputMin: projections.reduce((sum, item) => sum + item.projectedOutputMin, 0),
    projectedOutputMax: projections.reduce((sum, item) => sum + item.projectedOutputMax, 0),
    totalProjectedCost: projections.reduce((sum, item) => sum + item.projectedStaminaCost, 0),
    summaryNotes: projections.flatMap((item) => item.notes).slice(0, 3),
  };
}

export function creatureCanBeAssigned(
  creatureId: number,
  shift: RanchShift,
  assignments: TaskAssignmentMap
) {
  return !Object.values(assignments[shift]).some((ids) => ids.includes(creatureId));
}

export function toggleAssignment(
  assignments: TaskAssignmentMap,
  shift: RanchShift,
  taskId: RanchTaskId,
  creatureId: number
): TaskAssignmentMap {
  const currentIds = assignments[shift][taskId];
  const task = getTaskById(taskId);

  if (currentIds.includes(creatureId)) {
    return {
      ...assignments,
      [shift]: {
        ...assignments[shift],
        [taskId]: currentIds.filter((id) => id !== creatureId),
      },
    };
  }

  const alreadyAssignedElsewhere = Object.keys(assignments[shift]).some((key) =>
    assignments[shift][key as RanchTaskId].includes(creatureId)
  );
  if (alreadyAssignedElsewhere) return assignments;
  if (currentIds.length >= task.slotCount) return assignments;

  return {
    ...assignments,
    [shift]: {
      ...assignments[shift],
      [taskId]: [...currentIds, creatureId],
    },
  };
}

export function getFeedQualityFromStocks(foodStock: number) {
  if (foodStock <= 2) return "poor" as FeedQuality;
  if (foodStock <= 7) return "standard" as FeedQuality;
  if (foodStock <= 15) return "quality" as FeedQuality;
  return "luxury" as FeedQuality;
}

export function getTotalProjectedCostForCreature(
  creature: PlannerCreature,
  assignments: TaskAssignmentMap,
  weather: RanchWeather,
  feedQuality: FeedQuality,
  cleanliness: number,
  buildingLevels: RanchBuildingLevels
) {
  let total = 0;
  for (const shift of SHIFTS) {
    for (const task of RANCH_TASKS) {
      if (assignments[shift][task.id].includes(creature.id)) {
        total += calculateTaskProjection(creature, task, weather, feedQuality, cleanliness, buildingLevels).projectedStaminaCost;
      }
    }
  }
  return total;
}

function getSceneEmoji(taskId: RanchTaskId) {
  if (taskId === "house_cleaning") return "🧹";
  if (taskId === "kitchen_prep") return "🍲";
  if (taskId === "nursery_care") return "🥚";
  if (taskId === "field_labor") return "🌾";
  if (taskId === "hauling") return "🚜";
  if (taskId === "garden_tending") return "🥕";
  if (taskId === "pasture_watch") return "🌙";
  if (taskId === "coop_care") return "🪺";
  return "🛏️";
}

function getResultTier(score: number) {
  if (score >= 42) return "great";
  if (score >= 28) return "good";
  if (score >= 18) return "mixed";
  return "poor";
}

function buildFlavorLine(
  creatureNames: string[],
  task: RanchTaskDefinition,
  tier: "great" | "good" | "mixed" | "poor"
) {
  const cast = creatureNames.join(" and ");
  if (task.id === "kitchen_prep") {
    if (tier === "great") return `${cast} worked the kitchen with smug, domestic confidence, leaving the place warm with tempting smells.`;
    if (tier === "good") return `${cast} kept the kitchen moving and looked quietly pleased with themselves by the end of it.`;
    if (tier === "mixed") return `${cast} managed the meal prep, though the rhythm felt more flustered than graceful.`;
    return `${cast} fumbled the kitchen flow and left behind more sighs than satisfaction.`;
  }
  if (task.id === "nursery_care") {
    if (tier === "great") return `${cast} handled the nursery with soft hands and patient focus, creating a surprisingly intimate calm.`;
    if (tier === "good") return `${cast} kept the nursery steady and soothing, with only a little teasing along the way.`;
    if (tier === "mixed") return `${cast} kept things under control, though the mood never fully settled.`;
    return `${cast} struggled to keep the nursery calm, and the tension lingered in the room.`;
  }
  if (task.id === "rest") {
    if (tier === "great") return `${cast} spent the shift unwinding in open comfort, leaving the room warmer and the mood softer.`;
    if (tier === "good") return `${cast} took the chance to rest properly and looked much more satisfied afterward.`;
    if (tier === "mixed") return `${cast} recovered a little, though it never became the indulgent break it could have been.`;
    return `${cast} tried to rest, but never quite relaxed into it.`;
  }
  if (tier === "great") return `${cast} handled ${task.title.toLowerCase()} with confident teamwork and a little showy pride.`;
  if (tier === "good") return `${cast} kept ${task.title.toLowerCase()} moving smoothly through the shift.`;
  if (tier === "mixed") return `${cast} got through ${task.title.toLowerCase()}, though it took more effort than expected.`;
  return `${cast} had a rough time with ${task.title.toLowerCase()}, and it showed by the end of the shift.`;
}

function buildResultLine(
  task: RanchTaskDefinition,
  totalMin: number,
  totalMax: number,
  staminaCost: number
) {
  return `Projected result: ${totalMin}–${totalMax} ${task.outputLabel}. Shift stamina cost: ${staminaCost}.`;
}

export function generateRecapSlides(
  assignments: TaskAssignmentMap,
  creatures: PlannerCreature[],
  weather: RanchWeather,
  feedQuality: FeedQuality,
  cleanliness: number,
  buildingLevels: RanchBuildingLevels
): RanchRecapSlide[] {
  const slides: RanchRecapSlide[] = [];

  for (const shift of SHIFTS) {
    for (const task of RANCH_TASKS) {
      const assignedIds = assignments[shift][task.id];
      if (assignedIds.length === 0) continue;

      const assignedCreatures = creatures.filter((creature) => assignedIds.includes(creature.id));
      const creatureNames = assignedCreatures.map((creature) => creature.nickname);
      const projections = assignedCreatures.map((creature) =>
        calculateTaskProjection(creature, task, weather, feedQuality, cleanliness, buildingLevels)
      );

      const totalScore = projections.reduce((sum, item) => sum + item.score, 0);
      const totalMin = projections.reduce((sum, item) => sum + item.projectedOutputMin, 0);
      const totalMax = projections.reduce((sum, item) => sum + item.projectedOutputMax, 0);
      const staminaCost = projections.reduce((sum, item) => sum + item.projectedStaminaCost, 0);
      const tier = getResultTier(Math.round(totalScore / Math.max(1, projections.length)));

      slides.push({
        id: `${shift}-${task.id}`,
        image: getSceneEmoji(task.id),
        headline: `${shift[0].toUpperCase() + shift.slice(1)} — ${task.title}`,
        body: buildFlavorLine(creatureNames, task, tier),
        resultLine: buildResultLine(task, totalMin, totalMax, staminaCost),
        shift,
        taskId: task.id,
      });
    }
  }

  if (slides.length === 0) {
    slides.push({
      id: "idle-day",
      image: "🌙",
      headline: "A Quiet Day",
      body: "No one was assigned, so the ranch stayed soft, lazy, and uneventful from dawn to dusk.",
      resultLine: "No task output was generated today.",
      shift: "morning",
      taskId: "rest",
    });
  }

  return slides;
}
