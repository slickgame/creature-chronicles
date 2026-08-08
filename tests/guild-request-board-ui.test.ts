import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GUILD_REQUEST_BOARD_ASSETS,
  GUILD_REQUEST_BOARD_PAGE_SIZE,
  GUILD_REQUEST_BOARD_SLOTS,
  getGuildBoardPage,
  getGuildBoardPageCount,
  getGuildFlyerBadgeAsset,
  getGuildFlyerBadgeKind,
  getGuildFlyerBaseAsset,
  getGuildFlyerRotation,
} from "../src/data/guildRequestBoardPresentation";
import type { GuildContract } from "../src/types/guild";

const screenSource = readFileSync("src/features/guild/GuildHallScreen.tsx", "utf8");
const boardSource = readFileSync("src/features/guild/GuildAmbitionAdvisor.tsx", "utf8");
const boardCss = readFileSync("src/features/guild/GuildRequestBoard.module.css", "utf8");
const baseCss = readFileSync("src/features/guild/GuildHallScreen.module.css", "utf8");
const polishCss = readFileSync("src/features/guild/GuildHallScreen.polish.module.css", "utf8");

function makeContract(overrides: Partial<GuildContract> = {}): GuildContract {
  return {
    contractId: (overrides.contractId ?? "request-test") as GuildContract["contractId"],
    weekNumber: 1,
    tier: "bronze",
    type: "donate_creature",
    category: "general",
    requesterId: "mara_vell",
    requesterName: "Mara Vell",
    trustTarget: "Mara Vell",
    status: "available",
    title: "Test Request",
    description: "A test request.",
    requirement: { kind: "any_creature", label: "Any creature" },
    goldReward: 100,
    guildPointReward: 5,
    createdAtDayNumber: 1,
    expiresAtWeekNumber: 2,
    ...overrides,
  };
}

