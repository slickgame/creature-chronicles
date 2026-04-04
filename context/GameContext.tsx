"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type CreatureStats = {
  strength: number;
  endurance: number;
  intelligence: number;
  speed: number;
  fertility: number;
  vitality: number;
};

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type LocationName = "ranch" | "town" | "market" | "guild_hall";

type TravelLogEntry = {
  id: number;
  from: LocationName;
  to: LocationName;
  day: number;
  hour: number;
  minute: number;
  minutesSpent: number;
};

type Creature = {
  id: number;
  name: string;
  nickname: string;
  theme: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: CreatureStats;
  breedingStamina: number;
  maxBreedingStamina: number;
  breedingsToday: number;
  dailyBreedingLimit: number;
  giver: string | null;
  receiver: string | null;
  giverId: number | null;
  receiverId: number | null;
  giverIsPlayer: boolean;
  receiverIsPlayer: boolean;
  bornOnDay: number;
  generation: number;
  inbreedingRisk: InbreedingRisk;
  inbredTrait: InbredTrait;
  inbredTraitSeverity: InbredTraitSeverity;
};

type Egg = {
  id: number;
  name: string;
  parents: string;
  hatchDaysRemaining: number;
  giver: string;
  receiver: string;
  giverId: number | null;
  receiverId: number | null;
  giverIsPlayer: boolean;
  receiverIsPlayer: boolean;
  inbreedingRisk: InbreedingRisk;
};

type PlayerData = {
  name: string;
  gold: number;
  energy: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
};

type BreedingSelection = {
  giverType: "player" | "creature";
  giverCreatureId: number | null;
  receiverType: "player" | "creature";
  receiverCreatureId: number | null;
};

type TownStockEntry = {
  id: number;
  creature: Creature;
  price: number;
};

type QuestRequirement = {
  species: string;
  minimumLevel: number;
  minimumStats: Partial<CreatureStats>;
};

type TownQuest = {
  id: number;
  title: string;
  description: string;
  rewardGold: number;
  rewardXp: number;
  deadlineDay: number;
  deadlineHour: number;
  deadlineMinute: number;
  requirement: QuestRequirement;
  completed: boolean;
};

type SaveData = {
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  currentLocation: LocationName;
  playerData: PlayerData;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
  townStock: TownStockEntry[];
  townQuests: TownQuest[];
  travelLog: TravelLogEntry[];
};

