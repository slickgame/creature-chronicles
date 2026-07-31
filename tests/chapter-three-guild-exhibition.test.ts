import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  CHAPTER_THREE_EXHIBITION_STATE_FLAG,
  GUILD_EXHIBITION_DISCIPLINES,
  GUILD_EXHIBITION_ENERGY_COST,
  calculateGuildExhibitionScore,
  canAffordGuildExhibitionDiscipline,
  chooseGuildExhibitionDiscipline,
  enterGuildExhibition,
  getChapterThreeGuildExhibitionState,
  getGuildExhibitionCandidates,
  getGuildExhibitionPlacementDefinition,
  prepareChapterThreeGuildExhibitionSave,
  reviewGuildExhibitionInvitation,
  selectGuildExhibitionRepresentative,
} from "@/data/chapterThreeGuildExhibition";
import { CHAPTER_TWO_WOODLINE_STATE_FLAG } from "@/data/chapterTwoIntoWoodline";
import { ensureCurrentGuildState } from "@/data/guild";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";

const ROOT = new URL("../", import.meta.url);

function chapterTwoCompleteSave(): GameSave {
  const save = createNewGameSave("Guild Exhibition", 0);
  return {
    ...save,
    dayState: { ...save.dayState, dayNumber: 14, weekNumber: 3 },
    currencies: { ...save.currencies, gold: 1000, guildPoints: 20 },
    flags: {
      ...save.flags,
      ranchFeedStock: 20,
      ranchMaterialsStock: 10,
      [CHAPTER_TWO_WOODLINE_STATE_FLAG]: JSON.stringify({
        version: 1,
        stage: "complete",
        startedDayNumber: 12,
        briefingRead: true,
        approach: "cautious",
        expeditionEventId: "chapter_two_complete",
        battleResolved: true,
        battleOutcome: "player_won",
        resolution: "rangers",
        rewardClaimed: true,
        history: [],
      }),
    },
  };
}

function invitationReviewedSave(source: GameSave = chapterTwoCompleteSave()): GameSave {
  return reviewGuildExhibitionInvitation(prepareChapterThreeGuildExhibitionSave(source)).save;
}

function representativeSelectedSave(source: GameSave = chapterTwoCompleteSave()): GameSave {
  const reviewed = invitationReviewedSave(source);
  const candidate = getGuildExhibitionCandidates(reviewed)[0];
  assert.ok(candidate);
  return selectGuildExhibitionRepresentative(reviewed, candidate.creatureId).save;
}

function exhibitionReadySave(
  discipline: "bond" | "working" | "pedigree",
  source: GameSave = chapterTwoCompleteSave(),
): GameSave {
  return chooseGuildExhibitionDiscipline(representativeSelectedSave(source), discipline).save;
}

function replaceFirstCreature(save: GameSave, transform: (creature: CreatureRecord) => CreatureRecord): GameSave {
  const first = save.creatures?.[0];
  assert.ok(first);
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) => creature.creatureId === first.creatureId ? transform(creature) : creature),
  };
}

function transformAllCreatures(save: GameSave, transform: (creature: CreatureRecord) => CreatureRecord): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map(transform),
  };
}

function withoutExhibitionReputation(flags: GameSave["flags"]): GameSave["flags"] {
  const next = { ...flags };
  delete next.chapterThreeExhibitionGuildGoldPercent;
  delete next.chapterThreeExhibitionGuildGpBonus;
  delete next.chapterThreeExhibitionGuildAppliedWeek;
  delete next.chapterThreeExhibitionGuildRewardsActive;
  return next;
}

test("Chapter 3 remains locked until Into the Woodline is complete", () => {
  const save = createNewGameSave("Locked Exhibition", 0);
  const prepared = prepareChapterThreeGuildExhibitionSave(save);
  assert.equal(prepared, save);
  assert.equal(getChapterThreeGuildExhibitionState(prepared).stage, "locked");
});

test("the invitation opens representative selection and filters unavailable creatures", () => {
  const reviewed = invitationReviewedSave();
  assert.equal(getChapterThreeGuildExhibitionState(reviewed).stage, "representative");
  const candidates = getGuildExhibitionCandidates(reviewed);
  assert.ok(candidates.length > 0);

  const exhausted = replaceFirstCreature(reviewed, (creature) => ({ ...creature, energy: GUILD_EXHIBITION_ENERGY_COST - 1 }));
  const exhaustedId = exhausted.creatures![0].creatureId;
  assert.equal(getGuildExhibitionCandidates(exhausted).some((creature) => creature.creatureId === exhaustedId), false);
  assert.equal(selectGuildExhibitionRepresentative(exhausted, exhaustedId).ok, false);

  const injured = replaceFirstCreature(reviewed, (creature) => ({
    ...creature,
    injuredUntilDayNumber: reviewed.dayState.dayNumber + 2,
  }));
  const injuredId = injured.creatures![0].creatureId;
  assert.equal(getGuildExhibitionCandidates(injured).some((creature) => creature.creatureId === injuredId), false);
});

