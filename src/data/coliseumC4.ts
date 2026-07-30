import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
  type BattleOutfitterItemId,
} from "@/data/battleOutfitter";
import {
  COLISEUM_C2_ENCOUNTERS,
  getColiseumC2Division,
  getColiseumC2Encounter,
  getColiseumC2Progress,
  type ColiseumC2EncounterDefinition,
  type ColiseumC2EncounterId,
  type ColiseumCombatPerformanceMap,
} from "@/data/coliseumC2";
import {
  COLISEUM_C3_HISTORY_LIMIT,
  COLISEUM_C3_STATE_FLAG,
  getColiseumC3State,
} from "@/data/coliseumC3";
import {
  applyCreatureLevelGrowth,
  getProjectedMaxEnergyForCreature,
} from "@/data/levelGrowth";
import { resolveTalentEffects } from "@/data/talents/talentEngine";
import type { BattleAiDifficulty } from "@/types/battleAi";
import type {
  BattleOutcome,
  BattleState,
  BattleStatusId,
  BattleStatusStack,
} from "@/types/battle";
import type {
  CreatureRecord,
  CreatureStatKey,
} from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const COLISEUM_C4_STATE_FLAG = "coliseumC4StateV1";
export const COLISEUM_C4_STATE_VERSION = 1;
export const COLISEUM_C4_HISTORY_LIMIT = 80;
export const COLISEUM_C4_RESULT_LIMIT = 180;

export type ColiseumC4Mode = "daily" | "gauntlet" | "boss";
export type ColiseumC4ModifierId =
  | "quickened_field"
  | "deep_reserves"
  | "fragile_ground"
  | "enemy_bulwark"
  | "marked_opening"
  | "exhausting_heat"
  | "restricted_aid"
  | "enemy_focus"
  | "rallying_start";

export type ColiseumC4ModifierDefinition = {
  modifierId: ColiseumC4ModifierId;
  name: string;
  description: string;
  rewardBonusPercent: number;
  tone: "benefit" | "hazard" | "mixed";
};

export type ColiseumC4Reward = {
  marks: number;
  materials: number;
  itemId?: BattleOutfitterItemId;
  itemQuantity?: number;
};

export type ColiseumC4ChallengeDefinition = {
  challengeKey: string;
  claimKey: string;
  mode: ColiseumC4Mode;
  name: string;
  subtitle: string;
  description: string;
  encounterIds: ColiseumC2EncounterId[];
  modifierIds: ColiseumC4ModifierId[];
  reward: ColiseumC4Reward;
  requiredEncounterId: ColiseumC2EncounterId;
  levelBonus: number;
  aiDifficultyOverride?: BattleAiDifficulty;
  repeatRewardRatio: number;
};

export type ColiseumC4CarryoverEntry = {
  hpRatio: number;
  battleEnergyRatio: number;
};
export type ColiseumC4CarryoverMap = Record<string, ColiseumC4CarryoverEntry>;

export type ColiseumC4ActiveRun = {
  runId: string;
  challengeKey: string;
  mode: "gauntlet";
  stageIndex: number;
  teamCreatureIds: CreatureId[];
  carryover: ColiseumC4CarryoverMap;
  totalRounds: number;
  startedDayNumber: number;
  modifierIds: ColiseumC4ModifierId[];
};

export type ColiseumC4ModeRecord = {
  runsStarted: number;
  battles: number;
  clears: number;
  losses: number;
  draws: number;
  bestScore: number;
  bestRounds?: number;
  bestStage: number;
};

export type ColiseumC4CreatureRecord = {
  creatureId: CreatureId;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  totalCombatXp: number;
  dailyWins: number;
  gauntletClears: number;
  bossClears: number;
  bestScore: number;
};

export type ColiseumC4WeeklyScore = {
  weekKey: string;
  score: number;
  clears: number;
  bestMode?: ColiseumC4Mode;
  bestChallengeName?: string;
};

export type ColiseumC4HistoryEntry = {
  resultId: string;
  challengeKey: string;
  challengeName: string;
  mode: ColiseumC4Mode;
  outcome: BattleOutcome;
  stageNumber: number;
  stageCount: number;
  rounds: number;
  totalRunRounds: number;
  completedAtDayNumber: number;
  teamCreatureIds: CreatureId[];
  marks: number;
  materials: number;
  itemLabel?: string;
  score: number;
  rewardTier: "full" | "repeat" | "none";
};

export type ColiseumC4State = {
  version: number;
  processedResultIds: string[];
  dailyClaimKeys: string[];
  weeklyBossClaimKeys: string[];
  weeklyGauntletClaimKeys: string[];
  activeRun?: ColiseumC4ActiveRun;
  modeRecords: Record<ColiseumC4Mode, ColiseumC4ModeRecord>;
  creatureRecords: Record<string, ColiseumC4CreatureRecord>;
  weeklyScores: Record<string, ColiseumC4WeeklyScore>;
  history: ColiseumC4HistoryEntry[];
};

export type ColiseumC4XpSummary = {
  creatureId: CreatureId;
  creatureName: string;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
};

export type ColiseumC4Result = {
  save: GameSave;
  state: ColiseumC4State;
  ok: boolean;
  changed: boolean;
  duplicate: boolean;
  message: string;
  xpSummaries: ColiseumC4XpSummary[];
  historyEntry?: ColiseumC4HistoryEntry;
};

