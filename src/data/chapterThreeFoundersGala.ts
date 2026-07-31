import { BUILDER_PROJECTS, isBuilderProjectBuilt } from "@/data/builderProjects";
import { getChapterThreeGuildExhibitionState } from "@/data/chapterThreeGuildExhibition";
import {
  getChapterThreePatronCircuitState,
  type PatronCircuitPatron,
} from "@/data/chapterThreePatronCircuit";
import {
  getRoseLanternState,
  ROSE_LANTERN_STATE_FLAG,
  type RoseLanternState,
} from "@/data/roseLantern";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const CHAPTER_THREE_GALA_STATE_FLAG = "chapterThreeFoundersGalaV1";
export const CHAPTER_THREE_GALA_VERSION = 1;
export const CHAPTER_THREE_GALA_ART = "/images/story/chapter-three/chapter_three_founders_gala.svg";
export const FOUNDERS_PLAZA_ART = "/images/buildings/town/founders_plaza.svg";

export type FoundersGalaStage =
  | "locked"
  | "invitation"
  | "plan"
  | "gala"
  | "waiting"
  | "report"
  | "complete";

export type FoundersGalaPlanId =
  | "registry_open_ledger"
  | "registry_patron_banquet"
  | "builder_volunteer_works"
  | "builder_showcase_pavilion"
  | "lantern_public_salon"
  | "lantern_evening_reception";

export type FoundersGalaOutcome = "community" | "celebrated" | "landmark";

export type FoundersGalaScoreBreakdown = {
  foundation: number;
  exhibition: number;
  patronStanding: number;
  representative: number;
  preparation: number;
  total: number;
};

export type FoundersGalaState = {
  version: number;
  stage: FoundersGalaStage;
  startedDayNumber: number;
  invitationRead: boolean;
  patron: PatronCircuitPatron | "";
  planId: FoundersGalaPlanId | "";
  galaDayNumber: number;
  scoreBreakdown: FoundersGalaScoreBreakdown | null;
  outcome: FoundersGalaOutcome | "";
  rewardClaimed: boolean;
  history: string[];
};

export type FoundersGalaActionResult = {
  save: GameSave;
  state: FoundersGalaState;
  ok: boolean;
  message: string;
};

export type FoundersGalaPlanDefinition = {
  id: FoundersGalaPlanId;
  patron: PatronCircuitPatron;
  name: string;
  description: string;
  costLabel: string;
  goldCost: number;
  materialsCost: number;
  rumorTokenCost: number;
  scoreBonus: number;
};

export type FoundersGalaOutcomeDefinition = {
  id: FoundersGalaOutcome;
  name: string;
  minimumScore: number;
  goldReward: number;
  guildPointReward: number;
  materialsReward: number;
  prestigeReward: number;
  representativeXp: number;
  representativeAffection: number;
};

export type FoundersGalaLegacyBonuses = {
  townPrestige: number;
  guildGoldPercent: number;
  guildPointBonus: number;
  builderDiscountPercent: number;
  hospitalityGoldBonus: number;
  hospitalityTrustBonus: number;
  hospitalityRumorBonus: number;
};

const DEFAULT_STATE: FoundersGalaState = {
  version: CHAPTER_THREE_GALA_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  invitationRead: false,
  patron: "",
  planId: "",
  galaDayNumber: 0,
  scoreBreakdown: null,
  outcome: "",
  rewardClaimed: false,
  history: [],
};

