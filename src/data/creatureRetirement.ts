import { getCreatureLegacyProfile } from "@/data/creatureLegacyRankings";
import { addCreatureMemory } from "@/data/creatureMemories";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import {
  CREATURE_LEGACY_STATE_VERSION,
  type CreatureHeirloom,
  type CreatureLegacyState,
  type HallOfLegendsEntry,
  type HeirloomCategory,
  type RetiredCreatureRecord,
} from "@/types/legacy";
import type { RanchJobsState } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

const MAX_PROCESSED_EVENT_KEYS = 2500;
const MINIMUM_RETIREMENT_LEGACY_SCORE = 75;
const MINIMUM_RETIREMENT_LEVEL = 20;
const RETIREMENT_PRESTIGE = 15;
const HALL_INDUCTION_PRESTIGE = 50;

type LegacyAwareSave = GameSave & { creatureLegacy?: CreatureLegacyState };

export type RetirementEligibility = {
  eligible: boolean;
  reasons: string[];
  profile: ReturnType<typeof getCreatureLegacyProfile> | null;
  hallEligible: boolean;
};

export type CreatureLegacyActionResult = {
  save: GameSave;
  ok: boolean;
  message: string;
  retired?: RetiredCreatureRecord;
  heirloom?: CreatureHeirloom;
  hallEntry?: HallOfLegendsEntry;
};

function nowIso(): string {
  return new Date().toISOString();
}

function flagNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function boundedEventKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  return Array.from(
    new Set(keys.filter((key): key is string => typeof key === "string" && key.length > 0)),
  ).slice(-MAX_PROCESSED_EVENT_KEYS);
}

export function createEmptyCreatureLegacyState(): CreatureLegacyState {
  return {
    version: CREATURE_LEGACY_STATE_VERSION,
    retiredByCreatureId: {},
    heirloomsById: {},
    hallByCreatureId: {},
    processedEventKeys: [],
  };
}

export function getCreatureLegacyState(save: GameSave): CreatureLegacyState {
  const candidate = (save as LegacyAwareSave).creatureLegacy;
  if (!candidate || typeof candidate !== "object") return createEmptyCreatureLegacyState();
  return {
    version: CREATURE_LEGACY_STATE_VERSION,
    retiredByCreatureId:
      candidate.retiredByCreatureId && typeof candidate.retiredByCreatureId === "object"
        ? candidate.retiredByCreatureId
        : {},
    heirloomsById:
      candidate.heirloomsById && typeof candidate.heirloomsById === "object"
        ? candidate.heirloomsById
        : {},
    hallByCreatureId:
      candidate.hallByCreatureId && typeof candidate.hallByCreatureId === "object"
        ? candidate.hallByCreatureId
        : {},
    processedEventKeys: boundedEventKeys(candidate.processedEventKeys),
  };
}

export function normalizeCreatureLegacySave(save: GameSave): GameSave {
  const state = getCreatureLegacyState(save);
  return {
    ...save,
    creatureLegacy: state,
    flags: {
      ...save.flags,
      creatureLegacyStateVersion: CREATURE_LEGACY_STATE_VERSION,
      creatureRetirementEnabled: true,
      heirloomsEnabled: true,
      hallOfLegendsEnabled: true,
    },
  };
}

export function getRetiredCreatureRecords(save: GameSave): RetiredCreatureRecord[] {
  return Object.values(getCreatureLegacyState(save).retiredByCreatureId).sort(
    (left, right) =>
      right.retiredAtDayNumber - left.retiredAtDayNumber ||
      left.creature.nickname.localeCompare(right.creature.nickname),
  );
}

export function getRetiredCreatureRecord(
  save: GameSave,
  creatureId: CreatureId,
): RetiredCreatureRecord | null {
  return getCreatureLegacyState(save).retiredByCreatureId[String(creatureId)] ?? null;
}

export function getCreatureHeirlooms(save: GameSave): CreatureHeirloom[] {
  return Object.values(getCreatureLegacyState(save).heirloomsById).sort(
    (left, right) =>
      right.createdAtDayNumber - left.createdAtDayNumber || left.name.localeCompare(right.name),
  );
}

export function getHallOfLegendsEntries(save: GameSave): HallOfLegendsEntry[] {
  return Object.values(getCreatureLegacyState(save).hallByCreatureId).sort(
    (left, right) =>
      right.legacyScore - left.legacyScore ||
      right.fulfilledAmbitions - left.fulfilledAmbitions ||
      left.creatureName.localeCompare(right.creatureName),
  );
}

