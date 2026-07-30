import { BATTLE_OUTFITTER_ITEMS, getBattleOutfitterStock } from "@/data/battleOutfitter";
import type { BattleOutcome } from "@/types/battle";
import type { BattleAiDifficulty } from "@/types/battleAi";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const COLISEUM_PROGRESS_FLAG = "coliseumProgressV1";
export const COLISEUM_PROGRESS_VERSION = 1;
export const COLISEUM_HISTORY_LIMIT = 25;

export type ColiseumDivisionId = "novice" | "bronze" | "silver" | "crown";
export type ColiseumEncounterId =
  | "novice_echo_trial"
  | "bronze_pack_clash"
  | "silver_guard_circuit"
  | "crown_tactical_finale";

export type ColiseumReward = {
  gold: number;
  guildPoints: number;
  itemId?: string;
  itemQuantity?: number;
};

export type ColiseumDivisionDefinition = {
  divisionId: ColiseumDivisionId;
  name: string;
  subtitle: string;
  description: string;
  order: number;
};

export type ColiseumEncounterDefinition = {
  encounterId: ColiseumEncounterId;
  divisionId: ColiseumDivisionId;
  name: string;
  opponentName: string;
  description: string;
  aiDifficulty: BattleAiDifficulty;
  enemyLevelOffset: number;
  recommendedLevel: number;
  prerequisiteEncounterIds: ColiseumEncounterId[];
  firstClearReward: ColiseumReward;
  repeatReward: ColiseumReward;
};

export type ColiseumEncounterRecord = {
  encounterId: ColiseumEncounterId;
  attempts: number;
  wins: number;
  losses: number;
  draws: number;
  bestWinRounds?: number;
  lastOutcome?: BattleOutcome;
  lastRoundCount?: number;
  lastCompletedDayNumber?: number;
  lastTeamCreatureIds: CreatureId[];
};

export type ColiseumHistoryEntry = {
  historyId: string;
  encounterId: ColiseumEncounterId;
  encounterName: string;
  divisionId: ColiseumDivisionId;
  outcome: BattleOutcome;
  roundCount: number;
  completedAtDayNumber: number;
  teamCreatureIds: CreatureId[];
  rewardGold: number;
  rewardGuildPoints: number;
  rewardItemId?: string;
  rewardItemQuantity?: number;
  firstClear: boolean;
};

