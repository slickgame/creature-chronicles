import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  CHAPTER_THREE_EXHIBITION_STATE_FLAG,
  type GuildExhibitionState,
} from "@/data/chapterThreeGuildExhibition";
import {
  CHAPTER_THREE_PATRON_STATE_FLAG,
  choosePatronCircuitPatron,
  completePatronCircuitAssignment,
  finalizePatronCircuit,
  getChapterThreePatronCircuitState,
  getPatronCircuitBonuses,
  prepareChapterThreePatronCircuitSave,
  reviewPatronInvitations,
  type PatronCircuitPatron,
} from "@/data/chapterThreePatronCircuit";
import {
  BUILDER_PROJECTS,
  commissionBuilderProject,
  getBuilderProjectEffectiveCost,
} from "@/data/builderProjects";
import { ensureCurrentGuildState } from "@/data/guild";
import {
  acceptRoseLanternHouseRules,
  getRoseLanternState,
  workRoseLanternHospitalityShift,
} from "@/data/roseLantern";
import { createNewGameSave } from "@/lib/save/localSave";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function exhibitionCompleteSave(): GameSave {
  const save = createNewGameSave("Patron Circuit", 0);
  const representative = save.creatures?.[0];
  assert.ok(representative);
  const exhibitionState: GuildExhibitionState = {
    version: 1,
    stage: "complete",
    startedDayNumber: 14,
    invitationRead: true,
    representativeId: representative.creatureId,
    representativeName: representative.nickname,
    discipline: "bond",
    scoreBreakdown: {
      level: 10,
      stats: 20,
      affection: 12,
      condition: 14,
      discipline: 10,
      shiny: 0,
      total: 66,
    },
    placement: "bronze",
    rewardClaimed: true,
    history: [],
  };
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 20, weekNumber: 4 },
    currencies: { ...save.currencies, gold: 3000, guildPoints: 30, energy: 100 },
    flags: {
      ...save.flags,
      ranchFeedStock: 30,
      ranchMaterialsStock: 50,
      [CHAPTER_THREE_EXHIBITION_STATE_FLAG]: JSON.stringify(exhibitionState),
      chapterThreeGuildExhibitionComplete: true,
      chapterThreeExhibitionRepresentativeId: representative.creatureId,
    },
  };
}

function assignmentReadySave(patron: PatronCircuitPatron, source: GameSave = exhibitionCompleteSave()): GameSave {
  const prepared = prepareChapterThreePatronCircuitSave(source);
  const reviewed = reviewPatronInvitations(prepared).save;
  return choosePatronCircuitPatron(reviewed, patron).save;
}

function completedAssignmentSave(patron: PatronCircuitPatron, source: GameSave = exhibitionCompleteSave()): GameSave {
  let ready = assignmentReadySave(patron, source);
  if (patron === "lantern") ready = acceptRoseLanternHouseRules(ready).save;
  const completed = completePatronCircuitAssignment(ready);
  assert.equal(completed.ok, true);
  return completed.save;
}

function finalizedPatronSave(patron: PatronCircuitPatron, source: GameSave = exhibitionCompleteSave()): GameSave {
  const completed = completedAssignmentSave(patron, source);
  const nextDay = {
    ...completed,
    dayState: { ...completed.dayState, dayNumber: completed.dayState.dayNumber + 1 },
  };
  const prepared = prepareChapterThreePatronCircuitSave(nextDay);
  const finalized = finalizePatronCircuit(prepared);
  assert.equal(finalized.ok, true);
  return finalized.save;
}

test("Patron Circuit remains locked until the Guild Exhibition is complete", () => {
  const save = createNewGameSave("Patron Locked", 0);
  assert.equal(prepareChapterThreePatronCircuitSave(save), save);
  assert.equal(getChapterThreePatronCircuitState(save).stage, "locked");
});

test("the circuit advances through invitations, sponsor selection, assignment, and next-day report", () => {
  const prepared = prepareChapterThreePatronCircuitSave(exhibitionCompleteSave());
  assert.equal(getChapterThreePatronCircuitState(prepared).stage, "invitations");

  const reviewed = reviewPatronInvitations(prepared);
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.state.stage, "patron");

  const selected = choosePatronCircuitPatron(reviewed.save, "registry");
  assert.equal(selected.ok, true);
  assert.equal(selected.state.stage, "assignment");
  assert.equal(selected.state.patron, "registry");

  const assigned = completePatronCircuitAssignment(selected.save);
  assert.equal(assigned.ok, true);
  assert.equal(assigned.state.stage, "waiting");
  assert.equal(finalizePatronCircuit(assigned.save).ok, false);

  const nextDay = prepareChapterThreePatronCircuitSave({
    ...assigned.save,
    dayState: { ...assigned.save.dayState, dayNumber: assigned.save.dayState.dayNumber + 1 },
  });
  assert.equal(getChapterThreePatronCircuitState(nextDay).stage, "report");
  assert.equal(finalizePatronCircuit(nextDay).ok, true);
});

