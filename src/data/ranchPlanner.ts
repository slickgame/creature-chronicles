import { updateDailyGoalsAndRewards } from "@/data/ranch-day/ranchDayGoals";
import { projectRanchDay } from "@/data/ranch-day/ranchDayLifecycle";
import { enterEveningReview } from "@/data/ranch-day/ranchDayState";
import {
  getEligibleCreaturesForJob,
  getRanchJobs,
  RANCH_JOB_IDS,
} from "@/data/ranchJobs";
import { getCurrentMonthFinalizedTax } from "@/data/taxes";
import { getTrainingAssignment } from "@/data/trainingGrounds";
import type { GameSave } from "@/types/save";

export type PlannerDestination =
  "nursery" | "chores" | "supplies" | "office" | "training";
export type PlannerRow = {
  id: string;
  title: string;
  detail: string;
  status: string;
  attention: boolean;
  action: string;
  destination: PlannerDestination;
};
function numberFlag(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function getRanchPlanner(save: GameSave) {
  // Resolve a detached copy: previews must never grant rewards, write storage or mutate the save.
  const projected = projectRanchDay(
    enterEveningReview(structuredClone(save)),
  )!.save;
  const stock = numberFlag(save.flags.ranchFeedStock);
  const produced = numberFlag(projected.flags.ranchFeedProducedToday);
  const required = numberFlag(projected.flags.ranchFeedRequiredToday);
  const rewardFeed = Math.max(
    0,
    numberFlag(
      updateDailyGoalsAndRewards(structuredClone(save)).flags.ranchFeedStock,
    ) - stock,
  );
  const available = stock + rewardFeed + produced;
  const shortage = Math.max(0, required - available);
  const jobs = getRanchJobs(save);
  const assigned = new Set(RANCH_JOB_IDS.flatMap((id) => jobs.assignments[id]));
  const eligible = new Set(
    RANCH_JOB_IDS.filter((id) => jobs.assignments[id].length < 3).flatMap(
      (id) => getEligibleCreaturesForJob(save, id).map((c) => c.creatureId),
    ),
  );
  const unassigned = [...eligible].filter((id) => !assigned.has(id)).length;
  const readyEggs = (save.eggs ?? []).filter(
    (egg) => egg.status === "ready",
  ).length;
  const readyTraining = (save.creatures ?? []).filter(
    (c) => getTrainingAssignment(save, c.creatureId)?.isReady,
  ).length;
  const tax = getCurrentMonthFinalizedTax(save);
  const taxDays = Math.max(0, 30 - save.dayState.dayOfMonth);
  const taxShortage = Math.max(0, tax - save.currencies.gold);
  const damage = numberFlag(save.flags.ranchDamage);
  const rows: PlannerRow[] = [
    {
      id: "feed",
      title: "Feed tonight",
      detail: `${stock} in storage + ${produced} from chores${rewardFeed ? ` + ${rewardFeed} earned rewards` : ""} · ${required} projected need`,
      status: shortage
        ? `Short by ${shortage}`
        : `${available - required} left after feeding`,
      attention: shortage > 0,
      action: "Buy Feed",
      destination: "supplies",
    },
    {
      id: "nursery",
      title: "Nursery",
      detail: readyEggs
        ? `${readyEggs} egg${readyEggs === 1 ? " is" : "s are"} ready to hatch.`
        : "No ready eggs waiting.",
      status: readyEggs ? `${readyEggs} ready` : "Up to date",
      attention: readyEggs > 0,
      action: "Visit Nursery",
      destination: "nursery",
    },
    {
      id: "chores",
      title: "Ranch Chores",
      detail: unassigned
        ? `${unassigned} eligible helper${unassigned === 1 ? " has" : "s have"} no assignment.`
        : "No eligible unassigned helpers for open chore slots.",
      status: `${assigned.size} assigned`,
      attention: unassigned > 0,
      action: "Open Chores",
      destination: "chores",
    },
    {
      id: "tax",
      title: "Monthly tax",
      detail: `${tax} Gold due Day 30${taxShortage ? ` · ${taxShortage} more Gold needed at your current balance` : " · covered by your current balance"}.`,
      status: taxDays ? `${taxDays} days left` : "Due tonight",
      attention: taxDays <= 5,
      action: "View Ledger",
      destination: "office",
    },
    {
      id: "condition",
      title: "Ranch condition",
      detail: `${damage}/100 damage. Repairs and upkeep improve overnight recovery.`,
      status:
        damage >= 80
          ? "Critical"
          : damage >= 50
            ? "Damaged"
            : damage >= 20
              ? "Worn"
              : "Good",
      attention: damage >= 20,
      action: "Open Office",
      destination: "office",
    },
    {
      id: "training",
      title: "Training Grounds",
      detail: readyTraining
        ? `${readyTraining} training result${readyTraining === 1 ? "" : "s"} ready to collect.`
        : "No completed training waiting.",
      status: readyTraining ? "Ready to collect" : "Up to date",
      attention: readyTraining > 0,
      action: "Visit Training",
      destination: "training",
    },
  ];
  return {
    rows,
    attentionCount: rows.filter((row) => row.attention).length,
    readyEggs,
    unassigned,
    feed: {
      stock,
      rewardFeed,
      produced,
      required,
      shortage,
      remaining: available - required,
    },
    tax,
    taxDays,
    taxShortage,
  };
}
