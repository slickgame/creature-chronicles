export const playerData = {
  name: "Farmer",
  gold: 999,
  energy: 100,
  breedingStamina: 100,
};

export const creatures = [
  {
    id: 1,
    name: "Horse",
    theme: "Field Worker",
    stats: {
      strength: 8,
      endurance: 8,
      intelligence: 4,
      speed: 5,
    },
  },
  {
    id: 2,
    name: "Cat",
    theme: "House Maid",
    stats: {
      strength: 4,
      endurance: 5,
      intelligence: 8,
      speed: 8,
    },
  },
];

export const eggs = [
  {
    id: 1,
    name: "Test Egg",
    parents: "Horse + Cat",
    hatchDaysRemaining: 3,
  },
];

export const breedingSetup = {
  parent1: "Horse",
  parent2: "Cat",
  cost: {
    gold: 50,
    energy: 10,
    stamina: 15,
  },
  rule: "Offspring rolls between giver or receiver species.",
};