type GameContextType = {
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  currentLocation: LocationName;
  playerData: PlayerData;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
  townStock: TownStockEntry[];
  townQuests: TownQuest[];
  travelLog: TravelLogEntry[];
  nextDay: () => void;
  hatchEgg: (eggId: number) => Creature | null;
  breedCreatures: () => void;
  setBreedingSelection: (selection: BreedingSelection) => void;
  resetGame: () => void;
  renameCreature: (creatureId: number, newNickname: string) => void;
  renamePlayer: (newName: string) => void;
  purchaseTownCreature: (stockEntryId: number) => void;
  submitCreatureToQuest: (questId: number, creatureId: number) => void;
  travelTo: (destination: LocationName) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const horseFirstNames = [
  "Dusty",
  "Clover",
  "Rowan",
  "Bramble",
  "Flint",
  "Maple",
  "Sable",
  "Thorn",
];

const horseLastNames = [
  "Carter",
  "Vale",
  "Hoof",
  "Hollow",
  "Briar",
  "Reed",
  "Stone",
  "Meadow",
];

const catFirstNames = [
  "Velvet",
  "Misty",
  "Sable",
  "Luna",
  "Poppy",
  "Ivy",
  "Mochi",
  "Pearl",
];

const catLastNames = [
  "Whisk",
  "Bell",
  "Thorn",
  "Silk",
  "Mire",
  "Moon",
  "Bloom",
  "Shade",
];

const INBRED_TRAITS: InbredTrait[] = ["weak", "frail", "dull", "slow"];

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateNickname(speciesName: string): string {
  if (speciesName === "Horse") {
    return `${randomFrom(horseFirstNames)} ${randomFrom(horseLastNames)}`;
  }

  if (speciesName === "Cat") {
    return `${randomFrom(catFirstNames)} ${randomFrom(catLastNames)}`;
  }

  return `Creature ${Math.floor(Math.random() * 1000)}`;
}

function getXpToNextLevel(level: number): number {
  return 50 + level * 25;
}

function getPlayerXpToNextLevel(level: number): number {
  return 80 + level * 40;
}

function getMaxBreedingStaminaFromStats(stats: CreatureStats): number {
  return 40 + stats.endurance * 4 + stats.vitality * 3;
}

function getDailyBreedingLimitFromStats(stats: CreatureStats): number {
  return Math.max(1, 1 + Math.floor((stats.vitality + stats.fertility) / 8));
}

function createCreatureBase(
  partial: Omit<
    Creature,
    | "level"
    | "xp"
    | "xpToNextLevel"
    | "breedingStamina"
    | "maxBreedingStamina"
    | "breedingsToday"
    | "dailyBreedingLimit"
  >
): Creature {
  const maxBreedingStamina = getMaxBreedingStaminaFromStats(partial.stats);
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(partial.stats);

  return {
    ...partial,
    level: 1,
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
  };
}

const horseTemplate: Creature = createCreatureBase({
  id: 1,
  name: "Horse",
  nickname: "Starter Horse",
  theme: "Field Worker",
  stats: {
    strength: 8,
    endurance: 8,
    intelligence: 4,
    speed: 5,
    fertility: 6,
    vitality: 7,
  },
  giver: null,
  receiver: null,
  giverId: null,
  receiverId: null,
  giverIsPlayer: false,
  receiverIsPlayer: false,
  bornOnDay: 1,
  generation: 1,
  inbreedingRisk: "none",
  inbredTrait: "none",
  inbredTraitSeverity: "none",
});

const catTemplate: Creature = createCreatureBase({
  id: 2,
  name: "Cat",
  nickname: "Starter Cat",
  theme: "House Maid",
  stats: {
    strength: 4,
    endurance: 5,
    intelligence: 8,
    speed: 8,
    fertility: 7,
    vitality: 5,
  },
  giver: null,
  receiver: null,
  giverId: null,
  receiverId: null,
  giverIsPlayer: false,
  receiverIsPlayer: false,
  bornOnDay: 1,
  generation: 1,
  inbreedingRisk: "none",
  inbredTrait: "none",
  inbredTraitSeverity: "none",
});

function getCreatureTemplateByName(name: string): Creature | null {
  if (name === "Horse") return horseTemplate;
  if (name === "Cat") return catTemplate;
  return null;
}

function rollStatVariation(): number {
  const options = [-1, 0, 1];
  return options[Math.floor(Math.random() * options.length)];
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function calculateInbreedingRisk(
  giverCreature: Creature | null,
  receiverCreature: Creature | null,
  giverIsPlayer: boolean,
  receiverIsPlayer: boolean
): InbreedingRisk {
  if (
    giverIsPlayer &&
    receiverCreature &&
    (receiverCreature.giverIsPlayer || receiverCreature.receiverIsPlayer)
  ) {
    return "parent_child";
  }

  if (
    receiverIsPlayer &&
    giverCreature &&
    (giverCreature.giverIsPlayer || giverCreature.receiverIsPlayer)
  ) {
    return "parent_child";
  }

  if (!giverCreature || !receiverCreature) {
    return "none";
  }

  const isParentChild =
    giverCreature.id === receiverCreature.giverId ||
    giverCreature.id === receiverCreature.receiverId ||
    receiverCreature.id === giverCreature.giverId ||
    receiverCreature.id === giverCreature.receiverId;

  if (isParentChild) {
    return "parent_child";
  }

  const sameGiverSide =
    (giverCreature.giverId !== null &&
      giverCreature.giverId === receiverCreature.giverId) ||
    (giverCreature.giverIsPlayer && receiverCreature.giverIsPlayer);

  const sameReceiverSide =
    (giverCreature.receiverId !== null &&
      giverCreature.receiverId === receiverCreature.receiverId) ||
    (giverCreature.receiverIsPlayer && receiverCreature.receiverIsPlayer);

  if (sameGiverSide && sameReceiverSide) {
    return "full_sibling";
  }

  if (sameGiverSide || sameReceiverSide) {
    return "half_sibling";
  }

  return "none";
}

function createInheritedStats(
  baseStats: CreatureStats,
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): CreatureStats {
  const parentStats = [giverCreature?.stats, receiverCreature?.stats].filter(
    Boolean
  ) as CreatureStats[];

  if (parentStats.length === 0) {
    return {
      strength: Math.max(1, baseStats.strength + rollStatVariation()),
      endurance: Math.max(1, baseStats.endurance + rollStatVariation()),
      intelligence: Math.max(1, baseStats.intelligence + rollStatVariation()),
      speed: Math.max(1, baseStats.speed + rollStatVariation()),
      fertility: Math.max(1, baseStats.fertility + rollStatVariation()),
      vitality: Math.max(1, baseStats.vitality + rollStatVariation()),
    };
  }

  return {
    strength: Math.max(
      1,
      Math.round(
        (baseStats.strength + average(parentStats.map((p) => p.strength))) / 2
      ) + rollStatVariation()
    ),
    endurance: Math.max(
      1,
      Math.round(
        (baseStats.endurance + average(parentStats.map((p) => p.endurance))) / 2
      ) + rollStatVariation()
    ),
    intelligence: Math.max(
      1,
      Math.round(
        (baseStats.intelligence +
          average(parentStats.map((p) => p.intelligence))) /
          2
      ) + rollStatVariation()
    ),
    speed: Math.max(
      1,
      Math.round(
        (baseStats.speed + average(parentStats.map((p) => p.speed))) / 2
      ) + rollStatVariation()
    ),
    fertility: Math.max(
      1,
      Math.round(
        (baseStats.fertility + average(parentStats.map((p) => p.fertility))) / 2
      ) + rollStatVariation()
    ),
    vitality: Math.max(
      1,
      Math.round(
        (baseStats.vitality + average(parentStats.map((p) => p.vitality))) / 2
      ) + rollStatVariation()
    ),
  };
}

function applyInbreedingPenalty(
  stats: CreatureStats,
  risk: InbreedingRisk
): {
  stats: CreatureStats;
  inbredTrait: InbredTrait;
  inbredTraitSeverity: InbredTraitSeverity;
} {
  if (risk === "none") {
    return {
      stats,
      inbredTrait: "none",
      inbredTraitSeverity: "none",
    };
  }

  const inbredTrait = randomFrom(INBRED_TRAITS);
  const penalty = risk === "half_sibling" ? 1 : 2;
  const severity: InbredTraitSeverity =
    risk === "half_sibling" ? "mild" : "severe";

  const adjustedStats = { ...stats };

  if (inbredTrait === "weak") {
    adjustedStats.strength = Math.max(1, adjustedStats.strength - penalty);
  }

  if (inbredTrait === "frail") {
    adjustedStats.endurance = Math.max(1, adjustedStats.endurance - penalty);
    adjustedStats.vitality = Math.max(1, adjustedStats.vitality - 1);
  }

  if (inbredTrait === "dull") {
    adjustedStats.intelligence = Math.max(
      1,
      adjustedStats.intelligence - penalty
    );
  }

  if (inbredTrait === "slow") {
    adjustedStats.speed = Math.max(1, adjustedStats.speed - penalty);
  }

  return {
    stats: adjustedStats,
    inbredTrait,
    inbredTraitSeverity: severity,
  };
}

function createCreatureFromTemplate(
  template: Creature,
  giver: string,
  receiver: string,
  giverId: number | null,
  receiverId: number | null,
  giverIsPlayer: boolean,
  receiverIsPlayer: boolean,
  currentDay: number,
  generation: number,
  inbreedingRisk: InbreedingRisk,
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): Creature {
  const inheritedStats = createInheritedStats(
    template.stats,
    giverCreature,
    receiverCreature
  );

  const penaltyResult = applyInbreedingPenalty(inheritedStats, inbreedingRisk);

  const maxBreedingStamina = getMaxBreedingStaminaFromStats(
    penaltyResult.stats
  );
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(
    penaltyResult.stats
  );

  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    nickname: generateNickname(template.name),
    level: 1,
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    stats: penaltyResult.stats,
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
    giver,
    receiver,
    giverId,
    receiverId,
    giverIsPlayer,
    receiverIsPlayer,
    bornOnDay: currentDay,
    generation,
    inbreedingRisk,
    inbredTrait: penaltyResult.inbredTrait,
    inbredTraitSeverity: penaltyResult.inbredTraitSeverity,
  };
}

function normalizeCreature(creature: Creature): Creature {
  const normalizedStats = {
    strength: creature.stats?.strength ?? 1,
    endurance: creature.stats?.endurance ?? 1,
    intelligence: creature.stats?.intelligence ?? 1,
    speed: creature.stats?.speed ?? 1,
    fertility: creature.stats?.fertility ?? 5,
    vitality: creature.stats?.vitality ?? 5,
  };

  const maxBreedingStamina =
    creature.maxBreedingStamina ??
    getMaxBreedingStaminaFromStats(normalizedStats);

  const dailyBreedingLimit =
    creature.dailyBreedingLimit ??
    getDailyBreedingLimitFromStats(normalizedStats);

  return {
    ...creature,
    level: creature.level ?? 1,
    xp: creature.xp ?? 0,
    xpToNextLevel:
      creature.xpToNextLevel ?? getXpToNextLevel(creature.level ?? 1),
    stats: normalizedStats,
    breedingStamina: creature.breedingStamina ?? maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: creature.breedingsToday ?? 0,
    dailyBreedingLimit,
    inbreedingRisk: creature.inbreedingRisk ?? "none",
    inbredTrait: creature.inbredTrait ?? "none",
    inbredTraitSeverity: creature.inbredTraitSeverity ?? "none",
  };
}

function normalizeEgg(egg: Egg): Egg {
  return {
    ...egg,
    inbreedingRisk: egg.inbreedingRisk ?? "none",
  };
}

function normalizePlayerData(playerData: PlayerData): PlayerData {
  return {
    ...playerData,
    level: playerData.level ?? 1,
    xp: playerData.xp ?? 0,
    xpToNextLevel:
      playerData.xpToNextLevel ?? getPlayerXpToNextLevel(playerData.level ?? 1),
  };
}

function createTownSellerCreature(
  template: Creature,
  currentDay: number
): Creature {
  const stats = {
    strength: Math.max(1, template.stats.strength + rollStatVariation()),
    endurance: Math.max(1, template.stats.endurance + rollStatVariation()),
    intelligence: Math.max(1, template.stats.intelligence + rollStatVariation()),
    speed: Math.max(1, template.stats.speed + rollStatVariation()),
    fertility: Math.max(1, template.stats.fertility + rollStatVariation()),
    vitality: Math.max(1, template.stats.vitality + rollStatVariation()),
  };

  const maxBreedingStamina = getMaxBreedingStaminaFromStats(stats);
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(stats);

  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    nickname: generateNickname(template.name),
    level: 1 + Math.floor(Math.random() * 3),
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    stats,
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
    giver: null,
    receiver: null,
    giverId: null,
    receiverId: null,
    giverIsPlayer: false,
    receiverIsPlayer: false,
    bornOnDay: currentDay,
    generation: 1,
    inbreedingRisk: "none",
    inbredTrait: "none",
    inbredTraitSeverity: "none",
  };
}

