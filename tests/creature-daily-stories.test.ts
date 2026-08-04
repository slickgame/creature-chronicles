import assert from "node:assert/strict";
import test from "node:test";
import { processDailyCreatureStories } from "@/data/creatureDailyStories";
import { getChronicleEntries, getCreatureMemories } from "@/data/creatureMemories";
import { getCreatureRelationship } from "@/data/creatureRelationships";
import { createNewGameSave } from "@/lib/save/localSave";
import type { RanchJobResult } from "@/types/ranchJobs";

test("one shared Ranch Day story creates mirrored memories and one Chronicle entry", () => {
  const save = createNewGameSave("Daily Story Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const results: RanchJobResult[] = [left, right].map((creature) => ({
    jobId: "comfort_care",
    jobName: "Comfort Care",
    creatureId: creature.creatureId,
    creatureName: creature.nickname,
    goldReward: 0,
    guildPointReward: 0,
    affectionReward: 1,
    energyCost: 1,
    message: `${creature.nickname} completed Comfort Care.`,
  }));

  const updated = processDailyCreatureStories(save, results, save.dayState.dayNumber);
  const relationship = getCreatureRelationship(updated, left.creatureId, right.creatureId);
  assert.equal(relationship.sharedEvents, 1);
  assert.ok(getCreatureMemories(updated, left.creatureId).some((memory) => memory.sourceKey.startsWith("daily-story:")));
  assert.ok(getCreatureMemories(updated, right.creatureId).some((memory) => memory.sourceKey.startsWith("daily-story:")));
  assert.equal(getChronicleEntries(updated).filter((entry) => entry.sourceKey.startsWith("daily-story:")).length, 1);
  assert.equal(updated.flags.creatureDailyStoryDayNumber, save.dayState.dayNumber);

  const repeated = processDailyCreatureStories(updated, results, save.dayState.dayNumber);
  assert.equal(getCreatureRelationship(repeated, left.creatureId, right.creatureId).sharedEvents, 1);
  assert.equal(getChronicleEntries(repeated).filter((entry) => entry.sourceKey.startsWith("daily-story:")).length, 1);
});

test("a one-creature ranch receives a personality-backed solo work story", () => {
  const save = createNewGameSave("Solo Story Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const soloSave = {
    ...save,
    creatures: [creature],
    creatureIds: [creature.creatureId],
  };
  const result: RanchJobResult = {
    jobId: "security_patrol",
    jobName: "Security Patrol",
    creatureId: creature.creatureId,
    creatureName: creature.nickname,
    goldReward: 0,
    guildPointReward: 0,
    affectionReward: 1,
    energyCost: 1,
    message: `${creature.nickname} completed Security Patrol.`,
  };
  const updated = processDailyCreatureStories(soloSave, [result], soloSave.dayState.dayNumber);
  assert.ok(getCreatureMemories(updated, creature.creatureId).some((memory) => memory.sourceKey.startsWith("daily-solo-story:")));
});
