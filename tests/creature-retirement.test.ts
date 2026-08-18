import assert from "node:assert/strict";
import test from "node:test";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import { getCreatureLegacyProfile, getRanchLegacySummary } from "@/data/creatureLegacyRankings";
import { getCreatureMemories, getChronicleEntries } from "@/data/creatureMemories";
import {
  getCreatureHeirlooms,
  getHallOfLegendsEntries,
  getRetiredCreatureRecord,
  getRetirementEligibility,
  retireCreature,
} from "@/data/creatureRetirement";
import { createNewGameSave, normalizeGameSave } from "@/lib/save/localSave";
import type { GameSave } from "@/types/save";

function makeRetirementReady(save: GameSave, creatureId: string): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((creature) =>
      creature.creatureId === creatureId
        ? { ...creature, level: 20, isLocked: false }
        : creature,
    ),
  };
}

function makeHallReady(save: GameSave, creatureId: string): GameSave {
  const record = getCreatureCareerRecord(save, creatureId);
  return {
    ...save,
    creatureCareers: {
      ...save.creatureCareers!,
      recordsByCreatureId: {
        ...save.creatureCareers!.recordsByCreatureId,
        [String(creatureId)]: {
          ...record,
          victories: 20,
          battlesEntered: Math.max(record.battlesEntered, 20),
        },
      },
    },
  };
}

test("retirement removes a creature from active systems and preserves a permanent profile", () => {
  const save = createNewGameSave("Retirement Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const prepared = makeRetirementReady(save, creature.creatureId);
  const eligibility = getRetirementEligibility(prepared, creature.creatureId);
  assert.equal(eligibility.eligible, true);

  const result = retireCreature(prepared, creature.creatureId);
  assert.equal(result.ok, true);
  assert.ok(result.retired);
  assert.ok(result.heirloom);
  assert.equal(
    result.save.creatures?.some((entry) => entry.creatureId === creature.creatureId),
    false,
  );
  assert.equal(result.save.creatureIds.includes(creature.creatureId), false);
  assert.equal(
    result.save.habitats?.some((habitat) => habitat.creatureIds.includes(creature.creatureId)),
    false,
  );
  assert.ok(getRetiredCreatureRecord(result.save, creature.creatureId));
  assert.equal(getCreatureHeirlooms(result.save).length, 1);
  assert.ok(
    getCreatureMemories(result.save, creature.creatureId).some(
      (memory) => memory.sourceKey === `retirement:${creature.creatureId}`,
    ),
  );
  assert.ok(
    getChronicleEntries(result.save).some(
      (entry) => entry.sourceKey === `retirement:${creature.creatureId}`,
    ),
  );
});

test("Hall-eligible retirement creates one permanent induction and one Heirloom", () => {
  const save = createNewGameSave("Hall Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const prepared = makeHallReady(makeRetirementReady(save, creature.creatureId), creature.creatureId);
  const profile = getCreatureLegacyProfile(prepared, creature);
  assert.equal(profile.hallEligible, true);

  const first = retireCreature(prepared, creature.creatureId, true);
  assert.equal(first.ok, true);
  assert.equal(getHallOfLegendsEntries(first.save).length, 1);
  assert.equal(getCreatureHeirlooms(first.save).length, 1);
  assert.equal(getRetiredCreatureRecord(first.save, creature.creatureId)?.inductedIntoHall, true);
  assert.ok(
    getCreatureMemories(first.save, creature.creatureId).some(
      (memory) => memory.sourceKey === `hall-induction:${creature.creatureId}`,
    ),
  );

  const repeated = retireCreature(first.save, creature.creatureId, true);
  assert.equal(repeated.ok, false);
  assert.equal(getHallOfLegendsEntries(repeated.save).length, 1);
  assert.equal(getCreatureHeirlooms(repeated.save).length, 1);
});

test("retirement and Hall data survive canonical save normalization", () => {
  const save = createNewGameSave("Retirement Save Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const prepared = makeHallReady(makeRetirementReady(save, creature.creatureId), creature.creatureId);
  const retired = retireCreature(prepared, creature.creatureId, true);
  assert.equal(retired.ok, true);

  const normalized = normalizeGameSave(retired.save, retired.save.ranchDay?.phase ?? "active");
  assert.ok(getRetiredCreatureRecord(normalized, creature.creatureId));
  assert.equal(getCreatureHeirlooms(normalized).length, 1);
  assert.equal(getHallOfLegendsEntries(normalized).length, 1);
  const summary = getRanchLegacySummary(normalized);
  assert.equal(summary.retiredCreatures, 1);
  assert.equal(summary.heirlooms, 1);
  assert.equal(summary.hallInductedCreatures, 1);
});

test("retirement refuses to remove the final active ranch creature", () => {
  const save = createNewGameSave("Final Creature Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const oneCreatureSave: GameSave = {
    ...makeRetirementReady(save, creature.creatureId),
    creatures: [{ ...creature, level: 20, isLocked: false }],
    creatureIds: [creature.creatureId],
  };
  const eligibility = getRetirementEligibility(oneCreatureSave, creature.creatureId);
  assert.equal(eligibility.eligible, false);
  assert.ok(eligibility.reasons.some((reason) => reason.includes("At least one active creature")));
  assert.equal(retireCreature(oneCreatureSave, creature.creatureId).ok, false);
});
