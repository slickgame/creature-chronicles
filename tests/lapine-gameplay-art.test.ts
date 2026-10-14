import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  LAPINE_GAMEPLAY_ART,
  getLapineCombatSprite,
  getLapineGameplayCardSprite,
  getLapineGameplayProfileSprite,
  getLapineRanchJobSprite,
  isBaseLapine,
} from "@/data/lapineGameplayArt";

const ROOT = new URL("../", import.meta.url);
const bunny = { variantId: "variant_bunny" } as never;
const antlerhare = { variantId: "variant_antlerhare" } as never;
const dreamLop = { variantId: "variant_dream_lop" } as never;
const idle = { fainted: false, actor: false, target: false, specialAttack: false };

test("all ten approved Lapine gameplay PNGs exist and have an alpha channel", async () => {
  const paths = Object.values(LAPINE_GAMEPLAY_ART);
  assert.equal(new Set(paths).size, 10);
  for (const asset of paths) {
    assert.match(asset, /^\/images\/creatures\/lapine\/gameplay\/lapine_\d{2}_/);
    const png = await readFile(new URL("public" + asset, ROOT));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.toString("ascii", 12, 16), "IHDR");
    assert.equal(png.readUInt8(25), 6, "Approved source must be RGBA PNG");
  }
});

test("base Bunny uses gameplay-only images while rare Lapine variants and breeding registry stay untouched", async () => {
  assert.equal(isBaseLapine(bunny), true);
  assert.equal(isBaseLapine(antlerhare), false);
  assert.equal(isBaseLapine(dreamLop), false);
  assert.equal(isBaseLapine(undefined), false);
  assert.equal(getLapineGameplayCardSprite(bunny, "/legacy.png"), LAPINE_GAMEPLAY_ART.card);
  assert.equal(getLapineGameplayProfileSprite(bunny, "/legacy.png"), LAPINE_GAMEPLAY_ART.profile);
  assert.equal(getLapineRanchJobSprite(bunny, "garden_tending", "/legacy.png"), LAPINE_GAMEPLAY_ART.ranchWork);
  assert.equal(getLapineRanchJobSprite(bunny, "security_patrol", "/legacy.png"), LAPINE_GAMEPLAY_ART.profile);
  for (const rare of [antlerhare, dreamLop]) {
    assert.equal(getLapineGameplayCardSprite(rare, "/legacy.png"), "/legacy.png");
    assert.equal(getLapineGameplayProfileSprite(rare, "/legacy.png"), "/legacy.png");
    assert.equal(getLapineRanchJobSprite(rare, "garden_tending", "/legacy.png"), "/legacy.png");
    assert.equal(getLapineCombatSprite(rare, idle), null);
  }

  const registry = await readFile(new URL("src/data/creatures.ts", ROOT), "utf8");
  const bunnyDefinition = registry.split("\n").find(line => line.includes('variantId: "variant_bunny"'));
  assert.ok(bunnyDefinition?.includes("/images/creatures/lapine/bunny_portrait.png"));
  assert.ok(bunnyDefinition?.includes("/images/creatures/lapine/bunny_profile.png"));
  const sharedDetails = await readFile(new URL("src/features/creatures/CreatureDetailPanels.tsx", ROOT), "utf8");
  assert.match(sharedDetails, /useGameplayArt = false/);
  const breeding = await readFile(new URL("src/data/breedingSceneImages.ts", ROOT), "utf8");
  assert.doesNotMatch(breeding, /lapine_\d{2}_/);
});

test("base Bunny combat switches independently between idle, basic, special, guard, hit and KO", () => {
  assert.equal(getLapineCombatSprite(bunny, idle), LAPINE_GAMEPLAY_ART.combatIdle);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, actor: true, eventKind: "attack" }), LAPINE_GAMEPLAY_ART.combatBasic);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, actor: true, eventKind: "attack", specialAttack: true }), LAPINE_GAMEPLAY_ART.combatSpecial);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, actor: true, effectPreset: "shield" }), LAPINE_GAMEPLAY_ART.combatGuard);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, target: true, eventKind: "damage" }), LAPINE_GAMEPLAY_ART.combatDamage);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, target: true, eventKind: "knockout" }), LAPINE_GAMEPLAY_ART.combatKO);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, fainted: true }), LAPINE_GAMEPLAY_ART.combatKO);
  assert.equal(getLapineCombatSprite(bunny, { ...idle, fainted: true, actor: true, eventKind: "attack" }), LAPINE_GAMEPLAY_ART.combatKO);
});

test("Lapine visuals are connected only in gameplay screens", async () => {
  const screens = [
    "src/features/battle/BattlePortraitStage.tsx",
    "src/features/collection/CollectionScreen.tsx",
    "src/features/creatures/CreatureDetailPanels.tsx",
    "src/features/habitats/HabitatScreen.tsx",
    "src/features/ranch-jobs/RanchJobsScreen.tsx",
    "src/features/ranch/RanchHubScreen.tsx",
  ];
  for (const path of screens) {
    assert.match(await readFile(new URL(path, ROOT), "utf8"), /lapineGameplayArt/);
  }
  const ranch = await readFile(new URL("src/features/ranch/RanchHubScreen.tsx", ROOT), "utf8");
  assert.match(ranch, /LAPINE_GAMEPLAY_ART\.sleeping/);
  const battle = await readFile(new URL("src/features/battle/BattlePortraitStage.tsx", ROOT), "utf8");
  assert.match(battle, /getLapineCombatSprite/);
});
