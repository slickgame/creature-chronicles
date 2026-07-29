import { getVariantDefinition } from "@/data/creatures";
import type { DailyGoalRecord, RanchDayActivity, RanchDayReward } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";

const GOAL_REWARD_COMPLETION_BONUS: RanchDayReward = { gold: 50, feed: 1 };

function readFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function stableHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rewardLabel(reward: RanchDayReward): string {
  const parts = [
    reward.gold ? `${reward.gold} Gold` : "",
    reward.feed ? `${reward.feed} Feed` : "",
    reward.materials ? `${reward.materials} Materials` : "",
    reward.affection ? `+${reward.affection} Affection` : "",
    reward.comfortBonus ? `+${reward.comfortBonus}% Comfort` : "",
  ].filter(Boolean);
  return parts.join(" + ");
}

type GoalTemplate = {
  id: string;
  label: string;
  description: string;
  progressLabel: string;
  target: number;
  reward: RanchDayReward;
  available: (save: GameSave) => boolean;
  progress: (save: GameSave, activities: RanchDayActivity[]) => number;
};

function activityCount(activities: RanchDayActivity[], type: RanchDayActivity["type"]): number {
  return activities.filter((activity) => activity.type === type).length;
}

function hasFamily(save: GameSave, family: string): boolean {
  return (save.creatures ?? []).some((creature) => getVariantDefinition(creature.variantId).family === family);
}

function overnightResolvedForGoalDay(save: GameSave): boolean {
  return (save.ranchJobs?.lastProcessedDayNumber ?? 0) > save.dayState.dayNumber;
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "breed-once",
    label: "Complete a breeding session",
    description: "Use the Breeding Pen once today. A valid player or creature pairing counts.",
    progressLabel: "Breeding sessions",
    target: 1,
    reward: { gold: 50 },
    available: (save) => (save.creatures?.length ?? 0) >= 1,
    progress: (_save, activities) => activityCount(activities, "breeding"),
  },
  {
    id: "adjust-chores",
    label: "Plan the ranch work",
    description: "Assign, remove, or move at least one creature on the Ranch Chore board.",
    progressLabel: "Chore changes",
    target: 1,
    reward: { gold: 35, feed: 1 },
    available: (save) => (save.creatures?.length ?? 0) > 0,
    progress: (_save, activities) => activityCount(activities, "chore-assignment"),
  },
  {
    id: "use-support-item",
    label: "Use a ranch support item",
    description: "Use one care, Energy, breeding, or pregnancy support item.",
    progressLabel: "Items used",
    target: 1,
    reward: { gold: 30 },
    available: (save) => [
      "energySnackStock",
      "energyMealStock",
      "affectionTreatStock",
      "recoveryBalmStock",
      "breedingFertilityTonics",
      "traitStabilizerStock",
      "mutationCatalystStock",
      "gestationTonicStock",
    ].some((flag) => readFlagNumber(save.flags[flag]) > 0),
    progress: (_save, activities) => activityCount(activities, "item-use"),
  },
  {
    id: "purchase-supply",
    label: "Make one useful purchase",
    description: "Buy any item, creature, or ranch service today.",
    progressLabel: "Purchases",
    target: 1,
    reward: { gold: 25 },
    available: (save) => save.currencies.gold >= 50,
    progress: (_save, activities) => activityCount(activities, "purchase"),
  },
  {
    id: "care-for-two",
    label: "Care for two creatures",
    description: "Feed, comfort, or otherwise care for two ranch creatures.",
    progressLabel: "Care actions",
    target: 2,
    reward: { feed: 2 },
    available: (save) => (save.creatures?.length ?? 0) >= 2,
    progress: (_save, activities) => activityCount(activities, "care"),
  },
  {
    id: "hatch-ready-egg",
    label: "Hatch a ready egg",
    description: "Welcome one ready Nursery egg into the ranch roster.",
    progressLabel: "Eggs hatched",
    target: 1,
    reward: { gold: 60, feed: 1 },
    available: (save) => (save.eggs ?? []).some((egg) => egg.status === "ready"),
    progress: (_save, activities) => activityCount(activities, "egg-hatch"),
  },
  {
    id: "repair-ranch",
    label: "Repair ranch damage",
    description: "Use a repair action or complete enough Field Hauling to reduce ranch damage.",
    progressLabel: "Repair actions",
    target: 1,
    reward: { materials: 2 },
    available: (save) => readFlagNumber(save.flags.ranchDamage) > 0,
    progress: (_save, activities) => activityCount(activities, "repair"),
  },
  {
    id: "produce-feed",
    label: "Produce at least 5 Feed",
    description: "Assign Stable Production or Garden Tending before ending the day.",
    progressLabel: "Feed produced",
    target: 5,
    reward: { gold: 40, feed: 1 },
    available: (save) => hasFamily(save, "bovine") || hasFamily(save, "lapine"),
    progress: (save) => overnightResolvedForGoalDay(save) ? readFlagNumber(save.flags.ranchFeedProducedToday) : 0,
  },
  {
    id: "produce-materials",
    label: "Produce at least 2 Materials",
    description: "Assign Field Hauling before ending the day.",
    progressLabel: "Materials produced",
    target: 2,
    reward: { gold: 40, materials: 1 },
    available: (save) => hasFamily(save, "equine"),
    progress: (save) => overnightResolvedForGoalDay(save) ? readFlagNumber(save.flags.ranchMaterialsProducedToday) : 0,
  },
  {
    id: "finish-contract",
    label: "Complete a Guild contract",
    description: "Finish one Guild Hall request today.",
    progressLabel: "Contracts completed",
    target: 1,
    reward: { gold: 60 },
    available: (save) => Boolean(save.guild),
    progress: (_save, activities) => activityCount(activities, "contract"),
  },
  {
    id: "keep-gold-reserve",
    label: "Protect the ranch reserve",
    description: "End the day with at least 200 Gold available for supplies and taxes.",
    progressLabel: "Gold held at day end",
    target: 200,
    reward: { feed: 1, materials: 1 },
    available: () => true,
    progress: (save) => overnightResolvedForGoalDay(save) ? save.currencies.gold : 0,
  },
];