export const COLISEUM_C4_MODIFIERS: readonly ColiseumC4ModifierDefinition[] = [
  { modifierId: "quickened_field", name: "Quickened Field", description: "Every combatant gains +4 Speed. Initiative becomes much less forgiving.", rewardBonusPercent: 10, tone: "mixed" },
  { modifierId: "deep_reserves", name: "Deep Reserves", description: "Every combatant gains +12 maximum Battle Energy and begins with the additional reserve.", rewardBonusPercent: -5, tone: "benefit" },
  { modifierId: "fragile_ground", name: "Fragile Ground", description: "Every combatant enters with 15% less maximum HP.", rewardBonusPercent: 15, tone: "hazard" },
  { modifierId: "enemy_bulwark", name: "Bulwark Opening", description: "Every enemy begins Guarded for two rounds.", rewardBonusPercent: 15, tone: "hazard" },
  { modifierId: "marked_opening", name: "Marked Opening", description: "Every combatant begins Marked for two rounds and takes increased focused damage.", rewardBonusPercent: 10, tone: "mixed" },
  { modifierId: "exhausting_heat", name: "Exhausting Heat", description: "The ranch team begins Exhausted for two rounds, reducing Battle Energy recovery.", rewardBonusPercent: 20, tone: "hazard" },
  { modifierId: "restricted_aid", name: "Restricted Aid", description: "Field Tonics and Revival Salves cannot be used during this challenge.", rewardBonusPercent: 25, tone: "hazard" },
  { modifierId: "enemy_focus", name: "Focused Opposition", description: "Enemies gain +6 Accuracy and +6 Status Power.", rewardBonusPercent: 15, tone: "hazard" },
  { modifierId: "rallying_start", name: "Rallying Start", description: "The ranch team begins Inspired for two rounds.", rewardBonusPercent: -10, tone: "benefit" },
] as const;

const C4_GAUNTLETS: readonly ColiseumC4ChallengeDefinition[] = [
  {
    challengeKey: "gauntlet_rising_circuit",
    claimKey: "",
    mode: "gauntlet",
    name: "Rising Circuit",
    subtitle: "Three-stage fundamentals gauntlet",
    description: "Carry one locked team from Novice support pressure into Bronze offense and Silver status control.",
    encounterIds: ["novice_support_drill", "bronze_breaker_squad", "silver_status_web"],
    modifierIds: ["quickened_field"],
    reward: { marks: 18, materials: 6 },
    requiredEncounterId: "novice_echo_trial",
    levelBonus: 0,
    repeatRewardRatio: 0.35,
  },
  {
    challengeKey: "gauntlet_endurance_circuit",
    claimKey: "",
    mode: "gauntlet",
    name: "Endurance Circuit",
    subtitle: "Resource-management gauntlet",
    description: "Survive a medic line, an endurance cell, and the Crown control matrix with only partial recovery.",
    encounterIds: ["bronze_medic_line", "silver_endurance_cell", "crown_control_matrix"],
    modifierIds: ["deep_reserves", "enemy_bulwark"],
    reward: { marks: 28, materials: 10, itemId: "field_tonic", itemQuantity: 1 },
    requiredEncounterId: "silver_guard_circuit",
    levelBonus: 1,
    aiDifficultyOverride: "champion",
    repeatRewardRatio: 0.35,
  },
  {
    challengeKey: "gauntlet_champions_road",
    claimKey: "",
    mode: "gauntlet",
    name: "Champion's Road",
    subtitle: "Crown mastery gauntlet",
    description: "A restricted-aid run through the Silver champion and the two hardest Crown formations.",
    encounterIds: ["silver_guard_circuit", "crown_opening_assault", "crown_tactical_finale"],
    modifierIds: ["marked_opening", "restricted_aid"],
    reward: { marks: 42, materials: 15, itemId: "focus_manual", itemQuantity: 1 },
    requiredEncounterId: "crown_tactical_finale",
    levelBonus: 2,
    aiDifficultyOverride: "champion",
    repeatRewardRatio: 0.35,
  },
] as const;

const BOSS_ROTATION: readonly Omit<ColiseumC4ChallengeDefinition, "challengeKey" | "claimKey">[] = [
  {
    mode: "boss",
    name: "Bulwark Prime",
    subtitle: "Weekly fortress trial",
    description: "An elevated Silver champion formation begins behind reinforced Guard and reduced field durability.",
    encounterIds: ["silver_guard_circuit"],
    modifierIds: ["enemy_bulwark", "fragile_ground"],
    reward: { marks: 32, materials: 8, itemId: "field_tonic", itemQuantity: 1 },
    requiredEncounterId: "silver_guard_circuit",
    levelBonus: 4,
    aiDifficultyOverride: "champion",
    repeatRewardRatio: 0,
  },
  {
    mode: "boss",
    name: "Predator Ascendant",
    subtitle: "Weekly pressure trial",
    description: "A faster Crown assault attacks an Exhausted ranch team without mid-match recovery items.",
    encounterIds: ["crown_opening_assault"],
    modifierIds: ["quickened_field", "exhausting_heat", "restricted_aid"],
    reward: { marks: 40, materials: 10, itemId: "team_tactics_kit", itemQuantity: 1 },
    requiredEncounterId: "crown_opening_assault",
    levelBonus: 4,
    aiDifficultyOverride: "champion",
    repeatRewardRatio: 0,
  },
  {
    mode: "boss",
    name: "Grand Tactician",
    subtitle: "Weekly Crown trial",
    description: "The Crown finale returns at elevated levels with focused status pressure and a Marked opening.",
    encounterIds: ["crown_tactical_finale"],
    modifierIds: ["enemy_focus", "marked_opening", "deep_reserves"],
    reward: { marks: 55, materials: 14, itemId: "revival_salve", itemQuantity: 1 },
    requiredEncounterId: "crown_tactical_finale",
    levelBonus: 5,
    aiDifficultyOverride: "champion",
    repeatRewardRatio: 0,
  },
] as const;

function finiteCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function clampRatio(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0;
}

function uniqueStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string")))
    : [];
}

function sameTeam(left: CreatureId[], right: CreatureId[]): boolean {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right.map(String));
  return left.every((id) => rightIds.has(String(id)));
}

function emptyModeRecord(): ColiseumC4ModeRecord {
  return { runsStarted: 0, battles: 0, clears: 0, losses: 0, draws: 0, bestScore: 0, bestStage: 0 };
}

