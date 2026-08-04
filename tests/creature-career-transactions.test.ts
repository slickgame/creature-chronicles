import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/data/creatureCareerTransactions.ts"),
  "utf8",
);

test("career transactions expose all canonical gameplay adapters", () => {
  for (const exportName of [
    "processRanchJobsWithCareers",
    "hatchEggWithLegacyRecords",
    "applyBattleCareerResults",
    "applyGuildCareerCompletion",
    "applyTrainingCareerCompletion",
    "applyBreedingAttemptCareer",
    "applyInjuryCareerEvent",
  ]) {
    assert.match(source, new RegExp(`export function ${exportName}\\(`));
  }
});

test("ranch career adapter uses deterministic day, job, and creature keys", () => {
  assert.match(source, /ranch-job:\$\{save\.dayState\.dayNumber\}:\$\{result\.jobId\}:\$\{String\(result\.creatureId\)\}/);
  assert.match(source, /resourcesProduced: parseProducedResources\(result\)/);
});

test("Legacy hatch adapter writes memories and parent career credit", () => {
  assert.match(source, /recordBirthMemories/);
  assert.match(source, /role: "parent"/);
  assert.match(source, /offspringRarity: birth\.rarity/);
  assert.match(source, /offspring:\$\{String\(birth\.birthId\)\}/);
});

test("career transaction event keys are deterministic per gameplay result", () => {
  assert.match(source, /battle:\$\{input\.battleId\}:\$\{String\(participant\.creatureId\)\}/);
  assert.match(source, /guild:\$\{input\.requestId\}:\$\{String\(creatureId\)\}/);
  assert.match(source, /training:\$\{input\.assignmentId\}:\$\{String\(input\.creatureId\)\}/);
  assert.match(source, /breeding-attempt:\$\{input\.attemptId\}:\$\{String\(creatureId\)\}/);
  assert.match(source, /injury:\$\{input\.injuryId\}:\$\{String\(input\.creatureId\)\}/);
});

test("battle adapter forwards lifetime performance metrics", () => {
  for (const field of ["damageDealt", "healingDone", "alliesProtected", "knockouts", "fainted"]) {
    assert.match(source, new RegExp(`${field}: participant\\.${field}`));
  }
});
