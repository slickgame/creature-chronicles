import type { GameSave } from "@/types/save";

export type StarterGoal = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  hint: string;
};

export function getStarterGoals(save: GameSave): StarterGoal[] {
  const marketPurchased = Boolean(save.flags.m6MarketPurchaseMade) || (save.creatures ?? []).some((creature) => creature.origin === "market");
  const breedingAttempted = Boolean(save.flags.m4BreedingAttempted) || (save.breeding?.attempts.length ?? 0) > 0;
  const eggCreated = Boolean(save.flags.m5PregnancyCreated) || (save.pregnancies?.length ?? 0) > 0 || (save.eggs?.length ?? 0) > 0;
  const eggHatched = Boolean(save.flags.m5EggHatched) || Number(save.flags.m9TotalHatched ?? 0) > 0;
  const guildCompleted = Boolean(save.flags.m7GuildContractCompleted) || (save.guild?.completedCount ?? 0) > 0;
  const ranchUpgraded = Boolean(save.flags.m11RanchUpgradePurchased) || Object.values(save.ranchUpgrades ?? {}).some((tier) => Number(tier) > 0);
  const townUpgraded = Boolean(save.flags.m10TownUpgradePurchased) || Object.values(save.townUpgrades ?? {}).some((tier) => Number(tier) > 0);

  return [
    { id: "market", label: "Buy a market creature", description: "Purchase one creature from the Town Market.", complete: marketPurchased, hint: "Town Road → Market Stall" },
    { id: "breed", label: "Attempt breeding", description: "Try one breeding attempt at the Breeding Pen.", complete: breedingAttempted, hint: "Breeding Pen" },
    { id: "egg", label: "Create an egg", description: "Get a successful pregnancy or egg from breeding.", complete: eggCreated, hint: "Breed, then sleep" },
    { id: "hatch", label: "Hatch an egg", description: "Hatch one ready egg in the Nursery.", complete: eggHatched, hint: "Nursery" },
    { id: "guild", label: "Complete a guild contract", description: "Donate an eligible creature to finish one Guild Hall request.", complete: guildCompleted, hint: "Town Road → Guild Hall" },
    { id: "ranch-upgrade", label: "Buy a ranch upgrade", description: "Purchase any Ranch Office infrastructure upgrade.", complete: ranchUpgraded, hint: "Ranch Office" },
    { id: "town-upgrade", label: "Buy a town upgrade", description: "Purchase any Mara Vell town service upgrade.", complete: townUpgraded, hint: "Guild Hall → Mara Vell" },
  ];
}

export function getStarterGoalProgress(save: GameSave): { completed: number; total: number; nextGoal: StarterGoal | null } {
  const goals = getStarterGoals(save);
  const completed = goals.filter((goal) => goal.complete).length;
  return { completed, total: goals.length, nextGoal: goals.find((goal) => !goal.complete) ?? null };
}
