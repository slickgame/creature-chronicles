import { getChapterTwoIntoWoodlineState } from "@/data/chapterTwoIntoWoodline";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const CHAPTER_THREE_EXHIBITION_STATE_FLAG = "chapterThreeGuildExhibitionV1";
export const CHAPTER_THREE_EXHIBITION_VERSION = 1;
export const CHAPTER_THREE_EXHIBITION_ART = "/images/story/chapter-three/chapter_three_guild_exhibition.svg";
export const GUILD_EXHIBITION_ENERGY_COST = 18;

export type GuildExhibitionStage =
  | "locked"
  | "invitation"
  | "representative"
  | "preparation"
  | "exhibition"
  | "complete";

export type GuildExhibitionDiscipline = "bond" | "working" | "pedigree";
export type GuildExhibitionPlacement = "participant" | "bronze" | "silver" | "gold";

export type GuildExhibitionScoreBreakdown = {
  level: number;
  stats: number;
  affection: number;
  condition: number;
  discipline: number;
  shiny: number;
  total: number;
};

export type GuildExhibitionState = {
  version: number;
  stage: GuildExhibitionStage;
  startedDayNumber: number;
  invitationRead: boolean;
  representativeId: CreatureId | "";
  representativeName: string;
  discipline: GuildExhibitionDiscipline | "";
  scoreBreakdown: GuildExhibitionScoreBreakdown | null;
  placement: GuildExhibitionPlacement | "";
  rewardClaimed: boolean;
  history: string[];
};

export type GuildExhibitionActionResult = {
  save: GameSave;
  state: GuildExhibitionState;
  ok: boolean;
  message: string;
};

export type GuildExhibitionDisciplineDefinition = {
  id: GuildExhibitionDiscipline;
  name: string;
  costLabel: string;
  description: string;
  scoring: string;
  goldCost: number;
  feedCost: number;
};

export type GuildExhibitionPlacementDefinition = {
  id: GuildExhibitionPlacement;
  name: string;
  minimumScore: number;
  goldReward: number;
  guildPointReward: number;
  guildGoldBonusPercent: number;
  guildPointBonus: number;
};

export type GuildExhibitionReputationBonus = {
  placement: GuildExhibitionPlacement | "";
  guildGoldBonusPercent: number;
  guildPointBonus: number;
};

const STAT_KEYS: CreatureStatKey[] = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];

const DEFAULT_STATE: GuildExhibitionState = {
  version: CHAPTER_THREE_EXHIBITION_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  invitationRead: false,
  representativeId: "",
  representativeName: "",
  discipline: "",
  scoreBreakdown: null,
  placement: "",
  rewardClaimed: false,
  history: [],
};

export const GUILD_EXHIBITION_DISCIPLINES: readonly GuildExhibitionDisciplineDefinition[] = [
  {
    id: "bond",
    name: "Bond & Presence",
    costLabel: "Free",
    description: "Present the creature through trust, responsiveness, and the relationship built at the ranch.",
    scoring: "Emphasizes Affection, CHA, and WIL. Grants the representative extra Affection.",
    goldCost: 0,
    feedCost: 0,
  },
  {
    id: "working",
    name: "Working Demonstration",
    costLabel: "3 Feed",
    description: "Stage a practical ranch demonstration built around movement, strength, stamina, and reliable handling.",
    scoring: "Emphasizes STR, DEX, and STA. Returns 3 Materials after the exhibition.",
    goldCost: 0,
    feedCost: 3,
  },
  {
    id: "pedigree",
    name: "Pedigree Presentation",
    costLabel: "75 Gold",
    description: "Fund formal grooming, registry preparation, and a detailed presentation of the creature's lineage and temperament.",
    scoring: "Emphasizes CHA, WIL, and FER. Grants 1 additional Guild Point.",
    goldCost: 75,
    feedCost: 0,
  },
] as const;