test("one preparation discipline is always free and paid plans enforce exact resources", () => {
  const selected = representativeSelectedSave();
  const poor: GameSave = {
    ...selected,
    currencies: { ...selected.currencies, gold: 0 },
    flags: { ...selected.flags, ranchFeedStock: 0 },
  };
  assert.equal(GUILD_EXHIBITION_DISCIPLINES.length, 3);
  assert.equal(canAffordGuildExhibitionDiscipline(poor, "bond"), true);
  assert.equal(canAffordGuildExhibitionDiscipline(poor, "working"), false);
  assert.equal(canAffordGuildExhibitionDiscipline(poor, "pedigree"), false);

  const working = enterGuildExhibition(exhibitionReadySave("working"));
  const workingPlacement = getGuildExhibitionPlacementDefinition(working.state.placement || "participant");
  assert.equal(working.ok, true);
  assert.equal(Number(working.save.flags.ranchFeedStock), 17);
  assert.equal(Number(working.save.flags.ranchMaterialsStock), 13);
  assert.equal(working.save.currencies.gold, 1000 + workingPlacement.goldReward);

  const pedigree = enterGuildExhibition(exhibitionReadySave("pedigree"));
  const pedigreePlacement = getGuildExhibitionPlacementDefinition(pedigree.state.placement || "participant");
  assert.equal(pedigree.ok, true);
  assert.equal(pedigree.save.currencies.gold, 1000 - 75 + pedigreePlacement.goldReward);
  assert.equal(pedigree.save.currencies.guildPoints, 20 + pedigreePlacement.guildPointReward + 1);
});

test("exhibition scoring is deterministic and each discipline emphasizes different strengths", () => {
  const creature = chapterTwoCompleteSave().creatures![0];
  const bondA = calculateGuildExhibitionScore(creature, "bond");
  const bondB = calculateGuildExhibitionScore(creature, "bond");
  const working = calculateGuildExhibitionScore(creature, "working");
  const pedigree = calculateGuildExhibitionScore(creature, "pedigree");
  assert.deepEqual(bondA, bondB);
  assert.ok(bondA.total >= 0 && bondA.total <= 100);
  assert.ok(working.total >= 0 && working.total <= 100);
  assert.ok(pedigree.total >= 0 && pedigree.total <= 100);
  assert.ok(new Set([bondA.discipline, working.discipline, pedigree.discipline]).size >= 2);
});

test("weak and elite representatives earn deterministic non-blocking placements", () => {
  const weakBase = transformAllCreatures(chapterTwoCompleteSave(), (creature) => ({
    ...creature,
    level: 1,
    stats: { STR: 0, DEX: 0, STA: 0, CHA: 0, WIL: 0, FER: 0 },
    affection: 0,
    energy: GUILD_EXHIBITION_ENERGY_COST,
    maxEnergy: 100,
    hearts: 1,
    maxHearts: 5,
    shiny: false,
  }));
  const weak = enterGuildExhibition(exhibitionReadySave("bond", weakBase));
  assert.equal(weak.ok, true);
  assert.equal(weak.state.placement, "participant");
  assert.equal(weak.state.stage, "complete");

  const eliteBase = transformAllCreatures(chapterTwoCompleteSave(), (creature) => ({
    ...creature,
    level: 20,
    stats: { STR: 10, DEX: 10, STA: 10, CHA: 10, WIL: 10, FER: 10 },
    affection: 100,
    energy: creature.maxEnergy,
    hearts: creature.maxHearts,
    shiny: true,
  }));
  const elite = enterGuildExhibition(exhibitionReadySave("pedigree", eliteBase));
  assert.equal(elite.ok, true);
  assert.equal(elite.state.placement, "gold");
  assert.equal(elite.save.flags.chapterThreeExhibitionGuildGoldPercent, 12);
  assert.equal(elite.save.flags.chapterThreeExhibitionGuildGpBonus, 2);
});

