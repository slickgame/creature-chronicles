import assert from "node:assert/strict";
import test from "node:test";
import {
  applyHeirloomBattleEffect,
  applyHeirloomGuildEffect,
  applyHeirloomHatchEffect,
  applyHeirloomRanchWorkEffect,
  applyHeirloomTrainingEffect,
} from "../src/data/creatureHeirloomEffects.ts";
import { createNewGameSave } from "../src/lib/save/localSave.ts";
import type { CreatureId } from "../src/types/ids.ts";
import type { CreatureHeirloom, HeirloomCategory } from "../src/types/legacy.ts";
import type { GameSave } from "../src/types/save.ts";

function withHeirlooms(save: GameSave, categories: HeirloomCategory[], sourceCreatureId?: CreatureId): GameSave {
  const sourceId = sourceCreatureId ?? save.creatures![0].creatureId;
  const heirlooms = Object.fromEntries(
    categories.map((category, index) => {
      const heirloom: CreatureHeirloom = {
        heirloomId: `test_heirloom_${category}_${index}`,
        version: 1,
        sourceCreatureId: sourceId,
        sourceCreatureName: `Legacy ${index + 1}`,
        name: `${category} test heirloom`,
        category,
        description: "Regression fixture",
        legacyPrestigeValue: 10,
        createdAtDayNumber: 1,
        createdAt: new Date(0).toISOString(),
      };
      return [heirloom.heirloomId, heirloom];
    }),
  );
  return {
    ...save,
    creatureLegacy: {
      version: 1,
      retiredByCreatureId: {},
      heirloomsById: heirlooms,
      hallByCreatureId: {},
      processedEventKeys: [],
    },
  };
}

function affection(save: GameSave, creatureId: CreatureId): number {
  return save.creatures!.find((creature) => creature.creatureId === creatureId)!.affection;
}

test("combat and protection Heirlooms give a capped idempotent victory morale bonus", () => {
  const base = createNewGameSave("Heirloom Battle", 0);
  const ids = base.creatures!.slice(0, 2).map((creature) => creature.creatureId);
  const save = withHeirlooms(base, ["combat", "protection", "combat", "combat"]);
  const before = ids.map((id) => affection(save, id));
  const applied = applyHeirloomBattleEffect(save, "battle-1", ids, "player_won");
  assert.equal(applied.bonus, 3);
  assert.deepEqual(ids.map((id) => affection(applied.save, id)), before.map((value) => Math.min(100, value + 3)));
  const duplicate = applyHeirloomBattleEffect(applied.save, "battle-1", ids, "player_won");
  assert.equal(duplicate.bonus, 0);
  assert.deepEqual(ids.map((id) => affection(duplicate.save, id)), ids.map((id) => affection(applied.save, id)));
});

test("caregiving and Guild Heirlooms reward their matching completed activities once", () => {
  const base = createNewGameSave("Heirloom Activities", 0);
  const creatureId = base.creatures![0].creatureId;
  const save = withHeirlooms(base, ["caregiving", "guild"]);
  const start = affection(save, creatureId);
  const training = applyHeirloomTrainingEffect(save, "1:strength", creatureId);
  assert.equal(training.bonus, 1);
  const guild = applyHeirloomGuildEffect(training.save, "contract-1", creatureId);
  assert.equal(guild.bonus, 1);
  assert.equal(affection(guild.save, creatureId), Math.min(100, start + 2));
  assert.equal(applyHeirloomGuildEffect(guild.save, "contract-1", creatureId).bonus, 0);
});

test("work Heirlooms update successful Ranch job Affection and result text", () => {
  const base = createNewGameSave("Heirloom Work", 0);
  const creature = base.creatures![0];
  const save = withHeirlooms(base, ["work", "work"]);
  const results = [{
    jobId: "security_patrol" as const,
    jobName: "Security Patrol",
    creatureId: creature.creatureId,
    creatureName: creature.nickname,
    goldReward: 2,
    guildPointReward: 0,
    affectionReward: 1,
    energyCost: 2,
    message: "Worked successfully.",
  }];
  const applied = applyHeirloomRanchWorkEffect(save, results, 1);
  assert.equal(applied.bonus, 2);
  assert.equal(applied.results[0].affectionReward, 3);
  assert.match(applied.results[0].message, /Work Heirlooms added \+2 Affection/);
  assert.equal(applyHeirloomRanchWorkEffect(applied.save, applied.results, 1).bonus, 0);
});

test("Founder's Ribbons affect direct descendants while general tokens welcome any hatchling", () => {
  const base = createNewGameSave("Heirloom Hatch", 0);
  const parentId = base.creatures![0].creatureId;
  const childId = base.creatures![1].creatureId;
  const save = withHeirlooms(base, ["dynasty", "general"], parentId);
  const before = affection(save, childId);
  const applied = applyHeirloomHatchEffect(save, {
    creatureId: childId,
    lineage: { parentCreatureIds: [parentId] },
  });
  assert.equal(applied.bonus, 3);
  assert.equal(affection(applied.save, childId), Math.min(100, before + 3));
  assert.match(applied.note ?? "", /Founder's Blessing \+2/);
  assert.match(applied.note ?? "", /Legacy Welcome \+1/);
  assert.equal(applyHeirloomHatchEffect(applied.save, { creatureId: childId, lineage: { parentCreatureIds: [parentId] } }).bonus, 0);
});