export const GUILD_EXHIBITION_PLACEMENTS: readonly GuildExhibitionPlacementDefinition[] = [
  {
    id: "gold",
    name: "Gold Distinction",
    minimumScore: 82,
    goldReward: 400,
    guildPointReward: 8,
    guildGoldBonusPercent: 12,
    guildPointBonus: 2,
  },
  {
    id: "silver",
    name: "Silver Distinction",
    minimumScore: 68,
    goldReward: 260,
    guildPointReward: 5,
    guildGoldBonusPercent: 8,
    guildPointBonus: 1,
  },
  {
    id: "bronze",
    name: "Bronze Distinction",
    minimumScore: 54,
    goldReward: 180,
    guildPointReward: 3,
    guildGoldBonusPercent: 5,
    guildPointBonus: 0,
  },
  {
    id: "participant",
    name: "Recognized Exhibitor",
    minimumScore: 0,
    goldReward: 120,
    guildPointReward: 2,
    guildGoldBonusPercent: 3,
    guildPointBonus: 0,
  },
] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseScoreBreakdown(value: unknown): GuildExhibitionScoreBreakdown | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<GuildExhibitionScoreBreakdown>;
  const level = numberFlag(raw.level);
  const stats = numberFlag(raw.stats);
  const affection = numberFlag(raw.affection);
  const condition = numberFlag(raw.condition);
  const discipline = numberFlag(raw.discipline);
  const shiny = numberFlag(raw.shiny);
  const total = numberFlag(raw.total);
  return { level, stats, affection, condition, discipline, shiny, total };
}

function parseState(value: boolean | number | string | undefined): GuildExhibitionState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<GuildExhibitionState>;
    const stage = ["locked", "invitation", "representative", "preparation", "exhibition", "complete"].includes(String(parsed.stage))
      ? parsed.stage as GuildExhibitionStage
      : "locked";
    const discipline = ["bond", "working", "pedigree"].includes(String(parsed.discipline))
      ? parsed.discipline as GuildExhibitionDiscipline
      : "";
    const placement = ["participant", "bronze", "silver", "gold"].includes(String(parsed.placement))
      ? parsed.placement as GuildExhibitionPlacement
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_THREE_EXHIBITION_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber),
      invitationRead: parsed.invitationRead === true,
      representativeId: typeof parsed.representativeId === "string" ? parsed.representativeId as CreatureId : "",
      representativeName: typeof parsed.representativeName === "string" ? parsed.representativeName : "",
      discipline,
      scoreBreakdown: parseScoreBreakdown(parsed.scoreBreakdown),
      placement,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 30)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: GuildExhibitionState, entry: string): GuildExhibitionState {
  return { ...state, history: [entry, ...state.history].slice(0, 30) };
}

function withState(save: GameSave, state: GuildExhibitionState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_THREE_EXHIBITION_STATE_FLAG]: JSON.stringify(state),
      chapterThreeGuildExhibitionStarted: state.stage !== "locked",
      chapterThreeGuildExhibitionComplete: state.stage === "complete",
      m68ChapterThreeGuildExhibition: true,
    },
  };
}

function disciplineDefinition(discipline: GuildExhibitionDiscipline): GuildExhibitionDisciplineDefinition {
  return GUILD_EXHIBITION_DISCIPLINES.find((entry) => entry.id === discipline) ?? GUILD_EXHIBITION_DISCIPLINES[0];
}

function placementDefinition(placement: GuildExhibitionPlacement): GuildExhibitionPlacementDefinition {
  return GUILD_EXHIBITION_PLACEMENTS.find((entry) => entry.id === placement) ?? GUILD_EXHIBITION_PLACEMENTS.at(-1)!;
}

function getPlacementForScore(score: number): GuildExhibitionPlacementDefinition {
  return GUILD_EXHIBITION_PLACEMENTS.find((entry) => score >= entry.minimumScore) ?? GUILD_EXHIBITION_PLACEMENTS.at(-1)!;
}

function cappedStat(creature: CreatureRecord, stat: CreatureStatKey): number {
  return clamp(Number(creature.stats[stat] ?? 0), 0, 10);
}

export function getChapterThreeGuildExhibitionState(save: GameSave): GuildExhibitionState {
  return parseState(save.flags[CHAPTER_THREE_EXHIBITION_STATE_FLAG]);
}

export function isChapterThreeGuildExhibitionEligible(save: GameSave): boolean {
  return getChapterTwoIntoWoodlineState(save).stage === "complete" && save.flags.chapterThreeGuildExhibitionSkipped !== true;
}