function hasActivePregnancy(save: GameSave, creatureId: CreatureId): boolean {
  return (save.pregnancies ?? []).some(
    (pregnancy) =>
      pregnancy.status === "pregnant" &&
      (pregnancy.giver.creatureId === creatureId || pregnancy.receiver.creatureId === creatureId),
  );
}

export function getRetirementEligibility(
  save: GameSave,
  creatureId: CreatureId,
): RetirementEligibility {
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature) {
    const retired = getRetiredCreatureRecord(save, creatureId);
    const profile = retired ? getCreatureLegacyProfile(save, retired.creature) : null;
    return {
      eligible: false,
      reasons: [retired ? `${retired.creature.nickname} is already retired.` : "Creature not found."],
      profile,
      hallEligible: Boolean(profile?.hallEligible),
    };
  }

  const profile = getCreatureLegacyProfile(save, creature);
  const reasons: string[] = [];
  if ((save.creatures ?? []).length <= 1) {
    reasons.push("At least one active creature must remain on the ranch.");
  }
  if (creature.isLocked) reasons.push("Unlock this creature before retirement.");
  const trainingReason = getTrainingUnavailableReason(save, creatureId);
  if (trainingReason) {
    reasons.push(`Collect this creature from Training Grounds first: ${trainingReason}`);
  }
  if (hasActivePregnancy(save, creatureId)) {
    reasons.push("Resolve this creature's active pregnancy before retirement.");
  }
  if (
    profile.legacyScore < MINIMUM_RETIREMENT_LEGACY_SCORE &&
    profile.fulfilledAmbitions < 1 &&
    creature.level < MINIMUM_RETIREMENT_LEVEL
  ) {
    reasons.push(
      `Retirement requires Level ${MINIMUM_RETIREMENT_LEVEL}, ${MINIMUM_RETIREMENT_LEGACY_SCORE} Legacy score, or one fulfilled Ambition.`,
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    profile,
    hallEligible: profile.hallEligible,
  };
}

function heirloomDefinition(
  creature: CreatureRecord,
  strongestContribution: string,
  legacyScore: number,
  dayNumber: number,
  createdAt: string,
): CreatureHeirloom {
  const normalized = strongestContribution.toLowerCase();
  let category: HeirloomCategory = "general";
  let name = `${creature.nickname}'s Legacy Token`;
  let description = `A keepsake preserving ${creature.nickname}'s years of ranch service.`;

  if (normalized.includes("victor") || normalized.includes("coliseum")) {
    category = "combat";
    name = `${creature.nickname}'s Veteran Crest`;
    description = `A battle-worn crest honoring ${creature.nickname}'s Coliseum record.`;
  } else if (normalized.includes("protection")) {
    category = "protection";
    name = `${creature.nickname}'s Guardian Emblem`;
    description = `An emblem preserving ${creature.nickname}'s reputation for protecting allies.`;
  } else if (normalized.includes("healing") || normalized.includes("care")) {
    category = "caregiving";
    name = `${creature.nickname}'s Caregiver Charm`;
    description = `A warm charm commemorating ${creature.nickname}'s care for wounded companions.`;
  } else if (normalized.includes("guild")) {
    category = "guild";
    name = `${creature.nickname}'s Envoy Seal`;
    description = `A formal seal honoring ${creature.nickname}'s service to the Guild.`;
  } else if (normalized.includes("production") || normalized.includes("work")) {
    category = "work";
    name = `${creature.nickname}'s Worker's Medallion`;
    description = `A sturdy medallion recording ${creature.nickname}'s contribution to ranch prosperity.`;
  } else if (normalized.includes("family") || normalized.includes("offspring")) {
    category = "dynasty";
    name = `${creature.nickname}'s Founder's Ribbon`;
    description = `A family ribbon honoring the bloodline and descendants shaped by ${creature.nickname}.`;
  }

  return {
    heirloomId: `heirloom_${hashString(String(creature.creatureId))}`,
    version: CREATURE_LEGACY_STATE_VERSION,
    sourceCreatureId: creature.creatureId,
    sourceCreatureName: creature.nickname,
    name,
    category,
    description,
    legacyPrestigeValue: Math.max(10, Math.min(40, 10 + Math.floor(legacyScore / 75) * 5)),
    createdAtDayNumber: dayNumber,
    createdAt,
  };
}

