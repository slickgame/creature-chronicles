import * as core from "./nursery";
import { getVariantDefinition } from "./creatures";
import type { CreatureId, EggId } from "@/types/ids";
import type {
  BirthRecord,
  DayState,
  GameSave,
  PregnancyRecord,
  Weekday,
} from "@/types/save";

export * from "./nursery";

const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function advanceGameDate(dayState: DayState, daysToAdd: number): DayState {
  const safeDays = Math.max(0, Math.floor(daysToAdd));
  const weekdayIndex = Math.max(0, WEEKDAYS.indexOf(dayState.weekday));
  const totalDayOffset = Math.max(0, dayState.dayOfMonth - 1) + safeDays;
  const monthOffset = Math.floor(totalDayOffset / 30);
  const dayOfMonth = (totalDayOffset % 30) + 1;
  const nextWeekdayIndex = (weekdayIndex + safeDays) % WEEKDAYS.length;
  const weekOffset = Math.floor((weekdayIndex + safeDays) / WEEKDAYS.length);

  return {
    dayNumber: dayState.dayNumber + safeDays,
    weekday: WEEKDAYS[nextWeekdayIndex] ?? dayState.weekday,
    month: dayState.month + monthOffset,
    dayOfMonth,
    weekNumber: dayState.weekNumber + weekOffset,
  };
}

export function getEstimatedDeliveryDateLabel(
  dayState: DayState,
  daysRemaining: number,
): string {
  const deliveryDate = advanceGameDate(dayState, daysRemaining);
  return `${deliveryDate.weekday} ${deliveryDate.month}/${deliveryDate.dayOfMonth}`;
}

export function getPregnancyProgressPercent(pregnancy: PregnancyRecord): number {
  const totalDays = Math.max(1, pregnancy.totalDays);
  const completedDays = Math.max(0, totalDays - pregnancy.daysRemaining);
  return Math.max(0, Math.min(100, Math.round((completedDays / totalDays) * 100)));
}

export function getActivePregnancyForParticipant(
  save: GameSave,
  participantId: string,
): PregnancyRecord | null {
  return (
    (save.pregnancies ?? []).find(
      (pregnancy) =>
        pregnancy.status === "pregnant" &&
        pregnancy.receiver.participantId === participantId,
    ) ?? null
  );
}

export function getActivePregnancyForCreature(
  save: GameSave,
  creatureId: CreatureId,
): PregnancyRecord | null {
  return getActivePregnancyForParticipant(save, creatureId);
}

function clearInvalidPlayerPregnancies(save: GameSave): {
  save: GameSave;
  clearedCount: number;
} {
  let clearedCount = 0;
  const pregnancies = (save.pregnancies ?? []).map((pregnancy) => {
    if (
      pregnancy.status === "pregnant" &&
      pregnancy.receiver.kind === "player"
    ) {
      clearedCount += 1;
      return { ...pregnancy, status: "delivered" as const, daysRemaining: 0 };
    }
    return pregnancy;
  });

  return {
    save: clearedCount ? { ...save, pregnancies } : save,
    clearedCount,
  };
}

function restoreNewEggIncubationTime(
  saveBeforeAdvance: GameSave,
  advancedSave: GameSave,
): GameSave {
  const priorEggIds = new Set((saveBeforeAdvance.eggs ?? []).map((egg) => egg.eggId));
  let changed = false;
  const eggs = (advancedSave.eggs ?? []).map((egg) => {
    if (priorEggIds.has(egg.eggId)) return egg;
    changed = true;
    return {
      ...egg,
      daysRemaining: egg.totalDays,
      status: "incubating" as const,
    };
  });

  return changed
    ? { ...advancedSave, eggs, eggIds: eggs.map((egg) => egg.eggId) }
    : advancedSave;
}

export function advanceNurseryDay(save: GameSave): {
  save: GameSave;
  summaryItems: string[];
} {
  const sanitized = clearInvalidPlayerPregnancies(save);
  const result = core.advanceNurseryDay(sanitized.save);
  const correctedSave = restoreNewEggIncubationTime(sanitized.save, result.save);
  const summaryItems = sanitized.clearedCount
    ? [
        `${sanitized.clearedCount} invalid player pregnancy record${sanitized.clearedCount === 1 ? " was" : "s were"} cleared.`,
        ...result.summaryItems,
      ]
    : result.summaryItems;

  return { save: correctedSave, summaryItems };
}

function buildBirthRecord(
  save: GameSave,
  eggId: EggId,
  creatureId: CreatureId,
  nickname: string,
): BirthRecord | null {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  if (!egg) return null;

  const variant = getVariantDefinition(egg.variantId);
  const hatchedAt = new Date().toISOString();

  return {
    birthId: `birth_${creatureId}`,
    eggId,
    creatureId,
    hatchedAtDayNumber: save.dayState.dayNumber,
    hatchedAt,
    nickname,
    rarity: variant.rarity,
    speciesId: egg.speciesId,
    variantId: egg.variantId,
    parents: egg.parents,
    inheritedStatGrades: egg.projectedStatGrades,
    inheritedAbilities: egg.projectedAbilities,
    lineageRisk: egg.lineageRisk,
    lineageRiskLabel: egg.lineageRiskLabel,
    lineageTraits: egg.lineageTraits ?? [],
  };
}

export function hatchEgg(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): ReturnType<typeof core.hatchEgg> {
  const result = core.hatchEgg(save, eggId, nickname);
  if (!result) return null;

  const birthRecord = buildBirthRecord(
    save,
    eggId,
    result.creature.creatureId,
    result.creature.nickname,
  );

  if (!birthRecord) return result;

  const historyWithoutDuplicate = (result.save.birthHistory ?? []).filter(
    (record) => record.eggId !== eggId && record.creatureId !== result.creature.creatureId,
  );

  return {
    creature: result.creature,
    save: {
      ...result.save,
      birthHistory: [birthRecord, ...historyWithoutDuplicate].slice(0, 150),
      flags: {
        ...result.save.flags,
        pregnancyOffspringLoopComplete: true,
        nurseryBirthHistoryCreated: true,
      },
    },
  };
}