export const FOUNDERS_GALA_PLANS: readonly FoundersGalaPlanDefinition[] = [
  {
    id: "registry_open_ledger",
    patron: "registry",
    name: "Open Ledger Showcase",
    description: "Invite townsfolk to inspect the ranch registry, exhibition record, and contract history in a transparent public display.",
    costLabel: "Free",
    goldCost: 0,
    materialsCost: 0,
    rumorTokenCost: 0,
    scoreBonus: 8,
  },
  {
    id: "registry_patron_banquet",
    patron: "registry",
    name: "Patrons' Banquet",
    description: "Fund a formal banquet for contract patrons, registry officials, and town representatives.",
    costLabel: "75 Gold",
    goldCost: 75,
    materialsCost: 0,
    rumorTokenCost: 0,
    scoreBonus: 16,
  },
  {
    id: "builder_volunteer_works",
    patron: "builder",
    name: "Volunteer Works Fair",
    description: "Open Petra's plans to the public and demonstrate safe habitat construction with volunteer crews.",
    costLabel: "Free",
    goldCost: 0,
    materialsCost: 0,
    rumorTokenCost: 0,
    scoreBonus: 8,
  },
  {
    id: "builder_showcase_pavilion",
    patron: "builder",
    name: "Showcase Pavilion",
    description: "Use ranch Materials to erect a temporary pavilion featuring habitat models, security plans, and future expansion maps.",
    costLabel: "4 Materials",
    goldCost: 0,
    materialsCost: 4,
    rumorTokenCost: 0,
    scoreBonus: 16,
  },
  {
    id: "lantern_public_salon",
    patron: "lantern",
    name: "Public Salon Evening",
    description: "Host a free, public, non-intimate evening of music, introductions, and ranch storytelling under Rose Lantern house rules.",
    costLabel: "Free",
    goldCost: 0,
    materialsCost: 0,
    rumorTokenCost: 0,
    scoreBonus: 8,
  },
  {
    id: "lantern_evening_reception",
    patron: "lantern",
    name: "Lantern Reception",
    description: "Spend one Rumor Token to coordinate trusted performers, civic guests, and a stronger information network around the gala.",
    costLabel: "1 Rumor Token",
    goldCost: 0,
    materialsCost: 0,
    rumorTokenCost: 1,
    scoreBonus: 16,
  },
] as const;

export const FOUNDERS_GALA_OUTCOMES: readonly FoundersGalaOutcomeDefinition[] = [
  {
    id: "landmark",
    name: "Landmark Gala",
    minimumScore: 78,
    goldReward: 450,
    guildPointReward: 7,
    materialsReward: 8,
    prestigeReward: 20,
    representativeXp: 45,
    representativeAffection: 4,
  },
  {
    id: "celebrated",
    name: "Celebrated Gala",
    minimumScore: 60,
    goldReward: 300,
    guildPointReward: 5,
    materialsReward: 5,
    prestigeReward: 15,
    representativeXp: 30,
    representativeAffection: 3,
  },
  {
    id: "community",
    name: "Community Gala",
    minimumScore: 0,
    goldReward: 180,
    guildPointReward: 3,
    materialsReward: 3,
    prestigeReward: 10,
    representativeXp: 20,
    representativeAffection: 2,
  },
] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseScoreBreakdown(value: unknown): FoundersGalaScoreBreakdown | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FoundersGalaScoreBreakdown>;
  return {
    foundation: numberFlag(raw.foundation),
    exhibition: numberFlag(raw.exhibition),
    patronStanding: numberFlag(raw.patronStanding),
    representative: numberFlag(raw.representative),
    preparation: numberFlag(raw.preparation),
    total: numberFlag(raw.total),
  };
}

function parseState(value: boolean | number | string | undefined): FoundersGalaState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<FoundersGalaState>;
    const stage = ["locked", "invitation", "plan", "gala", "waiting", "report", "complete"].includes(String(parsed.stage))
      ? parsed.stage as FoundersGalaStage
      : "locked";
    const patron = ["registry", "builder", "lantern"].includes(String(parsed.patron))
      ? parsed.patron as PatronCircuitPatron
      : "";
    const planId = FOUNDERS_GALA_PLANS.some((plan) => plan.id === parsed.planId)
      ? parsed.planId as FoundersGalaPlanId
      : "";
    const outcome = ["community", "celebrated", "landmark"].includes(String(parsed.outcome))
      ? parsed.outcome as FoundersGalaOutcome
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_THREE_GALA_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber),
      invitationRead: parsed.invitationRead === true,
      patron,
      planId,
      galaDayNumber: numberFlag(parsed.galaDayNumber),
      scoreBreakdown: parseScoreBreakdown(parsed.scoreBreakdown),
      outcome,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 30)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: FoundersGalaState, entry: string): FoundersGalaState {
  return { ...state, history: [entry, ...state.history].slice(0, 30) };
}

function withState(save: GameSave, state: FoundersGalaState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_THREE_GALA_STATE_FLAG]: JSON.stringify(state),
      chapterThreeFoundersGalaStarted: state.stage !== "locked",
      chapterThreeFoundersGalaComplete: state.stage === "complete",
      m70ChapterThreeFoundersGala: true,
    },
  };
}

