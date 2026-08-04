import assert from "node:assert/strict";
import test from "node:test";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import { getCreatureRelationship } from "@/data/creatureRelationships";
import {
  COLISEUM_C2_ENCOUNTERS,
  recordColiseumC2BattleResult,
  type ColiseumCombatPerformanceMap,
} from "@/data/coliseumC2";
import { createNewGameSave } from "@/lib/save/localSave";

test("authored Coliseum results forward exact performance into Careers", () => {
  const save = createNewGameSave("C2 Legacy Tester", 0);
  const [left, right] = save.creatures ?? [];
  assert.ok(left && right);
  const encounter = COLISEUM_C2_ENCOUNTERS[0];
  const performance: ColiseumCombatPerformanceMap = {
    [String(left.creatureId)]: {
      creatureId: left.creatureId,
      actionsTaken: 3,
      damageDealt: 88,
      healingDone: 14,
      statusesApplied: 1,
      alliesProtected: 2,
      knockouts: 1,
      misses: 0,
    },
    [String(right.creatureId)]: {
      creatureId: right.creatureId,
      actionsTaken: 3,
      damageDealt: 42,
      healingDone: 30,
      statusesApplied: 0,
      alliesProtected: 1,
      knockouts: 0,
      misses: 1,
    },
  };

  const result = recordColiseumC2BattleResult(
    save,
    encounter.encounterId,
    "player_won",
    3,
    [left.creatureId, right.creatureId],
    performance,
    "c2_legacy_result_one",
  );
  assert.equal(result.duplicate, false);
  const leftCareer = getCreatureCareerRecord(result.save, left.creatureId);
  const rightCareer = getCreatureCareerRecord(result.save, right.creatureId);
  assert.equal(leftCareer.victories, 1);
  assert.equal(leftCareer.damageDealt, 88);
  assert.equal(leftCareer.healingDone, 14);
  assert.equal(leftCareer.alliesProtected, 2);
  assert.equal(leftCareer.knockouts, 1);
  assert.equal(rightCareer.damageDealt, 42);
  assert.equal(rightCareer.healingDone, 30);
  assert.equal(getCreatureRelationship(result.save, left.creatureId, right.creatureId).affinity, 2);
});

test("duplicate authored Coliseum result IDs do not duplicate Career credit", () => {
  const save = createNewGameSave("C2 Duplicate Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);
  const encounter = COLISEUM_C2_ENCOUNTERS[0];
  const performance: ColiseumCombatPerformanceMap = {
    [String(creature.creatureId)]: {
      creatureId: creature.creatureId,
      actionsTaken: 1,
      damageDealt: 25,
      healingDone: 0,
      statusesApplied: 0,
      alliesProtected: 0,
      knockouts: 0,
      misses: 0,
    },
  };
  const first = recordColiseumC2BattleResult(
    save,
    encounter.encounterId,
    "player_won",
    1,
    [creature.creatureId],
    performance,
    "c2_duplicate_result",
  );
  const second = recordColiseumC2BattleResult(
    first.save,
    encounter.encounterId,
    "player_won",
    1,
    [creature.creatureId],
    performance,
    "c2_duplicate_result",
  );
  assert.equal(second.duplicate, true);
  assert.equal(getCreatureCareerRecord(second.save, creature.creatureId).battlesEntered, 1);
});
