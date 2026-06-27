import type { GameSave } from "@/types/save";

export type StarterGoal = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  hint: string;
};

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getStarterGoals(save: GameSave): StarterGoal[] {
  const choresAssigned = Boolean(save.flags.m14RanchJobAssigned) || Boolean(save.flags.m14RanchJobsAutoAssigned) || Boolean(save.flags.m15ChorePlannerUsed) || Object.values(save.ranchJobs?.assignments ?? {}).some((assignment) => Array.isArray(assignment) && assignment.length > 0);
  const choresResolved = Boolean(save.flags.m14RanchJobsProcessed) || getFlagNumber(save.flags.ranchFeedProducedToday) > 0 || getFlagNumber(save.flags.ranchSecurityScoreToday) > 0 || getFlagNumber(save.flags.ranchBreedingComfortBonusToday) > 0 || getFlagNumber(save.flags.ranchUpkeepScoreToday) > 0;
  const feedProduced = getFlagNumber(save.flags.ranchFeedProducedToday) >= 5 || getFlagNumber(save.flags.ranchFeedStock) >= 5;
  const materialsProduced = Boolean(save.flags.m14FieldHaulingMaterials) || getFlagNumber(save.flags.ranchMaterialsProducedToday) > 0 || getFlagNumber(save.flags.ranchMaterialsStock) > 0;
  const ranchRepaired = Boolean(save.flags.ranchManualRepairUsed) || getFlagNumber(save.flags.ranchDamageRepairedToday) > 0;
  const ranchUpgraded = Boolean(save.flags.m11RanchUpgradePurchased) || Object.values(save.ranchUpgrades ?? {}).some((tier) => Number(tier) > 0);
  const breedingAttempted = Boolean(save.flags.m4BreedingAttempted) || (save.breeding?.attempts.length ?? 0) > 0;
  const eggCreatedOrHatched = Boolean(save.flags.m5PregnancyCreated) || Boolean(save.flags.m5EggHatched) || getFlagNumber(save.flags.m9TotalHatched) > 0 || (save.pregnancies?.length ?? 0) > 0 || (save.eggs?.length ?? 0) > 0;
  const guildCompleted = Boolean(save.flags.m7GuildContractCompleted) || (save.guild?.completedCount ?? 0) > 0;
  const marketPurchased = Boolean(save.flags.m6MarketPurchaseMade) || (save.creatures ?? []).some((creature) => creature.origin === "market");

  return [
    { id: "assign-chores", label: "Plan the ranch day", description: "Assign at least one helper to a Ranch Chore or use a Daily Planner preset.", complete: choresAssigned, hint: "Ranch Chores → choose a preset or Open Chore" },
    { id: "resolve-chores", label: "Complete the first work night", description: "Sleep after assigning chores so the ranch can process feed, security, comfort, materials, and upkeep.", complete: choresResolved, hint: "Ranch House → Sleep" },
    { id: "produce-feed", label: "Stock 5 Feed", description: "Produce or store at least 5 Feed so creature recovery is less punishing.", complete: feedProduced, hint: "Ranch Chores → Food Focus or Production/Garden" },
    { id: "gather-materials", label: "Gather Ranch Materials", description: "Use Field Hauling to produce Materials for future upgrades and repairs.", complete: materialsProduced, hint: "Ranch Chores → Repair Focus or Field Hauling" },
    { id: "repair-ranch", label: "Repair ranch damage", description: "Repair damage with Field Hauling upkeep or Manual Repair once the ranch has damage.", complete: ranchRepaired, hint: "Field Hauling overnight or Ranch Office → Repair Ranch" },
    { id: "ranch-upgrade", label: "Buy a ranch upgrade", description: "Purchase any Ranch Office infrastructure upgrade. Tier 1 upgrades only need Gold.", complete: ranchUpgraded, hint: "Ranch Office" },
    { id: "breed", label: "Try breeding", description: "Attempt one breeding pairing and start working toward eggs and lineage.", complete: breedingAttempted, hint: "Breeding Pen" },
    { id: "egg", label: "Create or hatch an egg", description: "Create a pregnancy, incubate an egg, or hatch one ready egg in the Nursery.", complete: eggCreatedOrHatched, hint: "Breeding Pen → Nursery" },
    { id: "market", label: "Recruit from town", description: "Buy one creature from the Town Market to expand chore and breeding options.", complete: marketPurchased, hint: "Town Road → Market Stall" },
    { id: "guild", label: "Complete a guild request", description: "Finish one Guild Hall contract to connect the ranch loop to town progression.", complete: guildCompleted, hint: "Town Road → Guild Hall" },
  ];
}

export function getStarterGoalProgress(save: GameSave): { completed: number; total: number; nextGoal: StarterGoal | null } {
  const goals = getStarterGoals(save);
  const completed = goals.filter((goal) => goal.complete).length;
  return { completed, total: goals.length, nextGoal: goals.find((goal) => !goal.complete) ?? null };
}