function planDefinition(planId: FoundersGalaPlanId): FoundersGalaPlanDefinition {
  return FOUNDERS_GALA_PLANS.find((plan) => plan.id === planId) ?? FOUNDERS_GALA_PLANS[0];
}

function outcomeDefinition(outcome: FoundersGalaOutcome): FoundersGalaOutcomeDefinition {
  return FOUNDERS_GALA_OUTCOMES.find((entry) => entry.id === outcome) ?? FOUNDERS_GALA_OUTCOMES.at(-1)!;
}

function outcomeForScore(score: number): FoundersGalaOutcomeDefinition {
  return FOUNDERS_GALA_OUTCOMES.find((entry) => score >= entry.minimumScore) ?? FOUNDERS_GALA_OUTCOMES.at(-1)!;
}

function getSelectedPatron(save: GameSave): PatronCircuitPatron | "" {
  const state = getChapterThreePatronCircuitState(save);
  if (state.stage === "complete" && state.patron) return state.patron;
  const flag = String(save.flags.chapterThreePatronSelected ?? "");
  return ["registry", "builder", "lantern"].includes(flag) ? flag as PatronCircuitPatron : "";
}

function completedGuildContracts(save: GameSave): number {
  return save.guild?.contracts.filter((contract) => contract.status === "completed").length ?? 0;
}

function builderStanding(save: GameSave): number {
  const built = BUILDER_PROJECTS.filter((project) => isBuilderProjectBuilt(save, project.id)).length;
  const materials = numberFlag(save.flags.ranchMaterialsStock);
  return Math.min(18, built * 3 + Math.min(6, Math.floor(materials / 5)));
}

function registryStanding(save: GameSave): number {
  return Math.min(18, Math.floor(save.currencies.guildPoints / 3) + completedGuildContracts(save) * 2);
}

function lanternStanding(save: GameSave): number {
  const state = getRoseLanternState(save);
  return Math.min(18, Math.floor(state.trust / 5) + Math.min(4, state.rumorTokens));
}

function representativeStanding(save: GameSave): number {
  const representativeId = String(save.flags.chapterThreeExhibitionRepresentativeId ?? "") as CreatureId;
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === representativeId);
  if (!creature) return 2;
  return Math.min(10, Math.floor(creature.affection / 12) + Math.floor(creature.level / 4));
}

function updateRepresentative(save: GameSave, outcome: FoundersGalaOutcomeDefinition): GameSave {
  const representativeId = String(save.flags.chapterThreeExhibitionRepresentativeId ?? "") as CreatureId;
  if (!representativeId) return save;
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) => creature.creatureId === representativeId
      ? {
          ...creature,
          xp: creature.xp + outcome.representativeXp,
          affection: Math.min(100, creature.affection + outcome.representativeAffection),
        }
      : creature),
  };
}

function writeRoseLanternState(save: GameSave, state: RoseLanternState): GameSave {
  return {
    ...save,
    flags: {
      ...save.flags,
      [ROSE_LANTERN_STATE_FLAG]: JSON.stringify(state),
    },
  };
}

function deductPlanCost(save: GameSave, plan: FoundersGalaPlanDefinition): GameSave {
  const materials = numberFlag(save.flags.ranchMaterialsStock);
  let nextSave: GameSave = {
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold - plan.goldCost,
    },
    flags: {
      ...save.flags,
      ranchMaterialsStock: materials - plan.materialsCost,
    },
  };
  if (plan.rumorTokenCost > 0) {
    const lantern = getRoseLanternState(nextSave);
    nextSave = writeRoseLanternState(nextSave, {
      ...lantern,
      rumorTokens: Math.max(0, lantern.rumorTokens - plan.rumorTokenCost),
      history: [
        `Day ${save.dayState.dayNumber}: ${plan.rumorTokenCost} Rumor Token spent preparing the Founders' Gala.`,
        ...lantern.history,
      ].slice(0, 20),
    });
  }
  return nextSave;
}

export function getChapterThreeFoundersGalaState(save: GameSave): FoundersGalaState {
  return parseState(save.flags[CHAPTER_THREE_GALA_STATE_FLAG]);
}

export function isChapterThreeFoundersGalaEligible(save: GameSave): boolean {
  return getChapterThreePatronCircuitState(save).stage === "complete"
    && save.flags.chapterThreeFoundersGalaSkipped !== true;
}

