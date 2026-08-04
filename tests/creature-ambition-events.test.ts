import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const ambitionEventsSource = readFileSync("src/data/creatureAmbitionEvents.ts", "utf8");
const careerTransactionsSource = readFileSync("src/data/creatureCareerTransactions.ts", "utf8");
const recommendationsSource = readFileSync("src/data/guildAmbitionRecommendations.ts", "utf8");

test("ambition milestone processor compares progress and writes Chronicle-backed memories", () => {
  assert.match(ambitionEventsSource, /recordNewAmbitionMilestones/);
  assert.match(ambitionEventsSource, /before\.progress < milestone && after\.progress >= milestone/);
  assert.match(ambitionEventsSource, /addCreatureMemory/);
  assert.match(ambitionEventsSource, /ambition:\$\{definition\.ambitionId\}:milestone:\$\{milestone\}/);
  assert.match(ambitionEventsSource, /fulfilled \$\{definition\.name\}/);
});

test("all canonical career transaction families trigger milestone evaluation", () => {
  assert.match(careerTransactionsSource, /processRanchJobsWithCareers[\s\S]*recordNewAmbitionMilestones/);
  assert.match(careerTransactionsSource, /hatchEggWithLegacyRecords[\s\S]*recordNewAmbitionMilestones/);
  assert.match(careerTransactionsSource, /applyBattleCareerResults[\s\S]*recordNewAmbitionMilestones/);
  assert.match(careerTransactionsSource, /applyGuildCareerCompletion[\s\S]*recordNewAmbitionMilestones/);
  assert.match(careerTransactionsSource, /applyTrainingCareerCompletion[\s\S]*recordNewAmbitionMilestones/);
  assert.match(careerTransactionsSource, /applyBreedingAttemptCareer[\s\S]*recordNewAmbitionMilestones/);
});

test("Guild recommendations preserve eligibility and explain ambition fit", () => {
  assert.match(recommendationsSource, /getEligibleCreaturesForContract/);
  assert.match(recommendationsSource, /getPrimaryCreatureAmbition/);
  assert.match(recommendationsSource, /categoryBonus/);
  assert.match(recommendationsSource, /strong energy reserve after service/);
  assert.match(recommendationsSource, /reasons/);
});
