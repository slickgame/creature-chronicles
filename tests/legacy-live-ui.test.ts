import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const rootSource = readFileSync("src/features/root/GameRoot.tsx", "utf8");
const chronicleSource = readFileSync("src/features/legacy/ChronicleScreen.tsx", "utf8");
const overviewSource = readFileSync("src/features/legacy/LegacyOverviewPanel.tsx", "utf8");
const prestigeSource = readFileSync("src/features/legacy/LegacyPrestigeBadge.tsx", "utf8");
const recommendationSource = readFileSync("src/features/guild/GuildRecommendationPanel.tsx", "utf8");
const advisorSource = readFileSync("src/features/guild/GuildAmbitionAdvisor.tsx", "utf8");
const careerSource = readFileSync("src/features/legacy/CreatureCareerPanel.tsx", "utf8");
const profileLauncherSource = readFileSync("src/features/legacy/LegacyCreatureProfileLauncher.tsx", "utf8");
const collectionSource = readFileSync("src/features/collection/CollectionScreenLedger.tsx", "utf8");
const habitatSource = readFileSync("src/features/habitats/HabitatScreenManaged.tsx", "utf8");
const ranchTutorialSource = readFileSync("src/features/ranch/RanchHubScreenTutorial.tsx", "utf8");
const morningStorySource = readFileSync("src/features/legacy/MorningCreatureStoryNotice.tsx", "utf8");

test("the Ranch Hub exposes a live Chronicle launcher and Prestige badge", () => {
  assert.match(rootSource, /useState\(false\)/);
  assert.match(rootSource, /data-legacy-chronicle-launcher="true"/);
  assert.match(rootSource, /<ChronicleScreen save=\{currentSave\}/);
  assert.match(rootSource, /<LegacyPrestigeBadge save=\{currentSave\} compact/);
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

test("Guild recommendations are explained and mounted as a live advisor", () => {
  assert.match(recommendationSource, /getGuildCreatureRecommendations/);
  assert.match(recommendationSource, /data-guild-recommendations="true"/);
  assert.match(recommendationSource, /recommendation\.reasons/);
  assert.match(recommendationSource, /onSelect\(recommendation\.creature\.creatureId\)/);
  assert.match(advisorSource, /data-guild-ambition-advisor="true"/);
  assert.match(advisorSource, /Ambition Advisor/);
  assert.match(rootSource, /appScreen === "guild-hall" \? <GuildAmbitionAdvisor save=\{currentSave\}/);
});

test("Collection and Habitat screens expose the full Legacy creature profile flow", () => {
  assert.match(collectionSource, /<LegacyCreatureProfileLauncher/);
  assert.match(collectionSource, /Ranch Roster Legacy Profiles/);
  assert.match(habitatSource, /<LegacyCreatureProfileLauncher/);
  assert.match(habitatSource, /Habitat Creature Legacy Profiles/);
  assert.match(profileLauncherSource, /data-legacy-profile-launcher="true"/);
  assert.match(profileLauncherSource, /data-legacy-profile-dialog="true"/);
  assert.match(profileLauncherSource, /<CreatureDetailWithMemories/);
  assert.match(profileLauncherSource, /compactRelationships/);
});

test("the Morning Brief surfaces the previous Ranch Day creature story", () => {
  assert.match(ranchTutorialSource, /<MorningCreatureStoryNotice save=\{currentSave\}/);
  assert.match(morningStorySource, /getMorningCreatureStory/);
  assert.match(morningStorySource, /data-morning-creature-story="true"/);
  assert.match(morningStorySource, /Morning Brief · Creature Story/);
});
