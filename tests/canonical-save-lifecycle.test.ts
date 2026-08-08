import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createNewGameSave, normalizeGameSave } from "@/lib/save/localSave";

test("the public localSave module routes through the normalized lifecycle", () => {
  const facade = readFileSync("src/lib/save/localSave.ts", "utf8");
  const lifecycle = readFileSync("src/lib/save/localSaveLifecycle.ts", "utf8");
  assert.match(facade, /export \* from "\.\/localSaveLifecycle"/);
  assert.match(lifecycle, /import \* as core from "\.\/localSaveCore"/);
  assert.match(lifecycle, /export function normalizeGameSave/);
  assert.match(lifecycle, /normalizeCreatureLegacySave/);
});

test("new public saves include every current Legacy persistence layer", () => {
  const save = createNewGameSave("Canonical Save Tester", 0);
  const creatureCount = save.creatures?.length ?? 0;
  assert.ok(creatureCount > 0);
  assert.equal(Object.keys(save.creatureCareers?.recordsByCreatureId ?? {}).length, creatureCount);
  assert.equal(Object.keys(save.creaturePersonalities?.profilesByCreatureId ?? {}).length, creatureCount);
  assert.ok(save.creatureMemories?.chronicle.length);
  assert.deepEqual(save.creatureLegacy?.retiredByCreatureId, {});
  assert.deepEqual(save.creatureLegacy?.heirloomsById, {});
  assert.deepEqual(save.creatureLegacy?.hallByCreatureId, {});
  assert.equal(save.flags.creatureCareersMigrated, true);
  assert.equal(save.flags.creaturePersonalitiesMigrated, true);
  assert.equal(save.flags.creatureRelationshipsMigrated, true);
  assert.equal(save.flags.creatureRetirementEnabled, true);
  assert.equal(save.flags.heirloomsEnabled, true);
  assert.equal(save.flags.hallOfLegendsEnabled, true);
});

test("normalizing an already-normalized save preserves Legacy identity", () => {
  const save = createNewGameSave("Idempotent Save Tester", 0);
  const normalized = normalizeGameSave(save, save.ranchDay?.phase ?? "active");
  assert.deepEqual(normalized.creaturePersonalities, save.creaturePersonalities);
  assert.deepEqual(normalized.creatureRelationships, save.creatureRelationships);
  assert.deepEqual(normalized.creatureLegacy, save.creatureLegacy);
});
