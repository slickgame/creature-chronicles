import assert from "node:assert/strict";
import test from "node:test";
import { getChronicleEntries, getCreatureMemories } from "@/data/creatureMemories";
import {
  getCreatureRelationship,
  recordCreatureRelationshipEvent,
} from "@/data/creatureRelationships";
import { createNewGameSave } from "@/lib/save/localSave";

test("crossing friendship thresholds writes mirrored Memories and one Chronicle story", () => {
  const save = createNewGameSave("Friendship Milestone Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  let updated = recordCreatureRelationshipEvent(save, {
    eventKey: "friendship:one",
    creatureIds: [left.creatureId, right.creatureId],
    dayNumber: save.dayState.dayNumber,
    affinityDelta: 20,
  });
  updated = recordCreatureRelationshipEvent(updated, {
    eventKey: "friendship:two",
    creatureIds: [left.creatureId, right.creatureId],
    dayNumber: save.dayState.dayNumber,
    affinityDelta: 10,
  });
  assert.equal(getCreatureRelationship(updated, left.creatureId, right.creatureId).affinity, 30);
  const sourceKey = `relationship-milestone:${[String(left.creatureId), String(right.creatureId)].sort().join("::")}:friend`;
  assert.ok(getCreatureMemories(updated, left.creatureId).some((memory) => memory.sourceKey === sourceKey));
  assert.ok(getCreatureMemories(updated, right.creatureId).some((memory) => memory.sourceKey === sourceKey));
  assert.equal(getChronicleEntries(updated).filter((entry) => entry.sourceKey === sourceKey).length, 1);
});

test("crossing rivalry thresholds records a major shared hardship only once", () => {
  const save = createNewGameSave("Rivalry Milestone Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  let updated = save;
  for (const [index, delta] of [-20, -20, -5].entries()) {
    updated = recordCreatureRelationshipEvent(updated, {
      eventKey: `rivalry:${index}`,
      creatureIds: [left.creatureId, right.creatureId],
      dayNumber: save.dayState.dayNumber,
      affinityDelta: delta,
    });
  }
  assert.equal(getCreatureRelationship(updated, left.creatureId, right.creatureId).affinity, -45);
  const rivalEntries = getChronicleEntries(updated).filter((entry) =>
    entry.sourceKey.endsWith(":rival"),
  );
  assert.equal(rivalEntries.length, 1);
  assert.equal(rivalEntries[0]?.importance, "major");
});
