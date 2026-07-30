import test from "node:test";
import assert from "node:assert/strict";

import { createNewGameSave } from "../src/lib/save/localSave.ts";
import {
  getBreedingParticipants,
  getBreedingPreview,
  performBreedingAttempt,
} from "../src/data/breedingTutorial.ts";
import { advanceNurseryDay } from "../src/data/nurseryMoveInheritanceLifecycle.ts";
import {
  getChapterOneGuidedTutorialStep,
  getChapterOneTutorialProgress,
  prepareChapterOneGuidedTutorialSave,
  QUICKHATCH_CATALYST_STOCK_FLAG,
} from "../src/data/chapterOneGuidedTutorialBattle.ts";
import { getChapterOneCompletionScene } from "../src/data/chapterOneStoryGuided.ts";
import { getStarterGoalProgress } from "../src/data/starterGoals.ts";
import {
  getQuickhatchCatalystCount,
  useTutorialQuickhatchCatalyst,
} from "../src/data/tutorialQuickhatch.ts";

function guidedSave() {
  const base = createNewGameSave("Guided Breeder", 0);
  return {
    ...base,
    habitats: (base.habitats ?? []).map((habitat) => ({ ...habitat, capacity: 99 })),
    flags: {
      ...base.flags,
      m24IntroSeen: true,
      chapterOneGuidedVersion: 1,
      chapterOneGuidedSkipped: false,
      chapterOneGuidedComplete: false,
      m15ChapterOneOnboardingComplete: false,
      m24ChapterOneStoryComplete: false,
    },
  };
}

function readyForBattleSave() {
  const base = guidedSave();
  if (!base.ranchJobs || !base.creatures?.[0] || !base.creatures[1]) {
    throw new Error("New save is missing required guided tutorial fixtures.");
  }
  return {
    ...base,
    dayState: { ...base.dayState, dayNumber: 2 },
    ranchJobs: {
      ...base.ranchJobs,
      assignments: {
        ...base.ranchJobs.assignments,
        security_patrol: [base.creatures[0].creatureId],
        stable_production: [base.creatures[1].creatureId],
      },
    },
    flags: {
      ...base.flags,
      chapterOneGuidedMorningOpened: true,
      chapterOneGuidedDayTwoBriefOpened: true,
      m14RanchJobsProcessed: true,
      ranchFeedProducedToday: 5,
      ranchFeedStock: 5,
      m7GuildContractCompleted: true,
      m4BreedingAttempted: true,
      m5PregnancyCreated: true,
      m9TotalHatched: 1,
      chapterOneQuickhatchCatalystUsed: true,
      chapterOneGuidedBattleOutfitterOpened: true,
    },
  };
}

function findValidCreaturePair(save: ReturnType<typeof guidedSave>) {
  const creatures = getBreedingParticipants(save).filter(
    (participant) => participant.kind === "creature" && participant.canBreed,
  );
  for (const giver of creatures) {
    for (const receiver of creatures) {
      if (giver.participantId === receiver.participantId) continue;
      const preview = getBreedingPreview(save, giver.participantId, receiver.participantId);
      if (preview?.canAttempt && receiver.kind === "creature") {
        return { giverId: giver.participantId, receiverId: receiver.participantId };
      }
    }
  }
  return null;
}

test("the first guided creature pairing guarantees a safe one-day pregnancy", () => {
  const save = guidedSave();
  const pair = findValidCreaturePair(save);
  assert.ok(pair, "new save should include at least one valid creature-to-creature pair");

  const result = performBreedingAttempt(save, pair.giverId, pair.receiverId);
  assert.ok(result);
  assert.equal(result.attempt.outcome, "pregnancy");
  assert.ok(result.attempt.pregnancyId);
  const pregnancy = (result.save.pregnancies ?? []).find(
    (record) => record.pregnancyId === result.attempt.pregnancyId,
  );
  assert.ok(pregnancy);
  assert.equal(pregnancy.daysRemaining, 1);
  assert.equal(pregnancy.totalDays, 1);
  assert.equal(result.save.flags.chapterOneTutorialPregnancyGuaranteed, true);
  assert.equal(result.save.flags.chapterOneTutorialPregnancyShortened, true);
});

test("Quickhatch Catalyst is granted once, recorded, consumed, and hatches the tutorial egg", () => {
  const save = guidedSave();
  const pair = findValidCreaturePair(save);
  assert.ok(pair);
  const breeding = performBreedingAttempt(save, pair.giverId, pair.receiverId);
  assert.ok(breeding);

  const nursery = advanceNurseryDay(breeding.save).save;
  const egg = (nursery.eggs ?? []).find((record) => record.status !== "hatched");
  assert.ok(egg, "one-day pregnancy should deliver an egg after the next day advance");

  const granted = prepareChapterOneGuidedTutorialSave(nursery);
  assert.equal(getQuickhatchCatalystCount(granted), 1);
  assert.equal(granted.flags.chapterOneQuickhatchCatalystGranted, true);
  const creatureCountBefore = (granted.creatures ?? []).length;

  const hatch = useTutorialQuickhatchCatalyst(granted, egg.eggId);
  assert.equal(hatch.ok, true);
  assert.ok(hatch.creature);
  assert.equal((hatch.save.creatures ?? []).length, creatureCountBefore + 1);
  assert.equal(getQuickhatchCatalystCount(hatch.save), 0);
  assert.equal(hatch.save.flags.chapterOneQuickhatchCatalystUsed, true);
  assert.equal(hatch.save.itemUseHistory?.[0]?.itemId, "quickhatch_catalyst");
  assert.equal(hatch.save.itemUseHistory?.[0]?.targetKind, "egg");

  const duplicate = useTutorialQuickhatchCatalyst(hatch.save, egg.eggId);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save, hatch.save);
});

test("an unused Catalyst expires if the guided egg hatches naturally", () => {
  const base = guidedSave();
  const save = {
    ...base,
    flags: {
      ...base.flags,
      chapterOneQuickhatchCatalystGranted: true,
      [QUICKHATCH_CATALYST_STOCK_FLAG]: 1,
      m9TotalHatched: 1,
    },
  };
  const prepared = prepareChapterOneGuidedTutorialSave(save);
  assert.equal(getQuickhatchCatalystCount(prepared), 0);
  assert.equal(prepared.flags.chapterOneQuickhatchCatalystExpired, true);
});

test("visiting Battle Outfitter early cannot skip earlier guided lessons", () => {
  const base = guidedSave();
  const save = {
    ...base,
    flags: {
      ...base.flags,
      chapterOneGuidedBattleOutfitterOpened: true,
    },
  };
  const step = getChapterOneGuidedTutorialStep(save);
  assert.equal(step?.id, "read-morning-brief");
});

test("the active first battle handoff names Opening Scrimmage", () => {
  const step = getChapterOneGuidedTutorialStep(readyForBattleSave());
  assert.equal(step?.id, "win-first-battle");
  assert.equal(step?.title, "Win the Opening Scrimmage");
});

test("guided Chapter 1 completion no longer requires all sixteen optional starter goals", () => {
  const ready = readyForBattleSave();
  const save = {
    ...ready,
    flags: {
      ...ready.flags,
      chapterOneFirstBattleWon: true,
    },
  };

  const guided = getChapterOneTutorialProgress(save);
  const optional = getStarterGoalProgress(save);
  assert.equal(guided.complete, true);
  assert.ok(optional.completed < optional.total, "optional handbook milestones should remain incomplete");
  assert.ok(getChapterOneCompletionScene(save), "guided completion should unlock the Chapter 1 ending");
});
