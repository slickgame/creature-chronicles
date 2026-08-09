import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hubSource = readFileSync("src/features/guild/GuildHallCharacterHub.tsx", "utf8");
const hubCss = readFileSync("src/features/guild/GuildHallCharacterHub.module.css", "utf8");
const hubPolishCss = readFileSync("src/features/guild/GuildHallCharacterHub.polish.module.css", "utf8");
const wrapperSource = readFileSync("src/features/guild/GuildHallScreenTutorial.tsx", "utf8");

test("Guild Hall home is enhanced into a Mara-led character hub", () => {
  assert.match(wrapperSource, /GuildHallCharacterHub/);
  assert.match(wrapperSource, /<GuildHallCharacterHub \/>/);
  assert.match(hubSource, /data-guild-character-hub="mara"/);
  assert.match(hubSource, /MARA\.profilePath/);
  assert.match(hubSource, /MARA\.portraitPath/);
  assert.match(hubSource, /What do you need\?/);
  assert.match(hubSource, /getDynamicGreeting/);
});

test("Mara hub exposes the four location actions and a direct physical board hotspot", () => {
  for (const action of ["board", "board-menu", "services", "relationship", "records"]) {
    assert.match(hubSource, new RegExp(`data-guild-hub-action="${action}"`));
  }
  assert.match(hubSource, /My Standing with Mara/);
  assert.match(hubSource, /Guild Records/);
  assert.match(hubSource, /Leave Guild Hall/);
  assert.match(hubSource, /physicalBoardHotspot/);
  assert.match(hubCss, /\.physicalBoardHotspot\s*\{/);
});

test("Guild Hall Trust and records are readable without restoring the old dashboard", () => {
  assert.match(hubSource, /data-guild-hub-relationship="true"/);
  assert.match(hubSource, /getNpcTrustRecord/);
  assert.match(hubSource, /getNpcNextUnlock/);
  assert.match(hubSource, /Current Benefit/);
  assert.match(hubSource, /Next Unlock/);
  assert.match(hubSource, /data-guild-hub-records="true"/);
  assert.match(hubSource, /Recent Completed Work/);
  assert.match(hubSource, /getTotalTownUpgradeTiers/);
});

test("character hub host discovery is guarded against MutationObserver update loops", () => {
  assert.match(hubSource, /hostRef = useRef<HTMLElement \| null>/);
  assert.match(hubSource, /if \(nextHost === hostRef\.current\) return;/);
  assert.match(hubSource, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(hubSource, /restoreSuppressed\(\)/);
});

test("character hub forcibly removes legacy home chrome while preserving it for subpages", () => {
  assert.match(hubSource, /element\.style\.setProperty\("display", "none", "important"\)/);
  assert.match(hubSource, /displayPriority: element\.style\.getPropertyPriority\("display"\)/);
  assert.match(hubSource, /element\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(hubSource, /item\.element\.style\.removeProperty\("display"\)/);
  assert.match(hubSource, /item\.element\.removeAttribute\("aria-hidden"\)/);
});

test("Mara receives the larger approved character-hub staging", () => {
  assert.match(hubSource, /GuildHallCharacterHub\.polish\.module\.css/);
  assert.match(hubSource, /polishStyles\.maraFigure/);
  assert.match(hubPolishCss, /width:\s*clamp\(430px,\s*32vw,\s*580px\)/);
  assert.match(hubPolishCss, /height:\s*88%/);
  assert.match(hubPolishCss, /transform:\s*scale\(1\.04\)/);
});

test("Guild tutorial targeting prefers the visible character-hub board action", () => {
  assert.match(wrapperSource, /data-guild-hub-action="board"/);
  assert.match(wrapperSource, /characterHubBoard\.dataset\.tutorialId = "tutorial-guild-request"/);
  assert.match(wrapperSource, /!button\.hidden/);
});
