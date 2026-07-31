import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { CHAPTER_TWO_AFTERMATH_STATE_FLAG } from "@/data/chapterTwoWoodlineAftermath";
import {
  CHAPTER_TWO_WOODLINE_HUNT_TAG,
  canLaunchWoodlineApproach,
  chooseWoodlineResolution,
  getChapterTwoIntoWoodlineState,
  launchWoodlineExpedition,
  prepareChapterTwoIntoWoodlineSave,
  readWoodlineExpeditionBriefing,
} from "@/data/chapterTwoIntoWoodline";
import {
  getPendingPredatorEvent,
  getPredatorEncounterDefinition,
  recordPredatorBattleOutcome,
  resolvePredatorNightCheck,
} from "@/data/predatorEvents";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function aftermathCompleteSave(): GameSave {
  const save = createNewGameSave("Woodline Expedition", 0);
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 12 },
    currencies: { ...save.currencies, gold: 500, guildPoints: 10 },
    flags: {
      ...save.flags,
      chapterOneGuidedComplete: true,
      ranchFeedStock: 30,
      ranchMaterialsStock: 20,
      [CHAPTER_TWO_AFTERMATH_STATE_FLAG]: JSON.stringify({
        version: 1,
        stage: "complete",
        startedDayNumber: 10,
        aftermathReviewed: true,
        recoveryCompleted: true,
        recoveryMode: "materials",
        doctrineOperationCompleted: true,
        guildAidCompleted: true,
        guildAidType: "materials",
        readyDayNumber: 10,
        finalReportRead: true,
        rewardClaimed: true,
        history: [],
      }),
    },
  };
}

function approachReadySave(): GameSave {
  let save = prepareChapterTwoIntoWoodlineSave(aftermathCompleteSave());
  save = readWoodlineExpeditionBriefing(save).save;
  return save;
}

function decisionReadySave(outcome: "player_won" | "enemy_won" | "draw" = "player_won"): GameSave {
  const launched = launchWoodlineExpedition(approachReadySave(), "cautious");
  const event = getPendingPredatorEvent(launched.save)!;
  const team = (launched.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  return recordPredatorBattleOutcome(launched.save, event.eventId, outcome, 4, team).save;
}

test("Into the Woodline remains locked until the Act II aftermath is complete", () => {
  const save = createNewGameSave("Locked Woodline", 0);
  const prepared = prepareChapterTwoIntoWoodlineSave(save);
  assert.equal(prepared, save);
  assert.equal(getChapterTwoIntoWoodlineState(prepared).stage, "locked");
});

test("the free cautious route creates one persisted authored Deepwood event", () => {
  const ready = approachReadySave();
  const result = launchWoodlineExpedition(ready, "cautious");
  assert.equal(result.ok, true);
  assert.equal(result.save.currencies.gold, ready.currencies.gold);
  assert.equal(result.save.flags.ranchFeedStock, ready.flags.ranchFeedStock);
  const event = getPendingPredatorEvent(result.save);
  assert.equal(event?.storyTag, CHAPTER_TWO_WOODLINE_HUNT_TAG);
  assert.equal(event?.predatorType, "wolves");
  assert.equal(event?.startingHpPercent, 82);
  assert.equal(event?.eventChance, 100);
  assert.equal(getChapterTwoIntoWoodlineState(result.save).stage, "battle");

  const blocked = launchWoodlineExpedition(result.save, "cautious");
  assert.equal(blocked.ok, false);
  assert.equal(getPendingPredatorEvent(blocked.save)?.eventId, event?.eventId);
});

test("paid approaches enforce and deduct their exact expedition resources", () => {
  const ready = approachReadySave();
  const swift = launchWoodlineExpedition(ready, "swift");
  assert.equal(swift.ok, true);
  assert.equal(swift.save.currencies.gold, ready.currencies.gold - 80);
  assert.equal(getPendingPredatorEvent(swift.save)?.startingHpPercent, 72);

  const baitReady = approachReadySave();
  const bait = launchWoodlineExpedition(baitReady, "bait");
  assert.equal(bait.ok, true);
  assert.equal(Number(bait.save.flags.ranchFeedStock), Number(baitReady.flags.ranchFeedStock) - 4);
  assert.equal(getPendingPredatorEvent(bait.save)?.startingHpPercent, 62);

  const poor = {
    ...approachReadySave(),
    currencies: { ...approachReadySave().currencies, gold: 0 },
    flags: { ...approachReadySave().flags, ranchFeedStock: 0 },
  };
  assert.equal(canLaunchWoodlineApproach(poor, "swift"), false);
  assert.equal(canLaunchWoodlineApproach(poor, "bait"), false);
  assert.equal(canLaunchWoodlineApproach(poor, "cautious"), true);
});

test("the authored Deepwood encounter uses champion AI and stronger named wolves", () => {
  const launched = launchWoodlineExpedition(approachReadySave(), "swift");
  const event = getPendingPredatorEvent(launched.save)!;
  const encounter = getPredatorEncounterDefinition(launched.save, event);
  assert.equal(encounter.name, "Chapter 2 — Into the Woodline");
  assert.equal(encounter.aiDifficulty, "champion");
  assert.equal(encounter.enemyTeam[0].nickname, "Ashfang");
  assert.equal(encounter.enemyTeam[1].nickname, "Briarstep");
  assert.equal(encounter.enemyTeam[2].nickname, "Old Stonejaw");
  assert.match(encounter.strategyLabel, /72% starting HP/);
});

test("victory, draw, and defeat all advance the expedition to the regional decision", () => {
  for (const outcome of ["player_won", "draw", "enemy_won"] as const) {
    const save = decisionReadySave(outcome);
    const state = getChapterTwoIntoWoodlineState(save);
    assert.equal(state.stage, "decision");
    assert.equal(state.battleResolved, true);
    assert.equal(state.battleOutcome, outcome);
    assert.equal(getPendingPredatorEvent(save), null);
  }
});

test("all three Woodline policies grant distinct permanent bonuses and one-time rewards", () => {
  for (const resolution of ["preserve", "boundary", "rangers"] as const) {
    const ready = decisionReadySave();
    const goldBefore = ready.currencies.gold;
    const guildBefore = ready.currencies.guildPoints;
    const materialsBefore = Number(ready.flags.ranchMaterialsStock ?? 0);
    const result = chooseWoodlineResolution(ready, resolution);
    assert.equal(result.ok, true);
    assert.equal(result.state.stage, "complete");
    assert.equal(result.state.resolution, resolution);

    if (resolution === "preserve") {
      assert.equal(result.save.flags.chapterTwoWoodlinePressureReduction, 6);
      assert.equal(result.save.currencies.gold, goldBefore + 200);
      assert.equal(result.save.currencies.guildPoints, guildBefore + 5);
      assert.equal(Number(result.save.flags.ranchMaterialsStock), materialsBefore + 6);
    } else if (resolution === "boundary") {
      assert.equal(result.save.flags.chapterTwoWoodlineSecurityBonus, 8);
      assert.equal(result.save.currencies.gold, goldBefore + 200);
      assert.equal(result.save.currencies.guildPoints, guildBefore + 4);
      assert.equal(Number(result.save.flags.ranchMaterialsStock), materialsBefore + 10);
    } else {
      assert.equal(result.save.flags.chapterTwoWoodlineInterceptBonus, 8);
      assert.equal(result.save.flags.chapterTwoWoodlineOpeningHpReduction, 5);
      assert.equal(result.save.currencies.gold, goldBefore + 275);
      assert.equal(result.save.currencies.guildPoints, guildBefore + 4);
      assert.equal(Number(result.save.flags.ranchMaterialsStock), materialsBefore + 6);
    }

    const duplicate = chooseWoodlineResolution(result.save, resolution);
    assert.equal(duplicate.ok, false);
    assert.equal(duplicate.save.currencies.gold, result.save.currencies.gold);
    assert.equal(duplicate.save.currencies.guildPoints, result.save.currencies.guildPoints);
  }
});

test("Protected Woodline and Stone Boundary alter the live threat calculation", () => {
  const base = aftermathCompleteSave();
  const source = base.creatures ?? [];
  const creatures = Array.from({ length: 10 }, (_, index) => ({
    ...source[index % source.length],
    creatureId: `woodline-threat-${index}` as CreatureId,
  }));
  const exposed: GameSave = {
    ...base,
    creatures,
    flags: { ...base.flags, ranchFeedStock: 30, ranchDamage: 30 },
  };
  const baseline = getPredatorThreatAssessment(exposed);
  const preserved = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoWoodlinePressureReduction: 6 },
  });
  const bounded = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoWoodlineSecurityBonus: 8 },
  });
  assert.equal(preserved.pressure, Math.max(0, baseline.pressure - 6));
  assert.equal(bounded.security, baseline.security + 8);
});

