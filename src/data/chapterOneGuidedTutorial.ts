import { getColiseumProgress } from "@/data/coliseum";
import type { GameSave } from "@/types/save";

export const CHAPTER_ONE_GUIDED_VERSION = 1;
export const QUICKHATCH_CATALYST_STOCK_FLAG = "chapterOneQuickhatchCatalystStock";

export type ChapterOneTutorialSignal =
  | "morning-opened"
  | "day-two-brief-opened"
  | "inventory-opened"
  | "battle-outfitter-opened";

export type ChapterOneTutorialAction =
  | "none"
  | "ranch"
  | "chores"
  | "town"
  | "guild"
  | "breeding"
  | "inventory"
  | "battle-outfitter"
  | "coliseum";

export type ChapterOneTutorialStep = {
  id: string;
  dayLabel: string;
  title: string;
  body: string;
  hint: string;
  action: ChapterOneTutorialAction;
  actionLabel: string;
  targetId?: string;
  lockToTarget?: boolean;
};

export type ChapterOneTutorialProgress = {
  choresAssigned: boolean;
  secondChoreAssigned: boolean;
  firstNightResolved: boolean;
  resourceProblemSolved: boolean;
  guildRequestCompleted: boolean;
  breedingAttempted: boolean;
  pregnancyCreated: boolean;
  eggAvailable: boolean;
  quickhatchUsed: boolean;
  battleOutfitterOpened: boolean;
  firstBattleWon: boolean;
  complete: boolean;
};

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function assignmentCount(save: GameSave): number {
  return Object.values(save.ranchJobs?.assignments ?? {}).reduce(
    (total, assignment) => total + (Array.isArray(assignment) ? assignment.length : 0),
    0,
  );
}

function hasSecurityAssignment(save: GameSave): boolean {
  const security = save.ranchJobs?.assignments?.security_patrol;
  return (Array.isArray(security) && security.length > 0) || flagNumber(save.flags.ranchSecurityScoreToday) > 0;
}

function hasResolvedFirstNight(save: GameSave): boolean {
  return Boolean(save.flags.m14RanchJobsProcessed) ||
    flagNumber(save.flags.ranchFeedProducedToday) > 0 ||
    flagNumber(save.flags.ranchSecurityScoreToday) > 0 ||
    flagNumber(save.flags.ranchMaterialsProducedToday) > 0 ||
    save.dayState.dayNumber > 1;
}

function hasSolvedResourceProblem(save: GameSave): boolean {
  return Boolean(save.flags.chapterOneGuidedResourceDecisionMade) ||
    flagNumber(save.flags.ranchFeedProducedToday) > 0 ||
    flagNumber(save.flags.ranchMaterialsProducedToday) > 0 ||
    Boolean(save.flags.m14FieldHaulingMaterials) ||
    Boolean(save.flags.ranchManualRepairUsed) ||
    flagNumber(save.flags.ranchDamageRepairedToday) > 0;
}

function hasCompletedGuildRequest(save: GameSave): boolean {
  return Boolean(save.flags.m7GuildContractCompleted) || (save.guild?.completedCount ?? 0) > 0;
}

function hasBreedingAttempt(save: GameSave): boolean {
  return Boolean(save.flags.m4BreedingAttempted) || (save.breeding?.attempts.length ?? 0) > 0;
}

function hasPregnancy(save: GameSave): boolean {
  return Boolean(save.flags.m5PregnancyCreated) || (save.pregnancies ?? []).length > 0;
}

function hasEgg(save: GameSave): boolean {
  return (save.eggs ?? []).some((egg) => egg.status !== "hatched") || flagNumber(save.flags.m9TotalHatched) > 0;
}

function hasWonBattle(save: GameSave): boolean {
  return getColiseumProgress(save).totalWins > 0 ||
    Boolean(save.flags.chapterOneFirstBattleWon) ||
    Boolean(save.flags.m62FirstBattleWon);
}

