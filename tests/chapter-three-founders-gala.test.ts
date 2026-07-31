import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  CHAPTER_THREE_EXHIBITION_STATE_FLAG,
  type GuildExhibitionState,
} from "@/data/chapterThreeGuildExhibition";
import {
  CHAPTER_THREE_PATRON_STATE_FLAG,
  type PatronCircuitPatron,
  type PatronCircuitState,
} from "@/data/chapterThreePatronCircuit";
import {
  CHAPTER_THREE_GALA_STATE_FLAG,
  FOUNDERS_GALA_PLANS,
  calculateFoundersGalaScore,
  chooseFoundersGalaPlan,
  finalizeFoundersGala,
  getChapterThreeFoundersGalaState,
  getFoundersGalaLegacyBonuses,
  getFoundersGalaPlansForSave,
  hostFoundersGala,
  prepareChapterThreeFoundersGalaSave,
  reviewFoundersGalaInvitation,
  type FoundersGalaPlanId,
} from "@/data/chapterThreeFoundersGala";
import {
  BUILDER_PROJECTS,
  commissionBuilderProject,
  getBuilderProjectEffectiveCost,
} from "@/data/builderProjects";
import { ensureCurrentGuildState } from "@/data/guild";
import {
  ROSE_LANTERN_STATE_FLAG,
  getRoseLanternState,
  workRoseLanternHospitalityShift,
  type RoseLanternState,
} from "@/data/roseLantern";
import { createNewGameSave } from "@/lib/save/localSave";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function patronCompleteSave(patron: PatronCircuitPatron): GameSave {
  const save = createNewGameSave("Founders Gala", 0);
  const representative = save.creatures?.[0];
  assert.ok(representative);
  const exhibitionState: GuildExhibitionState = {
    version: 1,
    stage: "complete",
    startedDayNumber: 12,
    invitationRead: true,
    representativeId: representative.creatureId,
    representativeName: representative.nickname,
    discipline: "bond",
    scoreBreakdown: {
      level: 12,
      stats: 20,
      affection: 10,
      condition: 12,
      discipline: 10,
      shiny: 0,
      total: 64,
    },
    placement: "bronze",
    rewardClaimed: true,
    history: [],
  };
  const patronState: PatronCircuitState = {
    version: 1,
    stage: "complete",
    startedDayNumber: 15,
    invitationsRead: true,
    patron,
    assignmentCompleted: true,
    assignmentDayNumber: 16,
    reportRead: true,
    rewardClaimed: true,
    history: [],
  };
  const lanternState: RoseLanternState = {
    version: 1,
    houseRulesAccepted: true,
    visits: 3,
    trust: patron === "lantern" ? 32 : 18,
    rumorTokens: 5,
    lastVisitDayNumber: 0,
    lastShiftDayNumber: 0,
    lastRumorDayNumber: 0,
    lastRumor: "",
    history: [],
  };
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 24, weekNumber: 4 },
    currencies: { ...save.currencies, gold: 4000, guildPoints: 36, energy: 100 },
    flags: {
      ...save.flags,
      ranchMaterialsStock: 50,
      ranchFeedStock: 30,
      [CHAPTER_THREE_EXHIBITION_STATE_FLAG]: JSON.stringify(exhibitionState),
      [CHAPTER_THREE_PATRON_STATE_FLAG]: JSON.stringify(patronState),
      [ROSE_LANTERN_STATE_FLAG]: JSON.stringify(lanternState),
      chapterThreeGuildExhibitionComplete: true,
      chapterThreePatronCircuitComplete: true,
      chapterThreePatronSelected: patron,
      chapterThreeExhibitionScore: 64,
      chapterThreeExhibitionRepresentativeId: representative.creatureId,
      chapterThreePatronGuildGoldPercent: patron === "registry" ? 4 : 0,
      chapterThreePatronGuildGpBonus: patron === "registry" ? 1 : 0,
      chapterThreePatronBuilderDiscountPercent: patron === "builder" ? 10 : 0,
      chapterThreePatronHospitalityGoldBonus: patron === "lantern" ? 10 : 0,
      chapterThreePatronHospitalityTrustBonus: patron === "lantern" ? 1 : 0,
      chapterThreePatronHospitalityRumorBonus: patron === "lantern" ? 1 : 0,
    },
  };
}

function planReadySave(patron: PatronCircuitPatron, planId: FoundersGalaPlanId): GameSave {
  const prepared = prepareChapterThreeFoundersGalaSave(patronCompleteSave(patron));
  const reviewed = reviewFoundersGalaInvitation(prepared);
  assert.equal(reviewed.ok, true);
  const selected = chooseFoundersGalaPlan(reviewed.save, planId);
  assert.equal(selected.ok, true);
  return selected.save;
}

function hostedSave(patron: PatronCircuitPatron, planId: FoundersGalaPlanId): GameSave {
  const ready = planReadySave(patron, planId);
  const hosted = hostFoundersGala(ready);
  assert.equal(hosted.ok, true);
  return hosted.save;
}

