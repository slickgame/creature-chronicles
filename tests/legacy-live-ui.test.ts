import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const rootSource = readFileSync("src/features/root/GameRoot.tsx", "utf8");
const chronicleSource = readFileSync("src/features/legacy/ChronicleScreen.tsx", "utf8");
const overviewSource = readFileSync("src/features/legacy/LegacyOverviewPanel.tsx", "utf8");
const prestigeSource = readFileSync("src/features/legacy/LegacyPrestigeBadge.tsx", "utf8");
const recommendationSource = readFileSync("src/features/guild/GuildRecommendationPanel.tsx", "utf8");
const careerSource = readFileSync("src/features/legacy/CreatureCareerPanel.tsx", "utf8");

test("the Ranch Hub exposes a live Chronicle launcher", () => {
  assert.match(rootSource, /useState\(false\)/);
  assert.match(rootSource, /data-legacy-chronicle-launcher="true"/);
  assert.match(rootSource, /<ChronicleScreen save=\{currentSave\}/);
});

test("the Chronicle includes the Ranch Legacy overview before the event feed", () => {
  const overviewIndex = chronicleSource.indexOf("<LegacyOverviewPanel");
  const feedIndex = chronicleSource.indexOf("<ChronicleFeed");
  assert.ok(overviewIndex >= 0);
  assert.ok(feedIndex > overviewIndex);
  assert.match(overviewSource, /Hall of Legends candidates/);
  assert.match(overviewSource, /getRanchLegacySummary/);
});

test("Legacy UI exposes Prestige, titles, Hall candidacy, and ambition rewards", () => {
  assert.match(prestigeSource, /data-legacy-prestige="true"/);
  assert.match(careerSource, /Legacy Score/);
  assert.match(careerSource, /Hall candidate/);
  const ambitionSource = readFileSync("src/features/legacy/CreatureAmbitionPanel.tsx", "utf8");
  assert.match(ambitionSource, /data-legacy-ambition-reward="true"/);
  assert.match(ambitionSource, /Ranch Legacy Prestige/);
});

test("Guild recommendation component explains ambition-aware choices", () => {
  assert.match(recommendationSource, /getGuildCreatureRecommendations/);
  assert.match(recommendationSource, /data-guild-recommendations="true"/);
  assert.match(recommendationSource, /recommendation\.reasons/);
  assert.match(recommendationSource, /onSelect\(recommendation\.creature\.creatureId\)/);
});
