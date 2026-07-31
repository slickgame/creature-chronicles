import { getChapterThreeGuildExhibitionState } from "@/data/chapterThreeGuildExhibition";
import { getRoseLanternState, ROSE_LANTERN_STATE_FLAG } from "@/data/roseLantern";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const CHAPTER_THREE_PATRON_STATE_FLAG = "chapterThreePatronCircuitV1";
export const CHAPTER_THREE_PATRON_VERSION = 1;
export const CHAPTER_THREE_PATRON_ART = "/images/story/chapter-three/chapter_three_patron_circuit.svg";

export type PatronCircuitStage =
  | "locked"
  | "invitations"
  | "patron"
  | "assignment"
  | "waiting"
  | "report"
  | "complete";

export type PatronCircuitPatron = "registry" | "builder" | "lantern";

export type PatronCircuitState = {
  version: number;
  stage: PatronCircuitStage;
  startedDayNumber: number;
  invitationsRead: boolean;
  patron: PatronCircuitPatron | "";
  assignmentCompleted: boolean;
  assignmentDayNumber: number;
  reportRead: boolean;
  rewardClaimed: boolean;
  history: string[];
};

export type PatronCircuitActionResult = {
  save: GameSave;
  state: PatronCircuitState;
  ok: boolean;
  message: string;
};

export type PatronCircuitDefinition = {
  id: PatronCircuitPatron;
  name: string;
  host: string;
  location: string;
  invitation: string;
  assignment: string;
  permanentEffect: string;
};

export type PatronCircuitBonuses = {
  guildGoldPercent: number;
  guildPointBonus: number;
  builderDiscountPercent: number;
  hospitalityGoldBonus: number;
  hospitalityTrustBonus: number;
  hospitalityRumorBonus: number;
};

const DEFAULT_STATE: PatronCircuitState = {
  version: CHAPTER_THREE_PATRON_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  invitationsRead: false,
  patron: "",
  assignmentCompleted: false,
  assignmentDayNumber: 0,
  reportRead: false,
  rewardClaimed: false,
  history: [],
};

export const PATRON_CIRCUIT_DEFINITIONS: readonly PatronCircuitDefinition[] = [
  {
    id: "registry",
    name: "Registry Sponsorship",
    host: "Registrar Elowen Vale",
    location: "Regional Guild Registry",
    invitation: "Turn the exhibition placement into a formal registry endorsement and help audit the next contract ledger.",
    assignment: "Review placement records and verify one season of contract classifications. No creature is donated or transferred.",
    permanentEffect: "+4% Gold and +1 Guild Point on unfinished current and future weekly Guild contracts.",
  },
  {
    id: "builder",
    name: "Petra's Works Charter",
    host: "Petra Hale",
    location: "Builder's Yard",
    invitation: "Use the exhibition attention to establish the ranch as Petra's preferred expansion demonstration site.",
    assignment: "Survey future habitat pads, review crew access, and approve a reusable construction plan.",
    permanentEffect: "10% lower Gold and Materials costs on every future unbuilt Builder's Yard project.",
  },
  {
    id: "lantern",
    name: "Rose Lantern Hospitality Charter",
    host: "Madam Selene Vale",
    location: "The Rose Lantern",
    invitation: "Host a public, consent-first reception where patrons can meet the ranch representative and hear its story.",
    assignment: "Acknowledge the adult house rules, then coordinate a non-intimate hospitality reception. Romantic or sexual participation is never required.",
    permanentEffect: "+10 Gold, +1 House Trust, and +1 Rumor Token from every future hospitality shift.",
  },
] as const;

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseState(value: boolean | number | string | undefined): PatronCircuitState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<PatronCircuitState>;
    const stage = ["locked", "invitations", "patron", "assignment", "waiting", "report", "complete"].includes(String(parsed.stage))
      ? parsed.stage as PatronCircuitStage
      : "locked";
    const patron = ["registry", "builder", "lantern"].includes(String(parsed.patron))
      ? parsed.patron as PatronCircuitPatron
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_THREE_PATRON_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber),
      invitationsRead: parsed.invitationsRead === true,
      patron,
      assignmentCompleted: parsed.assignmentCompleted === true,
      assignmentDayNumber: numberFlag(parsed.assignmentDayNumber),
      reportRead: parsed.reportRead === true,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 30)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: PatronCircuitState, entry: string): PatronCircuitState {
  return { ...state, history: [entry, ...state.history].slice(0, 30) };
}

function withState(save: GameSave, state: PatronCircuitState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_THREE_PATRON_STATE_FLAG]: JSON.stringify(state),
      chapterThreePatronCircuitStarted: state.stage !== "locked",
      chapterThreePatronCircuitComplete: state.stage === "complete",
      m69ChapterThreePatronCircuit: true,
    },
  };
}

function patronDefinition(patron: PatronCircuitPatron): PatronCircuitDefinition {
  return PATRON_CIRCUIT_DEFINITIONS.find((entry) => entry.id === patron) ?? PATRON_CIRCUIT_DEFINITIONS[0];
}