export function generateDailyGoals(save: GameSave): DailyGoalRecord[] {
  const available = GOAL_TEMPLATES.filter((goal) => goal.available(save));
  const seed = `${save.saveId}:ranch-day-goals:${save.dayState.dayNumber}`;
  const ordered = [...available].sort((left, right) => {
    const leftHash = stableHash(`${seed}:${left.id}`);
    const rightHash = stableHash(`${seed}:${right.id}`);
    return leftHash - rightHash || left.id.localeCompare(right.id);
  });
  const selected = ordered.slice(0, 3);

  for (const fallback of GOAL_TEMPLATES) {
    if (selected.length >= 3) break;
    if (!selected.some((goal) => goal.id === fallback.id) && fallback.available(save)) selected.push(fallback);
  }

  return selected.map((goal) => ({
    goalId: `${save.dayState.dayNumber}:${goal.id}`,
    dayNumber: save.dayState.dayNumber,
    label: goal.label,
    description: goal.description,
    progressLabel: goal.progressLabel,
    target: goal.target,
    progress: 0,
    complete: false,
    reward: { ...goal.reward },
    rewardLabel: rewardLabel(goal.reward),
    rewardClaimed: false,
  }));
}

function applyReward(save: GameSave, reward: RanchDayReward): GameSave {
  const feed = readFlagNumber(save.flags.ranchFeedStock) + (reward.feed ?? 0);
  const materials = readFlagNumber(save.flags.ranchMaterialsStock) + (reward.materials ?? 0);
  const affectionGain = reward.affection ?? 0;
  return {
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold + (reward.gold ?? 0),
    },
    creatures: affectionGain > 0
      ? (save.creatures ?? []).map((creature) => ({ ...creature, affection: Math.min(100, creature.affection + affectionGain) }))
      : save.creatures,
    flags: {
      ...save.flags,
      ranchFeedStock: feed,
      ranchMaterialsStock: materials,
      ranchBreedingComfortBonusToday: Math.min(25, readFlagNumber(save.flags.ranchBreedingComfortBonusToday) + (reward.comfortBonus ?? 0)),
    },
  };
}

export function updateDailyGoalsAndRewards(save: GameSave): GameSave {
  const ranchDay = save.ranchDay;
  if (!ranchDay || ranchDay.dayNumber !== save.dayState.dayNumber) return save;
  let workingSave = save;
  let claimedCount = 0;
  const completedAt = new Date().toISOString();
  const goals = ranchDay.goals.map((record) => {
    const templateId = record.goalId.split(":").slice(1).join(":");
    const template = GOAL_TEMPLATES.find((goal) => goal.id === templateId);
    const progress = template ? Math.min(record.target, template.progress(workingSave, ranchDay.activities)) : record.progress;
    const complete = progress >= record.target;
    let rewardClaimed = record.rewardClaimed;
    if (complete && !rewardClaimed) {
      workingSave = applyReward(workingSave, record.reward);
      rewardClaimed = true;
      claimedCount += 1;
    }
    return {
      ...record,
      progress,
      complete,
      rewardClaimed,
      completedAt: complete ? record.completedAt ?? completedAt : undefined,
    };
  });

  const allComplete = goals.length > 0 && goals.every((goal) => goal.complete);
  const completionBonusAlreadyClaimed = workingSave.flags[`ranchDayAllGoalsReward_${ranchDay.dayNumber}`] === true;
  if (allComplete && !completionBonusAlreadyClaimed) {
    workingSave = applyReward(workingSave, GOAL_REWARD_COMPLETION_BONUS);
  }

  const changed = claimedCount > 0
    || allComplete !== Boolean(save.flags[`ranchDayAllGoalsReward_${ranchDay.dayNumber}`])
    || goals.some((goal, index) => goal.progress !== ranchDay.goals[index]?.progress || goal.complete !== ranchDay.goals[index]?.complete);
  if (!changed) return save;

  return {
    ...workingSave,
    ranchDay: { ...ranchDay, goals },
    flags: {
      ...workingSave.flags,
      m60RanchDayGoals: true,
      ranchDayGoalRewardsClaimed: readFlagNumber(workingSave.flags.ranchDayGoalRewardsClaimed) + claimedCount,
      ...(allComplete ? {
        [`ranchDayAllGoalsReward_${ranchDay.dayNumber}`]: true,
        lastRanchDayAllGoalsCompleted: ranchDay.dayNumber,
      } : {}),
    },
  };
}