export function getChapterOneTutorialProgress(save: GameSave): ChapterOneTutorialProgress {
  const choresAssigned = hasSecurityAssignment(save);
  const secondChoreAssigned = assignmentCount(save) >= 2 || hasResolvedFirstNight(save);
  const firstNightResolved = hasResolvedFirstNight(save);
  const resourceProblemSolved = hasSolvedResourceProblem(save);
  const guildRequestCompleted = hasCompletedGuildRequest(save);
  const breedingAttempted = hasBreedingAttempt(save);
  const pregnancyCreated = hasPregnancy(save);
  const eggAvailable = hasEgg(save);
  const quickhatchUsed = Boolean(save.flags.chapterOneQuickhatchCatalystUsed) || flagNumber(save.flags.m9TotalHatched) > 0;
  const battleOutfitterOpened = Boolean(save.flags.chapterOneGuidedBattleOutfitterOpened);
  const firstBattleWon = hasWonBattle(save);
  const complete = choresAssigned &&
    secondChoreAssigned &&
    firstNightResolved &&
    resourceProblemSolved &&
    guildRequestCompleted &&
    breedingAttempted &&
    pregnancyCreated &&
    eggAvailable &&
    quickhatchUsed &&
    battleOutfitterOpened &&
    firstBattleWon;
  return {
    choresAssigned,
    secondChoreAssigned,
    firstNightResolved,
    resourceProblemSolved,
    guildRequestCompleted,
    breedingAttempted,
    pregnancyCreated,
    eggAvailable,
    quickhatchUsed,
    battleOutfitterOpened,
    firstBattleWon,
    complete,
  };
}

export function isChapterOneGuidedTutorialActive(save: GameSave): boolean {
  if (save.flags.chapterOneGuidedReplay === true) return true;
  if (save.flags.chapterOneGuidedSkipped === true || save.flags.chapterOneGuidedComplete === true) return false;
  if (save.flags.m24ChapterOneStoryComplete === true) return false;
  return true;
}

export function prepareChapterOneGuidedTutorialSave(save: GameSave): GameSave {
  if (!isChapterOneGuidedTutorialActive(save)) return save;
  const progress = getChapterOneTutorialProgress(save);
  const activeEgg = (save.eggs ?? []).find((egg) => egg.status !== "hatched");
  const catalystAlreadyGranted = Boolean(save.flags.chapterOneQuickhatchCatalystGranted);
  const shouldGrantCatalyst = Boolean(activeEgg && !progress.quickhatchUsed && !catalystAlreadyGranted);
  const shouldComplete = progress.complete && save.flags.chapterOneGuidedComplete !== true;
  const versionMissing = flagNumber(save.flags.chapterOneGuidedVersion) < CHAPTER_ONE_GUIDED_VERSION;
  if (!shouldGrantCatalyst && !shouldComplete && !versionMissing) return save;
  return {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedVersion: CHAPTER_ONE_GUIDED_VERSION,
      ...(shouldGrantCatalyst ? {
        [QUICKHATCH_CATALYST_STOCK_FLAG]: 1,
        chapterOneQuickhatchCatalystGranted: true,
        chapterOneQuickhatchTargetEggId: String(activeEgg?.eggId ?? ""),
      } : {}),
      ...(shouldComplete ? {
        chapterOneGuidedComplete: true,
        chapterOneGuidedReplay: false,
        m15ChapterOneOnboardingComplete: true,
      } : {}),
    },
  };
}

export function markChapterOneTutorialSignal(save: GameSave, signal: ChapterOneTutorialSignal): GameSave {
  const flagBySignal: Record<ChapterOneTutorialSignal, string> = {
    "morning-opened": "chapterOneGuidedMorningOpened",
    "day-two-brief-opened": "chapterOneGuidedDayTwoBriefOpened",
    "inventory-opened": "chapterOneGuidedInventoryOpened",
    "battle-outfitter-opened": "chapterOneGuidedBattleOutfitterOpened",
  };
  const flag = flagBySignal[signal];
  if (save.flags[flag] === true) return save;
  return {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedVersion: CHAPTER_ONE_GUIDED_VERSION,
      [flag]: true,
    },
  };
}

export function skipChapterOneGuidedTutorial(save: GameSave): GameSave {
  return {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedVersion: CHAPTER_ONE_GUIDED_VERSION,
      chapterOneGuidedSkipped: true,
      chapterOneGuidedReplay: false,
    },
  };
}