function generateTownStock(currentDay: number): TownStockEntry[] {
  const templates = [horseTemplate, catTemplate];

  return Array.from({ length: 3 }).map((_, index) => {
    const template = randomFrom(templates);
    const creature = createTownSellerCreature(template, currentDay);
    const statTotal =
      creature.stats.strength +
      creature.stats.endurance +
      creature.stats.intelligence +
      creature.stats.speed +
      creature.stats.fertility +
      creature.stats.vitality;

    return {
      id: currentDay * 100 + index + 1,
      creature,
      price: 80 + statTotal * 3,
    };
  });
}

function createSingleTownQuest(
  currentDay: number,
  questIdSeed: number
): TownQuest {
  const questTemplates = [
    {
      title: "Stable Delivery",
      description: "Submit a sturdy Horse with strong endurance.",
      rewardGold: 140,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 18,
      deadlineMinute: 0,
      requirement: {
        species: "Horse",
        minimumLevel: 1,
        minimumStats: {
          endurance: 8,
        },
      },
    },
    {
      title: "Household Companion",
      description: "Submit a quick Cat with sharp intelligence.",
      rewardGold: 145,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 20,
      deadlineMinute: 0,
      requirement: {
        species: "Cat",
        minimumLevel: 1,
        minimumStats: {
          intelligence: 8,
          speed: 7,
        },
      },
    },
    {
      title: "Healthy Bloodline",
      description:
        "Submit any creature with no inbreeding risk and solid vitality.",
      rewardGold: 175,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 12,
      deadlineMinute: 0,
      requirement: {
        species: "any",
        minimumLevel: 2,
        minimumStats: {
          vitality: 7,
        },
      },
    },
    {
      title: "Swift Courier",
      description: "Submit a fast creature suited for urgent deliveries.",
      rewardGold: 155,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 16,
      deadlineMinute: 0,
      requirement: {
        species: "any",
        minimumLevel: 1,
        minimumStats: {
          speed: 8,
        },
      },
    },
    {
      title: "Fertile Prospect",
      description: "Submit a breeding candidate with strong fertility.",
      rewardGold: 165,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 14,
      deadlineMinute: 0,
      requirement: {
        species: "any",
        minimumLevel: 2,
        minimumStats: {
          fertility: 8,
        },
      },
    },
  ] as const;

  const template = randomFrom(questTemplates);

  return {
    id: questIdSeed,
    title: template.title,
    description: template.description,
    rewardGold: template.rewardGold,
    rewardXp: template.rewardXp,
    deadlineDay: currentDay + template.deadlineOffsetDays,
    deadlineHour: template.deadlineHour,
    deadlineMinute: template.deadlineMinute,
    requirement: {
      species: template.requirement.species,
      minimumLevel: template.requirement.minimumLevel,
      minimumStats: { ...template.requirement.minimumStats },
    },
    completed: false,
  };
}