test("all three sponsor assignments preserve creatures and cannot fail for lack of resources", () => {
  for (const patron of ["registry", "builder", "lantern"] as const) {
    const poor = {
      ...exhibitionCompleteSave(),
      currencies: { ...exhibitionCompleteSave().currencies, gold: 0, energy: 0 },
      flags: {
        ...exhibitionCompleteSave().flags,
        ranchFeedStock: 0,
        ranchMaterialsStock: 0,
      },
    };
    let ready = assignmentReadySave(patron, poor);
    const beforeCreatureIds = ready.creatureIds.slice();
    if (patron === "lantern") {
      const blocked = completePatronCircuitAssignment(ready);
      assert.equal(blocked.ok, false);
      assert.match(blocked.message, /house rules/i);
      ready = acceptRoseLanternHouseRules(ready).save;
    }
    const result = completePatronCircuitAssignment(ready);
    assert.equal(result.ok, true);
    assert.deepEqual(result.save.creatureIds, beforeCreatureIds);
    assert.equal(result.save.creatures?.length, ready.creatures?.length);
  }
});

test("final rewards and representative progression apply exactly once", () => {
  const source = exhibitionCompleteSave();
  const representativeId = String(source.flags.chapterThreeExhibitionRepresentativeId);
  const beforeRepresentative = source.creatures!.find((creature) => creature.creatureId === representativeId)!;
  const finalSave = finalizedPatronSave("builder", source);
  const afterRepresentative = finalSave.creatures!.find((creature) => creature.creatureId === representativeId)!;

  assert.equal(finalSave.currencies.gold, source.currencies.gold + 175);
  assert.equal(finalSave.currencies.guildPoints, source.currencies.guildPoints + 3);
  assert.equal(Number(finalSave.flags.ranchMaterialsStock), Number(source.flags.ranchMaterialsStock) + 4);
  assert.equal(afterRepresentative.xp, beforeRepresentative.xp + 15);
  assert.equal(afterRepresentative.affection, Math.min(100, beforeRepresentative.affection + 2));
  assert.equal(getChapterThreePatronCircuitState(finalSave).rewardClaimed, true);
  assert.equal(typeof finalSave.flags[CHAPTER_THREE_PATRON_STATE_FLAG], "string");

  const duplicate = finalizePatronCircuit(finalSave);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.currencies.gold, finalSave.currencies.gold);
  assert.equal(duplicate.save.currencies.guildPoints, finalSave.currencies.guildPoints);
  assert.deepEqual(duplicate.save.creatures, finalSave.creatures);
});

test("Registry Sponsorship boosts current and future Guild contracts once per week", () => {
  const source = ensureCurrentGuildState(exhibitionCompleteSave());
  const baseline = source.guild!.contracts.find((contract) => contract.weekNumber === source.dayState.weekNumber)!;
  const finalSave = finalizedPatronSave("registry", source);
  const applied = ensureCurrentGuildState(finalSave);
  const improved = applied.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;

  assert.ok(improved.goldReward > baseline.goldReward);
  assert.equal(improved.guildPointReward, baseline.guildPointReward + 1);
  assert.equal(applied.flags.chapterThreePatronGuildAppliedWeek, applied.dayState.weekNumber);

  const duplicate = ensureCurrentGuildState(applied);
  const duplicateContract = duplicate.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;
  assert.equal(duplicateContract.goldReward, improved.goldReward);
  assert.equal(duplicateContract.guildPointReward, improved.guildPointReward);

  const nextWeek = applied.dayState.weekNumber + 1;
  const future = ensureCurrentGuildState({
    ...applied,
    dayState: { ...applied.dayState, weekNumber: nextWeek, dayNumber: applied.dayState.dayNumber + 7 },
  });
  const control = ensureCurrentGuildState({
    ...applied,
    guild: undefined,
    dayState: { ...applied.dayState, weekNumber: nextWeek, dayNumber: applied.dayState.dayNumber + 7 },
    flags: {
      ...applied.flags,
      chapterThreePatronGuildGoldPercent: 0,
      chapterThreePatronGuildGpBonus: 0,
      chapterThreePatronGuildAppliedWeek: 0,
    },
  });
  const futureContract = future.guild!.contracts.find((contract) => contract.weekNumber === nextWeek)!;
  const controlContract = control.guild!.contracts.find((contract) => contract.contractId === futureContract.contractId)!;
  assert.ok(futureContract.goldReward > controlContract.goldReward);
  assert.equal(futureContract.guildPointReward, controlContract.guildPointReward + 1);
});

