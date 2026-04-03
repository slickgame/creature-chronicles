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
};

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type Creature = {
  id: number;
  name: string;
  nickname: string;
  theme: string;
  stats: CreatureStats;
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
  breedingStamina: number;
};

type BreedingSelection = {
  giverType: "player" | "creature";
  giverCreatureId: number | null;
  receiverType: "player" | "creature";
  receiverCreatureId: number | null;
};

type SaveData = {
  currentDay: number;
  playerData: PlayerData;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
};

type GameContextType = {
  currentDay: number;
  playerData: PlayerData;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
  nextDay: () => void;
  hatchEgg: (eggId: number) => void;
  breedCreatures: () => void;
  setBreedingSelection: (selection: BreedingSelection) => void;
  resetGame: () => void;
  renameCreature: (creatureId: number, newNickname: string) => void;
  renamePlayer: (newName: string) => void;
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

const horseTemplate: Creature = {
  id: 1,
  name: "Horse",
  nickname: "Starter Horse",
  theme: "Field Worker",
  stats: {
    strength: 8,
    endurance: 8,
    intelligence: 4,
    speed: 5,
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
};

const catTemplate: Creature = {
  id: 2,
  name: "Cat",
  nickname: "Starter Cat",
  theme: "House Maid",
  stats: {
    strength: 4,
    endurance: 5,
    intelligence: 8,
    speed: 8,
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
};

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
    };
  }

  const strengthParentAvg = average(parentStats.map((p) => p.strength));
  const enduranceParentAvg = average(parentStats.map((p) => p.endurance));
  const intelligenceParentAvg = average(parentStats.map((p) => p.intelligence));
  const speedParentAvg = average(parentStats.map((p) => p.speed));

  return {
    strength: Math.max(
      1,
      Math.round((baseStats.strength + strengthParentAvg) / 2) +
        rollStatVariation()
    ),
    endurance: Math.max(
      1,
      Math.round((baseStats.endurance + enduranceParentAvg) / 2) +
        rollStatVariation()
    ),
    intelligence: Math.max(
      1,
      Math.round((baseStats.intelligence + intelligenceParentAvg) / 2) +
        rollStatVariation()
    ),
    speed: Math.max(
      1,
      Math.round((baseStats.speed + speedParentAvg) / 2) +
        rollStatVariation()
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

  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    nickname: generateNickname(template.name),
    stats: penaltyResult.stats,
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
  return {
    ...creature,
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

const defaultPlayerData: PlayerData = {
  name: "Player",
  gold: 500,
  energy: 100,
  breedingStamina: 100,
};

const defaultCreatures: Creature[] = [
  {
    ...horseTemplate,
    id: 1,
    nickname: "Starter Horse",
  },
  {
    ...catTemplate,
    id: 2,
    nickname: "Starter Cat",
  },
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
  playerData: defaultPlayerData,
  creatures: defaultCreatures,
  eggs: defaultEggs,
  breedingSelection: defaultBreedingSelection,
};

const STORAGE_KEY = "creature-chronicles-save";

export function GameProvider({ children }: { children: ReactNode }) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const [currentDay, setCurrentDay] = useState(defaultSaveData.currentDay);
  const [playerData, setPlayerData] = useState(defaultSaveData.playerData);
  const [creatures, setCreatures] = useState(defaultSaveData.creatures);
  const [eggs, setEggs] = useState(defaultSaveData.eggs);
  const [breedingSelection, setBreedingSelection] = useState(
    defaultSaveData.breedingSelection
  );

  useEffect(() => {
    const savedGame = localStorage.getItem(STORAGE_KEY);

    if (savedGame) {
      try {
        const parsedSave: SaveData = JSON.parse(savedGame);

        setCurrentDay(parsedSave.currentDay);
        setPlayerData(parsedSave.playerData);
        setCreatures(parsedSave.creatures.map(normalizeCreature));
        setEggs(parsedSave.eggs.map(normalizeEgg));
        setBreedingSelection(parsedSave.breedingSelection);
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
      playerData,
      creatures,
      eggs,
      breedingSelection,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }, [hasLoaded, currentDay, playerData, creatures, eggs, breedingSelection]);

  function nextDay() {
    setCurrentDay((prev) => prev + 1);

    setEggs((prevEggs) =>
      prevEggs.map((egg) => ({
        ...egg,
        hatchDaysRemaining:
          egg.hatchDaysRemaining > 0 ? egg.hatchDaysRemaining - 1 : 0,
      }))
    );
  }

  function hatchEgg(eggId: number) {
    const eggToHatch = eggs.find((egg) => egg.id === eggId);

    if (!eggToHatch || eggToHatch.hatchDaysRemaining > 0) {
      return;
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
      return;
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
  }

  function breedCreatures() {
    const goldCost = 50;
    const energyCost = 10;
    const staminaCost = 15;

    const hasEnoughGold = playerData.gold >= goldCost;
    const hasEnoughEnergy = playerData.energy >= energyCost;
    const hasEnoughStamina = playerData.breedingStamina >= staminaCost;

    if (!hasEnoughGold || !hasEnoughEnergy || !hasEnoughStamina) {
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

    const inbreedingRisk = calculateInbreedingRisk(
      giverCreature,
      receiverCreature,
      giverIsPlayer,
      receiverIsPlayer
    );

    setPlayerData((prev) => ({
      ...prev,
      gold: prev.gold - goldCost,
      energy: prev.energy - energyCost,
      breedingStamina: prev.breedingStamina - staminaCost,
    }));

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

  function resetGame() {
    const freshHorse = {
      ...horseTemplate,
      id: 1,
      nickname: generateNickname("Horse"),
    };

    const freshCat = {
      ...catTemplate,
      id: 2,
      nickname: generateNickname("Cat"),
    };

    setCurrentDay(1);
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
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <GameContext.Provider
      value={{
        currentDay,
        playerData,
        creatures,
        eggs,
        breedingSelection,
        nextDay,
        hatchEgg,
        breedCreatures,
        setBreedingSelection,
        resetGame,
        renameCreature,
        renamePlayer,
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