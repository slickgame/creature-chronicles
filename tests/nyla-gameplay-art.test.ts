import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { getBattleMove } from "@/data/battleMoves";
import {
  NYLA_GAMEPLAY_ART,
  getNylaCombatSprite,
  getNylaGameplayCardSprite,
  getNylaGameplayProfileSprite,
  getNylaRanchJobSprite,
  isNylaBaseFeline,
} from "@/data/nylaGameplayArt";

const ROOT = new URL("../", import.meta.url);
const baseFeline = { variantId: "variant_base_feline" } as const;
const sphinx = { variantId: "variant_sphinx" } as const;
const tiger = { variantId: "variant_tiger" } as const;
const idle = { fainted: false, actor: false, target: false, specialAttack: false };

test("every transferred approved Nyla gameplay image exists in public assets", async () => {
  for (const path of Object.values(NYLA_GAMEPLAY_ART)) {
    assert.match(path, /^\/images\/creatures\/feline\/nyla\/nyla_\d{2}_/);
    await access(new URL("public" + path, ROOT));
  }
  assert.equal(isNylaBaseFeline(baseFeline as never), true);
  assert.equal(isNylaBaseFeline(sphinx as never), false);
  assert.equal(isNylaBaseFeline(tiger as never), false);
});

test("gameplay art is opt-in and does not flow into the shared breeding registry", async () => {
  assert.equal(getNylaGameplayCardSprite(baseFeline as never, "/old.png"), NYLA_GAMEPLAY_ART.card);
  assert.equal(getNylaGameplayProfileSprite(baseFeline as never, "/old.png"), NYLA_GAMEPLAY_ART.profile);
  for (const variant of [sphinx, tiger]) {
    assert.equal(getNylaGameplayCardSprite(variant as never, "/old.png"), "/old.png");
    assert.equal(getNylaGameplayProfileSprite(variant as never, "/old.png"), "/old.png");
  }
  const variants = await readFile(new URL("src/data/creatures.ts", ROOT), "utf8");
  const baseRow = variants.split("\n").find((line) => line.includes('variantId: "variant_base_feline"'));
  const sphinxRow = variants.split("\n").find((line) => line.includes('variantId: "variant_sphinx"'));
  const tigerRow = variants.split("\n").find((line) => line.includes('variantId: "variant_tiger"'));
  assert.ok(baseRow?.includes("/images/creatures/feline/base_feline_portrait.png"));
  assert.ok(baseRow?.includes("/images/creatures/feline/base_feline_profile.png"));
  assert.ok(sphinxRow?.includes("sphinx_portrait.png"));
  assert.ok(tigerRow?.includes("saberfang_portrait.png"));
  const sharedDetail = await readFile(new URL("src/features/creatures/CreatureDetailPanels.tsx", ROOT), "utf8");
  assert.match(sharedDetail, /useGameplayArt = false/);
  const breedingCore = await readFile(new URL("src/data/breedingCore.ts", ROOT), "utf8");
  assert.match(breedingCore, /portraitPath: variant\.portraitPath/);
});

test("collection and habitats explicitly opt in to Nyla gameplay art", async () => {
  const collection = await readFile(new URL("src/features/collection/CollectionScreen.tsx", ROOT), "utf8");
  const habitat = await readFile(new URL("src/features/habitats/HabitatScreen.tsx", ROOT), "utf8");
  assert.match(collection, /getNylaGameplayCardSprite/);
  assert.match(collection, /getNylaGameplayProfileSprite/);
  assert.match(collection, /useGameplayArt/);
  assert.match(habitat, /getNylaGameplayCardSprite/);
  assert.match(habitat, /useGameplayArt/);
});

test("Nyla battle poses handle idle, basic, signature, guard, hit fallback and KO", async () => {
  assert.equal(getNylaCombatSprite(baseFeline as never, idle), NYLA_GAMEPLAY_ART.combatIdle);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack" }), NYLA_GAMEPLAY_ART.combatBasic);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack", specialAttack: true }), NYLA_GAMEPLAY_ART.combatSpecial);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack", effectPreset: "shield" }), NYLA_GAMEPLAY_ART.combatGuard);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, target: true, eventKind: "damage" }), NYLA_GAMEPLAY_ART.combatGuard);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, fainted: true }), NYLA_GAMEPLAY_ART.combatKO);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, target: true, eventKind: "knockout" }), NYLA_GAMEPLAY_ART.combatKO);
  assert.equal(getNylaCombatSprite(sphinx as never, idle), null);
  assert.equal(getNylaCombatSprite(tiger as never, idle), null);
  assert.equal(getBattleMove("pounce").rarity, "signature");
  assert.equal(getBattleMove("pounce").category, "physical");
  const stage = await readFile(new URL("src/features/battle/BattlePortraitStage.tsx", ROOT), "utf8");
  assert.match(stage, /actingMove\.rarity === "signature"/);
});

test("ranch work and rest remain mapped to approved sprites", async () => {
  assert.equal(getNylaRanchJobSprite(baseFeline as never, "garden_tending", "/old.png"), NYLA_GAMEPLAY_ART.ranchWork);
  assert.equal(getNylaRanchJobSprite(baseFeline as never, "security_patrol", "/old.png"), NYLA_GAMEPLAY_ART.profile);
  assert.equal(getNylaRanchJobSprite(sphinx as never, "garden_tending", "/old.png"), "/old.png");
  const ranch = await readFile(new URL("src/features/ranch/RanchHubScreen.tsx", ROOT), "utf8");
  assert.match(ranch, /NYLA_GAMEPLAY_ART\.sleeping/);
  assert.match(ranch, /getNylaGameplayProfileSprite/);
});

test("breeding scene manifest does not reference Nyla gameplay images", async () => {
  const manifest = await readFile(new URL("src/data/breedingSceneImages.ts", ROOT), "utf8");
  assert.doesNotMatch(manifest, /nyla_0\d_/);
});