export function prepareChapterThreeFoundersGalaSave(save: GameSave): GameSave {
  if (!isChapterThreeFoundersGalaEligible(save)) return save;
  const current = getChapterThreeFoundersGalaState(save);
  if (current.stage === "locked") {
    const patron = getSelectedPatron(save);
    if (!patron) return save;
    const state = appendHistory({
      ...current,
      stage: "invitation",
      patron,
      startedDayNumber: save.dayState.dayNumber,
    }, `Day ${save.dayState.dayNumber}: Founders' Plaza invited the ranch and its patron to host the season's closing gala.`);
    return withState(save, state);
  }
  if (current.stage === "waiting" && current.galaDayNumber > 0 && save.dayState.dayNumber > current.galaDayNumber) {
    const state = appendHistory({ ...current, stage: "report" },
      `Day ${save.dayState.dayNumber}: The town council delivered the final Founders' Gala assessment.`);
    return withState(save, state);
  }
  return save;
}

export function reviewFoundersGalaInvitation(save: GameSave): FoundersGalaActionResult {
  const prepared = prepareChapterThreeFoundersGalaSave(save);
  const current = getChapterThreeFoundersGalaState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Complete The Patron Circuit before opening the gala invitation." };
  }
  if (current.invitationRead) {
    return { save: prepared, state: current, ok: true, message: "The Founders' Gala invitation is already reviewed." };
  }
  const state = appendHistory({ ...current, stage: "plan", invitationRead: true },
    `Day ${save.dayState.dayNumber}: The ranch accepted the Founders' Plaza invitation and reviewed its patron-specific plans.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "Choose a free community plan or invest in a stronger gala presentation.",
  };
}

export function getFoundersGalaPlansForSave(save: GameSave): FoundersGalaPlanDefinition[] {
  const patron = getChapterThreeFoundersGalaState(prepareChapterThreeFoundersGalaSave(save)).patron || getSelectedPatron(save);
  return FOUNDERS_GALA_PLANS.filter((plan) => plan.patron === patron);
}

export function canAffordFoundersGalaPlan(save: GameSave, planId: FoundersGalaPlanId): boolean {
  const plan = planDefinition(planId);
  const lantern = getRoseLanternState(save);
  return save.currencies.gold >= plan.goldCost
    && numberFlag(save.flags.ranchMaterialsStock) >= plan.materialsCost
    && lantern.rumorTokens >= plan.rumorTokenCost;
}

export function chooseFoundersGalaPlan(save: GameSave, planId: FoundersGalaPlanId): FoundersGalaActionResult {
  const prepared = prepareChapterThreeFoundersGalaSave(save);
  const current = getChapterThreeFoundersGalaState(prepared);
  const plan = planDefinition(planId);
  if (current.stage !== "plan" || !current.patron) {
    return { save: prepared, state: current, ok: false, message: "Review the invitation before choosing a gala plan." };
  }
  if (plan.patron !== current.patron) {
    return { save: prepared, state: current, ok: false, message: "That gala plan belongs to a different patron route." };
  }
  const state = appendHistory({ ...current, stage: "gala", planId },
    `Day ${save.dayState.dayNumber}: ${plan.name} was selected for the Founders' Gala.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: `${plan.name} selected. ${plan.costLabel} is charged only when the gala begins.`,
  };
}

export function calculateFoundersGalaScore(save: GameSave, planId: FoundersGalaPlanId): FoundersGalaScoreBreakdown {
  const patron = getSelectedPatron(save);
  const plan = planDefinition(planId);
  const exhibition = getChapterThreeGuildExhibitionState(save);
  const exhibitionScore = exhibition.scoreBreakdown?.total ?? numberFlag(save.flags.chapterThreeExhibitionScore);
  const foundation = 34;
  const exhibitionContribution = Math.min(24, Math.floor(exhibitionScore * 0.24));
  const patronStanding = patron === "registry"
    ? registryStanding(save)
    : patron === "builder"
      ? builderStanding(save)
      : lanternStanding(save);
  const representative = representativeStanding(save);
  const preparation = plan.scoreBonus;
  const total = clamp(foundation + exhibitionContribution + patronStanding + representative + preparation, 0, 100);
  return {
    foundation,
    exhibition: exhibitionContribution,
    patronStanding,
    representative,
    preparation,
    total,
  };
}

