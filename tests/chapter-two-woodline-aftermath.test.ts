import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  canDeliverChapterTwoGuildAid,
  claimChapterTwoAftermathReport,
  completeChapterTwoDoctrineOperation,
  deliverChapterTwoGuildAid,
  getChapterTwoAftermathState,
  prepareChapterTwoAftermathSave,
  reviewChapterTwoAftermath,
  stabilizeChapterTwoRanch,
} from "@/data/chapterTwoWoodlineAftermath";
import {
  chooseChapterTwoDoctrine,
  consultChapterTwoPetra,
  getChapterTwoState,
  inspectChapterTwoTracks,
  prepareChapterTwoSave,
  type ChapterTwoDoctrine,
} from "@/data/chapterTwoTroubleBeyondFence";
import {
  recordPredatorBattleOutcome,
  resolvePredatorNightCheck,
} from "@/data/predatorEvents";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function chapterOneCompleteSave(): GameSave {
  const save = createNewGameSave("Woodline Aftermath", 0);
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 8 },
    flags: {
      ...save.flags,
      chapterOneGuidedComplete: true,
      m15ChapterOneOnboardingComplete: true,
      ranchFeedStock: 30,
      ranchMaterialsStock: 30,
      ranchDamage: 24,
    },
  };
}

function completeChapterTwo(doctrine: ChapterTwoDoctrine): GameSave {
  let save = prepareChapterTwoSave(chapterOneCompleteSave());
  save = inspectChapterTwoTracks(save).save;
  save = consultChapterTwoPetra(save).save;
  const guardId = save.creatures?.[0]?.creatureId as CreatureId;
  save = prepareChapterTwoSave({
    ...save,
    flags: {
      ...save.flags,
      builderProject_reinforced_fence_built: true,
    },
    ranchJobs: {
      ...save.ranchJobs!,
      assignments: {
        ...save.ranchJobs!.assignments,
        security_patrol: [guardId],
      },
    },
  });
  const checked = resolvePredatorNightCheck(save, 10);
  const team = (checked.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const resolved = recordPredatorBattleOutcome(checked.save, checked.event!.eventId, "player_won", 3, team);
  const chosen = chooseChapterTwoDoctrine(resolved.save, doctrine);
  assert.equal(chosen.ok, true);
  assert.equal(getChapterTwoState(chosen.save).stage, "complete");
  return chosen.save;
}

function reachOperation(doctrine: ChapterTwoDoctrine): GameSave {
  let save = prepareChapterTwoAftermathSave(completeChapterTwo(doctrine));
  save = reviewChapterTwoAftermath(save).save;
  save = stabilizeChapterTwoRanch(save).save;
  return save;
}

test("Woodline Aftermath remains locked until Chapter 2 is complete", () => {
  const save = chapterOneCompleteSave();
  const prepared = prepareChapterTwoAftermathSave(save);
  assert.equal(prepared, save);
  assert.equal(getChapterTwoAftermathState(save).stage, "locked");
});

test("Act II advances through review, recovery, operation, aid, wait, and final report", () => {
  let save = prepareChapterTwoAftermathSave(completeChapterTwo("fortify"));
  assert.equal(getChapterTwoAftermathState(save).stage, "survey");

  save = reviewChapterTwoAftermath(save).save;
  assert.equal(getChapterTwoAftermathState(save).stage, "recover");

  const materialsBefore = Number(save.flags.ranchMaterialsStock ?? 0);
  const damageBefore = Number(save.flags.ranchDamage ?? 0);
  save = stabilizeChapterTwoRanch(save).save;
  assert.equal(getChapterTwoAftermathState(save).recoveryMode, "materials");
  assert.equal(Number(save.flags.ranchMaterialsStock), materialsBefore - 3);
  assert.equal(Number(save.flags.ranchDamage), Math.max(0, damageBefore - 12));

  save = completeChapterTwoDoctrineOperation(save).save;
  assert.equal(getChapterTwoAftermathState(save).stage, "aid");
  assert.equal(save.flags.chapterTwoAftermathSecurityBonus, 5);
  assert.equal(save.flags.chapterTwoAftermathDamageReductionPercent, 20);

  const feedBefore = Number(save.flags.ranchFeedStock ?? 0);
  save = deliverChapterTwoGuildAid(save, "feed").save;
  assert.equal(getChapterTwoAftermathState(save).stage, "wait");
  assert.equal(Number(save.flags.ranchFeedStock), feedBefore - 6);
  assert.equal(prepareChapterTwoAftermathSave(save), save);

  save = prepareChapterTwoAftermathSave({
    ...save,
    dayState: { ...save.dayState, dayNumber: save.dayState.dayNumber + 1 },
  });
  assert.equal(getChapterTwoAftermathState(save).stage, "report");

  const goldBefore = save.currencies.gold;
  const gpBefore = save.currencies.guildPoints;
  const reportMaterialsBefore = Number(save.flags.ranchMaterialsStock ?? 0);
  const report = claimChapterTwoAftermathReport(save);
  assert.equal(report.ok, true);
  assert.equal(report.state.stage, "complete");
  assert.equal(report.save.currencies.gold, goldBefore + 150);
  assert.equal(report.save.currencies.guildPoints, gpBefore + 3);
  assert.equal(Number(report.save.flags.ranchMaterialsStock), reportMaterialsBefore + 4);
});

test("emergency stabilization never traps a low-resource save", () => {
  let save = prepareChapterTwoAftermathSave(completeChapterTwo("track"));
  save = reviewChapterTwoAftermath(save).save;
  save = {
    ...save,
    currencies: { ...save.currencies, gold: 0 },
    flags: { ...save.flags, ranchMaterialsStock: 0, ranchDamage: 10 },
  };
  const result = stabilizeChapterTwoRanch(save);
  assert.equal(result.ok, true);
  assert.equal(result.state.recoveryMode, "volunteer");
  assert.equal(Number(result.save.flags.ranchDamage), 6);
  assert.equal(result.state.stage, "operation");
});

test("each doctrine receives a distinct permanent Act II upgrade", () => {
  const fortified = completeChapterTwoDoctrineOperation(reachOperation("fortify")).save;
  const tracked = completeChapterTwoDoctrineOperation(reachOperation("track")).save;
  const stewarded = completeChapterTwoDoctrineOperation(reachOperation("steward")).save;

  assert.equal(fortified.flags.chapterTwoAftermathSecurityBonus, 5);
  assert.equal(fortified.flags.chapterTwoAftermathDamageReductionPercent, 20);
  assert.equal(tracked.flags.chapterTwoAftermathInterceptBonus, 6);
  assert.equal(tracked.flags.chapterTwoAftermathOpeningHpReduction, 5);
  assert.equal(stewarded.flags.chapterTwoAftermathPressureReduction, 4);
  assert.equal(stewarded.flags.chapterTwoAftermathFeedLossReduction, 2);
});

test("Fortify and Steward upgrades alter the live threat calculation", () => {
  const source = completeChapterTwo("fortify");
  const baseCreatures = source.creatures ?? [];
  const creatures = Array.from({ length: 10 }, (_, index) => ({
    ...baseCreatures[index % baseCreatures.length],
    creatureId: `aftermath-threat-${index}` as CreatureId,
  }));
  const exposed: GameSave = {
    ...source,
    creatures,
    flags: {
      ...source.flags,
      ranchFeedStock: 30,
      ranchDamage: 30,
      chapterTwoAftermathSecurityBonus: 0,
      chapterTwoAftermathPressureReduction: 0,
    },
  };
  const baseline = getPredatorThreatAssessment(exposed);
  const fortified = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoAftermathSecurityBonus: 5 },
  });
  const stewarded = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoAftermathPressureReduction: 4 },
  });
  assert.equal(fortified.security, baseline.security + 5);
  assert.equal(stewarded.pressure, Math.max(0, baseline.pressure - 4));
});