function removeCreatureFromActiveRanch(save: GameSave, creatureId: CreatureId): GameSave {
  const assignments: RanchJobsState["assignments"] | undefined = save.ranchJobs?.assignments
    ? (Object.fromEntries(
        Object.entries(save.ranchJobs.assignments).map(([jobId, creatureIds]) => [
          jobId,
          creatureIds.filter((id) => id !== creatureId),
        ]),
      ) as RanchJobsState["assignments"])
    : undefined;

  return {
    ...save,
    creatures: (save.creatures ?? []).filter((creature) => creature.creatureId !== creatureId),
    creatureIds: save.creatureIds.filter((id) => id !== creatureId),
    habitats: (save.habitats ?? []).map((habitat) => ({
      ...habitat,
      creatureIds: habitat.creatureIds.filter((id) => id !== creatureId),
    })),
    ranchJobs:
      save.ranchJobs && assignments ? { ...save.ranchJobs, assignments } : save.ranchJobs,
  };
}

export function retireCreature(
  save: GameSave,
  creatureId: CreatureId,
  inductIntoHall = false,
): CreatureLegacyActionResult {
  const existing = getRetiredCreatureRecord(save, creatureId);
  if (existing) {
    return {
      save,
      ok: false,
      message: `${existing.creature.nickname} is already retired.`,
      retired: existing,
      heirloom: getCreatureLegacyState(save).heirloomsById[existing.heirloomId],
    };
  }

  const eligibility = getRetirementEligibility(save, creatureId);
  if (!eligibility.eligible || !eligibility.profile) {
    return {
      save,
      ok: false,
      message: eligibility.reasons.join(" ") || "This creature is not ready to retire.",
    };
  }
  if (inductIntoHall && !eligibility.hallEligible) {
    return {
      save,
      ok: false,
      message: `${eligibility.profile.creature.nickname} has not yet earned Hall of Legends eligibility.`,
    };
  }

  const creature = eligibility.profile.creature;
  const createdAt = nowIso();
  const eventKey = `retirement:${String(creatureId)}`;
  const state = getCreatureLegacyState(save);
  if (state.processedEventKeys.includes(eventKey)) {
    return { save, ok: false, message: `${creature.nickname}'s retirement was already recorded.` };
  }

  const heirloom = heirloomDefinition(
    creature,
    eligibility.profile.strongestContribution,
    eligibility.profile.legacyScore,
    save.dayState.dayNumber,
    createdAt,
  );
  const retired: RetiredCreatureRecord = {
    retirementId: `retirement_${hashString(String(creatureId))}`,
    version: CREATURE_LEGACY_STATE_VERSION,
    creatureId,
    creature: { ...creature },
    retiredAtDayNumber: save.dayState.dayNumber,
    retiredAt: createdAt,
    legacyTitle: eligibility.profile.title,
    legacyScore: eligibility.profile.legacyScore,
    fulfilledAmbitions: eligibility.profile.fulfilledAmbitions,
    strongestContribution: eligibility.profile.strongestContribution,
    heirloomId: heirloom.heirloomId,
    inductedIntoHall: false,
  };

  let nextSave = removeCreatureFromActiveRanch(save, creatureId);
  nextSave = {
    ...nextSave,
    creatureLegacy: {
      version: CREATURE_LEGACY_STATE_VERSION,
      retiredByCreatureId: {
        ...state.retiredByCreatureId,
        [String(creatureId)]: retired,
      },
      heirloomsById: {
        ...state.heirloomsById,
        [heirloom.heirloomId]: heirloom,
      },
      hallByCreatureId: state.hallByCreatureId,
      processedEventKeys: boundedEventKeys([...state.processedEventKeys, eventKey]),
    },
    flags: {
      ...nextSave.flags,
      legacyPrestige:
        flagNumber(nextSave.flags.legacyPrestige) +
        RETIREMENT_PRESTIGE +
        heirloom.legacyPrestigeValue,
      totalRetiredCreatures: flagNumber(nextSave.flags.totalRetiredCreatures) + 1,
      totalHeirloomsCreated: flagNumber(nextSave.flags.totalHeirloomsCreated) + 1,
      lastRetiredCreatureName: creature.nickname,
    },
  };
  nextSave = addCreatureMemory(nextSave, {
    creatureId,
    category: "achievement",
    importance: eligibility.hallEligible ? "legendary" : "major",
    title: `${creature.nickname} retired as ${eligibility.profile.title}`,
    description: `${creature.nickname} concluded an active ranch career with a Legacy score of ${eligibility.profile.legacyScore}. ${heirloom.name} was created to preserve that service.`,
    dayNumber: save.dayState.dayNumber,
    createdAt,
    sourceKey: eventKey,
    tags: ["retirement", "heirloom", heirloom.category, eligibility.profile.title],
  });

  if (inductIntoHall) {
    const induction = inductRetiredCreatureIntoHall(nextSave, creatureId);
    if (induction.ok) {
      return {
        ...induction,
        retired: induction.retired ?? retired,
        heirloom,
        message: `${creature.nickname} retired, created ${heirloom.name}, and entered the Hall of Legends.`,
      };
    }
  }

  return {
    save: nextSave,
    ok: true,
    retired,
    heirloom,
    message: `${creature.nickname} retired as ${eligibility.profile.title}. ${heirloom.name} was added to the ranch Heirloom collection.`,
  };
}

