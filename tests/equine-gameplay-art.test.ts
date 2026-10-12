import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import {
  EQUINE_GAMEPLAY_ART,
  getEquineCombatSprite,
  getEquineGameplayCardSprite,
  getEquineGameplayProfileSprite,
  getEquineRanchJobSprite,
  isBaseEquine,
} from "@/data/equineGameplayArt";

const ROOT = new URL("../", import.meta.url);
const horse = { variantId: "variant_horse" } as never;
const unicorn = { variantId: "variant_unicorn" } as never;
const nightmare = { variantId: "variant_nightmare" } as never;
const idle = { fainted: false, actor: false, target: false, specialAttack: false };

test("all ten approved Equine gameplay images exist", async () => {
  for (const path of Object.values(EQUINE_GAMEPLAY_ART)) {
    assert.match(path, /^\/images\/creatures\/equine\/gameplay\/equine_\d{2}_/);
    await access(new URL("public" + path, ROOT));
  }
});

test("only the common Horse variant uses these images; breeding registry stays unchanged", async () => {
  assert.equal(isBaseEquine(horse), true);
  assert.equal(isBaseEquine(unicorn), false);
  assert.equal(isBaseEquine(nightmare), false);
  assert.equal(getEquineGameplayCardSprite(horse, "/old.png"), EQUINE_GAMEPLAY_ART.card);
  assert.equal(getEquineGameplayProfileSprite(horse, "/old.png"), EQUINE_GAMEPLAY_ART.profile);
  assert.equal(getEquineRanchJobSprite(horse, "/old.png"), EQUINE_GAMEPLAY_ART.ranchWork);
  for (const variant of [unicorn, nightmare]) {
    assert.equal(getEquineGameplayCardSprite(variant, "/old.png"), "/old.png");
    assert.equal(getEquineGameplayProfileSprite(variant, "/old.png"), "/old.png");
  }
  const registry = await readFile(new URL("src/data/creatures.ts", ROOT), "utf8");
  const horseRow = registry.split("\n").find((line) => line.includes('variantId: "variant_horse"'));
  assert.ok(horseRow?.includes("/images/creatures/equine/horse_portrait.png"));
  assert.ok(horseRow?.includes("/images/creatures/equine/horse_profile.png"));
  const details = await readFile(new URL("src/features/creatures/CreatureDetailPanels.tsx", ROOT), "utf8");
  assert.match(details, /useGameplayArt = false/);
  const breeding = await readFile(new URL("src/data/breedingSceneImages.ts", ROOT), "utf8");
  assert.doesNotMatch(breeding, /equine_\d{2}_/);
});

test("Equine combat art maps idle, basic, special, guard, hit and KO independently", () => {
  assert.equal(getEquineCombatSprite(horse, idle), EQUINE_GAMEPLAY_ART.combatIdle);
  assert.equal(getEquineCombatSprite(horse, {...idle, actor: true, eventKind:"attack"}), EQUINE_GAMEPLAY_ART.combatBasic);
  assert.equal(getEquineCombatSprite(horse, {...idle, actor: true, eventKind:"attack", specialAttack:true}), EQUINE_GAMEPLAY_ART.combatSpecial);
  assert.equal(getEquineCombatSprite(horse, {...idle, actor:true, effectPreset:"shield"}), EQUINE_GAMEPLAY_ART.combatGuard);
  assert.equal(getEquineCombatSprite(horse, {...idle, target:true, eventKind:"damage"}), EQUINE_GAMEPLAY_ART.combatDamage);
  assert.equal(getEquineCombatSprite(horse, {...idle, target:true, eventKind:"knockout"}), EQUINE_GAMEPLAY_ART.combatKO);
  assert.equal(getEquineCombatSprite(horse, {...idle, fainted:true}), EQUINE_GAMEPLAY_ART.combatKO);
  assert.equal(getEquineCombatSprite(unicorn, idle), null);
});
