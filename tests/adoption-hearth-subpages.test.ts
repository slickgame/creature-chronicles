import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/market/AdoptionHearthSubpageExperience.tsx", "utf8");
const css = readFileSync("src/features/market/AdoptionHearthSubpageExperience.module.css", "utf8");
const wrapper = readFileSync("src/features/market/MarketScreenCharacterHub.tsx", "utf8");

test("Tamsin Talk and Welfare Ledger mount one shared Hearth subpage experience", () => {
  assert.match(wrapper, /AdoptionHearthSubpageExperience/);
  assert.match(wrapper, /<AdoptionHearthSubpageExperience \/>/);
  assert.match(source, /data-adoption-subpage=\{attached\.mode\}/);
  assert.match(source, /Placement Philosophy/);
  assert.match(source, /Current Benefits/);
});

test("Hearth subpages suppress the legacy header and body only while a replacement is active", () => {
  assert.match(source, /tagName === "HEADER"/);
  assert.match(source, /element\.style\.setProperty\("display", "none", "important"\)/);
  assert.match(source, /restoreSuppressed/);
  assert.match(source, /previous\?\.root === root && previous\.mode === mode/);
});

test("Talk to Tamsin is an interactive conversation scene with authored topics", () => {
  for (const text of ["About the Adoption Hearth", "Choosing the Right Creature", "Special Placements", "My Standing With You"]) {
    assert.match(source, new RegExp(text));
  }
  assert.match(source, /What would you like to ask about\?/);
  assert.match(source, /Open Welfare Ledger/);
  assert.match(css, /\.conversationLayout\b/);
  assert.match(css, /\.tamsinFigure\b/);
});

test("Welfare Ledger exposes Trust progress, relationship milestones, perks, and placement records", () => {
  assert.match(source, /Relationship Path/);
  assert.match(source, /Adoption Network Benefits/);
  assert.match(source, /Placement Record/);
  assert.match(source, /getTamsinAdoptionFeeMultiplier/);
  assert.match(source, /getTamsinArrivalRefreshMultiplier/);
  assert.match(source, /getTamsinSpecialPlacementBonus/);
  assert.match(source, /creature\.origin === "market"/);
  assert.match(css, /\.progressTrack\b/);
  assert.match(css, /\.trustPath\b/);
  assert.match(css, /\.benefitGrid\b/);
});

test("Tamsin subpages preserve compact navigation and responsive layouts", () => {
  assert.match(source, /Back to Hearth/);
  assert.match(source, /Back to Town/);
  assert.match(source, /Review Listings/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
});
