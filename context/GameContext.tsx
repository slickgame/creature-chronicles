"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Creature = {
  id: number;
  name: string;
  theme: string;
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
    speed: number;
  };
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
};

function getCreatureTemplateByName(name: string): Creature | null {
  if (name === "Horse") return horseTemplate;
  if (name === "Cat") return catTemplate;
  return null;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentDay, setCurrentDay] = useState(1);

  const [playerData, setPlayerData] = useState<PlayerData>({
    name: "Player",
    gold: 500,
    energy: 100,
    breedingStamina: 100,
  });

  const [creatures, setCreatures] = useState<Creature[]>([
    horseTemplate,
    catTemplate,
  ]);

  const [breedingSelection, setBreedingSelection] = useState<BreedingSelection>({
    giver: "Horse",
    receiver: "Cat",
  });

  const [eggs, setEggs] = useState<Egg[]>([
    {
      id: 1,
      name: "Test Egg",
      parents: "Horse + Cat",
      hatchDaysRemaining: 3,
      giver: "Horse",
      receiver: "Cat",
    },
  ]);

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

    const newCreature: Creature = {
      ...template,
      id: Date.now(),
    };

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