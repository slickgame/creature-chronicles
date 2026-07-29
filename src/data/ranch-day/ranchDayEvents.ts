import { getVariantDefinition } from "@/data/creatures";
import type { DailyRanchEventRecord, RanchDayActivity } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";

function readFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function stableRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 10000019;
  }
  return Math.abs(hash) % Math.max(1, modulo);
}

const EVENT_BUILDERS: Array<(save: GameSave) => DailyRanchEventRecord> = [
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_supplier`,
    dayNumber: save.dayState.dayNumber,
    eventType: "supplier",
    title: "Traveling Feed Supplier",
    description: "A traveling supplier offers a small Feed bundle below the normal depot price.",
    choices: [
      { choiceId: "buy-feed", label: "Buy 5 Feed for 35 Gold", description: "Pay 35 Gold and add exactly 5 Feed.", requirementLabel: "Requires 35 Gold" },
      { choiceId: "decline", label: "Decline", description: "Keep your Gold and continue the day." },
    ],
  }),
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_fence`,
    dayNumber: save.dayState.dayNumber,
    eventType: "fence",
    title: "Loose Fence Section",
    description: "A loose section of fence can be handled before it becomes part of tonight's ranch wear.",
    choices: [
      { choiceId: "spend-material", label: "Spend 1 Material", description: "Use 1 Material and remove 5 ranch damage.", requirementLabel: "Requires 1 Material" },
      { choiceId: "temporary-labor", label: "Assign Temporary Labor", description: "Gain +2 upkeep score for tonight without changing chore assignments." },
      { choiceId: "leave-fence", label: "Leave It", description: "Take no immediate action." },
    ],
  }),
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_nursery`,
    dayNumber: save.dayState.dayNumber,
    eventType: "nursery",
    title: "Calm Nursery Morning",
    description: "The Nursery is unusually calm, creating a small opportunity for focused care.",
    choices: [
      { choiceId: "warm-egg", label: "Improve Egg Warmth", description: "Reduce one incubating egg by 1 day, never below 1 day remaining." },
      { choiceId: "comfort-expecting", label: "Comfort an Expecting Creature", description: "Add 4 Affection to one active pregnant receiver." },
      { choiceId: "leave-nursery", label: "Keep the Routine", description: "Preserve the normal Nursery schedule." },
    ],
  }),
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_messenger`,
    dayNumber: save.dayState.dayNumber,
    eventType: "messenger",
    title: "Guild Messenger",
    description: "A Guild messenger drops off a small ranch-support stipend and asks whether you want the board highlighted today.",
    choices: [
      { choiceId: "accept-stipend", label: "Accept the Support Stipend", description: "Gain 25 Gold and mark the Guild as today's suggested destination." },
      { choiceId: "review-guild", label: "Review at the Guild Hall", description: "Gain 1 Guild Point and mark the Guild as today's suggested destination." },
      { choiceId: "decline-message", label: "Decline", description: "Continue the day without changing resources." },
    ],
  }),
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_forage`,
    dayNumber: save.dayState.dayNumber,
    eventType: "forage",
    title: "Wild Forage Near the Ranch",
    description: "Fresh growth and loose stone appeared along the outer path.",
    choices: [
      { choiceId: "gather-feed", label: "Gather Feed", description: "Add exactly 3 Feed." },
      { choiceId: "gather-material", label: "Gather Materials", description: "Add exactly 1 Material." },
      { choiceId: "leave-forage", label: "Leave It Undisturbed", description: "Take no resources." },
    ],
  }),
  (save) => ({
    eventId: `event_${save.dayState.dayNumber}_bonding`,
    dayNumber: save.dayState.dayNumber,
    eventType: "bonding",
    title: "Quiet Bonding Opportunity",
    description: "One ranch creature seeks attention before the day's work begins.",
    choices: [
      { choiceId: "spend-time", label: "Spend Time Together", description: "Add 5 Affection to the lowest-Affection available creature." },
      { choiceId: "small-comfort", label: "Prepare the Breeding Pen", description: "Add +3% temporary breeding comfort for today." },
      { choiceId: "continue-work", label: "Continue Ranch Work", description: "Take no immediate action." },
    ],
  }),
];

export function generateDailyRanchEvent(save: GameSave): DailyRanchEventRecord {
  const index = stableRoll(`${save.saveId}:ranch-event:${save.dayState.dayNumber}`, EVENT_BUILDERS.length);
  return EVENT_BUILDERS[index](save);
}

function addEventActivity(save: GameSave, label: string, goldChange = 0, feedChange = 0, materialChange = 0): GameSave {
  if (!save.ranchDay) return save;
  const event = save.ranchDay.event;
  if (!event) return save;
  const activity: RanchDayActivity = {
    activityId: `${event.eventId}:${event.selectedChoiceId ?? "choice"}`,
    dayNumber: save.dayState.dayNumber,
    type: "event",
    label,
    goldChange: goldChange || undefined,
    feedChange: feedChange || undefined,
    materialChange: materialChange || undefined,
    createdAt: new Date().toISOString(),
  };
  if (save.ranchDay.activities.some((item) => item.activityId === activity.activityId)) return save;
  return {
    ...save,
    ranchDay: {
      ...save.ranchDay,
      activities: [...save.ranchDay.activities, activity].slice(-100),
    },
  };
}

export function canResolveDailyEventChoice(save: GameSave, choiceId: string): { ok: boolean; reason?: string } {
  const event = save.ranchDay?.event;
  if (!event) return { ok: false, reason: "No Ranch Day event is available." };
  if (event.resolvedAt) return { ok: false, reason: "Today's Ranch Day event is already resolved." };
  if (!event.choices.some((choice) => choice.choiceId === choiceId)) return { ok: false, reason: "That event choice is unavailable." };
  if (choiceId === "buy-feed" && save.currencies.gold < 35) return { ok: false, reason: "You need 35 Gold." };
  if (choiceId === "spend-material" && readFlagNumber(save.flags.ranchMaterialsStock) < 1) return { ok: false, reason: "You need 1 Material." };
  if (choiceId === "warm-egg" && !(save.eggs ?? []).some((egg) => egg.status === "incubating" && egg.daysRemaining > 1)) return { ok: false, reason: "No incubating egg can benefit from extra warmth." };
  if (choiceId === "comfort-expecting" && !(save.pregnancies ?? []).some((pregnancy) => pregnancy.status === "pregnant")) return { ok: false, reason: "No active pregnancy is available for this choice." };
  if (choiceId === "spend-time" && !(save.creatures ?? []).length) return { ok: false, reason: "No ranch creature is available." };
  return { ok: true };
}

export function resolveDailyRanchEventChoice(save: GameSave, choiceId: string): { save: GameSave; ok: boolean; message: string } {
  const availability = canResolveDailyEventChoice(save, choiceId);
  if (!availability.ok || !save.ranchDay?.event) return { save, ok: false, message: availability.reason ?? "Event choice unavailable." };

  const event = save.ranchDay.event;
  let nextSave = save;
  let message = "The ranch event was resolved.";
  let goldChange = 0;
  let feedChange = 0;
  let materialChange = 0;

  if (choiceId === "buy-feed") {
    goldChange = -35;
    feedChange = 5;
    message = "Purchased 5 Feed from the traveling supplier for 35 Gold.";
    nextSave = {
      ...nextSave,
      currencies: { ...nextSave.currencies, gold: nextSave.currencies.gold - 35 },
      flags: { ...nextSave.flags, ranchFeedStock: readFlagNumber(nextSave.flags.ranchFeedStock) + 5 },
    };
  } else if (choiceId === "spend-material") {
    materialChange = -1;
    message = "Spent 1 Material and removed 5 ranch damage.";
    nextSave = {
      ...nextSave,
      flags: {
        ...nextSave.flags,
        ranchMaterialsStock: readFlagNumber(nextSave.flags.ranchMaterialsStock) - 1,
        ranchDamage: Math.max(0, readFlagNumber(nextSave.flags.ranchDamage) - 5),
      },
    };
  } else if (choiceId === "temporary-labor") {
    message = "Temporary labor added +2 upkeep score for tonight.";
    nextSave = { ...nextSave, flags: { ...nextSave.flags, ranchUpkeepScoreToday: readFlagNumber(nextSave.flags.ranchUpkeepScoreToday) + 2 } };
  } else if (choiceId === "warm-egg") {
    let changed = false;
    nextSave = {
      ...nextSave,
      eggs: (nextSave.eggs ?? []).map((egg) => {
        if (changed || egg.status !== "incubating" || egg.daysRemaining <= 1) return egg;
        changed = true;
        return { ...egg, daysRemaining: egg.daysRemaining - 1 };
      }),
    };
    message = "Improved one incubating egg's warmth and reduced its timer by 1 day.";
  } else if (choiceId === "comfort-expecting") {
    const pregnancy = (nextSave.pregnancies ?? []).find((record) => record.status === "pregnant");
    const receiverId = pregnancy?.receiver.creatureId;
    nextSave = {
      ...nextSave,
      creatures: (nextSave.creatures ?? []).map((creature) => creature.creatureId === receiverId ? { ...creature, affection: Math.min(100, creature.affection + 4) } : creature),
    };
    message = `${pregnancy?.receiver.displayName ?? "The expecting creature"} gained 4 Affection from focused care.`;
  } else if (choiceId === "accept-stipend") {
    goldChange = 25;
    message = "Accepted a 25 Gold Guild support stipend.";
    nextSave = { ...nextSave, currencies: { ...nextSave.currencies, gold: nextSave.currencies.gold + 25 }, flags: { ...nextSave.flags, ranchDaySuggestedDestination: "guild-hall" } };
  } else if (choiceId === "review-guild") {
    message = "Gained 1 Guild Point and marked the Guild Hall as today's suggested destination.";
    nextSave = { ...nextSave, currencies: { ...nextSave.currencies, guildPoints: nextSave.currencies.guildPoints + 1 }, flags: { ...nextSave.flags, ranchDaySuggestedDestination: "guild-hall" } };
  } else if (choiceId === "gather-feed") {
    feedChange = 3;
    message = "Gathered 3 Feed from the outer path.";
    nextSave = { ...nextSave, flags: { ...nextSave.flags, ranchFeedStock: readFlagNumber(nextSave.flags.ranchFeedStock) + 3 } };
  } else if (choiceId === "gather-material") {
    materialChange = 1;
    message = "Gathered 1 Material from the outer path.";
    nextSave = { ...nextSave, flags: { ...nextSave.flags, ranchMaterialsStock: readFlagNumber(nextSave.flags.ranchMaterialsStock) + 1 } };
  } else if (choiceId === "spend-time") {
    const target = [...(nextSave.creatures ?? [])].sort((left, right) => left.affection - right.affection || left.nickname.localeCompare(right.nickname))[0];
    nextSave = { ...nextSave, creatures: (nextSave.creatures ?? []).map((creature) => creature.creatureId === target?.creatureId ? { ...creature, affection: Math.min(100, creature.affection + 5) } : creature) };
    message = `${target?.nickname ?? "A ranch creature"} gained 5 Affection from quiet time together.`;
  } else if (choiceId === "small-comfort") {
    message = "Prepared the Breeding Pen and added +3% temporary breeding comfort for today.";
    nextSave = { ...nextSave, flags: { ...nextSave.flags, ranchBreedingComfortBonusToday: Math.min(25, readFlagNumber(nextSave.flags.ranchBreedingComfortBonusToday) + 3) } };
  } else {
    const choice = event.choices.find((item) => item.choiceId === choiceId);
    message = `${choice?.label ?? "The event choice"} was recorded with no resource change.`;
  }

  nextSave = {
    ...nextSave,
    ranchDay: {
      ...nextSave.ranchDay!,
      event: {
        ...event,
        selectedChoiceId: choiceId,
        resultText: message,
        resolvedAt: new Date().toISOString(),
      },
    },
    flags: {
      ...nextSave.flags,
      m60RanchDayEvents: true,
      lastRanchDayEventId: event.eventId,
      lastRanchDayEventChoice: choiceId,
    },
  };
  nextSave = addEventActivity(nextSave, message, goldChange, feedChange, materialChange);
  return { save: nextSave, ok: true, message };
}
