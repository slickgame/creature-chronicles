import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/market/AdoptionListingsCarousel.tsx", "utf8");
const css = readFileSync("src/features/market/AdoptionListingsCarousel.module.css", "utf8");
const wrapper = readFileSync("src/features/market/MarketScreenCharacterHub.tsx", "utf8");

test("Adoption Board replaces the legacy grid with a focused creature carousel", () => {
  assert.match(wrapper, /AdoptionListingsCarousel/);
  assert.match(wrapper, /<AdoptionListingsCarousel \/>/);
  assert.match(source, /data-adoption-listings-carousel="true"/);
  assert.match(source, /data-adoption-featured-listing/);
  assert.match(source, /Previous adoption listing/);
  assert.match(source, /Next adoption listing/);
  assert.match(source, /Use ← → to browse/);
});

test("Adoption carousel preserves the Hearth background while suppressing only legacy listing chrome", () => {
  assert.match(source, /findListingsPanel/);
  assert.match(source, /section\[aria-label="Adoption listings"\]/);
  assert.match(source, /element\.style\.setProperty\("display", "none", "important"\)/);
  assert.match(source, /tagName === "HEADER"/);
  assert.doesNotMatch(css, /background-image:\s*url/);
  assert.match(css, /\.sceneShade\s*\{/);
});

test("Featured adoption card keeps browsing compact and exposes reusable full creature details", () => {
  assert.match(source, /Tamsin&apos;s Note/);
  assert.match(source, /Stat Highlights/);
  assert.match(source, /Best suited for/);
  assert.match(source, /View Full Details/);
  assert.match(source, /SharedCreatureDetail creature=\{creature\} mode="full" showActions=\{false\}/);
  assert.match(source, /data-adoption-carousel-detail="true"/);
});

test("Adoption purchase flow uses a dedicated confirmation and existing market transactions", () => {
  assert.match(source, /buyMarketCreature\(listing\.listingId\)/);
  assert.match(source, /rerollMarket\(\)/);
  assert.match(source, /data-adoption-confirm="true"/);
  assert.match(source, /Complete Adoption/);
  assert.match(source, /The creature will permanently join your ranch/);
});

test("Carousel styling includes focused, neighboring, pagination, and responsive states", () => {
  for (const selector of ["featuredCard", "previewCard", "previewPrevious", "previewNext", "arrowLeft", "arrowRight", "pagination", "detailModal"]) {
    assert.match(css, new RegExp(`\\.${selector}\\b`));
  }
  assert.match(css, /@media \(max-width: 760px\)/);
});
