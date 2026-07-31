import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState } from "@/data/battleEngine";
import {
  applyPredatorBattleOpening,
  buildPredatorEnemyTeam,
  getPendingPredatorEvent,
  recordPredatorBattleOutcome,
  resolvePredatorNightCheck,
} from "@/data/predatorEvents";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function exposedSave(): GameSave {
  const save = createNewGameSave("Predator Test", 0);
  const source = save.creatures ?? [];
  const creatures = Array.from({ length: 8 }, (_, index) => ({
    ...source[index % source.length],
    creatureId: `predator-test-${index}` as CreatureId,
    nickname: `Defender ${index + 1}`,
  }));
  return {
    ...save,
    creatures,
    dayState: { ...save.dayState, dayNumber: 8 },
    flags: {
      ...save.flags,
      chapterOneGuidedComplete: true,
      ranchFeedStock: 30,
      ranchDamage: 25,
      ranchMaterialsStock: 10,
      ranchSecurityScoreToday: 0,
    },
  };
}

test("subthreshold predator pressure explains why no incident can occur", () => {
  const save = createNewGameSave("Low Pressure", 0);
  const source = save.creatures ?? [];
  const creatures = Array.from({ length: 7 }, (_, index) => ({
    ...source[index % source.length],
    creatureId: `low-pressure-${index}` as CreatureId,
  }));
  const assessment = getPredatorThreatAssessment({
    ...save,
    creatures,
    dayState: { ...save.dayState, dayNumber: 8 },
    flags: { ...save.flags, chapterOneGuidedComplete: true, ranchFeedStock: 0, ranchDamage: 0 },
  });
  assert.equal(assessment.eligible, false);
  assert.ok(assessment.pressure < 18);
  assert.ok(assessment.blockers.some((item) => item.includes("18-point incident threshold")));
});

test("a forced qualifying incident is persisted and cannot reroll on reload", () => {
  const save = exposedSave();
  const forced = {
    ...save,
    flags: { ...save.flags, devForcePredatorEvent: true, devForcePredatorType: "wolves" },
  };
  const first = resolvePredatorNightCheck(forced, 0);
  assert.equal(first.rolled, true);
  assert.equal(first.event?.predatorType, "wolves");
  assert.equal(first.event?.status, "battle_pending");
  const persisted = getPendingPredatorEvent(first.save);
  assert.equal(persisted?.eventId, first.event?.eventId);

  const second = resolvePredatorNightCheck(first.save, 99);
  assert.equal(second.rolled, false);
  assert.equal(second.event?.eventId, first.event?.eventId);
  assert.equal(second.event?.startingHpPercent, first.event?.startingHpPercent);
});

test("successful interception carries reduced enemy HP into the battle state", () => {
  const forced = {
    ...exposedSave(),
    flags: {
      ...exposedSave().flags,
      devForcePredatorEvent: true,
      devForcePredatorIntercept: true,
      devForcePredatorType: "feral_hounds",
    },
  };
  const checked = resolvePredatorNightCheck(forced, 12);
  assert.ok(checked.event);
  assert.equal(checked.event?.intercepted, true);
  assert.ok((checked.event?.startingHpPercent ?? 100) < 100);
  const team = (checked.save.creatures ?? []).slice(0, 3);
  const enemies = buildPredatorEnemyTeam(checked.save, checked.event!);
  const base = createBattleState({
    battleId: checked.event!.eventId,
    playerCreatures: team,
    enemyCreatures: enemies,
    playerTeamName: "Defenders",
    enemyTeamName: checked.event!.predatorName,
  });
  const opened = applyPredatorBattleOpening(base, checked.event!);
  const enemyCombatants = Object.values(opened.combatants).filter((entry) => entry.sideId === "enemy");
  assert.equal(enemyCombatants.length, 3);
  assert.ok(enemyCombatants.every((entry) => entry.currentHp < entry.maxHp && entry.currentHp >= 1));
});

test("victory rewards and defeat penalties are each applied exactly once", () => {
  const victoryCheck = resolvePredatorNightCheck({
    ...exposedSave(),
    flags: { ...exposedSave().flags, devForcePredatorEvent: true, devForcePredatorType: "foxes" },
  }, 0);
  const victoryEvent = victoryCheck.event!;
  const teamIds = (victoryCheck.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const goldBefore = victoryCheck.save.currencies.gold;
  const materialsBefore = Number(victoryCheck.save.flags.ranchMaterialsStock ?? 0);
  const victory = recordPredatorBattleOutcome(victoryCheck.save, victoryEvent.eventId, "player_won", 3, teamIds);
  assert.equal(victory.duplicate, false);
  assert.ok(victory.save.currencies.gold > goldBefore);
  assert.ok(Number(victory.save.flags.ranchMaterialsStock) > materialsBefore);
  assert.equal(getPendingPredatorEvent(victory.save), null);

  const duplicateVictory = recordPredatorBattleOutcome(victory.save, victoryEvent.eventId, "player_won", 3, teamIds);
  assert.equal(duplicateVictory.duplicate, true);
  assert.equal(duplicateVictory.save.currencies.gold, victory.save.currencies.gold);
  assert.equal(duplicateVictory.save.flags.ranchMaterialsStock, victory.save.flags.ranchMaterialsStock);

  const defeatCheck = resolvePredatorNightCheck({
    ...exposedSave(),
    saveId: `${exposedSave().saveId}-defeat` as GameSave["saveId"],
    flags: { ...exposedSave().flags, devForcePredatorEvent: true, devForcePredatorType: "boars" },
  }, 0);
  const defeatEvent = defeatCheck.event!;
  const defeatTeam = (defeatCheck.save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const feedBefore = Number(defeatCheck.save.flags.ranchFeedStock ?? 0);
  const damageBefore = Number(defeatCheck.save.flags.ranchDamage ?? 0);
  const defeat = recordPredatorBattleOutcome(defeatCheck.save, defeatEvent.eventId, "enemy_won", 4, defeatTeam);
  assert.equal(defeat.duplicate, false);
  assert.ok(Number(defeat.save.flags.ranchFeedStock) < feedBefore);
  assert.ok(Number(defeat.save.flags.ranchDamage) > damageBefore);

  const duplicateDefeat = recordPredatorBattleOutcome(defeat.save, defeatEvent.eventId, "enemy_won", 4, defeatTeam);
  assert.equal(duplicateDefeat.duplicate, true);
  assert.equal(duplicateDefeat.save.flags.ranchFeedStock, defeat.save.flags.ranchFeedStock);
  assert.equal(duplicateDefeat.save.flags.ranchDamage, defeat.save.flags.ranchDamage);
});
