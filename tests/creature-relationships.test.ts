import assert from "node:assert/strict";
import test from "node:test";
import { applyBattleCareerResults } from "@/data/creatureCareerTransactions";
import {
  getCreatureRelationship,
  getCreatureRelationshipKind,
  getRelationshipsForCreature,
  normalizeCreatureRelationshipSave,
  recordCreatureRelationshipEvent,
} from "@/data/creatureRelationships";
import { createNewGameSave } from "@/lib/save/localSave";
import type { GameSave } from "@/types/save";

test("relationship events are symmetric and idempotent", () => {
  const save = createNewGameSave("Relationship Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const event = {
    eventKey: "relationship:test:shared-shift",
    creatureIds: [left.creatureId, right.creatureId] as [typeof left.creatureId, typeof right.creatureId],
    dayNumber: save.dayState.dayNumber,
    affinityDelta: 7,
  };
  const once = recordCreatureRelationshipEvent(save, event);
  const twice = recordCreatureRelationshipEvent(once, event);
  const forward = getCreatureRelationship(twice, left.creatureId, right.creatureId);
  const reverse = getCreatureRelationship(twice, right.creatureId, left.creatureId);
  assert.deepEqual(forward, reverse);
  assert.equal(forward.affinity, 7);
  assert.equal(forward.sharedEvents, 1);
});

test("battle participants build shared team history", () => {
  const save = createNewGameSave("Battle Bond Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const updated = applyBattleCareerResults(save, {
    battleId: "social_battle_one",
    outcome: "victory",
    dayNumber: save.dayState.dayNumber,
    participants: [{ creatureId: left.creatureId }, { creatureId: right.creatureId }],
  });
  const relationship = getCreatureRelationship(updated, left.creatureId, right.creatureId);
  assert.equal(relationship.affinity, 2);
  assert.equal(relationship.sharedEvents, 1);
  assert.equal(getRelationshipsForCreature(updated, left.creatureId).length, 1);
});

test("birth history migration seeds family bonds", () => {
  const save = createNewGameSave("Family Bond Tester", 0);
  const [child, parent] = save.creatures ?? [];
  assert.ok(child && parent);
  const withBirth = {
    ...save,
    birthHistory: [{
      birthId: "birth_family_test",
      creatureId: child.creatureId,
      hatchedAtDayNumber: 3,
      parents: {
        giver: { creatureId: parent.creatureId },
        receiver: {},
      },
    }],
  } as unknown as GameSave;
  const normalized = normalizeCreatureRelationshipSave(withBirth);
  const relationship = getCreatureRelationship(normalized, child.creatureId, parent.creatureId);
  assert.equal(relationship.family, true);
  assert.ok(relationship.affinity >= 35);
  assert.equal(getCreatureRelationshipKind(relationship), "family");
});