export function prepareChapterThreeGuildExhibitionSave(save: GameSave): GameSave {
  if (!isChapterThreeGuildExhibitionEligible(save)) return save;
  const current = getChapterThreeGuildExhibitionState(save);
  if (current.stage !== "locked") return save;
  const state = appendHistory({
    ...current,
    stage: "invitation",
    startedDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: A gold-sealed invitation arrived for the regional Guild Exhibition.`);
  return withState(save, state);
}

export function reviewGuildExhibitionInvitation(save: GameSave): GuildExhibitionActionResult {
  const prepared = prepareChapterThreeGuildExhibitionSave(save);
  const current = getChapterThreeGuildExhibitionState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Complete Chapter 2 before opening the exhibition invitation." };
  }
  if (current.invitationRead) {
    return { save: prepared, state: current, ok: true, message: "The Guild Exhibition invitation is already reviewed." };
  }
  const state = appendHistory({
    ...current,
    stage: "representative",
    invitationRead: true,
  }, `Day ${save.dayState.dayNumber}: The ranch accepted an open invitation to present one creature before the regional Guild.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "Select one healthy ranch creature as the exhibition representative.",
  };
}

export function isGuildExhibitionCreatureEligible(save: GameSave, creature: CreatureRecord): boolean {
  const activelyInjured = typeof creature.injuredUntilDayNumber === "number"
    && creature.injuredUntilDayNumber > save.dayState.dayNumber;
  return !activelyInjured
    && creature.hearts > 0
    && creature.energy >= GUILD_EXHIBITION_ENERGY_COST;
}

export function getGuildExhibitionCandidates(save: GameSave): CreatureRecord[] {
  return (save.creatures ?? [])
    .filter((creature) => isGuildExhibitionCreatureEligible(save, creature))
    .sort((left, right) => {
      if (left.isFavorite !== right.isFavorite) return left.isFavorite ? -1 : 1;
      const leftScore = Math.max(...GUILD_EXHIBITION_DISCIPLINES.map((entry) => calculateGuildExhibitionScore(left, entry.id).total));
      const rightScore = Math.max(...GUILD_EXHIBITION_DISCIPLINES.map((entry) => calculateGuildExhibitionScore(right, entry.id).total));
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.nickname.localeCompare(right.nickname);
    });
}

export function selectGuildExhibitionRepresentative(
  save: GameSave,
  creatureId: CreatureId,
): GuildExhibitionActionResult {
  const prepared = prepareChapterThreeGuildExhibitionSave(save);
  const current = getChapterThreeGuildExhibitionState(prepared);
  if (!current.invitationRead || !["representative", "preparation"].includes(current.stage)) {
    return { save: prepared, state: current, ok: false, message: "Review the invitation before naming a representative." };
  }
  if (current.discipline) {
    return { save: prepared, state: current, ok: false, message: "The presentation plan is already locked. Enter the exhibition or reload the earlier save." };
  }
  const creature = (prepared.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (!creature || !isGuildExhibitionCreatureEligible(prepared, creature)) {
    return { save: prepared, state: current, ok: false, message: "That creature is injured, exhausted, or no longer available." };
  }
  const state = appendHistory({
    ...current,
    stage: "preparation",
    representativeId: creature.creatureId,
    representativeName: creature.nickname,
  }, `Day ${save.dayState.dayNumber}: ${creature.nickname} was named the ranch's Guild Exhibition representative.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: `${creature.nickname} selected. Choose how the ranch will prepare the presentation.`,
  };
}

export function canAffordGuildExhibitionDiscipline(save: GameSave, discipline: GuildExhibitionDiscipline): boolean {
  const definition = disciplineDefinition(discipline);
  return save.currencies.gold >= definition.goldCost
    && numberFlag(save.flags.ranchFeedStock) >= definition.feedCost;
}

export function chooseGuildExhibitionDiscipline(
  save: GameSave,
  discipline: GuildExhibitionDiscipline,
): GuildExhibitionActionResult {
  const prepared = prepareChapterThreeGuildExhibitionSave(save);
  const current = getChapterThreeGuildExhibitionState(prepared);
  if (!current.representativeId || !["preparation", "exhibition"].includes(current.stage)) {
    return { save: prepared, state: current, ok: false, message: "Select a representative before planning the presentation." };
  }
  const creature = (prepared.creatures ?? []).find((entry) => entry.creatureId === current.representativeId);
  if (!creature || !isGuildExhibitionCreatureEligible(prepared, creature)) {
    const reset = appendHistory({
      ...current,
      stage: "representative",
      representativeId: "",
      representativeName: "",
      discipline: "",
    }, `Day ${save.dayState.dayNumber}: The previous representative became unavailable before preparation was finalized.`);
    return {
      save: withState(prepared, reset),
      state: reset,
      ok: false,
      message: "The selected representative is no longer ready. Choose another creature.",
    };
  }
  const definition = disciplineDefinition(discipline);
  const state = appendHistory({
    ...current,
    stage: "exhibition",
    discipline,
  }, `Day ${save.dayState.dayNumber}: ${definition.name} was chosen for ${creature.nickname}'s presentation.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: `${definition.name} selected. The cost is charged only when the exhibition begins.`,
  };
}

export function calculateGuildExhibitionScore(
  creature: CreatureRecord,
  discipline: GuildExhibitionDiscipline,
): GuildExhibitionScoreBreakdown {
  const averageStat = STAT_KEYS.reduce((sum, stat) => sum + cappedStat(creature, stat), 0) / STAT_KEYS.length;
  const level = Math.min(18, 6 + Math.max(1, creature.level) * 2);
  const stats = Math.round(averageStat * 4.2);
  const affection = Math.round(clamp(creature.affection, 0, 100) * 0.18);
  const energyRatio = creature.maxEnergy > 0 ? clamp(creature.energy / creature.maxEnergy, 0, 1) : 0;
  const heartRatio = creature.maxHearts > 0 ? clamp(creature.hearts / creature.maxHearts, 0, 1) : 0;
  const condition = Math.round(energyRatio * 7 + heartRatio * 7);
  let disciplineScore = 0;
  if (discipline === "bond") {
    disciplineScore = Math.round(
      clamp(creature.affection, 0, 100) / 100 * 8
      + (cappedStat(creature, "CHA") + cappedStat(creature, "WIL")) / 20 * 7,
    );
  } else if (discipline === "working") {
    disciplineScore = Math.round(
      (cappedStat(creature, "STR") + cappedStat(creature, "DEX") + cappedStat(creature, "STA")) / 30 * 15,
    );
  } else {
    disciplineScore = Math.round(
      (cappedStat(creature, "CHA") + cappedStat(creature, "WIL") + cappedStat(creature, "FER")) / 30 * 15 + 2,
    );
  }
  const shiny = creature.shiny ? 3 : 0;
  const total = clamp(level + stats + affection + condition + disciplineScore + shiny, 0, 100);
  return { level, stats, affection, condition, discipline: disciplineScore, shiny, total };
}

export function canEnterGuildExhibition(save: GameSave): boolean {
  const current = getChapterThreeGuildExhibitionState(save);
  if (current.stage !== "exhibition" || !current.representativeId || !current.discipline) return false;
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === current.representativeId);
  return Boolean(creature)
    && isGuildExhibitionCreatureEligible(save, creature!)
    && canAffordGuildExhibitionDiscipline(save, current.discipline);
}

export function enterGuildExhibition(save: GameSave): GuildExhibitionActionResult {
  const prepared = prepareChapterThreeGuildExhibitionSave(save);
  const current = getChapterThreeGuildExhibitionState(prepared);
  if (current.stage !== "exhibition" || !current.representativeId || !current.discipline) {
    return { save: prepared, state: current, ok: false, message: "Choose a representative and presentation discipline first." };
  }
  if (current.rewardClaimed || current.placement) {
    return { save: prepared, state: current, ok: false, message: "This Guild Exhibition result is already recorded." };
  }
  const creature = (prepared.creatures ?? []).find((entry) => entry.creatureId === current.representativeId);
  if (!creature || !isGuildExhibitionCreatureEligible(prepared, creature)) {
    return { save: prepared, state: current, ok: false, message: "The representative needs at least 18 Energy, one Heart, and no active injury." };
  }
  if (!canAffordGuildExhibitionDiscipline(prepared, current.discipline)) {
    return { save: prepared, state: current, ok: false, message: `${disciplineDefinition(current.discipline).name} requires ${disciplineDefinition(current.discipline).costLabel}.` };
  }

  const discipline = disciplineDefinition(current.discipline);
  const scoreBreakdown = calculateGuildExhibitionScore(creature, current.discipline);
  const placement = getPlacementForScore(scoreBreakdown.total);
  const feedBefore = numberFlag(prepared.flags.ranchFeedStock);
  const materialsBefore = numberFlag(prepared.flags.ranchMaterialsStock);
  const bonusMaterials = current.discipline === "working" ? 3 : 0;
  const bonusGuildPoints = current.discipline === "pedigree" ? 1 : 0;
  const affectionGain = current.discipline === "bond" ? 5 : 2;
  const nextCreatures = (prepared.creatures ?? []).map((entry) => entry.creatureId === creature.creatureId
    ? {
        ...entry,
        energy: Math.max(0, entry.energy - GUILD_EXHIBITION_ENERGY_COST),
        affection: Math.min(100, entry.affection + affectionGain),
        xp: entry.xp + 20 + Math.floor(scoreBreakdown.total / 5),
      }
    : entry);
  const state = appendHistory({
    ...current,
    stage: "complete",
    scoreBreakdown,
    placement: placement.id,
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: ${creature.nickname} earned ${placement.name} with an exhibition score of ${scoreBreakdown.total}.`);
  const nextSave = withState({
    ...prepared,
    creatures: nextCreatures,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold - discipline.goldCost + placement.goldReward,
      guildPoints: prepared.currencies.guildPoints + placement.guildPointReward + bonusGuildPoints,
    },
    flags: {
      ...prepared.flags,
      ranchFeedStock: feedBefore - discipline.feedCost,
      ranchMaterialsStock: materialsBefore + bonusMaterials,
      chapterThreeExhibitionPlacement: placement.id,
      chapterThreeExhibitionScore: scoreBreakdown.total,
      chapterThreeExhibitionGuildGoldPercent: placement.guildGoldBonusPercent,
      chapterThreeExhibitionGuildGpBonus: placement.guildPointBonus,
      chapterThreeExhibitionCompletedDayNumber: prepared.dayState.dayNumber,
      chapterThreeExhibitionRewardGranted: true,
      chapterThreeExhibitionRepresentativeId: creature.creatureId,
      chapterThreeExhibitionDiscipline: current.discipline,
      m68ChapterThreeGuildExhibitionComplete: true,
    },
  }, state);
  return {
    save: nextSave,
    state,
    ok: true,
    message: `${creature.nickname} earned ${placement.name}: score ${scoreBreakdown.total}, +${placement.goldReward} Gold, +${placement.guildPointReward + bonusGuildPoints} Guild Points${bonusMaterials ? `, and +${bonusMaterials} Materials` : ""}. Future weekly Guild contracts gain +${placement.guildGoldBonusPercent}% Gold${placement.guildPointBonus ? ` and +${placement.guildPointBonus} GP` : ""}.`,
  };
}

export function getGuildExhibitionReputationBonus(save: GameSave): GuildExhibitionReputationBonus {
  const placementValue = String(save.flags.chapterThreeExhibitionPlacement ?? "");
  const placement = ["participant", "bronze", "silver", "gold"].includes(placementValue)
    ? placementValue as GuildExhibitionPlacement
    : "";
  return {
    placement,
    guildGoldBonusPercent: numberFlag(save.flags.chapterThreeExhibitionGuildGoldPercent),
    guildPointBonus: numberFlag(save.flags.chapterThreeExhibitionGuildGpBonus),
  };
}

export function getGuildExhibitionPlacementDefinition(placement: GuildExhibitionPlacement): GuildExhibitionPlacementDefinition {
  return placementDefinition(placement);
}

export function getChapterThreeGuildExhibitionObjective(save: GameSave): {
  title: string;
  body: string;
  hint: string;
  action: "invitation" | "representative" | "preparation" | "exhibition" | "none";
} | null {
  if (!isChapterThreeGuildExhibitionEligible(save)) return null;
  const state = getChapterThreeGuildExhibitionState(prepareChapterThreeGuildExhibitionSave(save));
  if (state.stage === "invitation") return {
    title: "A Letter with a Gold Seal",
    body: "The regional Guild has invited the ranch to present one creature before breeders, contract patrons, and registry officials.",
    hint: "The exhibition is judged, but every placement advances the story and grants a permanent reputation benefit.",
    action: "invitation",
  };
  if (state.stage === "representative") return {
    title: "Name Your Representative",
    body: "Choose one healthy creature with at least 18 Energy and one Heart. Injured creatures must recover before entering.",
    hint: "Level, stats, Affection, Energy, Hearts, preparation discipline, and shiny status contribute to the final score.",
    action: "representative",
  };
  if (state.stage === "preparation") return {
    title: "Choose a Presentation Discipline",
    body: "Decide whether the ranch will emphasize trust, practical ranch work, or pedigree and registry presentation.",
    hint: "Bond & Presence is always free. Costs are not charged until the exhibition begins.",
    action: "preparation",
  };
  if (state.stage === "exhibition") return {
    title: "Enter the Guild Exhibition",
    body: "The representative and discipline are ready. Enter to calculate and permanently record the deterministic result.",
    hint: "The representative spends 18 Energy. Reloading cannot reroll a completed placement or duplicate its rewards.",
    action: "exhibition",
  };
  return {
    title: "The Guild Exhibition Complete",
    body: "The ranch now holds a recognized regional exhibition placement and a permanent reputation advantage on weekly Guild contracts.",
    hint: "Chapter 3 will continue from this public reputation and the patrons who noticed the ranch's representative.",
    action: "none",
  };
}