function normalizeModeRecord(value?: Partial<ColiseumC4ModeRecord>): ColiseumC4ModeRecord {
  return {
    runsStarted: finiteCount(value?.runsStarted),
    battles: finiteCount(value?.battles),
    clears: finiteCount(value?.clears),
    losses: finiteCount(value?.losses),
    draws: finiteCount(value?.draws),
    bestScore: finiteCount(value?.bestScore),
    bestRounds: typeof value?.bestRounds === "number" && Number.isFinite(value.bestRounds)
      ? Math.max(1, Math.floor(value.bestRounds))
      : undefined,
    bestStage: finiteCount(value?.bestStage),
  };
}

function emptyState(): ColiseumC4State {
  return {
    version: COLISEUM_C4_STATE_VERSION,
    processedResultIds: [],
    dailyClaimKeys: [],
    weeklyBossClaimKeys: [],
    weeklyGauntletClaimKeys: [],
    modeRecords: { daily: emptyModeRecord(), gauntlet: emptyModeRecord(), boss: emptyModeRecord() },
    creatureRecords: {},
    weeklyScores: {},
    history: [],
  };
}

function normalizeCarryover(value: unknown): ColiseumC4CarryoverMap {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    if (!entry || typeof entry !== "object") return [];
    const raw = entry as Partial<ColiseumC4CarryoverEntry>;
    return [[key, { hpRatio: clampRatio(raw.hpRatio), battleEnergyRatio: clampRatio(raw.battleEnergyRatio) } satisfies ColiseumC4CarryoverEntry]];
  }));
}

function normalizeState(raw: Partial<ColiseumC4State>): ColiseumC4State {
  const active = raw.activeRun;
  const activeRun: ColiseumC4ActiveRun | undefined = active && active.mode === "gauntlet" && typeof active.challengeKey === "string"
    ? {
        runId: typeof active.runId === "string" ? active.runId : `c4_run_${active.challengeKey}`,
        challengeKey: active.challengeKey,
        mode: "gauntlet",
        stageIndex: finiteCount(active.stageIndex),
        teamCreatureIds: uniqueStrings(active.teamCreatureIds) as CreatureId[],
        carryover: normalizeCarryover(active.carryover),
        totalRounds: finiteCount(active.totalRounds),
        startedDayNumber: Math.max(1, finiteCount(active.startedDayNumber)),
        modifierIds: uniqueStrings(active.modifierIds).filter((id): id is ColiseumC4ModifierId => COLISEUM_C4_MODIFIERS.some((entry) => entry.modifierId === id)),
      }
    : undefined;
  const creatureRecords = Object.fromEntries(Object.entries(raw.creatureRecords ?? {}).map(([key, value]) => {
    const entry = value as Partial<ColiseumC4CreatureRecord>;
    return [key, {
      creatureId: key as CreatureId,
      battles: finiteCount(entry.battles),
      wins: finiteCount(entry.wins),
      losses: finiteCount(entry.losses),
      draws: finiteCount(entry.draws),
      totalCombatXp: finiteCount(entry.totalCombatXp),
      dailyWins: finiteCount(entry.dailyWins),
      gauntletClears: finiteCount(entry.gauntletClears),
      bossClears: finiteCount(entry.bossClears),
      bestScore: finiteCount(entry.bestScore),
    } satisfies ColiseumC4CreatureRecord];
  }));
  const weeklyScores = Object.fromEntries(Object.entries(raw.weeklyScores ?? {}).map(([key, value]) => {
    const entry = value as Partial<ColiseumC4WeeklyScore>;
    return [key, {
      weekKey: key,
      score: finiteCount(entry.score),
      clears: finiteCount(entry.clears),
      bestMode: entry.bestMode === "daily" || entry.bestMode === "gauntlet" || entry.bestMode === "boss" ? entry.bestMode : undefined,
      bestChallengeName: typeof entry.bestChallengeName === "string" ? entry.bestChallengeName : undefined,
    } satisfies ColiseumC4WeeklyScore];
  }));
  return {
    version: COLISEUM_C4_STATE_VERSION,
    processedResultIds: uniqueStrings(raw.processedResultIds).slice(-COLISEUM_C4_RESULT_LIMIT),
    dailyClaimKeys: uniqueStrings(raw.dailyClaimKeys),
    weeklyBossClaimKeys: uniqueStrings(raw.weeklyBossClaimKeys),
    weeklyGauntletClaimKeys: uniqueStrings(raw.weeklyGauntletClaimKeys),
    activeRun,
    modeRecords: {
      daily: normalizeModeRecord(raw.modeRecords?.daily),
      gauntlet: normalizeModeRecord(raw.modeRecords?.gauntlet),
      boss: normalizeModeRecord(raw.modeRecords?.boss),
    },
    creatureRecords,
    weeklyScores,
    history: Array.isArray(raw.history)
      ? raw.history.filter((entry): entry is ColiseumC4HistoryEntry => Boolean(entry && typeof entry.resultId === "string")).slice(0, COLISEUM_C4_HISTORY_LIMIT)
      : [],
  };
}

export function getColiseumC4State(save: GameSave): ColiseumC4State {
  const raw = save.flags[COLISEUM_C4_STATE_FLAG];
  if (typeof raw !== "string" || !raw.trim()) return emptyState();
  try {
    return normalizeState(JSON.parse(raw) as Partial<ColiseumC4State>);
  } catch {
    return emptyState();
  }
}

function writeC4State(save: GameSave, state: ColiseumC4State, flags: GameSave["flags"] = save.flags): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...flags,
      [COLISEUM_C4_STATE_FLAG]: JSON.stringify(normalizeState(state)),
      coliseumC4Unlocked: true,
      mColiseumC4: true,
    },
  };
}

function deterministicRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % Math.max(1, modulo);
}

