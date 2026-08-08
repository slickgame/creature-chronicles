import test from "node:test";
import assert from "node:assert/strict";
import {
  CREATURE_AMBITIONS,
  getCreatureAmbitionProgress,
  getPrimaryCreatureAmbition,
} from "../src/data/creatureAmbitions";
import { createEmptyCreatureCareerRecord } from "../src/data/creatureCareerRecords";
import type { CreatureId } from "../src/types/ids";
import type { GameSave } from "../src/types/save";

const creatureId = "ambition_test_creature" as CreatureId;

function makeSave(): GameSave {
  const record = createEmptyCreatureCareerRecord(creatureId, 1);
  return {
    dayState: { dayNumber: 12, weekday: "Mon", month: 1, dayOfMonth: 12, weekNumber: 2 },
    creatures: [],
    birthHistory: [],
    creatureCareers: {
      version: 1,
      recordsByCreatureId: { [String(creatureId)]: record },
      appliedEventKeys: [],
    },
    flags: {},
  } as unknown as GameSave;
}

test("Ambitions v1 exposes eight career-backed definitions", () => {
  assert.equal(CREATURE_AMBITIONS.length, 8);
  assert.ok(CREATURE_AMBITIONS.every((definition) => definition.target > 0));
  assert.ok(CREATURE_AMBITIONS.every((definition) => definition.milestoneTargets.length >= 3));
});

test("primary ambition assignment is stable for a creature", () => {
  const save = makeSave();
  const first = getPrimaryCreatureAmbition(save, creatureId);
  const second = getPrimaryCreatureAmbition(save, creatureId);
  assert.equal(first.ambitionId, second.ambitionId);
});

test("strong existing career progress determines the primary ambition", () => {
  const save = makeSave();
  save.creatureCareers!.recordsByCreatureId[String(creatureId)] = {
    ...save.creatureCareers!.recordsByCreatureId[String(creatureId)],
    victories: 20,
    daysWorked: 1,
  };
  assert.equal(getPrimaryCreatureAmbition(save, creatureId).ambitionId, "coliseum_champion");
});

test("ambition progress reports milestones and completion", () => {
  const save = makeSave();
  save.creatureCareers!.recordsByCreatureId[String(creatureId)] = {
    ...save.creatureCareers!.recordsByCreatureId[String(creatureId)],
    guildRequestsCompleted: 10,
  };
  const progress = getCreatureAmbitionProgress(save, creatureId, "guild_contributor");
  assert.equal(progress.progress, 10);
  assert.equal(progress.percent, 100);
  assert.equal(progress.completed, true);
  assert.deepEqual(progress.reachedMilestones, [1, 3, 6, 10]);
  assert.equal(progress.nextMilestone, null);
});