export function replayChapterOneGuidedTutorial(save: GameSave): GameSave {
  return {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedVersion: CHAPTER_ONE_GUIDED_VERSION,
      chapterOneGuidedSkipped: false,
      chapterOneGuidedComplete: false,
      chapterOneGuidedReplay: true,
      chapterOneGuidedMorningOpened: false,
      chapterOneGuidedDayTwoBriefOpened: false,
      chapterOneGuidedInventoryOpened: false,
      chapterOneGuidedBattleOutfitterOpened: false,
    },
  };
}

export function getChapterOneGuidedTutorialStep(save: GameSave): ChapterOneTutorialStep | null {
  if (!isChapterOneGuidedTutorialActive(save) || save.flags.m24IntroSeen !== true) return null;
  const progress = getChapterOneTutorialProgress(save);
  const phase = save.ranchDay?.phase ?? "active";

  if (save.flags.chapterOneGuidedMorningOpened !== true) {
    return {
      id: "read-morning-brief",
      dayLabel: "Day 1 — Keep the Ranch Standing",
      title: "Read the Morning Brief",
      body: "Start each day by checking resources, warnings, creature moods, and the ranch's most urgent need.",
      hint: phase === "morning" ? "Review the cards, then begin the ranch day." : "Open Morning Brief from the Ranch Day bar.",
      action: "ranch",
      actionLabel: "Show Morning Brief",
      targetId: phase === "morning" ? "ranch-begin-day" : "ranch-morning-brief",
      lockToTarget: true,
    };
  }

  if (!progress.choresAssigned) {
    return {
      id: "assign-security",
      dayLabel: "Day 1 — Keep the Ranch Standing",
      title: "Post a Guard",
      body: "Open Security Patrol and assign a suitable helper. Strong Security reduces the chance that overnight danger damages the ranch.",
      hint: "Use Best Fit for a recommendation, or open the chore and choose a creature yourself.",
      action: "chores",
      actionLabel: "Open Ranch Chores",
      targetId: "chore-security",
      lockToTarget: true,
    };
  }

  if (!progress.secondChoreAssigned) {
    return {
      id: "assign-second-chore",
      dayLabel: "Day 1 — Keep the Ranch Standing",
      title: "Choose a Second Priority",
      body: "Now make one decision yourself. Add Feed production, Comfort Care, Garden Tending, or Field Hauling based on what your ranch needs.",
      hint: "The projected output on each chore card shows what tomorrow may look like.",
      action: "chores",
      actionLabel: "Choose Another Chore",
      targetId: "chore-second-priority",
    };
  }

  if (!progress.firstNightResolved) {
    return {
      id: "resolve-first-night",
      dayLabel: "Day 1 — Keep the Ranch Standing",
      title: phase === "evening" ? "End the First Day" : "Review the Day",
      body: "Sleeping resolves assignments, feeding, recovery, danger, pregnancy timers, taxes, and tomorrow's Morning Brief exactly once.",
      hint: phase === "evening" ? "Confirm End Day when you are ready." : "Review the projections before committing to the night.",
      action: "ranch",
      actionLabel: phase === "evening" ? "End Day" : "Review Day",
      targetId: phase === "evening" ? "ranch-end-day" : "ranch-review-day",
      lockToTarget: true,
    };
  }

  if (save.flags.chapterOneGuidedDayTwoBriefOpened !== true) {
    return {
      id: "read-results",
      dayLabel: "Day 2 — Read the Results",
      title: "See What Changed Overnight",
      body: "Compare yesterday's choices with today's Feed, Materials, condition, mood, and warning cards. The ranch is a loop, not a set of isolated menus.",
      hint: phase === "morning" ? "Read the overnight highlights before beginning Day 2." : "Open Morning Brief and review the resource changes.",
      action: "ranch",
      actionLabel: "Review Morning Results",
      targetId: phase === "morning" ? "ranch-begin-day" : "ranch-morning-brief",
    };
  }

  if (!progress.resourceProblemSolved) {
    return {
      id: "solve-resource-problem",
      dayLabel: "Day 2 — Make a Choice",
      title: "Create Some Breathing Room",
      body: "Produce Feed, gather Materials, or repair ranch damage. Choose the problem that matters most to your current ranch.",
      hint: "Ranch Chores shows projected Feed, Materials, Security, Comfort, and upkeep before the night resolves.",
      action: "chores",
      actionLabel: "Plan Ranch Work",
      targetId: "chore-second-priority",
    };
  }

  if (!progress.guildRequestCompleted) {
    return {
      id: "first-guild-request",
      dayLabel: "Day 3 — Town and Progression",
      title: "Complete a Beginner Guild Request",
      body: "The Guild connects ranch production to town progression. Accept and finish one request using a system you have already learned.",
      hint: "Beginner requests should reinforce Feed, Materials, care, or ranch work rather than introduce a new rule set.",
      action: "guild",
      actionLabel: "Open Guild Hall",
      targetId: "tutorial-guild-request",
    };
  }

  if (!progress.breedingAttempted) {
    return {
      id: "first-pairing",
      dayLabel: "Day 4 — Breeding and Nursery",
      title: "Inspect a Valid Pair",
      body: "Choose two creatures, compare compatibility, stamina, projected inheritance, and move lineage, then begin the guided pairing.",
      hint: "Your first valid creature-to-creature tutorial pairing is guaranteed to create a safe one-day pregnancy.",
      action: "breeding",
      actionLabel: "Open Breeding Pen",
      targetId: "tutorial-breeding-attempt",
      lockToTarget: true,
    };
  }

  if (!progress.eggAvailable) {
    return {
      id: "wait-for-first-egg",
      dayLabel: "Day 4 — Breeding and Nursery",
      title: "Let the Nursery Do Its Work",
      body: progress.pregnancyCreated
        ? "The guided pregnancy is safe and lasts one day. End the day once your ranch is prepared, then check the Nursery."
        : "The pairing was recorded, but the guided pregnancy still needs to be created. Return to the Breeding Pen and use two available creatures.",
      hint: progress.pregnancyCreated ? "Review the day, sleep, and the egg will be delivered tomorrow." : "Player-receiver sessions cannot create an egg; choose two creatures.",
      action: progress.pregnancyCreated ? "ranch" : "breeding",
      actionLabel: progress.pregnancyCreated ? "Prepare to End Day" : "Return to Breeding",
      targetId: progress.pregnancyCreated ? (phase === "evening" ? "ranch-end-day" : "ranch-review-day") : "tutorial-breeding-attempt",
    };
  }

  if (!progress.quickhatchUsed) {
    return {
      id: "use-quickhatch",
      dayLabel: "Day 4 — Breeding and Nursery",
      title: "Use the Quickhatch Catalyst",
      body: "Veyra has provided one tutorial-only Epic catalyst. Consume it from Inventory to finish this egg immediately and learn how targeted items work.",
      hint: "The catalyst cannot be purchased and is granted only once. A confirmation protects it from accidental use.",
      action: "inventory",
      actionLabel: "Open Inventory",
      targetId: "quickhatch-catalyst",
      lockToTarget: true,
    };
  }

  if (!progress.battleOutfitterOpened) {
    return {
      id: "prepare-first-team",
      dayLabel: "Day 5 — First Battle",
      title: "Prepare a Three-Creature Team",
      body: "Visit the Battle Outfitter to inspect equipped moves, roles, and basic equipment before entering your first exhibition.",
      hint: "You only need a functional beginner team; advanced manuals and optimization can wait.",
      action: "battle-outfitter",
      actionLabel: "Open Battle Outfitter",
      targetId: "tutorial-battle-outfitter",
    };
  }

  if (!progress.firstBattleWon) {
    return {
      id: "win-first-battle",
      dayLabel: "Day 5 — First Battle",
      title: "Win the Novice Echo Trial",
      body: "Target an enemy first, choose one move for each active creature, and resolve the round. The Novice trial is the guided entry point to combat.",
      hint: "Every creature has at least one usable basic move. Focus attacks on one vulnerable enemy at a time.",
      action: "coliseum",
      actionLabel: "Enter the Coliseum",
      targetId: "tutorial-first-battle",
    };
  }

  return {
    id: "chapter-one-complete",
    dayLabel: "Chapter 1 Complete",
    title: "Bramble Farm Is Running",
    body: "You have completed the ranch loop, solved a resource problem, worked with the Guild, bred and hatched a creature, used an item, and won a battle.",
    hint: "The Ranch Handbook still contains optional beginner milestones and rewards, but they no longer block the story.",
    action: "none",
    actionLabel: "Continue",
  };
}