export function canHostFoundersGala(save: GameSave): boolean {
  const current = getChapterThreeFoundersGalaState(save);
  if (current.stage !== "gala" || !current.planId || !current.patron) return false;
  const plan = planDefinition(current.planId);
  if (plan.patron !== current.patron) return false;
  if (current.patron === "lantern" && !getRoseLanternState(save).houseRulesAccepted) return false;
  return canAffordFoundersGalaPlan(save, current.planId);
}

export function hostFoundersGala(save: GameSave): FoundersGalaActionResult {
  const prepared = prepareChapterThreeFoundersGalaSave(save);
  const current = getChapterThreeFoundersGalaState(prepared);
  if (current.stage !== "gala" || !current.planId || !current.patron) {
    return { save: prepared, state: current, ok: false, message: "Choose a patron-specific gala plan first." };
  }
  if (current.scoreBreakdown || current.outcome) {
    return { save: prepared, state: current, ok: false, message: "This Founders' Gala result is already recorded." };
  }
  if (current.patron === "lantern" && !getRoseLanternState(prepared).houseRulesAccepted) {
    return {
      save: prepared,
      state: current,
      ok: false,
      message: "Acknowledge the Rose Lantern's adult, optional, consent-first house rules before hosting its public reception.",
    };
  }
  if (!canAffordFoundersGalaPlan(prepared, current.planId)) {
    return { save: prepared, state: current, ok: false, message: `${planDefinition(current.planId).name} requires ${planDefinition(current.planId).costLabel}.` };
  }
  const plan = planDefinition(current.planId);
  const scoreBreakdown = calculateFoundersGalaScore(prepared, current.planId);
  const outcome = outcomeForScore(scoreBreakdown.total);
  const charged = deductPlanCost(prepared, plan);
  const state = appendHistory({
    ...current,
    stage: "waiting",
    galaDayNumber: save.dayState.dayNumber,
    scoreBreakdown,
    outcome: outcome.id,
  }, `Day ${save.dayState.dayNumber}: ${plan.name} earned ${outcome.name} with a deterministic score of ${scoreBreakdown.total}.`);
  return {
    save: withState(charged, state),
    state,
    ok: true,
    message: `${outcome.name} recorded at score ${scoreBreakdown.total}. The council's final report arrives next Ranch Day.`,
  };
}