export type ColiseumProgressState = {
  version: number;
  completedEncounterIds: ColiseumEncounterId[];
  claimedFirstClearEncounterIds: ColiseumEncounterId[];
  records: Partial<Record<ColiseumEncounterId, ColiseumEncounterRecord>>;
  history: ColiseumHistoryEntry[];
  totalAttempts: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export type ColiseumAccessResult = {
  unlocked: boolean;
  reason: string;
  missingPrerequisiteIds: ColiseumEncounterId[];
};

export type ColiseumResult = {
  save: GameSave;
  progress: ColiseumProgressState;
  record: ColiseumEncounterRecord;
  historyEntry: ColiseumHistoryEntry;
  reward: ColiseumReward;
  firstClear: boolean;
  message: string;
};

export const COLISEUM_DIVISIONS: readonly ColiseumDivisionDefinition[] = [
  {
    divisionId: "novice",
    name: "Novice Division",
    subtitle: "Open Exhibition",
    description: "A forgiving introduction to permanent Coliseum records and first-clear rewards.",
    order: 1,
  },
  {
    divisionId: "bronze",
    name: "Bronze Division",
    subtitle: "Pack Clash",
    description: "A tactical bracket that expects deliberate targeting and a functional three-creature team.",
    order: 2,
  },
  {
    divisionId: "silver",
    name: "Silver Division",
    subtitle: "Guard Circuit",
    description: "Longer fights with stronger Echo levels and greater pressure on support timing.",
    order: 3,
  },
  {
    divisionId: "crown",
    name: "Crown Division",
    subtitle: "Tactical Finale",
    description: "The current capstone challenge against Champion AI and elevated Echo levels.",
    order: 4,
  },
] as const;

export const COLISEUM_ENCOUNTERS: readonly ColiseumEncounterDefinition[] = [
  {
    encounterId: "novice_echo_trial",
    divisionId: "novice",
    name: "Novice Echo Trial",
    opponentName: "Novice Echo Team",
    description: "A Basic-AI match with slightly reduced enemy levels. Clear it once to unlock Bronze.",
    aiDifficulty: "basic",
    enemyLevelOffset: -2,
    recommendedLevel: 1,
    prerequisiteEncounterIds: [],
    firstClearReward: { gold: 180, guildPoints: 6, itemId: "field_tonic", itemQuantity: 1 },
    repeatReward: { gold: 45, guildPoints: 1 },
  },
  {
    encounterId: "bronze_pack_clash",
    divisionId: "bronze",
    name: "Bronze Pack Clash",
    opponentName: "Bronze Echo Pack",
    description: "A Tactical-AI match at even levels. Target priority and defensive timing begin to matter.",
    aiDifficulty: "tactical",
    enemyLevelOffset: 0,
    recommendedLevel: 3,
    prerequisiteEncounterIds: ["novice_echo_trial"],
    firstClearReward: { gold: 300, guildPoints: 10, itemId: "focus_manual", itemQuantity: 1 },
    repeatReward: { gold: 75, guildPoints: 2 },
  },
  {
    encounterId: "silver_guard_circuit",
    divisionId: "silver",
    name: "Silver Guard Circuit",
    opponentName: "Silver Guard Echoes",
    description: "A Tactical-AI match with a two-level enemy advantage and stronger pressure on recovery tools.",
    aiDifficulty: "tactical",
    enemyLevelOffset: 2,
    recommendedLevel: 5,
    prerequisiteEncounterIds: ["bronze_pack_clash"],
    firstClearReward: { gold: 480, guildPoints: 18, itemId: "team_tactics_kit", itemQuantity: 1 },
    repeatReward: { gold: 120, guildPoints: 3 },
  },
  {
    encounterId: "crown_tactical_finale",
    divisionId: "crown",
    name: "Crown Tactical Finale",
    opponentName: "Crown Champion Echoes",
    description: "Champion AI and a four-level enemy advantage form the current permanent progression capstone.",
    aiDifficulty: "champion",
    enemyLevelOffset: 4,
    recommendedLevel: 8,
    prerequisiteEncounterIds: ["silver_guard_circuit"],
    firstClearReward: { gold: 800, guildPoints: 30, itemId: "revival_salve", itemQuantity: 1 },
    repeatReward: { gold: 200, guildPoints: 6 },
  },
] as const;

const ENCOUNTER_IDS = new Set<ColiseumEncounterId>(COLISEUM_ENCOUNTERS.map((encounter) => encounter.encounterId));

function createEmptyProgress(): ColiseumProgressState {
  return {
    version: COLISEUM_PROGRESS_VERSION,
    completedEncounterIds: [],
    claimedFirstClearEncounterIds: [],
    records: {},
    history: [],
    totalAttempts: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
  };
}

function uniqueEncounterIds(values: unknown): ColiseumEncounterId[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter(
        (value): value is ColiseumEncounterId =>
          typeof value === "string" && ENCOUNTER_IDS.has(value as ColiseumEncounterId),
      ),
    ),
  );
}

function finiteCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function normalizeRecord(
  encounterId: ColiseumEncounterId,
  value: Partial<ColiseumEncounterRecord> | undefined,
): ColiseumEncounterRecord {
  return {
    encounterId,
    attempts: finiteCount(value?.attempts),
    wins: finiteCount(value?.wins),
    losses: finiteCount(value?.losses),
    draws: finiteCount(value?.draws),
    bestWinRounds:
      typeof value?.bestWinRounds === "number" && Number.isFinite(value.bestWinRounds)
        ? Math.max(1, Math.floor(value.bestWinRounds))
        : undefined,
    lastOutcome:
      value?.lastOutcome === "player_won" || value?.lastOutcome === "enemy_won" || value?.lastOutcome === "draw"
        ? value.lastOutcome
        : undefined,
    lastRoundCount:
      typeof value?.lastRoundCount === "number" && Number.isFinite(value.lastRoundCount)
        ? Math.max(1, Math.floor(value.lastRoundCount))
        : undefined,
    lastCompletedDayNumber:
      typeof value?.lastCompletedDayNumber === "number" && Number.isFinite(value.lastCompletedDayNumber)
        ? Math.max(1, Math.floor(value.lastCompletedDayNumber))
        : undefined,
    lastTeamCreatureIds: Array.isArray(value?.lastTeamCreatureIds)
      ? value.lastTeamCreatureIds.filter((id): id is CreatureId => typeof id === "string")
      : [],
  };
}

function normalizeHistory(value: unknown): ColiseumHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is ColiseumHistoryEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<ColiseumHistoryEntry>;
      return Boolean(
        candidate.encounterId &&
          ENCOUNTER_IDS.has(candidate.encounterId) &&
          (candidate.outcome === "player_won" || candidate.outcome === "enemy_won" || candidate.outcome === "draw"),
      );
    })
    .slice(0, COLISEUM_HISTORY_LIMIT)
    .map((entry) => ({
      ...entry,
      roundCount: Math.max(1, finiteCount(entry.roundCount)),
      completedAtDayNumber: Math.max(1, finiteCount(entry.completedAtDayNumber)),
      rewardGold: finiteCount(entry.rewardGold),
      rewardGuildPoints: finiteCount(entry.rewardGuildPoints),
      rewardItemQuantity: entry.rewardItemId ? Math.max(1, finiteCount(entry.rewardItemQuantity) || 1) : undefined,
      teamCreatureIds: Array.isArray(entry.teamCreatureIds)
        ? entry.teamCreatureIds.filter((id): id is CreatureId => typeof id === "string")
        : [],
    }));
}

export function getColiseumEncounter(encounterId: string): ColiseumEncounterDefinition | null {
  return COLISEUM_ENCOUNTERS.find((encounter) => encounter.encounterId === encounterId) ?? null;
}

export function getColiseumDivision(divisionId: ColiseumDivisionId): ColiseumDivisionDefinition {
  const division = COLISEUM_DIVISIONS.find((entry) => entry.divisionId === divisionId);
  if (!division) throw new Error(`Unknown Coliseum division: ${divisionId}`);
  return division;
}

export function getColiseumProgress(save: GameSave): ColiseumProgressState {
  const raw = save.flags[COLISEUM_PROGRESS_FLAG];
  if (typeof raw !== "string" || !raw.trim()) return createEmptyProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<ColiseumProgressState>;
    const records = COLISEUM_ENCOUNTERS.reduce(
      (next, encounter) => {
        const rawRecord = parsed.records?.[encounter.encounterId];
        if (rawRecord) next[encounter.encounterId] = normalizeRecord(encounter.encounterId, rawRecord);
        return next;
      },
      {} as Partial<Record<ColiseumEncounterId, ColiseumEncounterRecord>>,
    );
    return {
      version: COLISEUM_PROGRESS_VERSION,
      completedEncounterIds: uniqueEncounterIds(parsed.completedEncounterIds),
      claimedFirstClearEncounterIds: uniqueEncounterIds(parsed.claimedFirstClearEncounterIds),
      records,
      history: normalizeHistory(parsed.history),
      totalAttempts: finiteCount(parsed.totalAttempts),
      totalWins: finiteCount(parsed.totalWins),
      totalLosses: finiteCount(parsed.totalLosses),
      totalDraws: finiteCount(parsed.totalDraws),
    };
  } catch {
    return createEmptyProgress();
  }
}

