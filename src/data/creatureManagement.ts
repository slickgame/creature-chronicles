import { getBreedingParticipants, getPairKey } from "@/data/breeding";
import {
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import type {
  CreatureFamily,
  CreatureRecord,
  CreatureSex,
  StatGrade,
} from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave, PregnancyRecord } from "@/types/save";

export type CreatureEnergyBand = "full" | "ready" | "tired" | "exhausted";
export type CreatureManagementStatusFilter =
  | "all"
  | "ready"
  | "pregnant"
  | "recovering"
  | "recently-bred"
  | "injured"
  | "training"
  | "low-energy"
  | "attention";
export type CreaturePregnancyFilter =
  | "all"
  | "not-pregnant"
  | "pregnant"
  | "due-soon"
  | "recovering";
export type CreatureOriginFilter =
  | "all"
  | "starter"
  | "market"
  | "hatched"
  | "guild";
export type CreatureRarityFilter =
  | "all"
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic";
export type CreatureSortMode =
  | "name"
  | "newest"
  | "level"
  | "energy"
  | "affection"
  | "fertility"
  | "rarity"
  | "variant"
  | "best-grade"
  | "generation";
export type SortDirection = "asc" | "desc";

export type CreatureManagementFilters = {
  search: string;
  family: "all" | CreatureFamily;
  status: CreatureManagementStatusFilter;
  sex: "all" | CreatureSex;
  pregnancy: CreaturePregnancyFilter;
  energy: "all" | CreatureEnergyBand;
  rarity: CreatureRarityFilter;
  variantId: "all" | string;
  origin: CreatureOriginFilter;
  favoritesOnly: boolean;
  lockedOnly: boolean;
  shinyOnly: boolean;
};

export type CreatureManagementStatus = {
  creatureId: CreatureId;
  family: CreatureFamily;
  sex: CreatureSex;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic";
  variantName: string;
  speciesName: string;
  energyPercent: number;
  energyBand: CreatureEnergyBand;
  isFavorite: boolean;
  isLocked: boolean;
  isShiny: boolean;
  isPregnant: boolean;
  pregnancyDaysRemaining: number | null;
  isRecovering: boolean;
  lastBredDay: number | null;
  daysSinceBred: number | null;
  recentlyBred: boolean;
  giverEligible: boolean;
  giverBlockedReason: string | null;
  receiverEligible: boolean;
  receiverBlockedReason: string | null;
  isTraining: boolean;
  isInjured: boolean;
  needsAttention: boolean;
  primaryStatus: string;
};

export const DEFAULT_CREATURE_MANAGEMENT_FILTERS: CreatureManagementFilters = {
  search: "",
  family: "all",
  status: "all",
  sex: "all",
  pregnancy: "all",
  energy: "all",
  rarity: "all",
  variantId: "all",
  origin: "all",
  favoritesOnly: false,
  lockedOnly: false,
  shinyOnly: false,
};

const STARTER_SEX_BY_ID: Record<string, CreatureSex> = {
  creature_starter_feline: "female",
  creature_starter_canine: "male",
  creature_starter_bovine: "female",
  creature_starter_lapine: "female",
  creature_starter_equine: "male",
};

const RARITY_SCORE = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
} as const;

const GRADE_SCORE: Record<StatGrade, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
};

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getDeterministicCreatureSex(creature: CreatureRecord): CreatureSex {
  if (creature.sex === "female" || creature.sex === "male") return creature.sex;
  const starterSex = STARTER_SEX_BY_ID[String(creature.creatureId)];
  if (starterSex) return starterSex;
  return hashString(`${creature.ownerSaveId}_${creature.creatureId}_sex`) % 2 === 0
    ? "female"
    : "male";
}

export function normalizeCreatureManagementMetadata(save: GameSave): GameSave {
  const creatures = (save.creatures ?? []).map((creature) => ({
    ...creature,
    sex: getDeterministicCreatureSex(creature),
    isFavorite: creature.isFavorite ?? false,
  }));

  return {
    ...save,
    creatures,
    flags: {
      ...save.flags,
      creatureManagementMetadataMigrated: true,
    },
  };
}

function getEnergyPercent(creature: CreatureRecord): number {
  if (creature.maxEnergy <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((creature.energy / creature.maxEnergy) * 100)),
  );
}

export function getEnergyBand(energyPercent: number): CreatureEnergyBand {
  if (energyPercent >= 100) return "full";
  if (energyPercent > 60) return "ready";
  if (energyPercent > 25) return "tired";
  return "exhausted";
}

function getActivePregnancy(
  save: GameSave,
  creatureId: CreatureId,
): PregnancyRecord | null {
  return (
    (save.pregnancies ?? []).find(
      (pregnancy) =>
        pregnancy.status === "pregnant" &&
        pregnancy.receiver.creatureId === creatureId,
    ) ?? null
  );
}