export function getColiseumC4WeekKey(dayNumber: number): string {
  return `week_${Math.floor(Math.max(0, dayNumber - 1) / 7) + 1}`;
}

export function getColiseumC4Modifier(modifierId: ColiseumC4ModifierId): ColiseumC4ModifierDefinition {
  const modifier = COLISEUM_C4_MODIFIERS.find((entry) => entry.modifierId === modifierId);
  if (!modifier) throw new Error(`Unknown Coliseum C4 modifier: ${modifierId}`);
  return modifier;
}

export function getColiseumC4RewardMultiplier(modifierIds: ColiseumC4ModifierId[]): number {
  const bonus = modifierIds.reduce((total, id) => total + getColiseumC4Modifier(id).rewardBonusPercent, 0);
  return Math.max(0.5, Math.round((1 + bonus / 100) * 100) / 100);
}

function scaledReward(base: ColiseumC4Reward, modifierIds: ColiseumC4ModifierId[]): ColiseumC4Reward {
  const multiplier = getColiseumC4RewardMultiplier(modifierIds);
  return {
    ...base,
    marks: Math.max(1, Math.round(base.marks * multiplier)),
    materials: Math.max(0, Math.round(base.materials * Math.max(0.75, multiplier))),
  };
}

export function getColiseumC4DailyChallenge(save: GameSave): ColiseumC4ChallengeDefinition {
  const day = Math.max(1, save.dayState.dayNumber);
  const progress = getColiseumC2Progress(save);
  const cleared = COLISEUM_C2_ENCOUNTERS.filter((entry) => progress.completedEncounterIds.includes(entry.encounterId));
  const pool = cleared.length ? cleared : [COLISEUM_C2_ENCOUNTERS[0]];
  const seed = `${save.saveId}_${day}_daily`;
  const encounter = pool[deterministicRoll(seed, pool.length)] ?? COLISEUM_C2_ENCOUNTERS[0];
  const hazards = COLISEUM_C4_MODIFIERS.filter((entry) => entry.tone !== "benefit");
  const wildcards = COLISEUM_C4_MODIFIERS.filter((entry) => entry.modifierId !== "restricted_aid");
  const first = hazards[deterministicRoll(`${seed}_hazard`, hazards.length)]?.modifierId ?? "quickened_field";
  let second = wildcards[deterministicRoll(`${seed}_wild`, wildcards.length)]?.modifierId ?? "rallying_start";
  if (second === first) second = second === "quickened_field" ? "rallying_start" : "quickened_field";
  const modifierIds: ColiseumC4ModifierId[] = [first, second];
  const division = getColiseumC2Division(encounter.divisionId);
  return {
    challengeKey: `daily_${day}`,
    claimKey: `daily_${day}`,
    mode: "daily",
    name: `Daily Challenge: ${encounter.name}`,
    subtitle: `Ranch Day ${day} rotation`,
    description: `A one-day modified version of ${encounter.opponentName}. The reward can be claimed once before the Ranch Day advances.`,
    encounterIds: [encounter.encounterId],
    modifierIds,
    reward: scaledReward({ marks: 6 + division.order * 3, materials: division.order + 1 }, modifierIds),
    requiredEncounterId: "novice_echo_trial",
    levelBonus: 1,
    aiDifficultyOverride: division.order >= 3 ? "champion" : encounter.aiDifficulty,
    repeatRewardRatio: 0,
  };
}

export function getColiseumC4Gauntlets(save: GameSave): ColiseumC4ChallengeDefinition[] {
  const weekKey = getColiseumC4WeekKey(save.dayState.dayNumber);
  return C4_GAUNTLETS.map((entry) => ({ ...entry, claimKey: `${weekKey}_${entry.challengeKey}`, reward: scaledReward(entry.reward, entry.modifierIds) }));
}

export function getColiseumC4WeeklyBoss(save: GameSave): ColiseumC4ChallengeDefinition {
  const weekKey = getColiseumC4WeekKey(save.dayState.dayNumber);
  const template = BOSS_ROTATION[deterministicRoll(`${save.saveId}_${weekKey}_boss`, BOSS_ROTATION.length)] ?? BOSS_ROTATION[0];
  const slug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return { ...template, challengeKey: `boss_${weekKey}_${slug}`, claimKey: `boss_${weekKey}_${slug}`, reward: scaledReward(template.reward, template.modifierIds) };
}

export function getColiseumC4ChallengeByKey(save: GameSave, challengeKey: string): ColiseumC4ChallengeDefinition | null {
  const daily = getColiseumC4DailyChallenge(save);
  if (daily.challengeKey === challengeKey) return daily;
  const boss = getColiseumC4WeeklyBoss(save);
  if (boss.challengeKey === challengeKey) return boss;
  return getColiseumC4Gauntlets(save).find((entry) => entry.challengeKey === challengeKey) ?? null;
}

export function getColiseumC4Access(save: GameSave, challenge: ColiseumC4ChallengeDefinition): { unlocked: boolean; reason: string } {
  const progress = getColiseumC2Progress(save);
  if (!progress.completedEncounterIds.includes(challenge.requiredEncounterId)) {
    return { unlocked: false, reason: `Clear ${getColiseumC2Encounter(challenge.requiredEncounterId)?.name ?? challenge.requiredEncounterId} in the permanent circuit first.` };
  }
  const activeRun = getColiseumC4State(save).activeRun;
  if (activeRun && activeRun.challengeKey !== challenge.challengeKey) {
    return { unlocked: false, reason: `Finish or abandon ${activeRun.challengeKey} before starting another C4 run.` };
  }
  return { unlocked: true, reason: "Challenge available." };
}