export function getColiseumAccess(
  save: GameSave,
  encounter: ColiseumEncounterDefinition,
): ColiseumAccessResult {
  const progress = getColiseumProgress(save);
  const missingPrerequisiteIds = encounter.prerequisiteEncounterIds.filter(
    (encounterId) => !progress.completedEncounterIds.includes(encounterId),
  );
  if (missingPrerequisiteIds.length > 0) {
    const names = missingPrerequisiteIds
      .map((encounterId) => getColiseumEncounter(encounterId)?.name ?? encounterId)
      .join(", ");
    return {
      unlocked: false,
      reason: `Clear ${names} first.`,
      missingPrerequisiteIds,
    };
  }
  return { unlocked: true, reason: "Encounter available.", missingPrerequisiteIds: [] };
}

export function getColiseumEncounterRecord(
  save: GameSave,
  encounterId: ColiseumEncounterId,
): ColiseumEncounterRecord {
  const progress = getColiseumProgress(save);
  return normalizeRecord(encounterId, progress.records[encounterId]);
}

export function getColiseumHighestDivision(save: GameSave): ColiseumDivisionDefinition {
  const progress = getColiseumProgress(save);
  const clearedDivisionOrders = COLISEUM_ENCOUNTERS
    .filter((encounter) => progress.completedEncounterIds.includes(encounter.encounterId))
    .map((encounter) => getColiseumDivision(encounter.divisionId).order);
  const highestOrder = clearedDivisionOrders.length > 0 ? Math.max(...clearedDivisionOrders) : 1;
  return COLISEUM_DIVISIONS.find((division) => division.order === highestOrder) ?? COLISEUM_DIVISIONS[0];
}

export function getColiseumNextEncounter(save: GameSave): ColiseumEncounterDefinition | null {
  return COLISEUM_ENCOUNTERS.find((encounter) => {
    const access = getColiseumAccess(save, encounter);
    const progress = getColiseumProgress(save);
    return access.unlocked && !progress.completedEncounterIds.includes(encounter.encounterId);
  }) ?? null;
}

export function buildColiseumEnemyTeam(
  playerTeam: CreatureRecord[],
  encounter: ColiseumEncounterDefinition,
): CreatureRecord[] {
  return [...playerTeam].reverse().map((creature, index) => ({
    ...creature,
    creatureId: `coliseum_${encounter.encounterId}_${index}_${creature.creatureId}` as CreatureId,
    nickname: `${encounter.divisionId === "crown" ? "Crown" : "Echo"} ${creature.nickname || index + 1}`,
    originLabel: encounter.opponentName,
    level: Math.max(1, creature.level + encounter.enemyLevelOffset),
  }));
}

function getRewardLabel(reward: ColiseumReward): string {
  const parts = [`${reward.gold} Gold`, `${reward.guildPoints} GP`];
  if (reward.itemId && reward.itemQuantity) {
    const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === reward.itemId);
    parts.push(`${reward.itemQuantity} ${item?.name ?? reward.itemId}`);
  }
  return parts.join(" • ");
}

function applyReward(save: GameSave, reward: ColiseumReward): GameSave {
  const nextFlags = { ...save.flags };
  if (reward.itemId && reward.itemQuantity) {
    const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === reward.itemId);
    if (item) nextFlags[item.flagKey] = getBattleOutfitterStock(save, item) + reward.itemQuantity;
  }
  return {
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold + reward.gold,
      guildPoints: save.currencies.guildPoints + reward.guildPoints,
    },
    flags: nextFlags,
  };
}