test("Petra's Works Charter discounts every remaining project without changing built projects", () => {
  const finalSave = finalizedPatronSave("builder");
  const project = BUILDER_PROJECTS.find((entry) => entry.id === "reinforced_fence")!;
  const cost = getBuilderProjectEffectiveCost(finalSave, project.id);
  assert.equal(cost.discountPercent, 10);
  assert.equal(cost.gold, Math.ceil(project.costGold * 0.9));
  assert.equal(cost.materials, Math.ceil(project.costMaterials * 0.9));

  const goldBefore = finalSave.currencies.gold;
  const materialsBefore = Number(finalSave.flags.ranchMaterialsStock);
  const built = commissionBuilderProject(finalSave, project.id);
  assert.equal(built.ok, true);
  assert.equal(built.save.currencies.gold, goldBefore - cost.gold);
  assert.equal(Number(built.save.flags.ranchMaterialsStock), materialsBefore - cost.materials);
  assert.equal(built.save.flags.builderProject_reinforced_fence_built, true);
  assert.equal(commissionBuilderProject(built.save, project.id).ok, false);
});

test("Rose Lantern charter grants initial standing and improves every future hospitality shift", () => {
  const source = exhibitionCompleteSave();
  const finalSave = finalizedPatronSave("lantern", source);
  const charterState = getRoseLanternState(finalSave);
  assert.equal(charterState.houseRulesAccepted, true);
  assert.ok(charterState.trust >= 6);
  assert.ok(charterState.rumorTokens >= 2);

  const beforeGold = finalSave.currencies.gold;
  const beforeEnergy = finalSave.currencies.energy;
  const beforeTrust = charterState.trust;
  const beforeRumors = charterState.rumorTokens;
  const shift = workRoseLanternHospitalityShift(finalSave);
  assert.equal(shift.ok, true);
  assert.equal(shift.save.currencies.energy, beforeEnergy - 15);
  assert.ok(shift.save.currencies.gold >= beforeGold + 42);
  assert.equal(shift.state.trust, Math.min(100, beforeTrust + 4));
  assert.equal(shift.state.rumorTokens, beforeRumors + 2);
  assert.equal(shift.save.flags.m69RoseLanternPatronBonusUsed, true);
});

test("the active Ranch Hub hands completed Exhibition saves to Patron Circuit", async () => {
  const wrapper = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterThreePatronCircuitPanel.tsx", ROOT), "utf8");
  const builder = await readFile(new URL("src/data/builderProjectsPatron.ts", ROOT), "utf8");
  const lantern = await readFile(new URL("src/data/roseLanternPatron.ts", ROOT), "utf8");
  const tsconfig = await readFile(new URL("tsconfig.json", ROOT), "utf8");
  const loader = await readFile(new URL("scripts/ts-test-loader.mjs", ROOT), "utf8");

  assert.match(wrapper, /exhibitionComplete/);
  assert.match(wrapper, /ChapterThreePatronCircuitPanel/);
  assert.match(panel, /The Patron Circuit/);
  assert.match(panel, /Acknowledge Adult, Optional, Consent-First House Rules/);
  assert.match(builder, /chapterThreePatronBuilderDiscountPercent/);
  assert.match(lantern, /chapterThreePatronHospitalityGoldBonus/);
  assert.match(tsconfig, /builderProjectsPatron/);
  assert.match(tsconfig, /roseLanternPatron/);
  assert.match(loader, /builderProjectsPatron/);
  assert.match(loader, /roseLanternPatron/);
});

test("all completed patron routes expose distinct permanent bonuses", () => {
  const registry = getPatronCircuitBonuses(finalizedPatronSave("registry"));
  const builder = getPatronCircuitBonuses(finalizedPatronSave("builder"));
  const lantern = getPatronCircuitBonuses(finalizedPatronSave("lantern"));

  assert.deepEqual(registry, {
    guildGoldPercent: 4,
    guildPointBonus: 1,
    builderDiscountPercent: 0,
    hospitalityGoldBonus: 0,
    hospitalityTrustBonus: 0,
    hospitalityRumorBonus: 0,
  });
  assert.equal(builder.builderDiscountPercent, 10);
  assert.equal(lantern.hospitalityGoldBonus, 10);
  assert.equal(lantern.hospitalityTrustBonus, 1);
  assert.equal(lantern.hospitalityRumorBonus, 1);
});