function getLastBreedingDay(save: GameSave, creatureId: CreatureId): number | null {
  const attempts = (save.breeding?.attempts ?? []).filter(
    (attempt) => attempt.giverId === creatureId || attempt.receiverId === creatureId,
  );
  if (!attempts.length) return null;
  return Math.max(...attempts.map((attempt) => attempt.dayNumber));
}

function getRoleBlockReason(
  role: "giver" | "receiver",
  canBreed: boolean,
  roleTags: readonly string[],
  unavailableReason: string | null | undefined,
  pregnancy: PregnancyRecord | null,
): string | null {
  if (!roleTags.includes(role)) return `Not configured for the ${role} role.`;
  if (role === "receiver" && pregnancy) {
    return `Pregnant · ${pregnancy.daysRemaining} day${pregnancy.daysRemaining === 1 ? "" : "s"} remaining.`;
  }
  if (!canBreed) return unavailableReason ?? "Currently unavailable.";
  return null;
}

export function getCreatureManagementStatus(
  save: GameSave,
  creature: CreatureRecord,
): CreatureManagementStatus {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const participant = getBreedingParticipants(save).find(
    (item) => item.creatureId === creature.creatureId,
  );
  const pregnancy = getActivePregnancy(save, creature.creatureId);
  const trainingReason = getTrainingUnavailableReason(save, creature.creatureId);
  const isTraining = Boolean(trainingReason);
  const isInjured =
    typeof creature.injuredUntilDayNumber === "number" &&
    creature.injuredUntilDayNumber >= save.dayState.dayNumber;
  const energyPercent = getEnergyPercent(creature);
  const energyBand = getEnergyBand(energyPercent);
  const isRecovering = Boolean(
    participant?.unavailableReason?.toLowerCase().includes("recovering"),
  );
  const lastBredDay = getLastBreedingDay(save, creature.creatureId);
  const daysSinceBred =
    lastBredDay === null ? null : Math.max(0, save.dayState.dayNumber - lastBredDay);
  const recentlyBred = daysSinceBred !== null && daysSinceBred <= 2;
  const canBreed = Boolean(participant?.canBreed);
  const roleTags = participant?.roleTags ?? [];
  const giverBlockedReason = getRoleBlockReason(
    "giver",
    canBreed,
    roleTags,
    participant?.unavailableReason,
    null,
  );
  const receiverBlockedReason = getRoleBlockReason(
    "receiver",
    canBreed,
    roleTags,
    participant?.unavailableReason,
    pregnancy,
  );
  const needsAttention =
    isTraining ||
    isInjured ||
    isRecovering ||
    energyBand === "tired" ||
    energyBand === "exhausted" ||
    creature.hearts < creature.maxHearts;

  let primaryStatus = "Ready";
  if (isTraining) primaryStatus = "Training";
  else if (isInjured) primaryStatus = creature.injuryLabel ?? "Injured";
  else if (isRecovering) primaryStatus = "Recovering";
  else if (pregnancy) primaryStatus = `Pregnant · ${pregnancy.daysRemaining}d`;
  else if (creature.hearts < creature.maxHearts) primaryStatus = "Hurt";
  else if (energyBand === "exhausted") primaryStatus = "Exhausted";
  else if (energyBand === "tired") primaryStatus = "Tired";
  else if (recentlyBred) {
    primaryStatus = daysSinceBred === 0 ? "Bred Today" : `Bred ${daysSinceBred}d Ago`;
  }

  return {
    creatureId: creature.creatureId,
    family: variant.family,
    sex: getDeterministicCreatureSex(creature),
    rarity: variant.rarity,
    variantName: variant.name,
    speciesName: species.name,
    energyPercent,
    energyBand,
    isFavorite: Boolean(creature.isFavorite),
    isLocked: creature.isLocked,
    isShiny: creature.shiny,
    isPregnant: Boolean(pregnancy),
    pregnancyDaysRemaining: pregnancy?.daysRemaining ?? null,
    isRecovering,
    lastBredDay,
    daysSinceBred,
    recentlyBred,
    giverEligible: giverBlockedReason === null,
    giverBlockedReason,
    receiverEligible: receiverBlockedReason === null,
    receiverBlockedReason,
    isTraining,
    isInjured,
    needsAttention,
    primaryStatus,
  };
}

function getBestGradeScore(creature: CreatureRecord): number {
  return Math.max(
    ...Object.values(creature.statGrades).map((grade) => GRADE_SCORE[grade]),
  );
}

function matchesStatus(
  status: CreatureManagementStatus,
  filter: CreatureManagementStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "ready") return status.giverEligible || status.receiverEligible;
  if (filter === "pregnant") return status.isPregnant;
  if (filter === "recovering") return status.isRecovering;
  if (filter === "recently-bred") return status.recentlyBred;
  if (filter === "injured") return status.isInjured;
  if (filter === "training") return status.isTraining;
  if (filter === "low-energy") {
    return status.energyBand === "tired" || status.energyBand === "exhausted";
  }
  return status.needsAttention;
}