export function buildColiseumC4Encounter(challenge: ColiseumC4ChallengeDefinition, stageIndex: number): ColiseumC2EncounterDefinition {
  const safeStage = Math.max(0, Math.min(challenge.encounterIds.length - 1, stageIndex));
  const encounterId = challenge.encounterIds[safeStage];
  const base = getColiseumC2Encounter(encounterId);
  if (!base) throw new Error(`Unknown C4 source encounter: ${encounterId}`);
  return {
    ...base,
    name: challenge.mode === "gauntlet" ? `${challenge.name} — Stage ${safeStage + 1}` : challenge.name,
    opponentName: challenge.mode === "boss" ? `${base.opponentName} · Boss Formation` : base.opponentName,
    description: `${challenge.description} ${base.description}`,
    strategyLabel: `${base.strategyLabel} · ${challenge.modifierIds.map((id) => getColiseumC4Modifier(id).name).join(" + ")}`,
    aiDifficulty: challenge.aiDifficultyOverride ?? base.aiDifficulty,
    recommendedLevel: base.recommendedLevel + challenge.levelBonus,
    enemyTeam: base.enemyTeam.map((entry) => ({ ...entry, level: Math.max(1, entry.level + challenge.levelBonus) })),
  };
}

function upsertStatus(statuses: BattleStatusStack[], status: BattleStatusId, duration: number): BattleStatusStack[] {
  const existing = statuses.some((entry) => entry.status === status);
  return existing
    ? statuses.map((entry) => entry.status === status ? { ...entry, duration: Math.max(entry.duration, duration), stacks: 1, maxStacks: 1 } : entry)
    : [...statuses, { status, duration, stacks: 1, maxStacks: 1 }];
}

export function applyColiseumC4Modifiers(state: BattleState, modifierIds: ColiseumC4ModifierId[]): BattleState {
  const modifiers = new Set(modifierIds);
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([id, combatant]) => {
    const battleStats = { ...combatant.battleStats };
    let statuses = [...combatant.statuses];
    let maxHp = combatant.maxHp;
    let currentHp = combatant.currentHp;
    let maxBattleEnergy = combatant.maxBattleEnergy;
    let currentBattleEnergy = combatant.currentBattleEnergy;
    if (modifiers.has("quickened_field")) battleStats.speed += 4;
    if (modifiers.has("deep_reserves")) {
      battleStats.battleEnergy += 12;
      maxBattleEnergy += 12;
      currentBattleEnergy += 12;
    }
    if (modifiers.has("fragile_ground")) {
      const ratio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 1;
      battleStats.maxHp = Math.max(1, Math.round(battleStats.maxHp * 0.85));
      maxHp = battleStats.maxHp;
      currentHp = combatant.isFainted ? 0 : Math.max(1, Math.round(maxHp * ratio));
    }
    if (modifiers.has("enemy_bulwark") && combatant.sideId === "enemy") statuses = upsertStatus(statuses, "guarded", 2);
    if (modifiers.has("marked_opening")) statuses = upsertStatus(statuses, "marked", 2);
    if (modifiers.has("exhausting_heat") && combatant.sideId === "player") statuses = upsertStatus(statuses, "exhausted", 2);
    if (modifiers.has("enemy_focus") && combatant.sideId === "enemy") {
      battleStats.accuracy += 6;
      battleStats.statusPower += 6;
    }
    if (modifiers.has("rallying_start") && combatant.sideId === "player") statuses = upsertStatus(statuses, "inspired", 2);
    return [id, {
      ...combatant,
      battleStats,
      maxHp,
      currentHp: Math.min(maxHp, currentHp),
      maxBattleEnergy,
      currentBattleEnergy: Math.min(maxBattleEnergy, currentBattleEnergy),
      statuses,
      isFainted: currentHp <= 0,
    }];
  })) as BattleState["combatants"];
  return { ...state, combatants, log: [...state.log, `C4 modifiers active: ${modifierIds.map((id) => getColiseumC4Modifier(id).name).join(" • ")}.`] };
}

export function applyColiseumC4Carryover(state: BattleState, carryover?: ColiseumC4CarryoverMap): BattleState {
  if (!carryover) return state;
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([id, combatant]) => {
    if (combatant.sideId !== "player") return [id, combatant];
    const snapshot = carryover[String(combatant.sourceCreatureId)];
    if (!snapshot) return [id, combatant];
    const currentHp = Math.max(1, Math.min(combatant.maxHp, Math.round(combatant.maxHp * clampRatio(snapshot.hpRatio))));
    const currentBattleEnergy = Math.max(0, Math.min(combatant.maxBattleEnergy, Math.round(combatant.maxBattleEnergy * clampRatio(snapshot.battleEnergyRatio))));
    return [id, { ...combatant, currentHp, currentBattleEnergy, isFainted: false, statuses: [], cooldowns: {} }];
  })) as BattleState["combatants"];
  return { ...state, combatants, log: [...state.log, "Gauntlet carryover applied after partial between-stage recovery."] };
}

export function createColiseumC4Carryover(state: BattleState): ColiseumC4CarryoverMap {
  return state.teams.player.combatantIds.reduce((next, id) => {
    const combatant = state.combatants[id];
    const hpRatio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 0;
    const energyRatio = combatant.maxBattleEnergy > 0 ? combatant.currentBattleEnergy / combatant.maxBattleEnergy : 0;
    next[String(combatant.sourceCreatureId)] = {
      hpRatio: combatant.isFainted ? 0.15 : Math.min(1, hpRatio + 0.3),
      battleEnergyRatio: Math.min(1, energyRatio + 0.25),
    };
    return next;
  }, {} as ColiseumC4CarryoverMap);
}

export function isColiseumC4AidRestricted(modifierIds: ColiseumC4ModifierId[]): boolean {
  return modifierIds.includes("restricted_aid");
}

function xpToNext(level: number): number {
  return 45 + Math.max(1, level) * 30;
}

function getGrowthBiases(creature: CreatureRecord): CreatureStatKey[] {
  return resolveTalentEffects(creature.abilities, "growth")
    .filter((effect) => effect.type === "growth-stat-bias" && effect.creatureStatKey)
    .map((effect) => effect.creatureStatKey as CreatureStatKey);
}

