import { getFarmState, workerBlocker, SITES, type SiteId } from "./farmResources";
import { projectRanchDay } from "@/data/ranch-day/ranchDayLifecycle";
import { enterEveningReview } from "@/data/ranch-day/ranchDayState";
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
  const farm = getFarmState(save);
  const stock = numberFlag(save.flags.ranchFeedStock);
  const produced = 0; // Instant work is already in stock; never add it twice.
  const required = numberFlag(projected.flags.ranchFeedRequiredToday);
  const rewardFeed = 0;
  const covered = numberFlag(projected.flags.ranchFeedConsumedToday);
  const available = covered;
  const shortage = Math.max(0, required - covered);
  const unassigned = (save.creatures ?? []).filter(c=>(Object.keys(SITES) as SiteId[]).some(site=>!workerBlocker(save,c,site))).length;
  const incubatingEggs = (save.eggs ?? []).filter(egg=>egg.status==='incubating').length;
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
      title: "Food tonight",
      detail: `${covered} / ${required} food units ready for tonight. Food is consumed when you sleep.\n\nNightly need: 2 units per bovine or equine; 1 per other resident. Rare and Epic variants need 1 extra. Away trainees eat with Rhea.\n\nUnreserved Balanced rations are used first. ${farm.ingredientFeeding?'Raw ingredient feeding is on: diet-compatible ingredients come next.':'Raw ingredient feeding is off: ingredients stay available for recipes.'} Older Feed stock covers the remainder.\n\nManage food shows each resident’s need, feeding settings, storage and reserves, cooking, and ration sources. One ration or compatible ingredient covers 1 food unit. Prepared bonus meals are served manually.`,
      status: shortage
        ? `Short by ${shortage}`
        : "Enough for tonight",
      attention: shortage > 0,
      action: "Manage food",
      destination: "chores",
    },
    {
      id: "nursery",
      title: "Nursery",
      detail: `${incubatingEggs} egg${incubatingEggs===1?'':'s'} incubating. ${readyEggs} ready to hatch.\n\nIncubation advances when you end the ranch day. Ready eggs wait for you to hatch them in the Nursery; the matching habitat needs an open space.`,
      status: `${incubatingEggs} incubating · ${readyEggs} ready`,
      attention: readyEggs > 0,
      action: "Visit Nursery",
      destination: "nursery",
    },
    {
      id: "chores",
      title: "Farm work",
      detail: `Gather crops, wood, stone and ore; produce milk; hunt; cook food; and craft components such as planks and iron ingots.\n\n${unassigned} creature${unassigned===1?' can':'s can'} currently gather at an available work location. Choose a worker and review output, Energy cost and skill XP before confirming. Work resolves immediately.\n\nThe counter records gathering actions today; cooking and crafting are separate recipe actions. Cleaning remains planned.`,
      status: `${farm.workDay === save.dayState.dayNumber ? farm.workCount ?? 0 : 0} gathering actions today`,
      attention: false,
      action: "Manage farm",
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
      detail: `${damage}/100 damage. Repairs restore protection and overnight recovery.`,
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
    incubatingEggs,
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