function matchesPregnancy(
  status: CreatureManagementStatus,
  filter: CreaturePregnancyFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "not-pregnant") return !status.isPregnant;
  if (filter === "pregnant") return status.isPregnant;
  if (filter === "due-soon") {
    return status.isPregnant && (status.pregnancyDaysRemaining ?? 99) <= 1;
  }
  return status.isRecovering;
}

export function filterAndSortManagedCreatures(
  save: GameSave,
  filters: CreatureManagementFilters,
  sortMode: CreatureSortMode,
  direction: SortDirection,
): CreatureRecord[] {
  const search = filters.search.trim().toLowerCase();
  const statusById = new Map(
    (save.creatures ?? []).map((creature) => [
      creature.creatureId,
      getCreatureManagementStatus(save, creature),
    ]),
  );

  const filtered = (save.creatures ?? []).filter((creature) => {
    const status = statusById.get(creature.creatureId)!;
    const variant = getVariantDefinition(creature.variantId);
    const species = getSpeciesDefinition(creature.speciesId);
    if (
      search &&
      !`${creature.nickname} ${variant.name} ${species.name}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    if (filters.family !== "all" && status.family !== filters.family) return false;
    if (!matchesStatus(status, filters.status)) return false;
    if (filters.sex !== "all" && status.sex !== filters.sex) return false;
    if (!matchesPregnancy(status, filters.pregnancy)) return false;
    if (filters.energy !== "all" && status.energyBand !== filters.energy) return false;
    if (filters.rarity !== "all" && status.rarity !== filters.rarity) return false;
    if (filters.variantId !== "all" && creature.variantId !== filters.variantId) return false;
    if (filters.origin !== "all" && creature.origin !== filters.origin) return false;
    if (filters.favoritesOnly && !status.isFavorite) return false;
    if (filters.lockedOnly && !status.isLocked) return false;
    if (filters.shinyOnly && !status.isShiny) return false;
    return true;
  });

  const multiplier = direction === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const statusA = statusById.get(a.creatureId)!;
    const statusB = statusById.get(b.creatureId)!;
    let result = 0;
    if (sortMode === "newest") {
      result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortMode === "level") result = a.level - b.level;
    else if (sortMode === "energy") result = statusA.energyPercent - statusB.energyPercent;
    else if (sortMode === "affection") result = a.affection - b.affection;
    else if (sortMode === "fertility") {
      result = a.stats.FER - b.stats.FER;
      if (!result) result = GRADE_SCORE[a.statGrades.FER] - GRADE_SCORE[b.statGrades.FER];
    } else if (sortMode === "rarity") {
      result = RARITY_SCORE[statusA.rarity] - RARITY_SCORE[statusB.rarity];
    } else if (sortMode === "variant") {
      result = statusA.variantName.localeCompare(statusB.variantName);
    } else if (sortMode === "best-grade") {
      result = getBestGradeScore(a) - getBestGradeScore(b);
    } else if (sortMode === "generation") result = a.generation - b.generation;
    else result = a.nickname.localeCompare(b.nickname);

    if (result === 0) result = a.nickname.localeCompare(b.nickname);
    return result * multiplier;
  });
}

export function getCreatureManagementSummary(save: GameSave) {
  const statuses = (save.creatures ?? []).map((creature) =>
    getCreatureManagementStatus(save, creature),
  );
  return {
    total: statuses.length,
    ready: statuses.filter((status) => status.giverEligible || status.receiverEligible)
      .length,
    pregnant: statuses.filter((status) => status.isPregnant).length,
    attention: statuses.filter((status) => status.needsAttention).length,
    favorites: statuses.filter((status) => status.isFavorite).length,
  };
}

export function getPairManagementSummary(
  save: GameSave,
  creatureA: CreatureRecord,
  creatureB: CreatureRecord,
) {
  const pairKey = getPairKey(creatureA.creatureId, creatureB.creatureId);
  const streak =
    save.breeding?.streaks.find((record) => record.pairKey === pairKey)?.streakCount ??
    0;
  const parentsA = new Set(creatureA.lineage?.parentCreatureIds ?? []);
  const parentsB = creatureB.lineage?.parentCreatureIds ?? [];
  const direct =
    parentsA.has(creatureB.creatureId) ||
    (creatureB.lineage?.parentCreatureIds ?? []).includes(creatureA.creatureId);
  const sharedParents = parentsB.filter((id) => parentsA.has(id)).length;
  const lineageLabel = direct
    ? "Direct lineage"
    : sharedParents >= 2
      ? "Full-sibling line"
      : sharedParents === 1
        ? "Half-sibling line"
        : "No close risk detected";

  return { streak, lineageLabel };
}