test("Ranger Network improves future forced interceptions without changing the expedition event", () => {
  const base: GameSave = {
    ...aftermathCompleteSave(),
    flags: {
      ...aftermathCompleteSave().flags,
      devForcePredatorEvent: true,
      devForcePredatorType: "wolves",
      devForcePredatorIntercept: true,
      ranchDamage: 35,
    },
  };
  const ordinary = resolvePredatorNightCheck(base, 0);
  const ranger = resolvePredatorNightCheck({
    ...base,
    saveId: `${base.saveId}_ranger`,
    flags: {
      ...base.flags,
      chapterTwoWoodlineInterceptBonus: 8,
      chapterTwoWoodlineOpeningHpReduction: 5,
    },
  }, 0);
  assert.equal(ordinary.event?.intercepted, true);
  assert.equal(ranger.event?.intercepted, true);
  assert.ok((ranger.event?.startingHpPercent ?? 100) <= (ordinary.event?.startingHpPercent ?? 100) - 5);
  assert.match(ranger.event?.summary ?? "", /ranger network/i);
});

test("the active Ranch Hub exposes Act III only after the aftermath is complete", async () => {
  const wrapper = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterTwoIntoWoodlinePanel.tsx", ROOT), "utf8");
  const model = await readFile(new URL("src/data/chapterTwoIntoWoodline.ts", ROOT), "utf8");
  const activeEvents = await readFile(new URL("src/data/predatorEventsWoodline.ts", ROOT), "utf8");
  assert.match(wrapper, /ChapterTwoIntoWoodlinePanel/);
  assert.match(wrapper, /aftermathComplete/);
  assert.match(panel, /Into the Woodline/);
  assert.match(panel, /WOODLINE_APPROACHES/);
  assert.match(panel, /WOODLINE_RESOLUTIONS/);
  assert.match(model, /Cautious Survey/);
  assert.match(model, /Protected Woodline/);
  assert.match(activeEvents, /CHAPTER_TWO_WOODLINE_HUNT_TAG/);
  assert.match(activeEvents, /champion/);
});