test("Guild Hall composes base and polish CSS modules instead of replacing structural classes", () => {
  assert.match(screenSource, /function composeStyleModules\(/);
  assert.match(screenSource, /const styles = composeStyleModules\(baseStyles, polishStyles\);/);
  assert.doesNotMatch(screenSource, /\{\s*\.\.\.baseStyles,\s*\.\.\.polishStyles\s*\}/);

  for (const className of ["contractOverlay", "contractGrid", "contractList", "filterButton", "primaryButton", "secondaryButton"]) {
    assert.match(baseCss, new RegExp(`\\.${className}`), `${className} must retain its base structural class`);
    assert.match(polishCss, new RegExp(`\\.${className}`), `${className} intentionally has polish rules and therefore must be composed`);
  }
});

test("Request Board mode still mounts a host that the modular flyer board enhances", () => {
  assert.match(screenSource, /onClick=\{\(\) => setHallMode\("board"\)\}/);
  assert.match(screenSource, /hallMode === "board"/);
  assert.match(screenSource, /data-contract-board="list"/);
  assert.match(boardSource, /\[data-contract-board="list"\]/);
  assert.match(boardSource, /requestBoardEnhanced/);
  assert.match(boardCss, /data-request-board-enhanced="true"/);
  assert.match(boardSource, /data-guild-request-board="flyers"/);
});

test("the request board is an empty board asset with modular tier flyers and category badges", () => {
  assert.equal(GUILD_REQUEST_BOARD_ASSETS.board, "/images/guild/request-board/request_board_empty.png");
  assert.equal(getGuildFlyerBaseAsset("bronze"), "/images/guild/request-board/flyer_base_bronze.png");
  assert.equal(getGuildFlyerBaseAsset("silver"), "/images/guild/request-board/flyer_base_silver.png");
  assert.equal(getGuildFlyerBaseAsset("gold"), "/images/guild/request-board/flyer_base_gold.png");

  assert.equal(getGuildFlyerBadgeKind(makeContract()), "donation");
  assert.equal(getGuildFlyerBadgeKind(makeContract({ type: "service_creature", category: "service" })), "service");
  assert.equal(getGuildFlyerBadgeKind(makeContract({ category: "registry" })), "registry");
  assert.equal(getGuildFlyerBadgeKind(makeContract({ category: "lineage" })), "lineage");
  assert.equal(getGuildFlyerBadgeKind(makeContract({ category: "restoration" })), "restoration");
  assert.equal(getGuildFlyerBadgeKind(makeContract({ category: "security" })), "security");
  assert.match(getGuildFlyerBadgeAsset(makeContract({ category: "security" })), /badge_security\.png$/);

  assert.match(boardSource, /getGuildFlyerBaseAsset\(contract\.tier\)/);
  assert.match(boardSource, /getGuildFlyerBadgeAsset\(contract\)/);
  assert.match(boardSource, /data-request-flyer="true"/);
});

test("flyers use six fixed board slots and stable micro-rotations", () => {
  assert.equal(GUILD_REQUEST_BOARD_PAGE_SIZE, 6);
  assert.equal(GUILD_REQUEST_BOARD_SLOTS.length, 6);
  assert.equal(getGuildBoardPageCount(3), 1);
  assert.equal(getGuildBoardPageCount(6), 1);
  assert.equal(getGuildBoardPageCount(7), 2);
  assert.deepEqual(getGuildBoardPage([1, 2, 3, 4, 5, 6, 7], 1), [7]);

  const first = getGuildFlyerRotation("contract-stable", 2);
  const second = getGuildFlyerRotation("contract-stable", 2);
  assert.equal(first, second);
  assert.ok(first >= -2.5 && first <= 2.5);
  assert.match(boardCss, /transform:\s*translate\(-50%, -50%\) rotate\(var\(--flyer-rotation\)\)/);
});

test("contract details own requester Trust, recommendations, service timing, and accept/submit actions", () => {
  assert.match(boardSource, /getGuildRequesterTrustSummary/);
  assert.match(boardSource, /getGuildRequesterTrustReward/);
  assert.match(boardSource, /getGuildCreatureRecommendations/);
  assert.match(boardSource, /data-guild-recommendations="true"/);
  assert.match(boardSource, /Recommended Creature/);
  assert.match(boardSource, /serviceDurationDays/);
  assert.match(boardSource, /returns Ranch Day/);
  assert.match(boardSource, /Accept Request/);
  assert.match(boardSource, /Send Selected Creature/);
  assert.match(boardSource, /Donate Selected Creature/);
  assert.match(boardSource, /Permanent donation/);
  assert.doesNotMatch(boardSource, /position:\s*"fixed"[\s\S]*Recommended Assignments/);
});

test("Guild flyers and detail sheets use tactile pins, status stamps, tier identity, and named requester signatures", () => {
  assert.match(boardSource, /getGuildRequesterDefinition/);
  assert.match(boardSource, /requesterDefinition\.portraitPath/);
  assert.match(boardSource, /requesterDefinition\.title/);
  assert.match(boardSource, /data-request-signature="true"/);
  assert.match(boardSource, /Posted under Guild seal/);
  assert.match(boardSource, /styles\.flyerPin/);
  assert.match(boardSource, /styles\.statusStamp/);
  assert.match(boardSource, /styles\.detailStatusStamp/);
  assert.match(boardSource, /data-detail-tier=\{selectedContract\.tier\}/);
  assert.match(boardSource, /data-detail-status=\{selectedContract\.status\}/);

  assert.match(boardCss, /\.flyerPin\s*\{/);
  assert.match(boardCss, /\.statusStamp\s*\{/);
  assert.match(boardCss, /\.detailStatusStamp\s*\{/);
  assert.match(boardCss, /\.detailSheet\[data-detail-tier="bronze"\]/);
  assert.match(boardCss, /\.detailSheet\[data-detail-tier="silver"\]/);
  assert.match(boardCss, /\.detailSheet\[data-detail-tier="gold"\]/);
  assert.match(boardCss, /\.requesterPortrait\s*\{/);
  assert.match(boardCss, /\.signatureBlock\s*\{/);
});
