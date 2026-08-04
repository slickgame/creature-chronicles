import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/data/legacyGameTransactions.ts"),
  "utf8",
);

test("breeding wrapper credits creature participants from canonical snapshots", () => {
  assert.match(source, /performBreedingAttemptWithCareers/);
  assert.match(source, /giverSnapshot\?\.creatureId/);
  assert.match(source, /receiverSnapshot\?\.creatureId/);
  assert.match(source, /applyBreedingAttemptCareer/);
  assert.match(source, /attemptId: String\(result\.attempt\.attemptId\)/);
});

test("hatch wrapper preserves Egg Atelier and Legacy records", () => {
  assert.match(source, /hatchEggWithLegacyRecords/);
  assert.match(source, /applyEggAtelierHatchEffects\(save, legacyResult, eggId\)/);
  assert.match(source, /atelierResult\.save/);
});

test("training wrapper captures assignment before canonical collection", () => {
  const assignmentIndex = source.indexOf("getTrainingAssignment(save, creatureId)");
  const collectionIndex = source.indexOf("collectTrainingGroundsAssignment(save, creatureId)");
  assert.ok(assignmentIndex >= 0);
  assert.ok(collectionIndex > assignmentIndex);
  assert.match(source, /applyTrainingCareerCompletion/);
  assert.match(source, /assignmentId: `\$\{assignment\.startDayNumber\}:\$\{assignment\.focusId\}`/);
});

test("Ranch Day wrapper delegates to career-aware job processing", () => {
  assert.match(source, /processLegacyRanchJobs/);
  assert.match(source, /return processRanchJobsWithCareers\(save\)/);
});
