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

type Creature = {
  id: number;
  name: string;
  theme: string;
  stats: CreatureStats;
  giver: string | null;
  receiver: string | null;
  bornOnDay: number;
  generation: number;
};

type Egg = {
  id: number;
  name: string;
  parents: string;
  hatchDaysRemaining: number;
  giver: string;
  receiver: string;
};

type PlayerData = {
  name: string;
  gold: number;
  energy: number;
  breedingStamina: number;
};

type BreedingSelection = {
  giver: string;
  receiver: string;
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
};

const GameContext = createContext<GameContextType | undefined>(undefined);

const horseTemplate: Creature = {
  id: 1,
  name: "Horse",
  theme: "Field Worker",
  stats: {
    strength: 8,
    endurance: 8,
    intelligence: 4,
    speed: 5,
  },
  giver: null,
  receiver: null,
  bornOnDay: 1,
  generation: 1,
};

const catTemplate: Creature = {
  id: 2,
  name: "Cat",
  theme: "House Maid",
  stats: {
    strength: 4,
    endurance: 5,
    intelligence: 8,
    speed: 8,
  },
  giver: null,
  receiver: null,
  bornOnDay: 1,
  generation: 1,
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

function createVariedStats(baseStats: CreatureStats): CreatureStats {
  return {
    strength: Math.max(1, baseStats.strength + rollStatVariation()),
    endurance: Math.max(1, baseStats.endurance + rollStatVariation()),
    intelligence: Math.max(1, baseStats.intelligence + rollStatVariation()),
    speed: Math.max(1, baseStats.speed + rollStatVariation()),
  };
}

function createCreatureFromTemplate(
  template: Creature,
  giver: string,
  receiver: string,
  currentDay: number
): Creature {
  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    stats: createVariedStats(template.stats),
    giver,
    receiver,
    bornOnDay: currentDay,
    generation: 2,
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
  },
  {
    ...catTemplate,
    id: 2,
  },
];

const defaultBreedingSelection: BreedingSelection = {
  giver: "Horse",
  receiver: "Cat",
};

const defaultEggs: Egg[] = [
  {
    id: 1,
    name: "Test Egg",
    parents: "Horse + Cat",
    hatchDaysRemaining: 3,
    giver: "Horse",
    receiver: "Cat",
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
        setCreatures(parsedSave.creatures);
        setEggs(parsedSave.eggs);
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

    const newCreature = createCreatureFromTemplate(
      template,
      eggToHatch.giver,
      eggToHatch.receiver,
      currentDay
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

    if (!breedingSelection.giver || !breedingSelection.receiver) {
      return;
    }

    if (breedingSelection.giver === breedingSelection.receiver) {
      return;
    }

    setPlayerData((prev) => ({
      ...prev,
      gold: prev.gold - goldCost,
      energy: prev.energy - energyCost,
      breedingStamina: prev.breedingStamina - staminaCost,
    }));

    if (breedingSelection.receiver === "Player") {
      return;
    }

    const newEgg: Egg = {
      id: Date.now(),
      name: `${breedingSelection.giver} x ${breedingSelection.receiver} Egg`,
      parents: `${breedingSelection.giver} + ${breedingSelection.receiver}`,
      hatchDaysRemaining: 3,
      giver: breedingSelection.giver,
      receiver: breedingSelection.receiver,
    };

    setEggs((prev) => [...prev, newEgg]);
  }

  function resetGame() {
    setCurrentDay(defaultSaveData.currentDay);
    setPlayerData(defaultSaveData.playerData);
    setCreatures(defaultSaveData.creatures);
    setEggs(defaultSaveData.eggs);
    setBreedingSelection(defaultSaveData.breedingSelection);
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