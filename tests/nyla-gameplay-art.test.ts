import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import {
  NYLA_GAMEPLAY_ART,
  getNylaCombatSprite,
  getNylaRanchJobSprite,
  isNylaBaseFeline,
} from "@/data/nylaGameplayArt";

const ROOT = new URL("../", import.meta.url);
const baseFeline = { variantId: "variant_base_feline" } as const;
const sphinx = { variantId: "variant_sphinx" } as const;
const common = { fainted: false, actor: false, target: false, specialAttack: false };

test("approved Nyla gameplay PNG paths resolve under the base Feline folder", async () => {
  for (const imagePath of Object.values(NYLA_GAMEPLAY_ART)) {
    assert.match(imagePath, /^\/images\/creatures\/feline\/nyla\/nyla_\d{2}_/);
    await access(new URL("public" + imagePath, ROOT));
  }
  assert.equal(isNylaBaseFeline(baseFeline as never), true);
  assert.equal(isNylaBaseFeline(sphinx as never), false);
  assert.equal(isNylaBaseFeline(undefined), false);
});

test("base-feline card and full-body assets are centralized without changing other variants", async () => {
  const data = await readFile(new URL("src/data/creatures.ts", ROOT), "utf8");
  const felineRow = data.split("\n").find((line) => line.includes('variantId: "variant_base_feline"'));
  const sphinxRow = data.split("\n").find((line) => line.includes('variantId: "variant_sphinx"'));
  assert.ok(felineRow?.includes(NYLA_GAMEPLAY_ART.card));
  assert.ok(felineRow?.includes(NYLA_GAMEPLAY_ART.profile));
  assert.ok(sphinxRow?.includes("/images/creatures/feline/sphinx_portrait.png"));
});

test("Nyla combat artwork reacts to combat events and preserves other variants", () => {
  assert.equal(getNylaCombatSprite(baseFeline as never, common), NYLA_GAMEPLAY_ART.combatIdle);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...common, actor: true, eventKind: "attack" }), NYLA_GAMEPLAY_ART.combatBasic);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...common, actor: true, eventKind: "attack", specialAttack: true }), NYLA_GAMEPLAY_ART.combatSpecial);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...common, actor: true, eventKind: "attack", effectPreset: "shield" }), NYLA_GAMEPLAY_ART.combatGuard);
  // PNGs 07 and 08 are still transfer-pending, so the fallbacks must be valid.
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...common, target: true, eventKind: "damage" }), NYLA_GAMEPLAY_ART.combatGuard);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...common, fainted: true }), NYLA_GAMEPLAY_ART.sleeping);
  assert.equal(getNylaCombatSprite(sphinx as never, common), null);
});

test("ranch gardening and sleep screens use their respective approved art", async () => {
  assert.equal(getNylaRanchJobSprite(baseFeline as never, "garden_tending", "/legacy.png"), NYLA_GAMEPLAY_ART.ranchWork);
  assert.equal(getNylaRanchJobSprite(baseFeline as never, "security_patrol", "/legacy.png"), NYLA_GAMEPLAY_ART.profile);
  assert.equal(getNylaRanchJobSprite(sphinx as never, "garden_tending", "/legacy.png"), "/legacy.png");
  const ranch = await readFile(new URL("src/features/ranch/RanchHubScreen.tsx", ROOT), "utf8");
  const stage = await readFile(new URL("src/features/battle/BattlePortraitStage.tsx", ROOT), "utf8");
  assert.match(ranch, /NYLA_GAMEPLAY_ART\.sleeping/);
  assert.match(stage, /getNylaCombatSprite/);
});

test("explicit breeding scene manifest remains separate from Nyla gameplay art", async () => {
  const manifest = await readFile(new URL("src/data/breedingSceneImages.ts", ROOT), "utf8");
  assert.doesNotMatch(manifest, /nyla_0\d_/);
});