function generateTownQuests(currentDay: number): TownQuest[] {
  return Array.from({ length: 10 }).map((_, index) =>
    createSingleTownQuest(currentDay, currentDay * 1000 + index + 1)
  );
}

function isQuestExpired(
  quest: TownQuest,
  currentDay: number,
  currentHour: number,
  currentMinute: number
) {
  if (currentDay > quest.deadlineDay) return true;
  if (currentDay < quest.deadlineDay) return false;
  if (currentHour > quest.deadlineHour) return true;
  if (currentHour < quest.deadlineHour) return false;
  return currentMinute > quest.deadlineMinute;
}

function isQuestExpiringSoon(
  quest: TownQuest,
  currentDay: number,
  currentHour: number,
  currentMinute: number
) {
  if (isQuestExpired(quest, currentDay, currentHour, currentMinute)) {
    return false;
  }

  const currentTotal =
    currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const deadlineTotal =
    quest.deadlineDay * 24 * 60 +
    quest.deadlineHour * 60 +
    quest.deadlineMinute;

  return deadlineTotal - currentTotal <= 24 * 60;
}

function ensureQuestBoardSize(
  quests: TownQuest[],
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  desiredCount = 10
): TownQuest[] {
  const activeQuests = quests.filter(
    (quest) =>
      !quest.completed &&
      !isQuestExpired(quest, currentDay, currentHour, currentMinute)
  );

  let nextIdSeed =
    activeQuests.length > 0
      ? Math.max(...activeQuests.map((quest) => quest.id)) + 1
      : currentDay * 1000 + 1;

  const nextQuests = [...activeQuests];

  while (nextQuests.length < desiredCount) {
    nextQuests.push(createSingleTownQuest(currentDay, nextIdSeed));
    nextIdSeed += 1;
  }

  return nextQuests.slice(0, desiredCount);
}

function applyTownActionTimeCost(
  day: number,
  hour: number,
  minute: number,
  minutesToAdd: number
) {
  return addMinutesToClock(day, hour, minute, minutesToAdd);
}

function applyIntelligenceRiskMitigation(
  baseRisk: InbreedingRisk,
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): InbreedingRisk {
  if (baseRisk === "none") {
    return "none";
  }

  const intelligenceValues = [
    giverCreature?.stats.intelligence,
    receiverCreature?.stats.intelligence,
  ].filter((value): value is number => typeof value === "number");

  if (intelligenceValues.length === 0) {
    return baseRisk;
  }

  const avgIntelligence = average(intelligenceValues);

  if (baseRisk === "half_sibling") {
    const mitigationChance = Math.min(
      0.45,
      Math.max(0, (avgIntelligence - 6) * 0.05)
    );
    if (Math.random() < mitigationChance) {
      return "none";
    }
  }

  if (baseRisk === "parent_child" || baseRisk === "full_sibling") {
    const downgradeChance = Math.min(
      0.35,
      Math.max(0, (avgIntelligence - 7) * 0.04)
    );
    if (Math.random() < downgradeChance) {
      return "half_sibling";
    }
  }

  return baseRisk;
}

