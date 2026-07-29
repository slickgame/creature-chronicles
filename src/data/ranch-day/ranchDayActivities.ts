import type { RanchDayActivity, RanchDayActivityType } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";
import { normalizeRanchDaySave } from "./ranchDayState";
import { updateDailyGoalsAndRewards } from "./ranchDayGoals";

function readFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function resourceValue(save: GameSave, key: "feed" | "materials"): number {
  return readFlagNumber(save.flags[key === "feed" ? "ranchFeedStock" : "ranchMaterialsStock"]);
}

function stableHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) % 10000019;
  return Math.abs(hash).toString(36);
}

function activity(
  save: GameSave,
  activityId: string,
  type: RanchDayActivityType,
  label: string,
  extras: Partial<RanchDayActivity> = {},
): RanchDayActivity {
  return {
    activityId,
    dayNumber: save.dayState.dayNumber,
    type,
    label,
    createdAt: save.updatedAt || new Date().toISOString(),
    ...extras,
  };
}

function assignmentSignature(save: GameSave): string {
  const assignments = save.ranchJobs?.assignments ?? {};
  return JSON.stringify(Object.entries(assignments).sort(([left], [right]) => left.localeCompare(right)).map(([jobId, ids]) => [jobId, [...(ids ?? [])].sort()]));
}

function upgradeTotal(save: GameSave): number {
  return Object.values(save.ranchUpgrades ?? {}).reduce((sum, tier) => sum + Number(tier ?? 0), 0);
}

function addIfNew(output: RanchDayActivity[], existing: Set<string>, record: RanchDayActivity) {
  if (existing.has(record.activityId)) return;
  existing.add(record.activityId);
  output.push(record);
}