function getC4CombatXp(challenge: ColiseumC4ChallengeDefinition, encounter: ColiseumC2EncounterDefinition, outcome: BattleOutcome, creature: CreatureRecord, performance?: ColiseumCombatPerformanceMap[string]): number {
  const modeMultiplier = challenge.mode === "boss" ? 1.6 : challenge.mode === "gauntlet" ? 1.1 : 1.15;
  const outcomeMultiplier = outcome === "player_won" ? 1 : outcome === "draw" ? 0.6 : 0.45;
  const overLevel = Math.max(0, creature.level - encounter.recommendedLevel);
  const levelMultiplier = overLevel >= 9 ? 0.25 : overLevel >= 5 ? 0.5 : overLevel >= 3 ? 0.75 : 1;
  const contribution = performance
    ? Math.min(12, Math.floor(performance.damageDealt / 60) + Math.floor(performance.healingDone / 45) + performance.statusesApplied * 2 + performance.alliesProtected * 2 + performance.knockouts * 3)
    : 0;
  return Math.max(4, Math.round(encounter.baseCombatXp * modeMultiplier * outcomeMultiplier * levelMultiplier) + contribution);
}

function applyC4CombatXp(creature: CreatureRecord, xpGain: number, seed: string): { creature: CreatureRecord; summary: ColiseumC4XpSummary } {
  const levelBefore = creature.level;
  let level = creature.level;
  let xp = creature.xp + xpGain;
  let threshold = creature.xpToNext > 0 ? creature.xpToNext : xpToNext(level);
  let levelUps = 0;
  while (level < 100 && xp >= threshold) {
    xp -= threshold;
    level += 1;
    levelUps += 1;
    threshold = xpToNext(level);
  }
  const growth = levelUps > 0
    ? applyCreatureLevelGrowth(creature, levelUps, getGrowthBiases(creature), seed)
    : { stats: creature.stats, growthProgress: creature.growthProgress ?? { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 } };
  const projected = { ...creature, level, stats: growth.stats, growthProgress: growth.growthProgress };
  const maxEnergy = getProjectedMaxEnergyForCreature(projected);
  return {
    creature: {
      ...projected,
      xp,
      xpToNext: threshold,
      maxEnergy,
      energy: Math.min(maxEnergy, creature.energy + levelUps * 8),
      notes: `${creature.notes ?? ""} Coliseum C4: +${xpGain} combat XP${levelUps ? `, +${levelUps} level${levelUps === 1 ? "" : "s"}` : ""}.`.trim(),
    },
    summary: { creatureId: creature.creatureId, creatureName: creature.nickname, xpGained: xpGain, levelBefore, levelAfter: level },
  };
}

function emptyCreatureRecord(creatureId: CreatureId): ColiseumC4CreatureRecord {
  return { creatureId, battles: 0, wins: 0, losses: 0, draws: 0, totalCombatXp: 0, dailyWins: 0, gauntletClears: 0, bossClears: 0, bestScore: 0 };
}

function addItemReward(save: GameSave, flags: GameSave["flags"], reward: ColiseumC4Reward): { flags: GameSave["flags"]; label?: string } {
  if (!reward.itemId || !reward.itemQuantity) return { flags };
  const item = BATTLE_OUTFITTER_ITEMS.find((entry) => entry.itemId === reward.itemId);
  if (!item) return { flags };
  const current = getBattleOutfitterStock({ ...save, flags }, item);
  const added = Math.max(0, Math.min(reward.itemQuantity, (item.maxStock ?? Number.MAX_SAFE_INTEGER) - current));
  if (added <= 0) return { flags, label: `${item.name} stock full` };
  return { flags: { ...flags, [item.flagKey]: current + added }, label: `+${added} ${item.name}` };
}

function creditC3Marks(save: GameSave, flags: GameSave["flags"], challenge: ColiseumC4ChallengeDefinition, resultId: string, marks: number, lootLabel: string): GameSave["flags"] {
  if (marks <= 0) return flags;
  const c3 = getColiseumC3State({ ...save, flags });
  const nextC3 = {
    ...c3,
    marks: c3.marks + marks,
    awardHistory: [{
      awardId: `c4_${resultId}`,
      sourceResultId: resultId,
      encounterName: challenge.name,
      dayNumber: save.dayState.dayNumber,
      marks,
      lootLabel,
      reason: "battle" as const,
    }, ...c3.awardHistory].slice(0, COLISEUM_C3_HISTORY_LIMIT),
  };
  return {
    ...flags,
    [COLISEUM_C3_STATE_FLAG]: JSON.stringify(nextC3),
    coliseumMarksUnlocked: true,
    mColiseumC3: true,
  };
}

function calculateScore(challenge: ColiseumC4ChallengeDefinition, outcome: BattleOutcome, stageNumber: number, totalRounds: number): number {
  const base = challenge.mode === "boss" ? 4000 : challenge.mode === "gauntlet" ? 2500 : 1200;
  const clearValue = outcome === "player_won" ? 1000 : outcome === "draw" ? 250 : 0;
  const stageValue = stageNumber * (challenge.mode === "gauntlet" ? 450 : 150);
  const modifierValue = Math.max(0, Math.round((getColiseumC4RewardMultiplier(challenge.modifierIds) - 1) * 1200));
  return Math.max(0, base + clearValue + stageValue + modifierValue - totalRounds * 15);
}

function invalidResult(save: GameSave, state: ColiseumC4State, message: string, duplicate = false): ColiseumC4Result {
  return { save, state, ok: false, changed: false, duplicate, message, xpSummaries: [] };
}

