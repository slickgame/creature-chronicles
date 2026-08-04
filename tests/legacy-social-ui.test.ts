import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const personalitySource = readFileSync("src/features/legacy/CreaturePersonalityPanel.tsx", "utf8");
const relationshipsSource = readFileSync("src/features/legacy/CreatureRelationshipsPanel.tsx", "utf8");
const detailSource = readFileSync("src/features/legacy/CreatureDetailWithMemories.tsx", "utf8");
const overviewSource = readFileSync("src/features/legacy/LegacyOverviewPanel.tsx", "utf8");
const guildSource = readFileSync("src/data/guildAmbitionRecommendations.ts", "utf8");
const transactionSource = readFileSync("src/data/legacyGameTransactions.ts", "utf8");

test("creature Legacy details expose personality and relationship panels", () => {
  assert.match(personalitySource, /data-legacy-panel="personality"/);
  assert.match(personalitySource, /Preferred Ranch Work/);
  assert.match(relationshipsSource, /data-legacy-panel="relationships"/);
  assert.match(relationshipsSource, /Ranch bonds and rivalries/);
  assert.match(detailSource, /<CreaturePersonalityPanel/);
  assert.match(detailSource, /<CreatureRelationshipsPanel/);
});

test("the Chronicle overview includes social history metrics", () => {
  assert.match(overviewSource, /getRanchSocialSummary/);
  assert.match(overviewSource, /Social Bonds/);
  assert.match(overviewSource, /Daily Stories/);
  assert.match(overviewSource, /data-legacy-social-summary="true"/);
});

test("Guild recommendations and Ranch Day processing consume personality systems", () => {
  assert.match(guildSource, /getCreaturePersonalityProfile/);
  assert.match(guildSource, /getPersonalityGuildCategoryBonus/);
  assert.match(guildSource, /personality prefers/);
  assert.match(transactionSource, /processDailyCreatureStories\(processed\.save, processed\.results/);
  assert.match(transactionSource, /isPreferredTrainingFocus/);
  assert.match(transactionSource, /preferred-training:/);
});