export function recordColiseumBattleResult(
  save: GameSave,
  encounterId: ColiseumEncounterId,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
): ColiseumResult {
  const encounter = getColiseumEncounter(encounterId);
  if (!encounter) throw new Error(`Unknown Coliseum encounter: ${encounterId}`);
  const progress = getColiseumProgress(save);
  const previousRecord = normalizeRecord(encounterId, progress.records[encounterId]);
  const win = outcome === "player_won";
  const loss = outcome === "enemy_won";
  const draw = outcome === "draw";
  const firstClear = win && !progress.claimedFirstClearEncounterIds.includes(encounterId);
  const reward = win ? (firstClear ? encounter.firstClearReward : encounter.repeatReward) : { gold: 0, guildPoints: 0 };
  const normalizedRounds = Math.max(1, Math.floor(roundCount));
  const nextRecord: ColiseumEncounterRecord = {
    ...previousRecord,
    attempts: previousRecord.attempts + 1,
    wins: previousRecord.wins + (win ? 1 : 0),
    losses: previousRecord.losses + (loss ? 1 : 0),
    draws: previousRecord.draws + (draw ? 1 : 0),
    bestWinRounds: win
      ? previousRecord.bestWinRounds
        ? Math.min(previousRecord.bestWinRounds, normalizedRounds)
        : normalizedRounds
      : previousRecord.bestWinRounds,
    lastOutcome: outcome,
    lastRoundCount: normalizedRounds,
    lastCompletedDayNumber: save.dayState.dayNumber,
    lastTeamCreatureIds: [...teamCreatureIds],
  };
  const historyEntry: ColiseumHistoryEntry = {
    historyId: `${encounterId}_${save.dayState.dayNumber}_${progress.totalAttempts + 1}_${normalizedRounds}_${outcome}`,
    encounterId,
    encounterName: encounter.name,
    divisionId: encounter.divisionId,
    outcome,
    roundCount: normalizedRounds,
    completedAtDayNumber: save.dayState.dayNumber,
    teamCreatureIds: [...teamCreatureIds],
    rewardGold: reward.gold,
    rewardGuildPoints: reward.guildPoints,
    rewardItemId: reward.itemId,
    rewardItemQuantity: reward.itemQuantity,
    firstClear,
  };
  const nextProgress: ColiseumProgressState = {
    ...progress,
    completedEncounterIds:
      win && !progress.completedEncounterIds.includes(encounterId)
        ? [...progress.completedEncounterIds, encounterId]
        : [...progress.completedEncounterIds],
    claimedFirstClearEncounterIds:
      firstClear
        ? [...progress.claimedFirstClearEncounterIds, encounterId]
        : [...progress.claimedFirstClearEncounterIds],
    records: { ...progress.records, [encounterId]: nextRecord },
    history: [historyEntry, ...progress.history].slice(0, COLISEUM_HISTORY_LIMIT),
    totalAttempts: progress.totalAttempts + 1,
    totalWins: progress.totalWins + (win ? 1 : 0),
    totalLosses: progress.totalLosses + (loss ? 1 : 0),
    totalDraws: progress.totalDraws + (draw ? 1 : 0),
  };
  const rewardedSave = applyReward(save, reward);
  const nextSave: GameSave = {
    ...rewardedSave,
    updatedAt: new Date().toISOString(),
    flags: {
      ...rewardedSave.flags,
      [COLISEUM_PROGRESS_FLAG]: JSON.stringify(nextProgress),
      coliseumProgressionStarted: true,
      ...(firstClear ? { coliseumFirstClearEarned: true } : {}),
    },
  };
  const outcomeLabel = win ? "Victory" : loss ? "Defeat" : "Draw";
  const rewardLabel = win ? getRewardLabel(reward) : "No reward";
  return {
    save: nextSave,
    progress: nextProgress,
    record: nextRecord,
    historyEntry,
    reward,
    firstClear,
    message: `${outcomeLabel} recorded for ${encounter.name} in ${normalizedRounds} rounds. ${firstClear ? "First-clear reward" : win ? "Repeat reward" : "Result"}: ${rewardLabel}.`,
  };
}

export function getColiseumRewardLabel(reward: ColiseumReward): string {
  return getRewardLabel(reward);
}