export function recordColiseumC4BattleResult(
  save: GameSave,
  challenge: ColiseumC4ChallengeDefinition,
  stageIndex: number,
  outcome: BattleOutcome,
  roundCount: number,
  teamCreatureIds: CreatureId[],
  performance: ColiseumCombatPerformanceMap,
  resultId: string,
  finalBattleState: BattleState,
): ColiseumC4Result {
  let state = getColiseumC4State(save);
  if (state.processedResultIds.includes(resultId)) {
    return invalidResult(save, state, "This C4 result was already processed. No duplicate XP, Marks, materials, score, or run progress was granted.", true);
  }
  if (teamCreatureIds.length !== 3 || new Set(teamCreatureIds.map(String)).size !== 3) {
    return invalidResult(save, state, "A C4 result requires exactly three unique ranch creatures.");
  }
  const previousRun = state.activeRun;
  if (challenge.mode === "gauntlet") {
    if (stageIndex === 0 && previousRun && previousRun.challengeKey !== challenge.challengeKey) {
      return invalidResult(save, state, "Another C4 gauntlet is already active.");
    }
    if (stageIndex > 0) {
      if (!previousRun || previousRun.challengeKey !== challenge.challengeKey || previousRun.stageIndex !== stageIndex) {
        return invalidResult(save, state, "This gauntlet stage is not the currently saved continuation.");
      }
      if (!sameTeam(previousRun.teamCreatureIds, teamCreatureIds)) {
        return invalidResult(save, state, "The gauntlet roster is locked and cannot be changed between stages.");
      }
    }
  }

  const encounter = buildColiseumC4Encounter(challenge, stageIndex);
  const win = outcome === "player_won";
  const loss = outcome === "enemy_won";
  const draw = outcome === "draw";
  const stageNumber = Math.max(1, stageIndex + 1);
  const stageCount = challenge.encounterIds.length;
  const run = previousRun?.challengeKey === challenge.challengeKey ? previousRun : undefined;
  const totalRunRounds = (run?.totalRounds ?? 0) + Math.max(1, Math.floor(roundCount));
  const completedRun = win && stageNumber >= stageCount;
  const runEnded = challenge.mode !== "gauntlet" || !win || completedRun;
  const weekKey = getColiseumC4WeekKey(save.dayState.dayNumber);

  const alreadyClaimed = challenge.mode === "daily"
    ? state.dailyClaimKeys.includes(challenge.claimKey)
    : challenge.mode === "boss"
      ? state.weeklyBossClaimKeys.includes(challenge.claimKey)
      : state.weeklyGauntletClaimKeys.includes(challenge.claimKey);
  let rewardTier: ColiseumC4HistoryEntry["rewardTier"] = "none";
  if ((challenge.mode !== "gauntlet" && win) || completedRun) rewardTier = alreadyClaimed ? (challenge.mode === "gauntlet" ? "repeat" : "none") : "full";

  const marks = rewardTier === "full"
    ? challenge.reward.marks
    : rewardTier === "repeat"
      ? Math.max(1, Math.round(challenge.reward.marks * challenge.repeatRewardRatio))
      : 0;
  const materials = rewardTier === "full" ? challenge.reward.materials : rewardTier === "repeat" ? 1 : 0;

  const xpSummaries: ColiseumC4XpSummary[] = [];
  const creatureRecords = { ...state.creatureRecords };
  const score = runEnded ? calculateScore(challenge, outcome, stageNumber, totalRunRounds) : 0;
  const creatures = (save.creatures ?? []).map((creature) => {
    if (!teamCreatureIds.includes(creature.creatureId)) return creature;
    const xpGain = getC4CombatXp(challenge, encounter, outcome, creature, performance[String(creature.creatureId)]);
    const xpResult = applyC4CombatXp(creature, xpGain, `${resultId}_${creature.creatureId}`);
    xpSummaries.push(xpResult.summary);
    const previous = creatureRecords[String(creature.creatureId)] ?? emptyCreatureRecord(creature.creatureId);
    creatureRecords[String(creature.creatureId)] = {
      ...previous,
      battles: previous.battles + 1,
      wins: previous.wins + (win ? 1 : 0),
      losses: previous.losses + (loss ? 1 : 0),
      draws: previous.draws + (draw ? 1 : 0),
      totalCombatXp: previous.totalCombatXp + xpGain,
      dailyWins: previous.dailyWins + (challenge.mode === "daily" && win ? 1 : 0),
      gauntletClears: previous.gauntletClears + (challenge.mode === "gauntlet" && completedRun ? 1 : 0),
      bossClears: previous.bossClears + (challenge.mode === "boss" && win ? 1 : 0),
      bestScore: Math.max(previous.bestScore, score),
    };
    return xpResult.creature;
  });

  if (xpSummaries.length !== 3) return invalidResult(save, state, "One or more C4 team creatures no longer exist in the save.");

  const previousMode = state.modeRecords[challenge.mode];
  const modeRecord: ColiseumC4ModeRecord = {
    ...previousMode,
    runsStarted: previousMode.runsStarted + (stageIndex === 0 ? 1 : 0),
    battles: previousMode.battles + 1,
    clears: previousMode.clears + ((challenge.mode === "gauntlet" ? completedRun : win) ? 1 : 0),
    losses: previousMode.losses + (loss ? 1 : 0),
    draws: previousMode.draws + (draw ? 1 : 0),
    bestScore: Math.max(previousMode.bestScore, score),
    bestRounds: runEnded && win ? previousMode.bestRounds ? Math.min(previousMode.bestRounds, totalRunRounds) : totalRunRounds : previousMode.bestRounds,
    bestStage: Math.max(previousMode.bestStage, win ? stageNumber : Math.max(0, stageNumber - 1)),
  };

  const activeRun: ColiseumC4ActiveRun | undefined = challenge.mode === "gauntlet" && win && !completedRun
    ? {
        runId: run?.runId ?? `c4_${challenge.challengeKey}_${save.dayState.dayNumber}_${resultId}`,
        challengeKey: challenge.challengeKey,
        mode: "gauntlet",
        stageIndex: stageIndex + 1,
        teamCreatureIds: [...teamCreatureIds],
        carryover: createColiseumC4Carryover(finalBattleState),
        totalRounds: totalRunRounds,
        startedDayNumber: run?.startedDayNumber ?? save.dayState.dayNumber,
        modifierIds: [...challenge.modifierIds],
      }
    : undefined;

  const weeklyPrevious = state.weeklyScores[weekKey] ?? { weekKey, score: 0, clears: 0 };
  const weeklyNext: ColiseumC4WeeklyScore = runEnded
    ? {
        ...weeklyPrevious,
        score: Math.max(weeklyPrevious.score, score),
        clears: weeklyPrevious.clears + ((challenge.mode === "gauntlet" ? completedRun : win) ? 1 : 0),
        bestMode: score > weeklyPrevious.score ? challenge.mode : weeklyPrevious.bestMode,
        bestChallengeName: score > weeklyPrevious.score ? challenge.name : weeklyPrevious.bestChallengeName,
      }
    : weeklyPrevious;

  let flags = { ...save.flags };
  if (materials > 0) flags.ranchMaterialsStock = finiteCount(flags.ranchMaterialsStock) + materials;
  const itemResult: { flags: GameSave["flags"]; label?: string } = rewardTier === "full"
    ? addItemReward(save, flags, challenge.reward)
    : { flags, label: undefined };
  flags = itemResult.flags;
  const lootPieces = [`+${marks} Marks`, `+${materials} Materials`, itemResult.label].filter(Boolean).join(" • ");

  const historyEntry: ColiseumC4HistoryEntry = {
    resultId,
    challengeKey: challenge.challengeKey,
    challengeName: challenge.name,
    mode: challenge.mode,
    outcome,
    stageNumber,
    stageCount,
    rounds: Math.max(1, Math.floor(roundCount)),
    totalRunRounds,
    completedAtDayNumber: save.dayState.dayNumber,
    teamCreatureIds: [...teamCreatureIds],
    marks,
    materials,
    itemLabel: itemResult.label,
    score,
    rewardTier,
  };

  state = {
    ...state,
    processedResultIds: [...state.processedResultIds, resultId].slice(-COLISEUM_C4_RESULT_LIMIT),
    dailyClaimKeys: rewardTier === "full" && challenge.mode === "daily" ? [...state.dailyClaimKeys, challenge.claimKey] : state.dailyClaimKeys,
    weeklyBossClaimKeys: rewardTier === "full" && challenge.mode === "boss" ? [...state.weeklyBossClaimKeys, challenge.claimKey] : state.weeklyBossClaimKeys,
    weeklyGauntletClaimKeys: rewardTier === "full" && challenge.mode === "gauntlet" ? [...state.weeklyGauntletClaimKeys, challenge.claimKey] : state.weeklyGauntletClaimKeys,
    activeRun,
    modeRecords: { ...state.modeRecords, [challenge.mode]: modeRecord },
    creatureRecords,
    weeklyScores: { ...state.weeklyScores, [weekKey]: weeklyNext },
    history: [historyEntry, ...state.history].slice(0, COLISEUM_C4_HISTORY_LIMIT),
  };

  flags = creditC3Marks(save, flags, challenge, resultId, marks, lootPieces || "C4 result recorded");
  const nextSave = writeC4State({ ...save, creatures }, state, flags);
  const xpLabel = xpSummaries.map((entry) => `${entry.creatureName} +${entry.xpGained} XP${entry.levelAfter > entry.levelBefore ? ` (Lv. ${entry.levelAfter})` : ""}`).join(" • ");
  const continuation = activeRun ? ` Stage ${activeRun.stageIndex + 1} is ready with 30% HP and 25% Battle Energy recovery.` : "";
  const rewardLabel = rewardTier === "none" ? "No repeat reward." : `${rewardTier === "full" ? "Full" : "Repeat"} reward: ${lootPieces}.`;
  return {
    save: nextSave,
    state,
    ok: true,
    changed: true,
    duplicate: false,
    message: `${win ? "Victory" : loss ? "Defeat" : "Draw"} recorded for ${challenge.name}, stage ${stageNumber}/${stageCount}. ${rewardLabel} Combat XP: ${xpLabel}.${continuation}`,
    xpSummaries,
    historyEntry,
  };
}

