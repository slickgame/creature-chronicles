import { getFarmSecurity } from "./farmSecurity";
import { grantFarmResources, getFarmState } from "./farmResources";
import type { GameSave } from "@/types/save";

export type StarterGoalReward = {
  gold?: number;
  guildPoints?: number;
  feed?: number;
  materials?: number;
};

export type StarterGoal = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  hint: string;
  reward: StarterGoalReward;
  rewardLabel: string;
  rewardClaimed: boolean;
};

const STARTER_GOAL_REWARDS: Record<string, StarterGoalReward> = {
  "assign-chores": { gold: 25, feed: 2 },
  "assign-security": { gold: 25, materials: 1 },
  "assign-comfort": { gold: 25 },
  "assign-feed": { gold: 35, feed: 3 },
  "assign-garden": { gold: 35, feed: 4 },
  "assign-hauling": { gold: 35, materials: 4 },
  "resolve-chores": { gold: 75, feed: 2, materials: 2 },
  "produce-feed": { gold: 35, guildPoints: 1, feed: 4 },
  "gather-materials": { gold: 35, guildPoints: 1, materials: 5 },
  "repair-ranch": { gold: 75, materials: 3 },
  "ranch-upgrade": { gold: 125, guildPoints: 2 },
  breed: { gold: 100, guildPoints: 3 },
  egg: { gold: 125, guildPoints: 4 },
  market: { gold: 50, guildPoints: 2 },
  tax: { gold: 75, guildPoints: 3 },
  guild: { gold: 150, guildPoints: 5 },
};

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getRewardFlag(goalId: string): string {
  return `starterGoalReward_${goalId}`;
}

function isRewardClaimed(save: GameSave, goalId: string): boolean {
  return save.flags[getRewardFlag(goalId)] === true;
}

function getRewardLabel(reward: StarterGoalReward): string {
  const parts = [
    reward.gold ? `${reward.gold} Gold` : "",
    reward.guildPoints ? `${reward.guildPoints} GP` : "",
    reward.feed ? `${reward.feed} Balanced rations` : "",
    reward.materials ? `${reward.materials} Wood` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" + ") : "No reward";
}

function buildGoal(save: GameSave, goal: Omit<StarterGoal, "reward" | "rewardLabel" | "rewardClaimed">): StarterGoal {
  const reward = STARTER_GOAL_REWARDS[goal.id] ?? {};
  const rewardLabel = getRewardLabel(reward);
  const rewardClaimed = isRewardClaimed(save, goal.id);
  return { ...goal, complete: goal.complete || rewardClaimed, description: `${goal.description} Reward: ${rewardLabel}.`, reward, rewardLabel, rewardClaimed };
}

function hasJobAssignment(save: GameSave, jobId: string): boolean {
  const assignments = save.ranchJobs?.assignments as Record<string, string[] | undefined> | undefined;
  const assigned = assignments?.[jobId];
  return Array.isArray(assigned) && assigned.length > 0;
}

