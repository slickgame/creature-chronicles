import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  clearPendingPredatorDevIncident,
  createForcedPredatorIncident,
  resolvePendingPredatorDevOutcome,
} from "@/data/predatorDevTools";
import { getPendingPredatorEvent } from "@/data/predatorEvents";
import {
  acceptRoseLanternHouseRules,
  getRoseLanternAccess,
  getRoseLanternState,
  spendRoseLanternRumorToken,
  visitRoseLanternSalon,
  workRoseLanternHospitalityShift,
} from "@/data/roseLantern";
import { createNewGameSave } from "@/lib/save/localSave";
import {
  inspectPortableSave,
  preparePortableSaveForSlot,
  serializePortableSave,
} from "@/lib/save/portableSave";

const ROOT = new URL("../", import.meta.url);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, ROOT), "utf8");
}

test("portable saves validate their checksum and remap to a chosen slot", () => {
  const save = createNewGameSave("Vacation Traveler", 0);
  const serialized = serializePortableSave(save);
  const inspection = inspectPortableSave(serialized);
  assert.equal(inspection.ok, true);
  assert.equal(inspection.verified, true);
  assert.equal(inspection.playerName, "Vacation Traveler");

  const prepared = preparePortableSaveForSlot(serialized, 2);
  assert.ok(prepared.save);
  assert.equal(prepared.save?.slotIndex, 2);
  assert.equal(prepared.save?.flags.m64PortableSaveTransfer, true);
  assert.equal(prepared.save?.flags.portableSaveOriginalSlotIndex, 0);
});

test("portable save integrity detects altered payloads while legacy JSON remains importable", () => {
  const save = createNewGameSave("Checksum Test", 0);
  const envelope = JSON.parse(serializePortableSave(save));
  envelope.payload.currencies.gold += 99;
  const tampered = inspectPortableSave(JSON.stringify(envelope));
  assert.equal(tampered.ok, false);
  assert.match(tampered.message, /altered|incomplete/i);

  const legacy = inspectPortableSave(JSON.stringify(save));
  assert.equal(legacy.ok, true);
  assert.equal(legacy.legacyJson, true);
  assert.equal(legacy.verified, false);
});

test("predator dev controls create, resolve, and clear reproducible incidents", () => {
  const save = createNewGameSave("Predator QA", 0);
  const created = createForcedPredatorIncident(save, "wolves", "severe", "intercepted");
  assert.equal(created.ok, true);
  assert.equal(created.event?.predatorType, "wolves");
  assert.equal(created.event?.tier, "severe");
  assert.equal(created.event?.intercepted, true);
  assert.ok((created.event?.startingHpPercent ?? 100) < 100);
  assert.equal(getPendingPredatorEvent(created.save)?.eventId, created.event?.eventId);

  const resolved = resolvePendingPredatorDevOutcome(created.save, "player_won");
  assert.equal(resolved.ok, true);
  assert.equal(getPendingPredatorEvent(resolved.save), null);
  assert.ok(Number(resolved.save.flags.predatorVictories ?? 0) >= 1);

  const cleared = clearPendingPredatorDevIncident(resolved.save, true);
  assert.equal(cleared.ok, true);
  assert.equal(cleared.save.flags.predatorEventHistoryV1, "[]");
});

test("Rose Lantern requires adult house rules and supports daily social progression", () => {
  const base = createNewGameSave("Lantern Guest", 0);
  const save = { ...base, dayState: { ...base.dayState, dayNumber: 4 } };
  assert.equal(getRoseLanternAccess(save).unlocked, true);

  const blocked = visitRoseLanternSalon(save);
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /house rules/i);

  const accepted = acceptRoseLanternHouseRules(save);
  assert.equal(accepted.ok, true);
  assert.equal(getRoseLanternState(accepted.save).houseRulesAccepted, true);

  const visited = visitRoseLanternSalon(accepted.save);
  assert.equal(visited.ok, true);
  assert.equal(visited.state.trust, 3);
  assert.equal(visited.state.rumorTokens, 1);

  const shifted = workRoseLanternHospitalityShift(visited.save);
  assert.equal(shifted.ok, true);
  assert.equal(shifted.state.trust, 6);
  assert.equal(shifted.state.rumorTokens, 2);
  assert.ok(shifted.save.currencies.gold > visited.save.currencies.gold);
  assert.ok(shifted.save.currencies.energy < visited.save.currencies.energy);

  const rumor = spendRoseLanternRumorToken(shifted.save);
  assert.equal(rumor.ok, true);
  assert.equal(rumor.state.rumorTokens, 1);
  assert.ok(rumor.state.lastRumor.length > 20);
});