test("entry spends Energy, rewards once, and cannot be rerolled or duplicated", () => {
  const ready = exhibitionReadySave("bond");
  const representativeId = getChapterThreeGuildExhibitionState(ready).representativeId;
  const beforeCreature = ready.creatures!.find((creature) => creature.creatureId === representativeId)!;
  const first = enterGuildExhibition(ready);
  const afterCreature = first.save.creatures!.find((creature) => creature.creatureId === representativeId)!;
  assert.equal(first.ok, true);
  assert.equal(afterCreature.energy, beforeCreature.energy - GUILD_EXHIBITION_ENERGY_COST);
  assert.ok(afterCreature.affection >= beforeCreature.affection);
  assert.equal(first.state.rewardClaimed, true);
  assert.equal(typeof first.save.flags[CHAPTER_THREE_EXHIBITION_STATE_FLAG], "string");

  const duplicate = enterGuildExhibition(first.save);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.save.currencies.gold, first.save.currencies.gold);
  assert.equal(duplicate.save.currencies.guildPoints, first.save.currencies.guildPoints);
  assert.deepEqual(duplicate.save.creatures, first.save.creatures);
});

test("exhibition reputation raises current and future weekly Guild rewards exactly once", () => {
  const synced = ensureCurrentGuildState(chapterTwoCompleteSave());
  const baseline = synced.guild!.contracts.find((contract) => contract.weekNumber === synced.dayState.weekNumber)!;
  const strong = transformAllCreatures(synced, (creature) => ({
    ...creature,
    level: 20,
    stats: { STR: 10, DEX: 10, STA: 10, CHA: 10, WIL: 10, FER: 10 },
    affection: 100,
    energy: creature.maxEnergy,
    hearts: creature.maxHearts,
    shiny: true,
  }));
  const completed = enterGuildExhibition(exhibitionReadySave("pedigree", strong)).save;
  const applied = ensureCurrentGuildState(completed);
  const improved = applied.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;
  assert.ok(improved.goldReward > baseline.goldReward);
  assert.equal(improved.guildPointReward, baseline.guildPointReward + 2);
  assert.equal(applied.flags.chapterThreeExhibitionGuildAppliedWeek, applied.dayState.weekNumber);

  const duplicate = ensureCurrentGuildState(applied);
  const duplicateContract = duplicate.guild!.contracts.find((contract) => contract.contractId === baseline.contractId)!;
  assert.equal(duplicateContract.goldReward, improved.goldReward);
  assert.equal(duplicateContract.guildPointReward, improved.guildPointReward);

  const nextWeekNumber = applied.dayState.weekNumber + 1;
  const future = ensureCurrentGuildState({
    ...applied,
    dayState: { ...applied.dayState, weekNumber: nextWeekNumber, dayNumber: applied.dayState.dayNumber + 7 },
  });
  const control = ensureCurrentGuildState({
    ...applied,
    guild: undefined,
    dayState: { ...applied.dayState, weekNumber: nextWeekNumber, dayNumber: applied.dayState.dayNumber + 7 },
    flags: withoutExhibitionReputation(applied.flags),
  });
  const futureContract = future.guild!.contracts.find((contract) => contract.weekNumber === nextWeekNumber)!;
  const controlContract = control.guild!.contracts.find((contract) => contract.contractId === futureContract.contractId)!;
  assert.ok(futureContract.goldReward > controlContract.goldReward);
  assert.equal(futureContract.guildPointReward, controlContract.guildPointReward + 2);
  assert.equal(future.flags.chapterThreeExhibitionGuildAppliedWeek, nextWeekNumber);
});

test("the active Ranch Hub hands the completed Woodline story to Chapter 3", async () => {
  const wrapper = await readFile(new URL("src/features/ranch/RanchHubScreenTutorial.tsx", ROOT), "utf8");
  const panel = await readFile(new URL("src/features/story/ChapterThreeGuildExhibitionPanel.tsx", ROOT), "utf8");
  const data = await readFile(new URL("src/data/chapterThreeGuildExhibition.ts", ROOT), "utf8");
  const tsconfig = await readFile(new URL("tsconfig.json", ROOT), "utf8");
  assert.match(wrapper, /woodlineComplete/);
  assert.match(wrapper, /ChapterThreeGuildExhibitionPanel/);
  assert.match(panel, /The Guild Exhibition/);
  assert.match(panel, /Enter the Guild Exhibition/);
  assert.match(data, /Bond & Presence/);
  assert.match(data, /Working Demonstration/);
  assert.match(data, /Pedigree Presentation/);
  assert.match(tsconfig, /guildExhibition/);
});