export function abandonColiseumC4Run(save: GameSave): ColiseumC4Result {
  const state = getColiseumC4State(save);
  if (!state.activeRun) return invalidResult(save, state, "No active C4 gauntlet is waiting.");
  const nextState = { ...state, activeRun: undefined };
  return {
    save: writeC4State(save, nextState),
    state: nextState,
    ok: true,
    changed: true,
    duplicate: false,
    message: "The active gauntlet was abandoned. Completed-stage XP remains, but no gauntlet clear reward was granted.",
    xpSummaries: [],
  };
}

export function getColiseumC4Summary(save: GameSave) {
  const state = getColiseumC4State(save);
  const weekKey = getColiseumC4WeekKey(save.dayState.dayNumber);
  const weekly = state.weeklyScores[weekKey] ?? { weekKey, score: 0, clears: 0 };
  return {
    weekKey,
    weeklyScore: weekly.score,
    weeklyClears: weekly.clears,
    dailyClaimed: state.dailyClaimKeys.includes(getColiseumC4DailyChallenge(save).claimKey),
    bossClaimed: state.weeklyBossClaimKeys.includes(getColiseumC4WeeklyBoss(save).claimKey),
    activeRun: state.activeRun,
    totalC4Battles: state.modeRecords.daily.battles + state.modeRecords.gauntlet.battles + state.modeRecords.boss.battles,
    totalC4Clears: state.modeRecords.daily.clears + state.modeRecords.gauntlet.clears + state.modeRecords.boss.clears,
  };
}