export function finalizeFoundersGala(save: GameSave): FoundersGalaActionResult {
  const prepared = prepareChapterThreeFoundersGalaSave(save);
  const current = getChapterThreeFoundersGalaState(prepared);
  if (current.stage !== "report" || !current.outcome || !current.patron || !current.scoreBreakdown) {
    return { save: prepared, state: current, ok: false, message: "Host the gala and advance to the next Ranch Day before reading the council report." };
  }
  if (current.rewardClaimed) {
    return { save: prepared, state: current, ok: false, message: "The Founders' Gala legacy and rewards are already recorded." };
  }
  const outcome = outcomeDefinition(current.outcome);
  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  const sharedGuildGold = 2;
  const sharedBuilderDiscount = 3;
  const sharedHospitalityGold = 5;
  const routeGuildGold = current.patron === "registry" ? 3 : 0;
  const routeGuildPoints = current.patron === "registry" ? 1 : 0;
  const routeBuilderDiscount = current.patron === "builder" ? 5 : 0;
  const routeHospitalityGold = current.patron === "lantern" ? 5 : 0;
  const routeHospitalityTrust = current.patron === "lantern" ? 1 : 0;
  const routeHospitalityRumor = current.patron === "lantern" ? 1 : 0;

  let nextSave: GameSave = {
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold + outcome.goldReward,
      guildPoints: prepared.currencies.guildPoints + outcome.guildPointReward,
    },
    flags: {
      ...prepared.flags,
      ranchMaterialsStock: materials + outcome.materialsReward,
      townPrestige: numberFlag(prepared.flags.townPrestige) + outcome.prestigeReward,
      chapterThreeGalaGuildGoldPercent: sharedGuildGold + routeGuildGold,
      chapterThreeGalaGuildGpBonus: routeGuildPoints,
      chapterThreeGalaGuildAppliedWeek: 0,
      chapterThreeGalaBuilderDiscountPercent: sharedBuilderDiscount + routeBuilderDiscount,
      chapterThreeGalaHospitalityGoldBonus: sharedHospitalityGold + routeHospitalityGold,
      chapterThreeGalaHospitalityTrustBonus: routeHospitalityTrust,
      chapterThreeGalaHospitalityRumorBonus: routeHospitalityRumor,
      chapterThreeFoundersGalaOutcome: current.outcome,
      chapterThreeFoundersGalaScore: current.scoreBreakdown.total,
      chapterThreeFoundersGalaRewardGranted: true,
      chapterThreeFoundersGalaCompletedDayNumber: prepared.dayState.dayNumber,
      m70ChapterThreeFoundersGalaComplete: true,
    },
  };
  nextSave = updateRepresentative(nextSave, outcome);
  const state = appendHistory({
    ...current,
    stage: "complete",
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: ${outcome.name} became a permanent Founders' Plaza legacy for the ranch.`);
  return {
    save: withState(nextSave, state),
    state,
    ok: true,
    message: `${outcome.name} finalized: +${outcome.goldReward} Gold, +${outcome.guildPointReward} Guild Points, +${outcome.materialsReward} Materials, and +${outcome.prestigeReward} Town Prestige.`,
  };
}

export function getFoundersGalaLegacyBonuses(save: GameSave): FoundersGalaLegacyBonuses {
  return {
    townPrestige: numberFlag(save.flags.townPrestige),
    guildGoldPercent: numberFlag(save.flags.chapterThreeGalaGuildGoldPercent),
    guildPointBonus: numberFlag(save.flags.chapterThreeGalaGuildGpBonus),
    builderDiscountPercent: numberFlag(save.flags.chapterThreeGalaBuilderDiscountPercent),
    hospitalityGoldBonus: numberFlag(save.flags.chapterThreeGalaHospitalityGoldBonus),
    hospitalityTrustBonus: numberFlag(save.flags.chapterThreeGalaHospitalityTrustBonus),
    hospitalityRumorBonus: numberFlag(save.flags.chapterThreeGalaHospitalityRumorBonus),
  };
}

export function getFoundersGalaOutcomeDefinition(outcome: FoundersGalaOutcome): FoundersGalaOutcomeDefinition {
  return outcomeDefinition(outcome);
}

export function getChapterThreeFoundersGalaObjective(save: GameSave): {
  title: string;
  body: string;
  hint: string;
  action: "invitation" | "plan" | "gala" | "waiting" | "report" | "none";
} | null {
  if (!isChapterThreeFoundersGalaEligible(save)) return null;
  const state = getChapterThreeFoundersGalaState(prepareChapterThreeFoundersGalaSave(save));
  if (state.stage === "invitation") return {
    title: "Founders' Plaza Calls",
    body: "The town has invited the ranch and its formal patron to host the season's closing public gala.",
    hint: "Every patron route has a free plan, so the chapter cannot become resource-locked.",
    action: "invitation",
  };
  if (state.stage === "plan") return {
    title: "Choose the Gala Plan",
    body: "Select a patron-specific public format. Paid plans improve the deterministic result but are never required.",
    hint: "Plan costs are charged only when the gala begins.",
    action: "plan",
  };
  if (state.stage === "gala") return {
    title: "Open Founders' Plaza",
    body: "The plaza, patron, and ranch representative are ready. Host the event to record its permanent score and outcome.",
    hint: "The result uses existing progression and cannot be rerolled after it is recorded.",
    action: "gala",
  };
  if (state.stage === "waiting") return {
    title: "Await the Council Report",
    body: "The gala is complete. End the current Ranch Day to receive the final civic assessment.",
    hint: "The saved score and outcome will not change when the report arrives.",
    action: "waiting",
  };
  if (state.stage === "report") return {
    title: "Read the Founders' Report",
    body: "The council has prepared the gala reward, Town Prestige award, and permanent cross-town legacy.",
    hint: "The shared legacy improves Guild, Builder, and Rose Lantern systems; the selected patron receives the strongest route bonus.",
    action: "report",
  };
  return {
    title: "A Founders' Plaza Legacy",
    body: "Chapter 3 is complete. The ranch's public standing now improves contracts, construction, and optional hospitality work.",
    hint: "Town Prestige and all legacy bonuses remain saved permanently.",
    action: "none",
  };
}
