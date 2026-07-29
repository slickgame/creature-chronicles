import { formatGameDate } from "@/lib/formatters";
import type {
  RanchDayPhase,
  RanchDayState,
  RanchResourceSnapshot,
} from "@/types/ranchDay";
import type { GameSave } from "@/types/save";
import { generateDailyGoals } from "./ranchDayGoals";
import { generateDailyRanchEvent } from "./ranchDayEvents";

function readFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getRanchResourceSnapshot(save: GameSave): RanchResourceSnapshot {
  return {
    gold: save.currencies.gold,
    feed: readFlagNumber(save.flags.ranchFeedStock),
    materials: readFlagNumber(save.flags.ranchMaterialsStock),
    energy: save.currencies.energy,
  };
}

export function createRanchDayState(save: GameSave, phase: RanchDayPhase): RanchDayState {
  const now = new Date().toISOString();
  const shell: RanchDayState = {
    dayNumber: save.dayState.dayNumber,
    phase,
    startedAt: now,
    startingResources: getRanchResourceSnapshot(save),
    activities: [],
    goals: [],
  };
  const withShell: GameSave = { ...save, ranchDay: shell };
  return {
    ...shell,
    goals: generateDailyGoals(withShell),
    event: generateDailyRanchEvent(withShell),
  };
}

function normalizePhase(value: unknown, fallback: RanchDayPhase): RanchDayPhase {
  return value === "morning" || value === "active" || value === "evening" ? value : fallback;
}

export function normalizeRanchDaySave(
  save: GameSave,
  missingPhase: RanchDayPhase = "active",
): GameSave {
  const existing = save.ranchDay;
  if (!existing || existing.dayNumber !== save.dayState.dayNumber) {
    return {
      ...save,
      ranchDay: createRanchDayState(save, missingPhase),
      flags: {
        ...save.flags,
        m60RanchDayLoop: true,
        ranchDayStateMigrated: true,
      },
    };
  }

  const phase = normalizePhase(existing.phase, missingPhase);
  const startedAt = existing.startedAt || new Date().toISOString();
  const startingResources = existing.startingResources ?? getRanchResourceSnapshot(save);
  const activities = Array.isArray(existing.activities)
    ? existing.activities.length > 100 ? existing.activities.slice(-100) : existing.activities
    : [];
  const goals = Array.isArray(existing.goals) && existing.goals.length
    ? existing.goals.length > 3 ? existing.goals.slice(0, 3) : existing.goals
    : generateDailyGoals(save);
  const event = existing.event ?? generateDailyRanchEvent(save);

  const unchanged = existing.dayNumber === save.dayState.dayNumber
    && phase === existing.phase
    && startedAt === existing.startedAt
    && startingResources === existing.startingResources
    && activities === existing.activities
    && goals === existing.goals
    && event === existing.event;
  if (unchanged) return save;
  return {
    ...save,
    ranchDay: {
      ...existing,
      dayNumber: save.dayState.dayNumber,
      phase,
      startedAt,
      startingResources,
      activities,
      goals,
      event,
    },
  };
}

export function beginRanchDay(save: GameSave): GameSave {
  const normalized = normalizeRanchDaySave(save, "morning");
  if (!normalized.ranchDay || normalized.ranchDay.phase === "active") return normalized;
  return {
    ...normalized,
    ranchDay: {
      ...normalized.ranchDay,
      phase: "active",
      eveningPreview: undefined,
    },
    flags: {
      ...normalized.flags,
      m60RanchDayBegun: true,
      lastRanchDayBegun: normalized.dayState.dayNumber,
    },
  };
}

export function enterEveningReview(save: GameSave): GameSave {
  const normalized = normalizeRanchDaySave(save);
  if (!normalized.ranchDay || normalized.ranchDay.phase === "evening") return normalized;
  return {
    ...normalized,
    ranchDay: {
      ...normalized.ranchDay,
      phase: "evening",
    },
    flags: {
      ...normalized.flags,
      m60RanchEveningReview: true,
      lastRanchEveningReviewDay: normalized.dayState.dayNumber,
    },
  };
}

export function cancelEveningReview(save: GameSave): GameSave {
  const normalized = normalizeRanchDaySave(save);
  if (!normalized.ranchDay || normalized.ranchDay.phase !== "evening") return normalized;
  return {
    ...normalized,
    ranchDay: {
      ...normalized.ranchDay,
      phase: "active",
      eveningPreview: undefined,
    },
  };
}

export function getRanchDayDateLabel(save: GameSave): string {
  return formatGameDate(
    save.dayState.weekday,
    save.dayState.month,
    save.dayState.dayOfMonth,
  );
}