function finalizedSave(patron: PatronCircuitPatron, planId: FoundersGalaPlanId): GameSave {
  const hosted = hostedSave(patron, planId);
  const nextDay = prepareChapterThreeFoundersGalaSave({
    ...hosted,
    dayState: { ...hosted.dayState, dayNumber: hosted.dayState.dayNumber + 1 },
  });
  const finalized = finalizeFoundersGala(nextDay);
  assert.equal(finalized.ok, true);
  return finalized.save;
}

test("Founders Gala remains locked until the Patron Circuit is complete", () => {
  const save = createNewGameSave("Gala Locked", 0);
  assert.equal(prepareChapterThreeFoundersGalaSave(save), save);
  assert.equal(getChapterThreeFoundersGalaState(save).stage, "locked");
});

test("each patron receives one free and one stronger paid gala plan", () => {
  for (const patron of ["registry", "builder", "lantern"] as const) {
    const prepared = prepareChapterThreeFoundersGalaSave(patronCompleteSave(patron));
    const reviewed = reviewFoundersGalaInvitation(prepared).save;
    const plans = getFoundersGalaPlansForSave(reviewed);
    assert.equal(plans.length, 2);
    assert.equal(plans.every((plan) => plan.patron === patron), true);
    assert.equal(plans.some((plan) => plan.goldCost === 0 && plan.materialsCost === 0 && plan.rumorTokenCost === 0), true);
    assert.ok(Math.max(...plans.map((plan) => plan.scoreBonus)) > Math.min(...plans.map((plan) => plan.scoreBonus)));
  }
  assert.equal(FOUNDERS_GALA_PLANS.length, 6);
});

test("paid gala plans deduct their exact committed resource once", () => {
  const registry = planReadySave("registry", "registry_patron_banquet");
  const registryGold = registry.currencies.gold;
  const registryHosted = hostFoundersGala(registry);
  assert.equal(registryHosted.save.currencies.gold, registryGold - 75);
  assert.equal(hostFoundersGala(registryHosted.save).ok, false);

  const builder = planReadySave("builder", "builder_showcase_pavilion");
  const builderMaterials = Number(builder.flags.ranchMaterialsStock);
  const builderHosted = hostFoundersGala(builder);
  assert.equal(Number(builderHosted.save.flags.ranchMaterialsStock), builderMaterials - 4);

  const lantern = planReadySave("lantern", "lantern_evening_reception");
  const rumors = getRoseLanternState(lantern).rumorTokens;
  const lanternHosted = hostFoundersGala(lantern);
  assert.equal(getRoseLanternState(lanternHosted.save).rumorTokens, rumors - 1);
});

test("gala scoring is deterministic and paid plans improve the same route", () => {
  const registry = patronCompleteSave("registry");
  const free = calculateFoundersGalaScore(registry, "registry_open_ledger");
  const repeated = calculateFoundersGalaScore(registry, "registry_open_ledger");
  const paid = calculateFoundersGalaScore(registry, "registry_patron_banquet");
  assert.deepEqual(free, repeated);
  assert.equal(paid.total, free.total + 8);
  assert.ok(free.total >= 0 && free.total <= 100);
});

test("hosting records a non-failing outcome and waits for the next Ranch Day report", () => {
  const hosted = hostedSave("builder", "builder_volunteer_works");
  const state = getChapterThreeFoundersGalaState(hosted);
  assert.equal(state.stage, "waiting");
  assert.ok(["community", "celebrated", "landmark"].includes(state.outcome));
  assert.ok(state.scoreBreakdown);
  assert.equal(prepareChapterThreeFoundersGalaSave(hosted), hosted);
  assert.equal(finalizeFoundersGala(hosted).ok, false);

  const nextDay = prepareChapterThreeFoundersGalaSave({
    ...hosted,
    dayState: { ...hosted.dayState, dayNumber: hosted.dayState.dayNumber + 1 },
  });
  assert.equal(getChapterThreeFoundersGalaState(nextDay).stage, "report");
});

test("final rewards, Town Prestige, and representative progression apply exactly once", () => {
  const source = patronCompleteSave("registry");
  const representativeId = String(source.flags.chapterThreeExhibitionRepresentativeId);
  const beforeRepresentative = source.creatures!.find((creature) => creature.creatureId === representativeId)!;
  const finalSave = finalizedSave("registry", "registry_patron_banquet");
  const galaState = getChapterThreeFoundersGalaState(finalSave);
  const afterRepresentative = finalSave.creatures!.find((creature) => creature.creatureId === representativeId)!;

  assert.equal(galaState.stage, "complete");
  assert.equal(galaState.rewardClaimed, true);
  assert.ok(Number(finalSave.flags.townPrestige) >= 10);
  assert.ok(afterRepresentative.xp > beforeRepresentative.xp);
  assert.ok(afterRepresentative.affection > beforeRepresentative.affection);
  assert.equal(typeof finalSave.flags[CHAPTER_THREE_GALA_STATE_FLAG], "string");

  const duplicate = finalizeFoundersGala(finalSave);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.currencies.gold, finalSave.currencies.gold);
  assert.deepEqual(duplicate.save.creatures, finalSave.creatures);
});