function updateRepresentative(save: GameSave): GameSave {
  const representativeId = String(save.flags.chapterThreeExhibitionRepresentativeId ?? "") as CreatureId;
  if (!representativeId) return save;
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) => creature.creatureId === representativeId
      ? {
          ...creature,
          xp: creature.xp + 15,
          affection: Math.min(100, creature.affection + 2),
        }
      : creature),
  };
}

function grantRoseLanternCharter(save: GameSave): GameSave {
  const current = getRoseLanternState(save);
  const state = {
    ...current,
    trust: Math.min(100, current.trust + 5),
    rumorTokens: current.rumorTokens + 2,
    history: [
      `Day ${save.dayState.dayNumber}: The Rose Lantern Hospitality Charter was signed; +5 House Trust and +2 Rumor Tokens.`,
      ...current.history,
    ].slice(0, 20),
  };
  return {
    ...save,
    flags: {
      ...save.flags,
      [ROSE_LANTERN_STATE_FLAG]: JSON.stringify(state),
    },
  };
}

export function getChapterThreePatronCircuitState(save: GameSave): PatronCircuitState {
  return parseState(save.flags[CHAPTER_THREE_PATRON_STATE_FLAG]);
}

export function isChapterThreePatronCircuitEligible(save: GameSave): boolean {
  return getChapterThreeGuildExhibitionState(save).stage === "complete"
    && save.flags.chapterThreePatronCircuitSkipped !== true;
}

export function prepareChapterThreePatronCircuitSave(save: GameSave): GameSave {
  if (!isChapterThreePatronCircuitEligible(save)) return save;
  const current = getChapterThreePatronCircuitState(save);
  if (current.stage === "locked") {
    const state = appendHistory({
      ...current,
      stage: "invitations",
      startedDayNumber: save.dayState.dayNumber,
    }, `Day ${save.dayState.dayNumber}: Three patrons sent formal offers after the Guild Exhibition.`);
    return withState(save, state);
  }
  if (
    current.stage === "waiting"
    && current.assignmentCompleted
    && save.dayState.dayNumber > current.assignmentDayNumber
  ) {
    const state = appendHistory({ ...current, stage: "report" },
      `Day ${save.dayState.dayNumber}: The patron's final charter arrived for signature.`);
    return withState(save, state);
  }
  return save;
}

export function reviewPatronInvitations(save: GameSave): PatronCircuitActionResult {
  const prepared = prepareChapterThreePatronCircuitSave(save);
  const current = getChapterThreePatronCircuitState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Complete The Guild Exhibition before reviewing patron offers." };
  }
  if (current.invitationsRead) {
    return { save: prepared, state: current, ok: true, message: "The three patron invitations are already reviewed." };
  }
  const state = appendHistory({ ...current, stage: "patron", invitationsRead: true },
    `Day ${save.dayState.dayNumber}: The ranch reviewed offers from the Registry, Petra Hale, and the Rose Lantern.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "Choose the patron whose charter best fits the ranch's future.",
  };
}

export function choosePatronCircuitPatron(
  save: GameSave,
  patron: PatronCircuitPatron,
): PatronCircuitActionResult {
  const prepared = prepareChapterThreePatronCircuitSave(save);
  const current = getChapterThreePatronCircuitState(prepared);
  if (!current.invitationsRead || current.stage !== "patron") {
    return { save: prepared, state: current, ok: false, message: "Review all three invitations before selecting a sponsor." };
  }
  const definition = patronDefinition(patron);
  const state = appendHistory({ ...current, stage: "assignment", patron },
    `Day ${save.dayState.dayNumber}: ${definition.name} was selected as the ranch's formal patron route.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: `${definition.host} is ready to begin ${definition.assignment.toLowerCase()}`,
  };
}

