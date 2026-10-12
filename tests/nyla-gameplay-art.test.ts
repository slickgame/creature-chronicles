import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
  for (const [role, path] of Object.entries(NYLA_GAMEPLAY_ART)) {
    assert.match(path, /^\/images\/creatures\/feline\/nyla\/nyla_\d{2}_/);
    const fileUrl = new URL("public" + path, ROOT);
    await access(fileUrl);
    const header = (await readFile(fileUrl)).subarray(0, 26);
    assert.equal(header.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(header.toString("ascii", 12, 16), "IHDR");
    assert.equal(header.readUInt8(25), 6, role + " must retain RGBA transparency");
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    if (role === "sleeping") assert.ok(width > height, "Sleeping pose uses landscape canvas");
    else assert.ok(height > width, role + " uses portrait canvas");
  }
  assert.equal(isNylaBaseFeline(baseFeline as never), true);
  assert.equal(isNylaBaseFeline(sphinx as never), false);
  assert.equal(isNylaBaseFeline(tiger as never), false);
});

test("canonical portraits and profiles use approved art while rare variants retain their own art", async () => {
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
  assert.ok(baseRow?.includes("/images/creatures/feline/nyla/nyla_02_bust_portrait.png"));
  assert.ok(baseRow?.includes("/images/creatures/feline/nyla/nyla_01_full_body.png"));
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

test("Nyla battle poses handle idle, basic, signature, guard, approved damage and KO", async () => {
  assert.equal(getNylaCombatSprite(baseFeline as never, idle), NYLA_GAMEPLAY_ART.combatIdle);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack" }), NYLA_GAMEPLAY_ART.combatBasic);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack", specialAttack: true }), NYLA_GAMEPLAY_ART.combatSpecial);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, actor: true, eventKind: "attack", effectPreset: "shield" }), NYLA_GAMEPLAY_ART.combatGuard);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, target: true, eventKind: "damage" }), NYLA_GAMEPLAY_ART.combatHit);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, fainted: true }), NYLA_GAMEPLAY_ART.combatKO);
  assert.equal(getNylaCombatSprite(baseFeline as never, { ...idle, target: true, eventKind: "knockout" }), NYLA_GAMEPLAY_ART.combatKO);
  assert.equal(getNylaCombatSprite(sphinx as never, idle), null);
  assert.equal(getNylaCombatSprite(tiger as never, idle), null);
  assert.equal(getBattleMove("pounce").rarity, "signature");
  assert.equal(getBattleMove("pounce").category, "physical");
  const stage = await readFile(new URL("src/features/battle/BattlePortraitStage.tsx", ROOT), "utf8");
  assert.match(stage, /actingMove\.rarity === "signature"/);
});

test("approved user-supplied damage PNG is preserved byte for byte", async () => {
  const uploaded = await readFile(new URL("public" + NYLA_GAMEPLAY_ART.combatHit, ROOT));
  assert.equal(
    createHash("sha256").update(uploaded).digest("hex"),
    "43c0d4386dacc8d45b2adcd2965ac30e09e16f29b2470274fe96e556999e5563",
  );
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


test("Nyla-only battle KO ground contact and tiny-card framing are responsive", async () => {
  const stage = await readFile(new URL("src/features/battle/BattlePortraitStage.tsx", ROOT), "utf8");
  const battleCss = await readFile(new URL("src/features/battle/BattlePortraitStage.module.css", ROOT), "utf8");
  const polishCss = await readFile(new URL("src/features/battle/BattlePortraitStagePolish.module.css", ROOT), "utf8");
  const habitat = await readFile(new URL("src/features/habitats/HabitatScreen.tsx", ROOT), "utf8");
  const habitatCss = await readFile(new URL("src/features/habitats/HabitatScreen.module.css", ROOT), "utf8");

  assert.match(stage, /data-nyla-pose=\{nylaSprite === NYLA_GAMEPLAY_ART\.combatKO/);
  assert.match(stage, /data-nyla-card=\{isNylaBaseFeline\(source\)/);
  assert.match(habitat, /data-nyla-card=\{isNylaBaseFeline\(creature\)/);
  assert.match(polishCss, /\.combatant\[data-nyla-pose="ko"\]\[data-side\]\[data-slot\]/);
  assert.match(polishCss, /--portrait-offset-y:\s*12% !important/);
  assert.match(polishCss, /@media \(max-width: 850px\)[\s\S]*--portrait-offset-y:\s*10% !important/);
  assert.match(battleCss, /\.orderToken img\[data-nyla-card="true"\]\s*\{\s*object-position: center top/);
  assert.match(habitatCss, /\.creatureCard img\[data-nyla-card="true"\]\s*\{\s*object-position: center top/);
  assert.match(battleCss, /\.stage\[data-reduced-motion="true"\] \*/);
});

test("participant cards use shared definitions while scene imagery stays isolated", async () => {
  const breedingCore = await readFile(new URL("src/data/breedingCore.ts", ROOT), "utf8");
  const breedingScreen = await readFile(new URL("src/features/breeding/BreedingFocusedScreen.tsx", ROOT), "utf8");
  const breedingOverlay = await readFile(new URL("src/features/breeding/SharedInfoOverlay.tsx", ROOT), "utf8");
  const sharedDetail = await readFile(new URL("src/features/creatures/CreatureDetailPanels.tsx", ROOT), "utf8");

  assert.match(breedingCore, /portraitPath: variant\.portraitPath/);
  assert.match(breedingCore, /variant\.profilePath/);
  assert.doesNotMatch(breedingScreen, /useGameplayArt/);
  assert.doesNotMatch(breedingOverlay, /useGameplayArt/);
  assert.match(sharedDetail, /useGameplayArt = false/);
});
