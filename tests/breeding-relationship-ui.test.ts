import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const screenSource = readFileSync(
  "src/features/breeding/BreedingFocusedScreen.tsx",
  "utf8",
);
const panelSource = readFileSync(
  "src/features/breeding/BreedingRelationshipCompatibilityPanel.tsx",
  "utf8",
);

test("the active Breeding Pen derives relationship compatibility from the selected pair", () => {
  assert.match(screenSource, /getBreedingRelationshipCompatibility/);
  assert.match(
    screenSource,
    /getBreedingRelationshipCompatibility\(currentSave, giverId, receiverId\)/,
  );
  assert.match(screenSource, /<BreedingRelationshipCompatibilityPanel compatibility=\{compatibility\}/);
});

test("the compatibility panel explains personality, bond, score, and pregnancy separation", () => {
  assert.match(panelSource, /data-breeding-relationship-compatibility="available"/);
  assert.match(panelSource, /compatibility\.personalityScore/);
  assert.match(panelSource, /compatibility\.affinity/);
  assert.match(panelSource, /compatibility\.score/);
  assert.match(panelSource, /affects social aftermath, not pregnancy chance/);
  assert.match(panelSource, /Creature pairs only/);
});

test("the breeding preview compatibility row wraps safely on narrow layouts", () => {
  assert.match(
    screenSource,
    /repeat\(auto-fit,minmax\(min\(100%,220px\),1fr\)\)/,
  );
  assert.match(screenSource, /style=\{\{ \.\.\.primaryButtonStyle, width: "100%" \}\}/);
});