export function recordRanchDayTransition(previous: GameSave | null, incoming: GameSave): GameSave {
  const fallbackPhase = previous?.ranchDay?.phase ?? "active";
  const next = normalizeRanchDaySave(incoming, fallbackPhase);
  if (!previous || previous.saveId !== next.saveId || previous.dayState.dayNumber !== next.dayState.dayNumber || !next.ranchDay) {
    return next;
  }

  const existingIds = new Set(next.ranchDay.activities.map((item) => item.activityId));
  const additions: RanchDayActivity[] = [];
  const priorAttempts = new Set((previous.breeding?.attempts ?? []).map((attempt) => String(attempt.attemptId)));
  for (const attempt of next.breeding?.attempts ?? []) {
    if (priorAttempts.has(String(attempt.attemptId))) continue;
    addIfNew(additions, existingIds, activity(
      next,
      `breeding:${attempt.attemptId}`,
      "breeding",
      `${attempt.giverName} and ${attempt.receiverName} completed a Breeding Pen session: ${attempt.outcome === "pregnancy" ? "pregnancy" : attempt.pregnancyBlockedReason ? "no eligible conception" : "no pregnancy"}.`,
      {
        participantIds: [String(attempt.giverId), String(attempt.receiverId)],
        energySpent: attempt.energyCost,
      },
    ));
  }

  const priorItemUses = new Set((previous.itemUseHistory ?? []).map((record) => record.itemUseId));
  for (const record of next.itemUseHistory ?? []) {
    if (priorItemUses.has(record.itemUseId)) continue;
    addIfNew(additions, existingIds, activity(
      next,
      `item:${record.itemUseId}`,
      "item-use",
      `Used ${record.itemName}${record.targetName ? ` on ${record.targetName}` : ""}: ${record.effectSummary}`,
      { participantIds: record.targetId ? [record.targetId] : undefined },
    ));
  }

  const priorBirths = new Set((previous.birthHistory ?? []).map((record) => record.birthId));
  for (const record of next.birthHistory ?? []) {
    if (priorBirths.has(record.birthId)) continue;
    addIfNew(additions, existingIds, activity(
      next,
      `birth:${record.birthId}`,
      "egg-hatch",
      `Hatched ${record.nickname} and added them to the ranch roster.`,
      { participantIds: [String(record.creatureId)] },
    ));
  }

  const previousGuildCount = previous.guild?.completedCount ?? 0;
  const nextGuildCount = next.guild?.completedCount ?? 0;
  if (nextGuildCount > previousGuildCount) {
    addIfNew(additions, existingIds, activity(
      next,
      `contract:${next.dayState.dayNumber}:${nextGuildCount}`,
      "contract",
      `Completed ${nextGuildCount - previousGuildCount} Guild contract${nextGuildCount - previousGuildCount === 1 ? "" : "s"}.`,
    ));
  }

  const previousAssignments = assignmentSignature(previous);
  const nextAssignments = assignmentSignature(next);
  if (previousAssignments !== nextAssignments) {
    addIfNew(additions, existingIds, activity(
      next,
      `chores:${next.dayState.dayNumber}:${stableHash(nextAssignments)}`,
      "chore-assignment",
      "Adjusted Ranch Chore assignments for tonight's work cycle.",
    ));
  }

  for (const creature of next.creatures ?? []) {
    const creatureId = String(creature.creatureId);
    const flag = `trainingGroundsAssignment_${creatureId}`;
    const priorFocus = String(previous.flags[flag] ?? "");
    const nextFocus = String(next.flags[flag] ?? "");
    if (priorFocus === nextFocus) continue;
    const started = Boolean(nextFocus);
    addIfNew(additions, existingIds, activity(
      next,
      `training:${next.dayState.dayNumber}:${creatureId}:${nextFocus || "collected"}`,
      "training",
      started
        ? `${creature.nickname} began ${nextFocus.replace(/_/g, " ")} at the Training Grounds.`
        : `${creature.nickname} returned from training and the result was collected.`,
      { participantIds: [creatureId] },
    ));
  }

  const priorUpgradeTotal = upgradeTotal(previous);
  const nextUpgradeTotal = upgradeTotal(next);
  if (nextUpgradeTotal > priorUpgradeTotal) {
    addIfNew(additions, existingIds, activity(
      next,
      `upgrade:${next.dayState.dayNumber}:${nextUpgradeTotal}`,
      "upgrade",
      `Purchased ${nextUpgradeTotal - priorUpgradeTotal} Ranch upgrade tier${nextUpgradeTotal - priorUpgradeTotal === 1 ? "" : "s"}.`,
      { goldChange: next.currencies.gold - previous.currencies.gold },
    ));
  }

  const previousDamage = readFlagNumber(previous.flags.ranchDamage);
  const nextDamage = readFlagNumber(next.flags.ranchDamage);
  if (nextDamage < previousDamage) {
    addIfNew(additions, existingIds, activity(
      next,
      `repair:${next.dayState.dayNumber}:${nextDamage}:${next.updatedAt}`,
      "repair",
      `Reduced ranch damage from ${previousDamage} to ${nextDamage}.`,
      { materialChange: resourceValue(next, "materials") - resourceValue(previous, "materials") },
    ));
  }

  const hasSpecificGoldAction = additions.some((item) => item.type === "upgrade" || item.type === "repair")
    || next.ranchDay.activities.some((item) => item.type === "event" && item.goldChange);
  const goldChange = next.currencies.gold - previous.currencies.gold;
  if (goldChange < 0 && !hasSpecificGoldAction) {
    addIfNew(additions, existingIds, activity(
      next,
      `purchase:${next.dayState.dayNumber}:${next.updatedAt}:${Math.abs(goldChange)}`,
      "purchase",
      `Spent ${Math.abs(goldChange)} Gold on a ranch purchase or service.`,
      {
        goldChange,
        feedChange: resourceValue(next, "feed") - resourceValue(previous, "feed") || undefined,
        materialChange: resourceValue(next, "materials") - resourceValue(previous, "materials") || undefined,
      },
    ));
  }

  const itemOrEventCare = additions.some((item) => item.type === "item-use")
    || next.ranchDay.activities.some((item) => item.type === "event" && item.createdAt === next.ranchDay?.event?.resolvedAt);
  if (!itemOrEventCare) {
    const priorById = new Map((previous.creatures ?? []).map((creature) => [String(creature.creatureId), creature]));
    for (const creature of next.creatures ?? []) {
      const prior = priorById.get(String(creature.creatureId));
      if (!prior) continue;
      if (creature.affection > prior.affection || creature.energy > prior.energy) {
        addIfNew(additions, existingIds, activity(
          next,
          `care:${next.dayState.dayNumber}:${creature.creatureId}:${creature.affection}:${creature.energy}`,
          "care",
          `Cared for ${creature.nickname}, improving ${creature.affection > prior.affection ? "Affection" : "Energy"}.`,
          { participantIds: [String(creature.creatureId)] },
        ));
      }
    }
  }

  if (!additions.length) return updateDailyGoalsAndRewards(next);

  const withActivities: GameSave = {
    ...next,
    ranchDay: {
      ...next.ranchDay,
      activities: [...next.ranchDay.activities, ...additions].slice(-100),
    },
    flags: {
      ...next.flags,
      m60RanchDayActivities: true,
      ranchDayActivitiesToday: next.ranchDay.activities.length + additions.length,
      lastRanchDayActivityAt: additions[additions.length - 1].createdAt,
    },
  };
  return updateDailyGoalsAndRewards(withActivities);
}
