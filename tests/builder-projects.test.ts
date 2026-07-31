import assert from "node:assert/strict";
import test from "node:test";
import {
  commissionBuilderProject,
  getBuilderProjectProgress,
  getBuilderSecurityBonus,
  isBuilderProjectBuilt,
} from "@/data/builderProjects";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function fundedSave(): GameSave {
  const save = createNewGameSave("Builder Test", 0);
  return {
    ...save,
    currencies: { ...save.currencies, gold: 20000 },
    flags: {
      ...save.flags,
      ranchMaterialsStock: 200,
      chapterOneGuidedComplete: true,
    },
    dayState: { ...save.dayState, dayNumber: 8 },
  };
}

function build(save: GameSave, projectId: Parameters<typeof commissionBuilderProject>[1]): GameSave {
  const result = commissionBuilderProject(save, projectId);
  assert.equal(result.ok, true, result.message);
  return result.save;
}

test("future habitats stay locked until Petra completes their land prerequisite", () => {
  const save = fundedSave();
  const locked = getBuilderProjectProgress(save, "chicken_coop");
  assert.equal(locked.status, "locked");
  assert.deepEqual(locked.missingPrerequisites.map((item) => item.id), ["north_pasture_land"]);

  const expanded = build(save, "north_pasture_land");
  const available = getBuilderProjectProgress(expanded, "chicken_coop");
  assert.equal(available.status, "available");
  assert.equal(available.affordable, true);
});

test("commissioning a project deducts exact resources and persists its built state", () => {
  const save = fundedSave();
  const result = commissionBuilderProject(save, "north_pasture_land");
  assert.equal(result.ok, true);
  assert.equal(result.save.currencies.gold, save.currencies.gold - 850);
  assert.equal(Number(result.save.flags.ranchMaterialsStock), Number(save.flags.ranchMaterialsStock) - 12);
  assert.equal(isBuilderProjectBuilt(result.save, "north_pasture_land"), true);
  assert.equal(getBuilderProjectProgress(result.save, "north_pasture_land").status, "built");
});

test("condition-gated predator pressure stays disabled before story and attractor gates", () => {
  const save = createNewGameSave("Quiet Ranch", 0);
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(assessment.eligible, false);
  assert.equal(assessment.eventChance, 0);
  assert.ok(assessment.blockers.some((item) => item.includes("Chapter 1")));
  assert.ok(assessment.blockers.some((item) => item.includes("livestock")));
});

test("future livestock and stored feed can expose a low-security ranch", () => {
  let save = fundedSave();
  save = build(save, "north_pasture_land");
  save = build(save, "chicken_coop");
  save = { ...save, flags: { ...save.flags, ranchFeedStock: 30, ranchSecurityScoreToday: 0 } };
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(assessment.eligible, true);
  assert.ok(assessment.eventChance > 0);
  assert.ok(assessment.pressure > assessment.security);
});

test("permanent fence and watchtower security can guard an expanded ranch", () => {
  let save = fundedSave();
  save = build(save, "north_pasture_land");
  save = build(save, "woodline_acre_land");
  save = build(save, "reinforced_fence");
  save = build(save, "watchtower");
  const sourceCreatures = save.creatures ?? [];
  const creatures = Array.from({ length: 7 }, (_, index) => ({
    ...sourceCreatures[index % sourceCreatures.length],
    creatureId: `builder-threat-${index}` as CreatureId,
  }));
  save = { ...save, creatures, flags: { ...save.flags, ranchFeedStock: 0, ranchSecurityScoreToday: 0 } };
  const assessment = getPredatorThreatAssessment(save);
  assert.equal(getBuilderSecurityBonus(save), 42);
  assert.equal(assessment.eligible, false);
  assert.equal(assessment.tier, "guarded");
  assert.ok(assessment.security >= assessment.requiredSecurity);
});
