import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/state/GameProvider.tsx"),
  "utf8",
);

test("GameProvider uses the career-aware breeding and hatch transactions", () => {
  assert.match(source, /performBreedingAttemptWithCareers\(currentSave, giverId, receiverId\)/);
  assert.match(source, /hatchEggWithAtelierLegacy\(currentSave, eggId, nickname\)/);
  assert.doesNotMatch(source, /const result = performBreedingAttempt\(currentSave/);
  assert.doesNotMatch(source, /const result = hatchEgg\(currentSave/);
});

test("GameProvider persists collected training career progress", () => {
  assert.match(source, /collectTrainingWithCareer\(currentSave, creatureId\)/);
  assert.match(source, /if \(result\.ok\) saveCurrentGame\(result\.save\)/);
});

test("Ranch Day processing uses the career-aware job transaction", () => {
  assert.match(source, /processLegacyRanchJobs\(guildSynced\)/);
  assert.doesNotMatch(source, /processRanchJobsForNewDay\(guildSynced/);
});
