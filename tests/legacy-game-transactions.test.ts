import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/data/legacyGameTransactions.ts"),
  "utf8",
);

test("breeding wrapper credits creature participants and relationship aftermath", () => {
  assert.match(source, /performBreedingAttemptWithCareers/);
  assert.match(source, /getBreedingRelationshipCompatibility/);
  assert.match(source, /giverSnapshot\?\.creatureId/);
  assert.match(source, /receiverSnapshot\?\.creatureId/);
  assert.match(source, /applyBreedingAttemptCareer/);
  assert.match(source, /attemptId: String\(result\.attempt\.attemptId\)/);
  assert.match(source, /applyBreedingRelationshipAftermath/);
});

test("hatch wrapper preserves Egg Atelier and Legacy records", () => {
  assert.match(source, /hatchEggWithLegacyRecords/);
  assert.match(source, /applyEggAtelierHatchEffects\(save, legacyResult, eggId\)/);
  assert.match(source, /atelierResult\.save/);
});

test("training wrapper captures assignment before canonical collection and social support", () => {
  const assignmentIndex = source.indexOf("getTrainingAssignment(save, creatureId)");
  const collectionIndex = source.indexOf("collectTrainingGroundsAssignment(save, creatureId)");
  assert.ok(assignmentIndex >= 0);
  assert.ok(collectionIndex > assignmentIndex);
  assert.match(source, /const assignmentId = `\$\{assignment\.startDayNumber\}:\$\{assignment\.focusId\}`/);
  assert.match(source, /applyTrainingCareerCompletion\(result\.save/);
  assert.match(source, /applyTrainingRelationshipSupport/);
});

test("Ranch Day wrapper composes careers, relationship effects, and daily stories", () => {
  const careerIndex = source.indexOf("processRanchJobsWithCareers(save)");
  const relationshipIndex = source.indexOf("applyRanchWorkRelationshipEffects(");
  const storyIndex = source.indexOf("processDailyCreatureStories(");
  assert.ok(careerIndex >= 0);
  assert.ok(relationshipIndex > careerIndex);
  assert.ok(storyIndex > relationshipIndex);
  assert.match(source, /relationshipEffects\.save/);
  assert.match(source, /relationshipEffects\.results/);
});
