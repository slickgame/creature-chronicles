import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/supply-depot/SupplyDepotScreen.tsx", "utf8");
const css = readFileSync("src/features/supply-depot/SupplyDepotScreen.module.css", "utf8");
const polish = readFileSync("src/features/supply-depot/SupplyDepotScreen.polish.module.css", "utf8");

test("Supply Depot landing is a Pella-led character hub with environmental hotspots", () => {
  assert.match(source, /data-supply-depot-mode=\{depotMode\}/);
  assert.match(source, /What do you need\?/);
  assert.match(source, /Ranch Supplies/);
  assert.match(source, /Special Supplies/);
  assert.match(source, /Talk to Pella/);
  assert.match(source, /Supply Ledger/);
  assert.match(source, /Ranch Shelves/);
  assert.match(source, /Counter Cabinet/);
  assert.match(source, /\? "Main Floor"/);
  assert.doesNotMatch(source, /\? "Supply Depot"\s*:/);
  assert.match(css, /\.pellaFigure\b/);
  assert.match(css, /\.hubPanel\b/);
  assert.match(css, /\.hotspot\b/);
});

test("Supply Depot storefront shares a modern filtered product layout", () => {
  assert.match(source, /Browse Stock/);
  assert.match(source, /Ranch Shelves/);
  assert.match(source, /Counter Cabinet/);
  assert.match(source, /All Stock/);
  assert.match(source, /You own:/);
  assert.match(source, /getSupplyDepotPrice/);
  assert.match(css, /\.productGrid\b/);
  assert.match(css, /\.productCard\b/);
  assert.match(css, /\.shopToolbar\b/);
  assert.match(polish, /\.shopLayout\s*\{[^}]*min-height:\s*0;[^}]*align-items:\s*start;/s);
  assert.match(polish, /\.shopSidebar,[\s\S]*\.shopMain\s*\{[^}]*align-self:\s*start;/);
});

test("Counter Cabinet owns all delicate care and breeding categories", () => {
  for (const category of ["Breeding", "Nursery", "Care", "Pregnancy"]) {
    assert.match(source, new RegExp(`item\\.category === \\"${category}\\"`));
  }
  assert.match(source, /Breeding, nursery, creature-care, and pregnancy supplies/);
  assert.match(source, /Breeding · Nursery · Care/);
});

test("Talk to Pella offers authored conversation topics", () => {
  for (const topic of ["Practical Advice", "Keeping a Ranch Stocked", "Special Supplies", "Town Trade", "My Standing With You"]) {
    assert.match(source, new RegExp(topic));
  }
  assert.match(source, /What do you want to ask\?/);
  assert.match(css, /\.conversationLayout\b/);
  assert.match(css, /\.conversationFigure\b/);
  assert.match(css, /\.topicButtonActive\b/);
});

test("Supply Ledger presents Trust progression, real perks, and live stock counts", () => {
  assert.match(source, /Relationship Path/);
  assert.match(source, /Depot Benefits/);
  assert.match(source, /Current Ranch Stock/);
  assert.match(source, /Regular Customer Pricing/);
  assert.match(source, /Priority Supply Requests/);
  assert.match(source, /Gold Personal Requests/);
  assert.match(source, /Confidant Pricing/);
  assert.match(source, /getPellaSupplyPriceMultiplier/);
  assert.match(source, /getSupplyDepotSupplyCounts/);
  assert.match(css, /\.progressTrack\b/);
  assert.match(css, /\.trustPath\b/);
  assert.match(css, /\.benefitGrid\b/);
});

test("Supply Ledger uses themed scrolling and keeps actions reachable", () => {
  assert.match(source, /polish\.ledgerLayout/);
  assert.match(source, /polish\.ledgerActions/);
  assert.match(polish, /scrollbar-width:\s*thin/);
  assert.match(polish, /scrollbar-color:/);
  assert.match(polish, /::-webkit-scrollbar-thumb/);
  assert.match(polish, /\.ledgerActions\s*\{[^}]*position:\s*sticky;[^}]*bottom:/s);
  assert.match(polish, /padding-bottom:\s*82px/);
});

test("Supply Depot redesign keeps responsive PC and compact layouts", () => {
  assert.match(css, /@media \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(polish, /@media \(max-width: 900px\)/);
});
