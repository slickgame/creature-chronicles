import assert from "node:assert/strict";
import test from "node:test";
import {
  generateCreaturePersonality,
  getCreaturePersonalityProfile,
  getPersonalityCompatibility,
  normalizeCreaturePersonalitySave,
} from "@/data/creaturePersonalities";
import { createNewGameSave } from "@/lib/save/localSave";

test("personality migration assigns every creature a stable profile", () => {
  const save = createNewGameSave("Personality Tester", 0);
  const normalized = normalizeCreaturePersonalitySave(save);
  const creatures = normalized.creatures ?? [];
  assert.ok(creatures.length >= 2);
  assert.equal(Object.keys(normalized.creaturePersonalities?.profilesByCreatureId ?? {}).length, creatures.length);
  for (const creature of creatures) {
    const first = getCreaturePersonalityProfile(normalized, creature.creatureId);
    const second = getCreaturePersonalityProfile(normalized, creature.creatureId);
    assert.deepEqual(first, second);
    assert.ok(first.preferredJobIds.length >= 2);
    assert.ok(first.values.length >= 2);
    assert.equal(first.creatureId, creature.creatureId);
  }
  assert.equal(normalized.flags.creaturePersonalitiesMigrated, true);
});

test("personality generation is deterministic before persistence", () => {
  const save = createNewGameSave("Personality Seed Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  assert.deepEqual(generateCreaturePersonality(creature), generateCreaturePersonality(structuredClone(creature)));
});

test("personality compatibility stays within the supported social range", () => {
  const normalized = normalizeCreaturePersonalitySave(createNewGameSave("Compatibility Tester", 0));
  const [left, right] = normalized.creatures ?? [];
  assert.ok(left && right);
  const leftProfile = getCreaturePersonalityProfile(normalized, left.creatureId);
  const rightProfile = getCreaturePersonalityProfile(normalized, right.creatureId);
  const score = getPersonalityCompatibility(leftProfile, rightProfile);
  assert.ok(score >= -2 && score <= 4);
});
