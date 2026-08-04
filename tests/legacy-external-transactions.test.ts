import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/data/legacyExternalTransactions.ts"),
  "utf8",
);

test("Coliseum wrapper records canonical result before career and teamwork credit", () => {
  const resultIndex = source.indexOf(
    "recordColiseumBattleResult(save, encounterId, outcome, roundCount, teamCreatureIds)",
  );
  const careerIndex = source.indexOf("applyBattleCareerResults(result.save");
  const moraleIndex = source.indexOf("applyBattleTeamworkMorale(");
  assert.ok(resultIndex >= 0);
  assert.ok(careerIndex > resultIndex);
  assert.ok(moraleIndex > careerIndex);
  assert.match(source, /const careerOutcome = toCareerOutcome\(outcome\)/);
  assert.match(source, /battleId: result\.historyEntry\.historyId/);
  assert.match(source, /participants: normalizeParticipants\(teamCreatureIds, telemetry\)/);
  assert.match(source, /telemetryById/);
  assert.match(source, /careerOutcome/);
});

test("Guild wrapper credits the submitted creature and featured Gold requests", () => {
  assert.match(source, /donateCreatureToGuildContract\(syncedSave, contractId, creatureId\)/);
  assert.match(source, /applyGuildCareerCompletion/);
  assert.match(source, /participantIds: \[creatureId\]/);
  assert.match(source, /featured: contract\.tier === "gold"/);
});