export function getStarterGoals(save: GameSave): StarterGoal[] {
  const choresAssigned = Boolean(save.flags.m14RanchJobAssigned) || Boolean(save.flags.m14RanchJobsAutoAssigned) || Boolean(save.flags.m15ChorePlannerUsed) || Object.values(save.ranchJobs?.assignments ?? {}).some((assignment) => Array.isArray(assignment) && assignment.length > 0);
  const securityAssigned = getFarmSecurity(save).guard !== null || hasJobAssignment(save, "security_patrol") || getFlagNumber(save.flags.ranchSecurityScoreToday) > 0;
  const comfortAssigned = Object.keys(getFarmState(save).meals).length > 0 || hasJobAssignment(save, "comfort_care") || getFlagNumber(save.flags.ranchBreedingComfortBonusToday) > 0;
  const feedAssigned = getFlagNumber(save.flags.farmFoodProduced) > 0 || hasJobAssignment(save, "stable_production") || getFlagNumber(save.flags.ranchFeedProducedToday) > 0;
  const gardenAssigned = getFlagNumber(save.flags.farmWork_garden) > 0 || hasJobAssignment(save, "garden_tending") || getFlagNumber(save.flags.ranchFeedProducedToday) >= 8;
  const haulingAssigned = getFlagNumber(save.flags.farmWork_woodlot) > 0 || hasJobAssignment(save, "field_hauling") || getFlagNumber(save.flags.ranchMaterialsProducedToday) > 0 || getFlagNumber(save.flags.ranchUpkeepScoreToday) > 0;
  const choresResolved = getFlagNumber(save.flags.farmWorkActions) > 0 || Boolean(save.flags.m14RanchJobsProcessed) || getFlagNumber(save.flags.ranchFeedProducedToday) > 0 || getFlagNumber(save.flags.ranchSecurityScoreToday) > 0 || getFlagNumber(save.flags.ranchBreedingComfortBonusToday) > 0 || getFlagNumber(save.flags.ranchUpkeepScoreToday) > 0;
  const feedProduced = getFlagNumber(save.flags.farmFoodProduced) >= 5 || getFlagNumber(save.flags.ranchFeedProducedToday) >= 5 || (getFarmState(save).stock.rations ?? 0) >= 5;
  const materialsProduced = Boolean(save.flags.m14FieldHaulingMaterials) || getFlagNumber(save.flags.ranchMaterialsProducedToday) > 0 || (getFarmState(save).stock.wood ?? 0) > 0;
  const ranchRepaired = Boolean(save.flags.ranchManualRepairUsed) || getFlagNumber(save.flags.ranchDamageRepairedToday) > 0;
  const ranchUpgraded = Boolean(save.flags.m11RanchUpgradePurchased) || Object.values(save.ranchUpgrades ?? {}).some((tier) => Number(tier) > 0);
  const breedingAttempted = Boolean(save.flags.m4BreedingAttempted) || (save.breeding?.attempts.length ?? 0) > 0;
  const eggCreatedOrHatched = Boolean(save.flags.m5PregnancyCreated) || Boolean(save.flags.m5EggHatched) || getFlagNumber(save.flags.m9TotalHatched) > 0 || (save.pregnancies?.length ?? 0) > 0 || (save.eggs?.length ?? 0) > 0;
  const guildCompleted = Boolean(save.flags.m7GuildContractCompleted) || (save.guild?.completedCount ?? 0) > 0;
  const marketPurchased = Boolean(save.flags.m6MarketPurchaseMade) || (save.creatures ?? []).some((creature) => creature.origin === "market");
  const survivedTaxPressure = save.dayState.dayOfMonth >= 8 || save.flags.taxStatus === "paid" || Boolean(save.flags.m21DailyReportUpgrade);

  return [
    buildGoal(save, { id: "assign-chores", label: "Complete farm work", description: "Choose a creature at an owned location and Work. Resources arrive immediately; only Energy is spent.", complete: choresAssigned, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "assign-security", label: "Keep a Guard Dog", description: "A resident canine with Guard Dog passively adds Security. Only the strongest bonus counts.", complete: securityAssigned, hint: "Farm Management → Security" }),
    buildGoal(save, { id: "assign-comfort", label: "Serve a bonus meal", description: "Cook and serve one bonus meal to a creature.", complete: comfortAssigned, hint: "Farm Management → Kitchen" }),
    buildGoal(save, { id: "assign-feed", label: "Produce ingredients", description: "Work at a food location to collect ingredients.", complete: feedAssigned, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "assign-garden", label: "Harvest vegetables", description: "Work at the Kitchen garden.", complete: gardenAssigned, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "assign-hauling", label: "Collect timber", description: "Work at the Inherited woodlot.", complete: haulingAssigned, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "resolve-chores", label: "Finish a work action", description: "Complete an instant work action. There are no overnight assignments.", complete: choresResolved, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "produce-feed", label: "Stock food supplies", description: "Produce at least 5 food ingredients or hold 5 Balanced rations.", complete: feedProduced, hint: "Farm Management → Kitchen" }),
    buildGoal(save, { id: "gather-materials", label: "Gather Wood", description: "Gather Wood for crafting and repairs.", complete: materialsProduced, hint: "Farm Management → Work locations" }),
    buildGoal(save, { id: "repair-ranch", label: "Repair ranch damage", description: "Repair damaged fortifications with named resources or a repair kit.", complete: ranchRepaired, hint: "Farm Management → Security" }),
    buildGoal(save, { id: "ranch-upgrade", label: "Buy a ranch upgrade", description: "Purchase any Ranch Office infrastructure upgrade. Check the exact Gold and component cost before confirming.", complete: ranchUpgraded, hint: "Ranch Office" }),
    buildGoal(save, { id: "breed", label: "Try breeding", description: "Attempt one breeding pairing and start working toward eggs and inheritance.", complete: breedingAttempted, hint: "Breeding Pen" }),
    buildGoal(save, { id: "egg", label: "Create or hatch an egg", description: "Create a pregnancy, incubate an egg, or hatch one ready egg in the Nursery.", complete: eggCreatedOrHatched, hint: "Breeding Pen → Nursery" }),
    buildGoal(save, { id: "market", label: "Inspect the market", description: "Buy one creature from the Town Market to expand work and breeding options.", complete: marketPurchased, hint: "Town Road → Market Stall" }),
    buildGoal(save, { id: "tax", label: "Prepare for tax pressure", description: "Reach the first week checkpoint or pay the posted monthly bill without defaulting.", complete: survivedTaxPressure, hint: "Keep Gold before Day 30. Ranch Advisor warns when tax is close." }),
    buildGoal(save, { id: "guild", label: "Complete a guild request", description: "Finish one Guild Hall contract to connect the ranch loop to town progression and complete Chapter 1 onboarding.", complete: guildCompleted, hint: "Town Road → Guild Hall" }),
  ];
}

