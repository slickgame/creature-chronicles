import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, ROOT), "utf8");
}

test("pending predator events route into the dedicated defense screen", async () => {
  const root = await source("src/features/root/GameRoot.tsx");
  const defense = await source("src/features/predators/PredatorDefenseScreen.tsx");
  assert.match(root, /getPendingPredatorEvent\(currentSave\)/);
  assert.match(root, /<PredatorDefenseScreen/);
  assert.match(defense, /applyPredatorBattleOpening/);
  assert.match(defense, /Record Defense Outcome/);
  assert.match(defense, /Accept Breach Consequences/);
  assert.match(defense, /<BattlePortraitStage/);
});

test("Morning Brief displays the resolved predator outcome", async () => {
  const ranch = await source("src/features/ranch/RanchHubScreenDayLoop.tsx");
  assert.match(ranch, /getLatestPredatorEvent/);
  assert.match(ranch, /Overnight Predator Defense/);
  assert.match(ranch, /predatorEvent\.resolutionSummary/);
});

test("the application exposes iPhone standalone metadata and safe-area styles", async () => {
  const manifest = await source("src/app/manifest.ts");
  const layout = await source("src/app/layout.tsx");
  const mobile = await source("src/app/mobile-install.css");
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /start_url:\s*"\/"/);
  assert.match(layout, /appleWebApp/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(mobile, /safe-area-inset-top/);
  assert.match(mobile, /touch-action:\s*manipulation/);
  assert.match(mobile, /min-height:\s*44px/);
});

test("town opens the functional Rose Lantern adult social-house foundation", async () => {
  const town = await source("src/features/town/TownScreenC4.tsx");
  const lantern = await source("src/features/town/RoseLanternScreen.tsx");
  assert.match(town, /<RoseLanternScreen/);
  assert.match(town, /The Rose Lantern/);
  assert.match(town, />OPEN</);
  assert.match(lantern, /Adults-Only Social House/);
  assert.match(lantern, /Acknowledge House Rules/);
  assert.match(lantern, /Hospitality Shift/);
  assert.match(lantern, /Rumor Network/);
});