export function completePatronCircuitAssignment(save: GameSave): PatronCircuitActionResult {
  const prepared = prepareChapterThreePatronCircuitSave(save);
  const current = getChapterThreePatronCircuitState(prepared);
  if (current.stage !== "assignment" || !current.patron) {
    return { save: prepared, state: current, ok: false, message: "Select a patron before completing an assignment." };
  }
  if (current.patron === "lantern" && !getRoseLanternState(prepared).houseRulesAccepted) {
    return {
      save: prepared,
      state: current,
      ok: false,
      message: "Acknowledge the Rose Lantern's adult, optional, consent-first house rules before hosting the public reception.",
    };
  }
  const definition = patronDefinition(current.patron);
  const state = appendHistory({
    ...current,
    stage: "waiting",
    assignmentCompleted: true,
    assignmentDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: ${definition.assignment}`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: `${definition.host} will deliver the permanent charter on the next Ranch Day.`,
  };
}

export function finalizePatronCircuit(save: GameSave): PatronCircuitActionResult {
  const prepared = prepareChapterThreePatronCircuitSave(save);
  const current = getChapterThreePatronCircuitState(prepared);
  if (current.stage !== "report" || !current.patron || !current.assignmentCompleted) {
    return { save: prepared, state: current, ok: false, message: "Complete the patron assignment and advance to the next Ranch Day first." };
  }
  if (current.rewardClaimed) {
    return { save: prepared, state: current, ok: false, message: "The Patron Circuit reward and charter are already recorded." };
  }

  const definition = patronDefinition(current.patron);
  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  let nextSave: GameSave = {
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold + 175,
      guildPoints: prepared.currencies.guildPoints + 3,
    },
    flags: {
      ...prepared.flags,
      chapterThreePatronSelected: current.patron,
      chapterThreePatronRewardGranted: true,
      chapterThreePatronCompletedDayNumber: prepared.dayState.dayNumber,
      m69ChapterThreePatronCircuitComplete: true,
    },
  };

  if (current.patron === "registry") {
    nextSave = {
      ...nextSave,
      flags: {
        ...nextSave.flags,
        chapterThreePatronGuildGoldPercent: 4,
        chapterThreePatronGuildGpBonus: 1,
        chapterThreePatronGuildAppliedWeek: 0,
      },
    };
  } else if (current.patron === "builder") {
    nextSave = {
      ...nextSave,
      flags: {
        ...nextSave.flags,
        ranchMaterialsStock: materials + 4,
        chapterThreePatronBuilderDiscountPercent: 10,
      },
    };
  } else {
    nextSave = grantRoseLanternCharter({
      ...nextSave,
      flags: {
        ...nextSave.flags,
        chapterThreePatronHospitalityGoldBonus: 10,
        chapterThreePatronHospitalityTrustBonus: 1,
        chapterThreePatronHospitalityRumorBonus: 1,
      },
    });
  }

  nextSave = updateRepresentative(nextSave);
  const state = appendHistory({
    ...current,
    stage: "complete",
    reportRead: true,
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: ${definition.name} became the ranch's permanent patron charter.`);
  return {
    save: withState(nextSave, state),
    state,
    ok: true,
    message: `${definition.name} signed: +175 Gold, +3 Guild Points, and ${definition.permanentEffect}`,
  };
}

export function getPatronCircuitBonuses(save: GameSave): PatronCircuitBonuses {
  return {
    guildGoldPercent: numberFlag(save.flags.chapterThreePatronGuildGoldPercent),
    guildPointBonus: numberFlag(save.flags.chapterThreePatronGuildGpBonus),
    builderDiscountPercent: numberFlag(save.flags.chapterThreePatronBuilderDiscountPercent),
    hospitalityGoldBonus: numberFlag(save.flags.chapterThreePatronHospitalityGoldBonus),
    hospitalityTrustBonus: numberFlag(save.flags.chapterThreePatronHospitalityTrustBonus),
    hospitalityRumorBonus: numberFlag(save.flags.chapterThreePatronHospitalityRumorBonus),
  };
}

export function getChapterThreePatronCircuitObjective(save: GameSave): {
  title: string;
  body: string;
  hint: string;
  action: "invitations" | "patron" | "assignment" | "waiting" | "report" | "none";
} | null {
  if (!isChapterThreePatronCircuitEligible(save)) return null;
  const state = getChapterThreePatronCircuitState(prepareChapterThreePatronCircuitSave(save));
  if (state.stage === "invitations") return {
    title: "Three Seals at the Gate",
    body: "The exhibition drew offers from the Registry, Petra Hale, and the Rose Lantern. Review what each patron expects and provides.",
    hint: "All routes remain optional town systems afterward. This choice only determines the ranch's formal sponsor bonus.",
    action: "invitations",
  };
  if (state.stage === "patron") return {
    title: "Choose a Formal Sponsor",
    body: "Select the charter that best matches the ranch's preferred future: Guild contracts, construction, or hospitality and information.",
    hint: "The choice is permanent, but it never blocks ordinary access to the other two locations.",
    action: "patron",
  };
  if (state.stage === "assignment") return {
    title: state.patron ? patronDefinition(state.patron).assignment : "Complete the Patron Assignment",
    body: state.patron ? patronDefinition(state.patron).invitation : "Complete the selected sponsor's public assignment.",
    hint: state.patron === "lantern"
      ? "The Rose Lantern route requires explicit house-rule acknowledgment. The reception is non-intimate and participation remains optional."
      : "The assignment removes no creatures and has no failure state.",
    action: "assignment",
  };
  if (state.stage === "waiting") return {
    title: "Await the Final Charter",
    body: "The patron is preparing the permanent agreement after reviewing the completed assignment.",
    hint: "Advance to the next Ranch Day. The result is saved and cannot be rerolled.",
    action: "waiting",
  };
  if (state.stage === "report") return {
    title: "Sign the Patron Charter",
    body: "The permanent agreement is ready. Read the final report and record the sponsor bonus.",
    hint: "The base reward and route bonus are granted once.",
    action: "report",
  };
  return {
    title: "The Patron Circuit Complete",
    body: "The ranch now has a permanent formal sponsor and a lasting benefit tied to that relationship.",
    hint: "Chapter 3 can continue from this charter without removing access to the other town systems.",
    action: "none",
  };
}

export function getPatronCircuitDefinition(patron: PatronCircuitPatron): PatronCircuitDefinition {
  return patronDefinition(patron);
}
