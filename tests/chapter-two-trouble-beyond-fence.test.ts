import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  CHAPTER_TWO_DEFENSE_TAG,
  chooseChapterTwoDoctrine,
  consultChapterTwoPetra,
  getChapterTwoState,
  inspectChapterTwoTracks,
  prepareChapterTwoSave,
} from "@/data/chapterTwoTroubleBeyondFence";
import {
  getPendingPredatorEvent,
  recordPredatorBattleOutcome,
  resolvePredatorNightCheck,
} from "@/data/predatorEvents";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function chapterOneCompleteSave(): GameSave {
  const save = createNewGameSave("Chapter Two", 0);
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 6 },
    flags: {
      ...save.flags,
      chapterOneGuidedComplete: true,
      m15ChapterOneOnboardingComplete: true,
      ranchFeedStock: 24,
      ranchMaterialsStock: 40,
    },
  };
}

function prepareDefenseReadySave(): GameSave {
  let save = prepareChapterTwoSave(chapterOneCompleteSave());
  save = inspectChapterTwoTracks(save).save;
  save = consultChapterTwoPetra(save).save;
  const guardId = save.creatures?.[0]?.creatureId as CreatureId;
  save = {
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
  };
  return prepareChapterTwoSave(save);
}

test("Chapter 2 remains locked until Chapter 1 completes", () => {
  const save = createNewGameSave("Locked Story", 0);
  const prepared = prepareChapterTwoSave(save);
  assert.equal(prepared, save);
  assert.equal(getChapterTwoState(prepared).stage, "locked");
});

test("Chapter 2 advances through tracks, Petra, construction, and patrol preparation", () => {
  let save = prepareChapterTwoSave(chapterOneCompleteSave());
  assert.equal(getChapterTwoState(save).stage, "tracks");

  const tracks = inspectChapterTwoTracks(save);
  assert.equal(tracks.ok, true);
  save = tracks.save;
  assert.equal(getChapterTwoState(save).stage, "petra");

  const petra = consultChapterTwoPetra(save);
  assert.equal(petra.ok, true);
  save = petra.save;
  assert.equal(getChapterTwoState(save).stage, "fortify");

  const guardId = save.creatures?.[0]?.creatureId as CreatureId;
  save = prepareChapterTwoSave({
    ...save,
    flags: { ...save.flags, builderProject_reinforced_fence_built: true },
    ranchJobs: {
      ...save.ranchJobs!,
      assignments: { ...save.ranchJobs!.assignments, security_patrol: [guardId] },
    },
  });
  const state = getChapterTwoState(save);
  assert.equal(state.fortificationBuilt, true);
  assert.equal(state.patrolPrepared, true);
  assert.equal(state.stage, "defense");
});

test("the first Chapter 2 defense is guaranteed, tagged, persisted, and cannot reroll", () => {
  const ready = prepareDefenseReadySave();
  const first = resolvePredatorNightCheck(ready, 12);
  assert.equal(first.rolled, true);
  assert.equal(first.event?.predatorType, "wolves");
  assert.equal(first.event?.storyTag, CHAPTER_TWO_DEFENSE_TAG);
  assert.equal(first.event?.eventChance, 100);
  assert.equal(getPendingPredatorEvent(first.save)?.eventId, first.event?.eventId);
  assert.equal(getChapterTwoState(first.save).defenseEventId, first.event?.eventId);

  const second = resolvePredatorNightCheck(first.save, 99);
  assert.equal(second.rolled, false);
  assert.equal(second.event?.eventId, first.event?.eventId);
  assert.equal(second.event?.startingHpPercent, first.event?.startingHpPercent);
});

test("victory or defeat advances Chapter 2 to a permanent doctrine choice", () => {
  const checked = resolvePredatorNightCheck(prepareDefenseReadySave(), 8);
  const event = checked.event!;
  const team = (checked.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const resolved = recordPredatorBattleOutcome(checked.save, event.eventId, "enemy_won", 4, team);
  const story = getChapterTwoState(resolved.save);
  assert.equal(story.defenseResolved, true);
  assert.equal(story.defenseOutcome, "enemy_won");
  assert.equal(story.stage, "doctrine");
});

test("doctrine rewards and bonuses apply exactly once", () => {
  const checked = resolvePredatorNightCheck(prepareDefenseReadySave(), 10);
  const event = checked.event!;
  const team = (checked.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const resolved = recordPredatorBattleOutcome(checked.save, event.eventId, "player_won", 3, team);
  const goldBefore = resolved.save.currencies.gold;
  const gpBefore = resolved.save.currencies.guildPoints;
  const materialsBefore = Number(resolved.save.flags.ranchMaterialsStock ?? 0);

  const chosen = chooseChapterTwoDoctrine(resolved.save, "fortify");
  assert.equal(chosen.ok, true);
  assert.equal(chosen.state.stage, "complete");
  assert.equal(chosen.save.currencies.gold, goldBefore + 250);
  assert.equal(chosen.save.currencies.guildPoints, gpBefore + 5);
  assert.equal(Number(chosen.save.flags.ranchMaterialsStock), materialsBefore + 8);
  assert.equal(chosen.save.flags.chapterTwoDoctrineSecurityBonus, 10);

  const duplicate = chooseChapterTwoDoctrine(chosen.save, "steward");
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.currencies.gold, chosen.save.currencies.gold);
  assert.equal(duplicate.save.currencies.guildPoints, chosen.save.currencies.guildPoints);
});

test("Fortify and Steward doctrines alter the live threat calculation", () => {
  const base = chapterOneCompleteSave();
  const source = base.creatures ?? [];
  const creatures = Array.from({ length: 9 }, (_, index) => ({
    ...source[index % source.length],
    creatureId: `chapter-two-threat-${index}` as CreatureId,
  }));
  const exposed: GameSave = {
    ...base,
    creatures,
    flags: {
      ...base.flags,
      ranchFeedStock: 30,
      ranchDamage: 30,
    },
  };
  const baseline = getPredatorThreatAssessment(exposed);
  const fortified = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoDoctrineSecurityBonus: 10 },
  });
  const stewarded = getPredatorThreatAssessment({
    ...exposed,
    flags: { ...exposed.flags, chapterTwoDoctrinePressureReduction: 8 },
  });
  assert.equal(fortified.security, baseline.security + 10);
  assert.equal(stewarded.pressure, Math.max(0, baseline.pressure - 8));
});

test("the active ranch UI exposes the Chapter 2 journal and doctrine choices", async () => {
  const wrapper = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterTwoQuestPanel.tsx", ROOT), "utf8");
  const predator = await readFile(new URL("src/data/predatorEvents.ts", ROOT), "utf8");
  assert.match(wrapper, /<ChapterTwoQuestPanel/);
  assert.match(panel, /Trouble Beyond the Fence/);
  assert.match(panel, /Fortified Perimeter/);
  assert.match(panel, /Trail Wardens/);
  assert.match(panel, /Quiet Pastures/);
  assert.match(predator, /CHAPTER_TWO_DEFENSE_TAG/);
  assert.match(predator, /chapter_two_defense_/);
});