test("all three completed routes grant shared legacies and a stronger sponsor bonus", () => {
  const registry = getFoundersGalaLegacyBonuses(finalizedSave("registry", "registry_open_ledger"));
  const builder = getFoundersGalaLegacyBonuses(finalizedSave("builder", "builder_volunteer_works"));
  const lantern = getFoundersGalaLegacyBonuses(finalizedSave("lantern", "lantern_public_salon"));

  assert.equal(registry.guildGoldPercent, 5);
  assert.equal(registry.guildPointBonus, 1);
  assert.equal(registry.builderDiscountPercent, 3);
  assert.equal(registry.hospitalityGoldBonus, 5);

  assert.equal(builder.guildGoldPercent, 2);
  assert.equal(builder.builderDiscountPercent, 8);
  assert.equal(builder.hospitalityGoldBonus, 5);

  assert.equal(lantern.guildGoldPercent, 2);
  assert.equal(lantern.builderDiscountPercent, 3);
  assert.equal(lantern.hospitalityGoldBonus, 10);
  assert.equal(lantern.hospitalityTrustBonus, 1);
  assert.equal(lantern.hospitalityRumorBonus, 1);
});

test("Founders Gala Guild legacy boosts current and future contracts once per week", () => {
  const source = ensureCurrentGuildState(patronCompleteSave("registry"));
  const baseline = source.guild!.contracts.find((contract) => contract.weekNumber === source.dayState.weekNumber)!;
  const finalSave = finalizedSave("registry", "registry_open_ledger");
  const withGuild = { ...finalSave, guild: source.guild };
  const applied = ensureCurrentGuildState(withGuild);
  const improved = applied.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;
  assert.ok(improved.goldReward > baseline.goldReward);
  assert.ok(improved.guildPointReward > baseline.guildPointReward);
  assert.equal(applied.flags.chapterThreeGalaGuildAppliedWeek, applied.dayState.weekNumber);

  const duplicate = ensureCurrentGuildState(applied);
  const duplicateContract = duplicate.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;
  assert.equal(duplicateContract.goldReward, improved.goldReward);
  assert.equal(duplicateContract.guildPointReward, improved.guildPointReward);
});

test("Builder discounts combine the patron charter and civic legacy using displayed costs", () => {
  const finalSave = finalizedSave("builder", "builder_volunteer_works");
  const project = BUILDER_PROJECTS.find((entry) => entry.id === "reinforced_fence")!;
  const cost = getBuilderProjectEffectiveCost(finalSave, project.id);
  assert.equal(cost.discountPercent, 18);
  const goldBefore = finalSave.currencies.gold;
  const materialsBefore = Number(finalSave.flags.ranchMaterialsStock);
  const built = commissionBuilderProject(finalSave, project.id);
  assert.equal(built.ok, true);
  assert.equal(built.save.currencies.gold, goldBefore - cost.gold);
  assert.equal(Number(built.save.flags.ranchMaterialsStock), materialsBefore - cost.materials);
});

test("hospitality shifts combine patron and gala bonuses exactly once", () => {
  const finalSave = finalizedSave("lantern", "lantern_public_salon");
  const before = getRoseLanternState(finalSave);
  const goldBefore = finalSave.currencies.gold;
  const shift = workRoseLanternHospitalityShift(finalSave);
  assert.equal(shift.ok, true);
  assert.ok(shift.save.currencies.gold >= goldBefore + 52);
  assert.equal(shift.state.trust, Math.min(100, before.trust + 5));
  assert.equal(shift.state.rumorTokens, before.rumorTokens + 3);
  assert.equal(shift.save.flags.m70FoundersGalaHospitalityLegacyUsed, true);
});

test("Ranch Hub and town expose the active Founders Gala and plaza", async () => {
  const ranch = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const town = await readFile(new URL("src/features/town/TownScreenC4.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterThreeFoundersGalaPanel.tsx", ROOT), "utf8");
  const guild = await readFile(new URL("src/data/guildExhibition.ts", ROOT), "utf8");
  const builder = await readFile(new URL("src/data/builderProjectsPatron.ts", ROOT), "utf8");
  const lantern = await readFile(new URL("src/data/roseLanternPatron.ts", ROOT), "utf8");

  assert.match(ranch, /patronComplete/);
  assert.match(ranch, /ChapterThreeFoundersGalaPanel/);
  assert.match(town, /launcherMode="town"/);
  assert.match(panel, /The Founders&apos; Gala/);
  assert.match(panel, /Founders&apos; Plaza/);
  assert.match(guild, /chapterThreeGalaGuildGoldPercent/);
  assert.match(builder, /chapterThreeGalaBuilderDiscountPercent/);
  assert.match(lantern, /chapterThreeGalaHospitalityGoldBonus/);
});
