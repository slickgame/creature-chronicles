import { getColiseumC2Progress } from "./coliseumC2";
import { getColiseumProgress } from "@/data/coliseum";
import type { GameSave } from "@/types/save";

export const CHAPTER_ONE_GUIDED_VERSION = 3;
export const QUICKHATCH_CATALYST_STOCK_FLAG = "chapterOneQuickhatchCatalystStock";

export type ChapterOneTutorialSignal =
  | "morning-opened"
  | "day-two-brief-opened"
  | "town-opened"
  | "market-opened"
  | "office-opened"
  | "inventory-opened"
  | "battle-outfitter-opened";

export type ChapterOneTutorialAction =
  | "none"
  | "ranch"
  | "chores"
  | "town"
  | "market"
  | "office"
  | "guild"
  | "breeding"
  | "nursery"
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
  townNavigationComplete: boolean;
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
  return flagNumber(save.flags.farmWorkActions) > 0 || Boolean(save.flags.chapterOneGuidedResourceDecisionMade) ||
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
  return getColiseumC2Progress(save).totalWins > 0 || getColiseumProgress(save).totalWins > 0 ||
    Boolean(save.flags.chapterOneFirstBattleWon) ||
    Boolean(save.flags.m62FirstBattleWon);
}

export function getChapterOneTutorialProgress(save: GameSave): ChapterOneTutorialProgress {
  const choresAssigned = save.flags.chapterOneGuidedChoresAssigned === true || hasSecurityAssignment(save);
  const secondChoreAssigned = save.flags.chapterOneGuidedSecondChoreAssigned === true || assignmentCount(save) >= 2 || hasResolvedFirstNight(save);
  const firstNightResolved = hasResolvedFirstNight(save);
  const resourceProblemSolved = save.flags.chapterOneGuidedResourceSolved === true || hasSolvedResourceProblem(save);
  const guildRequestCompleted = hasCompletedGuildRequest(save);
  const legacyTownComplete = flagNumber(save.flags.chapterOneGuidedVersion) < 2 && guildRequestCompleted;
  const townNavigationComplete = legacyTownComplete || Boolean(
    save.flags.chapterOneGuidedTownOpened && save.flags.chapterOneGuidedMarketOpened && save.flags.chapterOneGuidedOfficeOpened,
  );
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
    townNavigationComplete &&
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
    townNavigationComplete,
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
  const milestoneFlags = {
    chapterOneGuidedChoresAssigned: progress.choresAssigned,
    chapterOneGuidedSecondChoreAssigned: progress.secondChoreAssigned,
    chapterOneGuidedResourceSolved: progress.resourceProblemSolved,
  };
  const earnedMilestones = Object.fromEntries(Object.entries(milestoneFlags).filter(([key, earned]) => earned && save.flags[key] !== true));
  if (!shouldGrantCatalyst && !shouldComplete && !versionMissing && !Object.keys(earnedMilestones).length) return save;
  return {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedVersion: CHAPTER_ONE_GUIDED_VERSION,
      ...earnedMilestones,
      ...(flagNumber(save.flags.chapterOneGuidedVersion) < 2 && hasCompletedGuildRequest(save) ? {
        chapterOneGuidedTownOpened: true,
        chapterOneGuidedMarketOpened: true,
        chapterOneGuidedOfficeOpened: true,
      } : {}),
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
  save = prepareChapterOneGuidedTutorialSave(save);
  const flagBySignal: Record<ChapterOneTutorialSignal, string> = {
    "morning-opened": "chapterOneGuidedMorningOpened",
    "day-two-brief-opened": "chapterOneGuidedDayTwoBriefOpened",
    "town-opened": "chapterOneGuidedTownOpened",
    "market-opened": "chapterOneGuidedMarketOpened",
    "office-opened": "chapterOneGuidedOfficeOpened",
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
      dayLabel: "Day 1 · Farm Work",
      title: "Read the Morning Brief",
      body: "Start each day by checking resources, warnings, creature moods, and the ranch's most urgent need.",
      hint: phase === "morning" ? "Review the cards, then begin the ranch day." : "Open Today, then expand Morning Brief & Daily Records.",
      action: "ranch",
      actionLabel: "Show Morning Brief",
      targetId: phase === "morning" ? "ranch-begin-day" : "ranch-morning-brief",
      lockToTarget: true,
    };
  }

  if (!progress.choresAssigned) {
    return {
      id: "assign-security",
      dayLabel: "Day 1 · Farm Work",
      title: "Gather Your First Supplies",
      body: "Open Farm Management, choose a worker at the Woodlot, and press Work. Resources arrive immediately and only that creature spends Energy.",
      hint: "Review the exact output and Energy cost before working. No Gold is charged.",
      action: "chores",
      actionLabel: "Open Farm Management",
      targetId: "farm-work-locations",
      lockToTarget: true,
    };
  }

  if (!progress.secondChoreAssigned) {
    return {
      id: "assign-second-chore",
      dayLabel: "Day 1 · Farm Work",
      title: "Work at Another Location",
      body: "Perform another work action. The garden and wheat patch provide ingredients for cooking Balanced rations.",
      hint: "Work resolves now. Use the Kitchen to combine ingredients into rations or bonus meals.",
      action: "chores",
      actionLabel: "Choose More Work",
      targetId: "farm-work-locations",
    };
  }

  if (!progress.firstNightResolved) {
    return {
      id: "resolve-first-night",
      dayLabel: "Day 1 · Farm Work",
      title: phase === "evening" ? "End the First Day" : "Review the Day",
      body: "Review supplies already produced, food needs, and Security, then end the day. Energy recovers and pregnancy, egg, and construction timers advance. Work does not repeat overnight.",
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
      dayLabel: "Day 2 · Morning Results",
      title: "See What Changed Overnight",
      body: "Review food consumed, recovery, building progress, and any overnight incidents. Your work supplies were already collected when you pressed Work.",
      hint: phase === "morning" ? "Read the overnight highlights before beginning the next day." : "Open Morning Brief and review the resource changes.",
      action: "ranch",
      actionLabel: "Review Morning Results",
      targetId: phase === "morning" ? "ranch-begin-day" : "ranch-morning-brief",
    };
  }

  if (!progress.resourceProblemSolved) {
    return {
      id: "solve-resource-problem",
      dayLabel: "Day 2 · Resources",
      title: "Create Some Breathing Room",
      body: "Gather food ingredients, collect Wood, or repair fortifications. Choose the problem that matters most to your farm.",
      hint: "Farm Management shows work output, Energy costs, and passive Security. Fortifications and the strongest Guard Dog protect the farm.",
      action: "chores",
      actionLabel: "Plan Ranch Work",
      targetId: "farm-work-locations",
    };
  }

  if (!progress.townNavigationComplete && save.flags.chapterOneGuidedTownOpened !== true) {
    return {
      id: "visit-town", dayLabel: "Days 2–3 · Town",
      title: "Find Your Way Around Town",
      body: "Visit the town square and explore its service cards. The Adoption Hearth offers creatures, the Guild offers requests, and the Battle Outfitter prepares your team.",
      hint: "Choose a service card to see what it offers. Browsing costs nothing.",
      action: "town", actionLabel: "Visit Town",
    };
  }

  if (!progress.townNavigationComplete && save.flags.chapterOneGuidedMarketOpened !== true) {
    return {
      id: "browse-market", dayLabel: "Days 2–3 · Town",
      title: "Browse the Adoption Hearth",
      body: "Inspect the available creatures and their costs. Compare their strengths with your ranch crew before deciding whether you need another helper.",
      hint: "You do not need to buy a creature to finish this lesson.",
      action: "market", actionLabel: "Browse Adoption Hearth",
    };
  }

  if (!progress.guildRequestCompleted) {
    return {
      id: "first-guild-request",
      dayLabel: "Days 2–3 · Requests",
      title: "Complete a Beginner Guild Request",
      body: "The Guild connects ranch production to town progression. Accept and finish one request using a system you have already learned.",
      hint: "Choose a delivery, care, or work request you can fulfill. Review the exact Gold/GP reward and any resource or creature cost before confirming.",
      action: "guild",
      actionLabel: "Open Guild Hall",
      targetId: "tutorial-guild-request",
    };
  }

  if (!progress.townNavigationComplete && save.flags.chapterOneGuidedOfficeOpened !== true) {
    return {
      id: "return-to-office", dayLabel: "Days 2–3 · Town",
      title: "Return to the Ranch Office",
      body: "Back at the farm, the Ranch Office keeps your records and story log together. Check where to find them before heading out again.",
      hint: "Use the navigation menu to return to the ranch whenever you need to manage your crew.",
      action: "office", actionLabel: "Open Ranch Office",
    };
  }

  if (!progress.breedingAttempted) {
    return {
      id: "first-pairing",
      dayLabel: "Days 3–4 · Breeding & Nursery",
      title: "Inspect a Valid Pair",
      body: "Choose two available creatures. Open Inheritance → Talents to compare their grades and bonuses, then choose a useful talent you would like the offspring to inherit. Hot-Blooded improves Fertility; Diligent increases work output.",
      hint: "The first valid creature pairing guarantees a safe one-day pregnancy, not a specific talent. Talent inheritance is a separate roll; moves are under Inheritance → Moves.",
      action: "breeding",
      actionLabel: "Open Breeding Pen",
      targetId: "tutorial-breeding-attempt",
      lockToTarget: true,
    };
  }

  if (!progress.eggAvailable) {
    return {
      id: "wait-for-first-egg",
      dayLabel: "Days 3–4 · Breeding & Nursery",
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
      dayLabel: "Days 3–4 · Breeding & Nursery",
      title: "Hatch Your First Egg",
      body: "Let the egg hatch naturally as days pass, or use Veyra’s one-time Quickhatch Catalyst from Inventory to hatch it immediately.",
      hint: "Both paths count. Confirm the hatchling to finish. Check Nursery → Births for inherited talents and their parents. While waiting naturally, you can explore later lessons from First Week.",
      action: "nursery",
      actionLabel: "Open Nursery",
      targetId: "quickhatch-catalyst",
    };
  }

  if (!progress.battleOutfitterOpened) {
    return {
      id: "prepare-first-team",
      dayLabel: "Days 5–7 · Battle Preparation",
      title: "Prepare a Three-Creature Team",
      body: "Visit the Battle Outfitter. Check each creature’s four equipped moves and compare any gear you can afford. A basic attack plus a support or recovery move gives you options.",
      hint: "Gear is optional. Focus Manuals teach compatible moves, but learned moves must be equipped before battle. Save some Gold for ranch supplies.",
      action: "battle-outfitter",
      actionLabel: "Open Battle Outfitter",
      targetId: "tutorial-battle-outfitter",
    };
  }

  if (!progress.firstBattleWon) {
    return {
      id: "win-first-battle",
      dayLabel: "Days 5–7 · Battle Preparation",
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
    body: "You have completed the ranch loop, solved a resource problem, worked with the Guild, won a battle, and bred and hatched a creature.",
    hint: "The Ranch Handbook still contains optional beginner milestones and rewards, but they no longer block the story.",
    action: "none",
    actionLabel: "Continue",
  };
}