export function inductRetiredCreatureIntoHall(
  save: GameSave,
  creatureId: CreatureId,
): CreatureLegacyActionResult {
  const state = getCreatureLegacyState(save);
  const retired = state.retiredByCreatureId[String(creatureId)];
  if (!retired) {
    return { save, ok: false, message: "Only a retired creature can enter the Hall of Legends." };
  }
  const existing = state.hallByCreatureId[String(creatureId)];
  if (existing) {
    return {
      save,
      ok: false,
      message: `${retired.creature.nickname} is already in the Hall of Legends.`,
      retired,
      hallEntry: existing,
    };
  }
  const profile = getCreatureLegacyProfile(save, retired.creature);
  if (!profile.hallEligible) {
    return {
      save,
      ok: false,
      message: `${retired.creature.nickname} has not earned Hall of Legends eligibility.`,
      retired,
    };
  }

  const eventKey = `hall-induction:${String(creatureId)}`;
  if (state.processedEventKeys.includes(eventKey)) {
    return {
      save,
      ok: false,
      message: `${retired.creature.nickname}'s Hall induction was already recorded.`,
      retired,
    };
  }

  const inductedAt = nowIso();
  const hallEntry: HallOfLegendsEntry = {
    hallEntryId: `hall_${hashString(String(creatureId))}`,
    version: CREATURE_LEGACY_STATE_VERSION,
    creatureId,
    creatureName: retired.creature.nickname,
    creature: retired.creature,
    legacyTitle: retired.legacyTitle,
    legacyScore: retired.legacyScore,
    fulfilledAmbitions: retired.fulfilledAmbitions,
    strongestContribution: retired.strongestContribution,
    heirloomId: retired.heirloomId,
    inductedAtDayNumber: save.dayState.dayNumber,
    inductedAt,
  };
  const updatedRetired: RetiredCreatureRecord = { ...retired, inductedIntoHall: true };
  let nextSave: GameSave = {
    ...save,
    creatureLegacy: {
      version: CREATURE_LEGACY_STATE_VERSION,
      retiredByCreatureId: {
        ...state.retiredByCreatureId,
        [String(creatureId)]: updatedRetired,
      },
      heirloomsById: state.heirloomsById,
      hallByCreatureId: {
        ...state.hallByCreatureId,
        [String(creatureId)]: hallEntry,
      },
      processedEventKeys: boundedEventKeys([...state.processedEventKeys, eventKey]),
    },
    flags: {
      ...save.flags,
      legacyPrestige: flagNumber(save.flags.legacyPrestige) + HALL_INDUCTION_PRESTIGE,
      hallOfLegendsInductions: flagNumber(save.flags.hallOfLegendsInductions) + 1,
      lastHallInducteeName: retired.creature.nickname,
    },
  };
  nextSave = addCreatureMemory(nextSave, {
    creatureId,
    category: "achievement",
    importance: "legendary",
    title: `${retired.creature.nickname} entered the Hall of Legends`,
    description: `${retired.creature.nickname}, remembered as ${retired.legacyTitle}, received permanent Hall induction for ${retired.strongestContribution}.`,
    dayNumber: save.dayState.dayNumber,
    createdAt: inductedAt,
    sourceKey: eventKey,
    tags: ["hall-of-legends", "induction", retired.legacyTitle],
  });

  return {
    save: nextSave,
    ok: true,
    message: `${retired.creature.nickname} was permanently inducted into the Hall of Legends.`,
    retired: updatedRetired,
    heirloom: state.heirloomsById[retired.heirloomId],
    hallEntry,
  };
}