test("Trail Wardens intelligence strengthens an intercepted predator opening", () => {
  const operation = completeChapterTwoDoctrineOperation(reachOperation("track")).save;
  const forced: GameSave = {
    ...operation,
    dayState: { ...operation.dayState, dayNumber: operation.dayState.dayNumber + 2 },
    flags: {
      ...operation.flags,
      devForcePredatorEvent: true,
      devForcePredatorIntercept: true,
      predatorLastCheckDayNumber: 0,
      predatorPendingEventV1: false,
    },
  };
  const baseline = resolvePredatorNightCheck({
    ...forced,
    flags: {
      ...forced.flags,
      chapterTwoAftermathInterceptBonus: 0,
      chapterTwoAftermathOpeningHpReduction: 0,
    },
  }, 8);
  const improved = resolvePredatorNightCheck(forced, 8);
  assert.equal(improved.event?.intercepted, true);
  assert.ok((improved.event?.startingHpPercent ?? 100) < (baseline.event?.startingHpPercent ?? 100));
  assert.match(improved.summary, /additional 5% HP/);
});

test("improved procedures reduce future predator failure penalties", () => {
  const fortifyOperation = completeChapterTwoDoctrineOperation(reachOperation("fortify")).save;
  const fortifyForced: GameSave = {
    ...fortifyOperation,
    dayState: { ...fortifyOperation.dayState, dayNumber: fortifyOperation.dayState.dayNumber + 3 },
    flags: {
      ...fortifyOperation.flags,
      ranchDamage: 0,
      devForcePredatorEvent: true,
      predatorLastCheckDayNumber: 0,
      predatorPendingEventV1: false,
    },
  };
  const fortifyEvent = resolvePredatorNightCheck(fortifyForced, 0);
  const team = (fortifyEvent.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const fortifiedLoss = recordPredatorBattleOutcome(fortifyEvent.save, fortifyEvent.event!.eventId, "enemy_won", 4, team);
  assert.ok(Number(fortifiedLoss.save.flags.chapterTwoAftermathDamagePreventedTotal ?? 0) > 0);
  assert.match(fortifiedLoss.message, /ranch damage prevented/);

  const stewardOperation = completeChapterTwoDoctrineOperation(reachOperation("steward")).save;
  const stewardForced: GameSave = {
    ...stewardOperation,
    dayState: { ...stewardOperation.dayState, dayNumber: stewardOperation.dayState.dayNumber + 4 },
    flags: {
      ...stewardOperation.flags,
      ranchFeedStock: 30,
      devForcePredatorEvent: true,
      predatorLastCheckDayNumber: 0,
      predatorPendingEventV1: false,
    },
  };
  const stewardEvent = resolvePredatorNightCheck(stewardForced, 0);
  const stewardTeam = (stewardEvent.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const stewardLoss = recordPredatorBattleOutcome(stewardEvent.save, stewardEvent.event!.eventId, "enemy_won", 4, stewardTeam);
  assert.equal(Number(stewardLoss.save.flags.chapterTwoAftermathFeedPreservedTotal), 2);
  assert.match(stewardLoss.message, /2 Feed preserved/);
});

test("Guild aid options validate resources and completion rewards cannot duplicate", () => {
  let save = completeChapterTwoDoctrineOperation(reachOperation("steward")).save;
  assert.equal(canDeliverChapterTwoGuildAid(save, "feed"), true);
  assert.equal(canDeliverChapterTwoGuildAid(save, "materials"), true);
  assert.equal(canDeliverChapterTwoGuildAid(save, "gold"), true);
  save = deliverChapterTwoGuildAid(save, "materials").save;
  save = prepareChapterTwoAftermathSave({
    ...save,
    dayState: { ...save.dayState, dayNumber: save.dayState.dayNumber + 1 },
  });
  const first = claimChapterTwoAftermathReport(save);
  const duplicate = claimChapterTwoAftermathReport(first.save);
  assert.equal(first.ok, true);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.currencies.gold, first.save.currencies.gold);
  assert.equal(duplicate.save.currencies.guildPoints, first.save.currencies.guildPoints);
});

test("the active ranch UI switches from Act I to the Woodline aftermath journal", async () => {
  const wrapper = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterTwoAftermathPanel.tsx", ROOT), "utf8");
  const tsconfig = await readFile(new URL("tsconfig.json", ROOT), "utf8");
  assert.match(wrapper, /chapterTwoComplete \? <ChapterTwoAftermathPanel \/> : <ChapterTwoQuestPanel \/>/);
  assert.match(panel, /The Woodline Aftermath/);
  assert.match(panel, /Send 6 Feed/);
  assert.match(panel, /Fund 120 Gold/);
  assert.match(tsconfig, /predatorEventsAftermath/);
});