export function applyStarterGoalRewards(save: GameSave): GameSave {
  const goals = getStarterGoals(save);
  const claimableGoals = goals.filter((goal) => goal.complete && !goal.rewardClaimed);
  if (!claimableGoals.length) return save;

  let nextGold = save.currencies.gold;
  let nextGuildPoints = save.currencies.guildPoints;
  let nextFeed = 0;
  let nextMaterials = 0;
  const nextFlags: GameSave["flags"] = { ...save.flags, m15StarterGoalRewards: true, m22ChapterOneTutorial: true, m31PersistentStarterGoals: true, m34StarterGoalRewardRebalance: true };
  const claimedLabels: string[] = [];

  for (const goal of claimableGoals) {
    nextGold += goal.reward.gold ?? 0;
    nextGuildPoints += goal.reward.guildPoints ?? 0;
    nextFeed += goal.reward.feed ?? 0;
    nextMaterials += goal.reward.materials ?? 0;
    nextFlags[getRewardFlag(goal.id)] = true;
    claimedLabels.push(`${goal.label}: ${goal.rewardLabel}`);
  }

  if (claimableGoals.some((goal) => goal.id === "guild")) nextFlags.m15ChapterOneOnboardingComplete = true;

  const paidSave = grantFarmResources(save, { rations: nextFeed, wood: nextMaterials });
  const rewarded: GameSave = {
    ...paidSave,
    currencies: { ...save.currencies, gold: nextGold, guildPoints: nextGuildPoints },
    flags: {
      ...nextFlags,
      farmResourcesV1: paidSave.flags.farmResourcesV1,
      starterGoalRewardsLastClaimed: claimedLabels.join(" | "),
      starterGoalRewardsClaimedCount: getFlagNumber(save.flags.starterGoalRewardsClaimedCount) + claimableGoals.length,
    },
  };
  return applyStarterGoalRewards(rewarded);
}

export function getStarterGoalProgress(save: GameSave): { completed: number; total: number; nextGoal: StarterGoal | null; claimable: number; claimed: number } {
  const goals = getStarterGoals(save);
  const completed = goals.filter((goal) => goal.complete).length;
  const claimable = goals.filter((goal) => goal.complete && !goal.rewardClaimed).length;
  const claimed = goals.filter((goal) => goal.rewardClaimed).length;
  return { completed, total: goals.length, nextGoal: goals.find((goal) => !goal.complete) ?? null, claimable, claimed };
}