test("main menu, dev tools, and town expose the vacation test features", async () => {
  const menu = await source("src/features/main-menu/MainMenuScreen.tsx");
  const transfer = await source("src/features/main-menu/SaveTransferPanel.tsx");
  const dev = await source("src/features/dev-tools/PredatorTestPanel.tsx");
  const town = await source("src/features/town/TownScreenC4.tsx");
  const lantern = await source("src/features/town/RoseLanternScreen.tsx");

  assert.match(menu, /Transfer Save/);
  assert.match(transfer, /Download \.ccsave/);
  assert.match(transfer, /navigator\.share/);
  assert.match(dev, /Create Incident Now/);
  assert.match(dev, /Instant Test Victory/);
  assert.match(town, /RoseLanternScreen/);
  assert.match(lantern, /Acknowledge House Rules/);
  assert.match(lantern, /Hospitality Shift/);
  assert.match(lantern, /Rumor Network/);
});

test("the main menu fits dynamic iPhone portrait and landscape viewports", async () => {
  const menuStyles = await source("src/features/main-menu/MainMenuScreen.module.css");

  assert.match(menuStyles, /height:\s*100dvh/);
  assert.match(menuStyles, /overflow-y:\s*auto/);
  assert.match(menuStyles, /env\(safe-area-inset-top\)/);
  assert.match(menuStyles, /@media \(max-width: 620px\)/);
  assert.match(menuStyles, /min-height:\s*52px/);
  assert.match(menuStyles, /:has\(\.menuPanel\)/);
  assert.match(menuStyles, /@media \(max-width: 980px\) and \(max-height: 520px\)/);
});

test("the Chapter 1 story overlay stays above Ranch Day controls and fits iPhone", async () => {
  const story = await source("src/features/story/ChapterOneStoryOverlay.tsx");

  assert.match(story, /zIndex:\s*1200/);
  assert.match(story, /100dvh/);
  assert.match(story, /env\(safe-area-inset-top\)/);
  assert.match(story, /overflowY:\s*"auto"/);
  assert.match(story, /repeat\(auto-fit, minmax\(min\(280px, 100%\), 1fr\)\)/);
  assert.match(story, /data-chapter-one-story-actions="true"/);
  assert.match(story, /minHeight:\s*44/);
});

test("the Ranch Hub uses iPhone-only compaction without changing desktop rules", async () => {
  const wrapper = await source("src/features/ranch/RanchHubScreenTutorial.tsx");
  const mobileStyles = await source("src/features/ranch/RanchHubMobile.module.css");

  assert.match(wrapper, /RanchHubMobile\.module\.css/);
  assert.match(wrapper, /data-ranch-mobile-shell="true"/);
  assert.match(mobileStyles, /@media \(max-width: 700px\)/);
  assert.match(mobileStyles, /grid-template-areas:[\s\S]*"identity menu"[\s\S]*"stats stats"/);
  assert.match(mobileStyles, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mobileStyles, /aside\[aria-label="Ranch Day controls"\]/);
  assert.match(mobileStyles, /data-tutorial-card="true"/);
  assert.match(mobileStyles, /Ranch Advisor morning planner/);
  assert.match(mobileStyles, /Optional beginner milestones/);
  assert.match(mobileStyles, /env\(safe-area-inset-bottom\)/);
});
