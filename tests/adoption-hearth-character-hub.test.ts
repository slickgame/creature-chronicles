import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hubSource = readFileSync("src/features/market/AdoptionHearthCharacterHub.tsx", "utf8");
const hubCss = readFileSync("src/features/market/AdoptionHearthCharacterHub.module.css", "utf8");
const backgroundCss = readFileSync("src/app/adoption-hearth-hub.css", "utf8");
const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
const wrapperSource = readFileSync("src/features/market/MarketScreenCharacterHub.tsx", "utf8");
const rootSource = readFileSync("src/features/root/GameRoot.tsx", "utf8");

test("Vale's Adoption Hearth mounts a Tamsin-led character hub", () => {
  assert.match(wrapperSource, /AdoptionHearthCharacterHub/);
  assert.match(wrapperSource, /<AdoptionHearthCharacterHub \/>/);
  assert.match(rootSource, /MarketScreenCharacterHub/);
  assert.match(hubSource, /data-adoption-character-hub="tamsin"/);
  assert.match(hubSource, /TAMSIN\.portraitPath/);
  assert.match(hubSource, /What do you need\?/);
});

test("Adoption Hearth landing screen exposes the approved character-hub actions", () => {
  for (const action of ["board", "listings", "talk", "trust", "refresh"]) {
    assert.match(hubSource, new RegExp(`data-adoption-hub-action="${action}"`));
  }
  assert.match(hubSource, /View Adoption Listings/);
  assert.match(hubSource, /Talk to Tamsin/);
  assert.match(hubSource, /Trust \/ Welfare Ledger/);
  assert.match(hubSource, /Refresh Arrivals/);
  assert.match(hubSource, /Leave Adoption Hearth/);
});

test("Adoption Hearth replaces legacy landing chrome only while the interior is active", () => {
  assert.match(hubSource, /findInterior/);
  assert.match(hubSource, /Vale\\'s Adoption Hearth interior/);
  assert.match(hubSource, /element\.style\.setProperty\("display", "none", "important"\)/);
  assert.match(hubSource, /restoreSuppressed/);
  assert.match(hubSource, /if \(nextHost === hostRef\.current\) return;/);
});

test("Tamsin and the Adoption Board receive the approved large-room staging", () => {
  assert.match(hubCss, /\.tamsinFigure\s*\{/);
  assert.match(hubCss, /width:\s*clamp\(390px, 30vw, 540px\)/);
  assert.match(hubCss, /height:\s*82%/);
  assert.match(hubCss, /\.dialoguePanel\s*\{/);
  assert.match(hubCss, /\.boardHotspot\s*\{/);
});

test("the Tamsin hub owns the same proven Adoption Hearth room background as the legacy screen", () => {
  assert.match(layoutSource, /adoption-hearth-hub\.css/);
  assert.match(backgroundCss, /data-adoption-character-hub="tamsin"/);
  assert.match(backgroundCss, /\/images\/backgrounds\/market\/market_road_interior\.png/);
  assert.doesNotMatch(backgroundCss, /adoption_hearth_interior\.png/);
});