function getBreedingSessionMinutes(
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): number {
  const speedValues = [giverCreature?.stats.speed, receiverCreature?.stats.speed]
    .filter((value): value is number => typeof value === "number");

  if (speedValues.length === 0) {
    return 120;
  }

  const avgSpeed = average(speedValues);
  return Math.max(30, 120 - Math.round(avgSpeed * 6));
}

function getBreedingStaminaCost(creature: Creature): number {
  return Math.max(8, 22 - Math.floor(creature.stats.endurance / 2));
}

function addMinutesToClock(
  day: number,
  hour: number,
  minute: number,
  minutesToAdd: number
) {
  let totalMinutes = hour * 60 + minute + minutesToAdd;
  let newDay = day;

  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    newDay += 1;
  }

  return {
    day: newDay,
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

function applyXpGain(creature: Creature, xpGain: number): Creature {
  let updatedCreature = {
    ...creature,
    xp: creature.xp + xpGain,
  };

  while (updatedCreature.xp >= updatedCreature.xpToNextLevel) {
    updatedCreature = {
      ...updatedCreature,
      xp: updatedCreature.xp - updatedCreature.xpToNextLevel,
      level: updatedCreature.level + 1,
      xpToNextLevel: getXpToNextLevel(updatedCreature.level + 1),
      stats: {
        strength:
          updatedCreature.stats.strength +
          (updatedCreature.level % 2 === 0 ? 1 : 0),
        endurance: updatedCreature.stats.endurance + 1,
        intelligence:
          updatedCreature.stats.intelligence +
          (updatedCreature.level % 3 === 0 ? 1 : 0),
        speed:
          updatedCreature.stats.speed +
          (updatedCreature.level % 2 !== 0 ? 1 : 0),
        fertility:
          updatedCreature.stats.fertility +
          (updatedCreature.level % 3 === 0 ? 1 : 0),
        vitality: updatedCreature.stats.vitality + 1,
      },
    };

    const recalculatedMaxStamina = getMaxBreedingStaminaFromStats(
      updatedCreature.stats
    );
    const recalculatedDailyLimit = getDailyBreedingLimitFromStats(
      updatedCreature.stats
    );

    updatedCreature = {
      ...updatedCreature,
      maxBreedingStamina: recalculatedMaxStamina,
      breedingStamina: Math.min(
        recalculatedMaxStamina,
        updatedCreature.breedingStamina + 6
      ),
      dailyBreedingLimit: recalculatedDailyLimit,
    };
  }

  return updatedCreature;
}

function applyPlayerXpGain(playerData: PlayerData, xpGain: number): PlayerData {
  let updatedPlayer = {
    ...playerData,
    xp: playerData.xp + xpGain,
  };

  while (updatedPlayer.xp >= updatedPlayer.xpToNextLevel) {
    updatedPlayer = {
      ...updatedPlayer,
      xp: updatedPlayer.xp - updatedPlayer.xpToNextLevel,
      level: updatedPlayer.level + 1,
      xpToNextLevel: getPlayerXpToNextLevel(updatedPlayer.level + 1),
      energy: Math.min(100, updatedPlayer.energy + 10),
    };
  }

  return updatedPlayer;
}

function doesCreatureMeetQuest(
  creature: Creature,
  quest: TownQuest
): boolean {
  if (
    quest.requirement.species !== "any" &&
    creature.name !== quest.requirement.species
  ) {
    return false;
  }

  if (creature.level < quest.requirement.minimumLevel) {
    return false;
  }

  const minimumStats = quest.requirement.minimumStats;

  if (
    minimumStats.strength !== undefined &&
    creature.stats.strength < minimumStats.strength
  ) {
    return false;
  }

  if (
    minimumStats.endurance !== undefined &&
    creature.stats.endurance < minimumStats.endurance
  ) {
    return false;
  }

  if (
    minimumStats.intelligence !== undefined &&
    creature.stats.intelligence < minimumStats.intelligence
  ) {
    return false;
  }

  if (
    minimumStats.speed !== undefined &&
    creature.stats.speed < minimumStats.speed
  ) {
    return false;
  }

  if (
    minimumStats.fertility !== undefined &&
    creature.stats.fertility < minimumStats.fertility
  ) {
    return false;
  }

  if (
    minimumStats.vitality !== undefined &&
    creature.stats.vitality < minimumStats.vitality
  ) {
    return false;
  }

  if (
    quest.title === "Healthy Bloodline" &&
    creature.inbreedingRisk !== "none"
  ) {
    return false;
  }

  return true;
}

function getTravelMinutes(from: LocationName, to: LocationName): number {
  if (from === to) return 0;

  const travelTimes: Record<LocationName, Record<LocationName, number>> = {
    ranch: {
      ranch: 0,
      town: 30,
      market: 40,
      guild_hall: 45,
    },
    town: {
      ranch: 30,
      town: 0,
      market: 15,
      guild_hall: 20,
    },
    market: {
      ranch: 40,
      town: 15,
      market: 0,
      guild_hall: 10,
    },
    guild_hall: {
      ranch: 45,
      town: 20,
      market: 10,
      guild_hall: 0,
    },
  };

  return travelTimes[from][to];
}

const defaultPlayerData: PlayerData = {
  name: "Player",
  gold: 500,
  energy: 100,
  level: 1,
  xp: 0,
  xpToNextLevel: getPlayerXpToNextLevel(1),
};

const defaultCreatures: Creature[] = [
  normalizeCreature({
    ...horseTemplate,
    id: 1,
    nickname: "Starter Horse",
  }),
  normalizeCreature({
    ...catTemplate,
    id: 2,
    nickname: "Starter Cat",
  }),
];

const defaultBreedingSelection: BreedingSelection = {
  giverType: "creature",
  giverCreatureId: 1,
  receiverType: "creature",
  receiverCreatureId: 2,
};

const defaultEggs: Egg[] = [
  {
    id: 1,
    name: "Test Egg",
    parents: "Starter Horse + Starter Cat",
    hatchDaysRemaining: 3,
    giver: "Horse",
    receiver: "Cat",
    giverId: 1,
    receiverId: 2,
    giverIsPlayer: false,
    receiverIsPlayer: false,
    inbreedingRisk: "none",
  },
];

const defaultSaveData: SaveData = {
  currentDay: 1,
  currentHour: 8,
  currentMinute: 0,
  currentLocation: "ranch",
  playerData: defaultPlayerData,
  creatures: defaultCreatures,
  eggs: defaultEggs,
  breedingSelection: defaultBreedingSelection,
  townStock: generateTownStock(1),
  townQuests: generateTownQuests(1),
  travelLog: [],
};

const STORAGE_KEY = "creature-chronicles-save";

export function GameProvider({ children }: { children: ReactNode }) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const [currentDay, setCurrentDay] = useState(defaultSaveData.currentDay);
  const [currentHour, setCurrentHour] = useState(defaultSaveData.currentHour);
  const [currentMinute, setCurrentMinute] = useState(defaultSaveData.currentMinute);
  const [currentLocation, setCurrentLocation] = useState<LocationName>(
    defaultSaveData.currentLocation
  );
  const [playerData, setPlayerData] = useState(defaultSaveData.playerData);
  const [creatures, setCreatures] = useState(defaultSaveData.creatures);
  const [eggs, setEggs] = useState(defaultSaveData.eggs);
  const [breedingSelection, setBreedingSelection] = useState(
    defaultSaveData.breedingSelection
  );
  const [townStock, setTownStock] = useState(defaultSaveData.townStock);
  const [townQuests, setTownQuests] = useState(defaultSaveData.townQuests);
  const [travelLog, setTravelLog] = useState<TravelLogEntry[]>(
    defaultSaveData.travelLog
  );

  useEffect(() => {
    const savedGame = localStorage.getItem(STORAGE_KEY);

    if (savedGame) {
      try {
        const parsedSave: SaveData = JSON.parse(savedGame);

        setCurrentDay(parsedSave.currentDay);
        setCurrentHour(parsedSave.currentHour ?? 8);
        setCurrentMinute(parsedSave.currentMinute ?? 0);
        setCurrentLocation(parsedSave.currentLocation ?? "ranch");
        setPlayerData(normalizePlayerData(parsedSave.playerData));
        setCreatures(parsedSave.creatures.map(normalizeCreature));
        setEggs(parsedSave.eggs.map(normalizeEgg));
        setBreedingSelection(parsedSave.breedingSelection);
        setTownStock(
          parsedSave.townStock?.map((entry) => ({
            ...entry,
            creature: normalizeCreature(entry.creature),
          })) ?? generateTownStock(parsedSave.currentDay ?? 1)
        );
        setTownQuests(
          ensureQuestBoardSize(
            parsedSave.townQuests ?? generateTownQuests(parsedSave.currentDay ?? 1),
            parsedSave.currentDay ?? 1,
            parsedSave.currentHour ?? 8,
            parsedSave.currentMinute ?? 0,
            10
          )
        );
        setTravelLog(parsedSave.travelLog ?? []);
      } catch (error) {
        console.error("Failed to load save data:", error);
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    const saveData: SaveData = {
      currentDay,
      currentHour,
      currentMinute,
      currentLocation,
      playerData,
      creatures,
      eggs,
      breedingSelection,
      townStock,
      townQuests,
      travelLog,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }, [
    hasLoaded,
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    creatures,
    eggs,
    breedingSelection,
    townStock,
    townQuests,
    travelLog,
  ]);

  function nextDay() {
    const newDay = currentDay + 1;

    setCurrentDay(newDay);
    setCurrentHour(8);
    setCurrentMinute(0);

    setEggs((prevEggs) =>
      prevEggs.map((egg) => ({
        ...egg,
        hatchDaysRemaining:
          egg.hatchDaysRemaining > 0 ? egg.hatchDaysRemaining - 1 : 0,
      }))
    );

    setCreatures((prevCreatures) =>
      prevCreatures.map((creature) => ({
        ...creature,
        breedingStamina: creature.maxBreedingStamina,
        breedingsToday: 0,
      }))
    );

    setPlayerData((prev) => ({
      ...prev,
      energy: Math.min(100, prev.energy + 25),
    }));

    setTownStock(generateTownStock(newDay));
    setTownQuests((prev) =>
      ensureQuestBoardSize(prev, newDay, 8, 0, 10)
    );
  }

  function hatchEgg(eggId: number): Creature | null {
    const eggToHatch = eggs.find((egg) => egg.id === eggId);

    if (!eggToHatch || eggToHatch.hatchDaysRemaining > 0) {
      return null;
    }

    let childSpeciesName = "Cat";

    if (eggToHatch.giver === "Player") {
      childSpeciesName = eggToHatch.receiver;
    } else {
      childSpeciesName =
        Math.random() < 0.5 ? eggToHatch.giver : eggToHatch.receiver;
    }

    const template = getCreatureTemplateByName(childSpeciesName);

    if (!template) {
      return null;
    }

    const giverCreature = eggToHatch.giverId
      ? creatures.find((c) => c.id === eggToHatch.giverId) ?? null
      : null;

    const receiverCreature = eggToHatch.receiverId
      ? creatures.find((c) => c.id === eggToHatch.receiverId) ?? null
      : null;

    const parentGenerations = [
      giverCreature?.generation ?? 1,
      receiverCreature?.generation ?? 1,
    ];

    const childGeneration = Math.max(...parentGenerations) + 1;

    const inbreedingRisk =
      eggToHatch.inbreedingRisk ??
      calculateInbreedingRisk(
        giverCreature,
        receiverCreature,
        eggToHatch.giverIsPlayer,
        eggToHatch.receiverIsPlayer
      );

    const newCreature = createCreatureFromTemplate(
      template,
      eggToHatch.giver,
      eggToHatch.receiver,
      eggToHatch.giverId,
      eggToHatch.receiverId,
      eggToHatch.giverIsPlayer,
      eggToHatch.receiverIsPlayer,
      currentDay,
      childGeneration,
      inbreedingRisk,
      giverCreature,
      receiverCreature
    );

    setCreatures((prev) => [...prev, newCreature]);
    setEggs((prev) => prev.filter((egg) => egg.id !== eggId));

    return newCreature;
  }

  function breedCreatures() {
    const energyCost = 8;

    if (playerData.energy < energyCost) {
      return;
    }

    const giverIsPlayer = breedingSelection.giverType === "player";
    const receiverIsPlayer = breedingSelection.receiverType === "player";

    const giverCreature = breedingSelection.giverCreatureId
      ? creatures.find((c) => c.id === breedingSelection.giverCreatureId) ?? null
      : null;

    const receiverCreature = breedingSelection.receiverCreatureId
      ? creatures.find((c) => c.id === breedingSelection.receiverCreatureId) ?? null
      : null;

    const giverLabel = giverIsPlayer
      ? playerData.name
      : giverCreature?.nickname ?? "";
    const receiverLabel = receiverIsPlayer
      ? playerData.name
      : receiverCreature?.nickname ?? "";

    const giverSpecies = giverIsPlayer ? "Player" : giverCreature?.name ?? "";
    const receiverSpecies = receiverIsPlayer
      ? "Player"
      : receiverCreature?.name ?? "";

    if (!giverLabel || !receiverLabel || !giverSpecies || !receiverSpecies) {
      return;
    }

    if (
      !giverIsPlayer &&
      !receiverIsPlayer &&
      giverCreature &&
      receiverCreature &&
      giverCreature.id === receiverCreature.id
    ) {
      return;
    }

    if (giverCreature) {
      if (
        giverCreature.breedingsToday >= giverCreature.dailyBreedingLimit ||
        giverCreature.breedingStamina < getBreedingStaminaCost(giverCreature)
      ) {
        return;
      }
    }

    if (receiverCreature) {
      if (
        receiverCreature.breedingsToday >= receiverCreature.dailyBreedingLimit ||
        receiverCreature.breedingStamina < getBreedingStaminaCost(receiverCreature)
      ) {
        return;
      }
    }

    const baseInbreedingRisk = calculateInbreedingRisk(
      giverCreature,
      receiverCreature,
      giverIsPlayer,
      receiverIsPlayer
    );

    const inbreedingRisk = applyIntelligenceRiskMitigation(
      baseInbreedingRisk,
      giverCreature,
      receiverCreature
    );

    const minutesSpent = getBreedingSessionMinutes(giverCreature, receiverCreature);
    const updatedClock = addMinutesToClock(
      currentDay,
      currentHour,
      currentMinute,
      minutesSpent
    );

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setPlayerData((prev) => ({
      ...prev,
      energy: prev.energy - energyCost,
    }));

    setCreatures((prev) =>
      prev.map((creature) => {
        if (giverCreature && creature.id === giverCreature.id) {
          return applyXpGain(
            {
              ...creature,
              breedingStamina:
                creature.breedingStamina - getBreedingStaminaCost(creature),
              breedingsToday: creature.breedingsToday + 1,
            },
            18
          );
        }

        if (receiverCreature && creature.id === receiverCreature.id) {
          return applyXpGain(
            {
              ...creature,
              breedingStamina:
                creature.breedingStamina - getBreedingStaminaCost(creature),
              breedingsToday: creature.breedingsToday + 1,
            },
            18
          );
        }

        return creature;
      })
    );

    if (receiverIsPlayer) {
      return;
    }

    const newEgg: Egg = {
      id: Date.now(),
      name: `${giverLabel} x ${receiverLabel} Egg`,
      parents: `${giverLabel} + ${receiverLabel}`,
      hatchDaysRemaining: 3,
      giver: giverSpecies,
      receiver: receiverSpecies,
      giverId: giverIsPlayer ? null : giverCreature?.id ?? null,
      receiverId: receiverIsPlayer ? null : receiverCreature?.id ?? null,
      giverIsPlayer,
      receiverIsPlayer,
      inbreedingRisk,
    };

    setEggs((prev) => [...prev, newEgg]);
  }

  function renameCreature(creatureId: number, newNickname: string) {
    const trimmedName = newNickname.trim();
    if (!trimmedName) return;

    setCreatures((prev) =>
      prev.map((creature) =>
        creature.id === creatureId
          ? { ...creature, nickname: trimmedName }
          : creature
      )
    );
  }

  function renamePlayer(newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setPlayerData((prev) => ({
      ...prev,
      name: trimmedName,
    }));
  }

  function purchaseTownCreature(stockEntryId: number) {
    const entry = townStock.find((item) => item.id === stockEntryId);
    if (!entry) return;
    if (playerData.gold < entry.price) return;

    const updatedClock = applyTownActionTimeCost(
      currentDay,
      currentHour,
      currentMinute,
      20
    );

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setPlayerData((prev) => ({
      ...prev,
      gold: prev.gold - entry.price,
    }));

    setCreatures((prev) => [...prev, entry.creature]);
    setTownStock((prev) => prev.filter((item) => item.id !== stockEntryId));

    setTownQuests((prev) =>
      ensureQuestBoardSize(
        prev,
        updatedClock.day,
        updatedClock.hour,
        updatedClock.minute,
        10
      )
    );
  }

  function submitCreatureToQuest(questId: number, creatureId: number) {
    const quest = townQuests.find((item) => item.id === questId);
    const creature = creatures.find((item) => item.id === creatureId);

    if (!quest || !creature || quest.completed) return;
    if (isQuestExpired(quest, currentDay, currentHour, currentMinute)) return;
    if (!doesCreatureMeetQuest(creature, quest)) return;

    const updatedClock = applyTownActionTimeCost(
      currentDay,
      currentHour,
      currentMinute,
      30
    );

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setCreatures((prev) => prev.filter((item) => item.id !== creatureId));

    setPlayerData((prev) =>
      applyPlayerXpGain(
        {
          ...prev,
          gold: prev.gold + quest.rewardGold,
        },
        quest.rewardXp
      )
    );

    setTownQuests((prev) => {
      const completedSet = prev.map((item) =>
        item.id === questId ? { ...item, completed: true } : item
      );

      return ensureQuestBoardSize(
        completedSet,
        updatedClock.day,
        updatedClock.hour,
        updatedClock.minute,
        10
      );
    });
  }

  function travelTo(destination: LocationName) {
    if (destination === currentLocation) return;

    const travelMinutes = getTravelMinutes(currentLocation, destination);
    const updatedClock = addMinutesToClock(
      currentDay,
      currentHour,
      currentMinute,
      travelMinutes
    );

    const newLogEntry: TravelLogEntry = {
      id: Date.now(),
      from: currentLocation,
      to: destination,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
      minutesSpent: travelMinutes,
    };

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setCurrentLocation(destination);
    setTravelLog((prev) => [newLogEntry, ...prev].slice(0, 20));

    setTownQuests((prev) =>
      ensureQuestBoardSize(
        prev,
        updatedClock.day,
        updatedClock.hour,
        updatedClock.minute,
        10
      )
    );
  }

  function resetGame() {
    const freshHorse = normalizeCreature({
      ...horseTemplate,
      id: 1,
      nickname: generateNickname("Horse"),
      inbreedingRisk: "none",
      inbredTrait: "none",
      inbredTraitSeverity: "none",
    });

    const freshCat = normalizeCreature({
      ...catTemplate,
      id: 2,
      nickname: generateNickname("Cat"),
      inbreedingRisk: "none",
      inbredTrait: "none",
      inbredTraitSeverity: "none",
    });

    setCurrentDay(1);
    setCurrentHour(8);
    setCurrentMinute(0);
    setCurrentLocation("ranch");
    setPlayerData(defaultPlayerData);
    setCreatures([freshHorse, freshCat]);
    setEggs([
      {
        id: 1,
        name: `${freshHorse.nickname} x ${freshCat.nickname} Egg`,
        parents: `${freshHorse.nickname} + ${freshCat.nickname}`,
        hatchDaysRemaining: 3,
        giver: "Horse",
        receiver: "Cat",
        giverId: freshHorse.id,
        receiverId: freshCat.id,
        giverIsPlayer: false,
        receiverIsPlayer: false,
        inbreedingRisk: "none",
      },
    ]);
    setBreedingSelection({
      giverType: "creature",
      giverCreatureId: freshHorse.id,
      receiverType: "creature",
      receiverCreatureId: freshCat.id,
    });
    setTownStock(generateTownStock(1));
    setTownQuests(generateTownQuests(1));
    setTravelLog([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <GameContext.Provider
      value={{
        currentDay,
        currentHour,
        currentMinute,
        currentLocation,
        playerData,
        creatures,
        eggs,
        breedingSelection,
        townStock,
        townQuests,
        travelLog,
        nextDay,
        hatchEgg,
        breedCreatures,
        setBreedingSelection,
        resetGame,
        renameCreature,
        renamePlayer,
        purchaseTownCreature,
        submitCreatureToQuest,
        travelTo,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside a GameProvider");
  }

  return context;
}