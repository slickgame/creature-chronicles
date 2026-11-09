import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, previewBattleAction, resolveBattleTurn } from "@/data/battleEngine";
import type { BattleMoveId } from "@/types/battle";
import { createNewGameSave } from "./helpers/establishedSave.ts";

function createDamageFixture(speciesId: string, moveId: BattleMoveId, twoEnemies = false) {
  const creatures = createNewGameSave("Damage breakdown", 0).creatures;
  const player = creatures.find(creature => creature.speciesId === speciesId);
  const enemy = creatures.find(creature => creature.speciesId === "species_bovine");
  assert.ok(player && enemy);
  const state = createBattleState({
    battleId: "damage-breakdown",
    playerCreatures: [player],
    enemyCreatures: twoEnemies ? [enemy, { ...enemy, creatureId: "second_bovine" }] : [enemy],
  });
  const [actorId] = state.teams.player.combatantIds;
  const actor = state.combatants[actorId];
  actor.loadout = { ...actor.loadout, equippedMoveIds: [moveId], learnedMoveIds: [moveId] };
  Object.assign(actor.battleStats, { accuracy: 1000, physicalPower: 40, specialPower: 40 });
  const targetIds = state.teams.enemy.combatantIds;
  for (const id of targetIds) {
    Object.assign(state.combatants[id].battleStats, { evasion: 0, resistance: 20, defense: 40 });
  }
  return { state, action: { actorId, moveId, targetIds }, order: [actorId, ...targetIds] };
}

test("damage forecast follows additive species and ordered multiplicative modifiers per target", () => {
  const { state, action, order } = createDamageFixture("species_equine", "thunder_tread", true);
  const [guardedId, otherId] = action.targetIds;
  state.combatants[guardedId].statuses = [
    { status: "guarded", amount: 35, duration: 2 },
    { status: "marked", duration: 2 },
  ];
  const before = structuredClone(state);
  const preview = previewBattleAction(state, action);
  const guarded = preview.find(row => row.targetId === guardedId && row.effectType === "damage");
  const other = preview.find(row => row.targetId === otherId && row.effectType === "damage");
  assert.ok(guarded?.damageBreakdown && other?.damageBreakdown);
  const { baseDamage, finalDamage, hpLost, modifiers } = guarded.damageBreakdown;
  assert.deepEqual([baseDamage, finalDamage, hpLost], [40, 33, 33]);
  assert.deepEqual(modifiers.map(({ kind, operation, percent, damageBefore, damageAfter }) =>
    [kind, operation, percent, damageBefore, damageAfter]), [
    ["affinity", "additive", 10, 40, 44],
    ["vulnerability", "additive", 20, 44, 52],
    ["guarded", "multiply", -35, 52, 34],
    ["marked", "multiply", 15, 34, 39],
    ["spread", "multiply", -15, 39, 33],
  ]);
  assert.equal(other.damageBreakdown.finalDamage, 44);
  assert.deepEqual(other.damageBreakdown.modifiers.map(step => step.kind), ["affinity", "vulnerability", "spread"]);
  assert.ok(preview.filter(row => row.effectType !== "damage").every(row => row.damageBreakdown === undefined));
  assert.deepEqual(state, before);

  const resolved = resolveBattleTurn(state, order, action);
  assert.ok(resolved);
  for (const row of [guarded, other]) {
    const impact = resolved.frames.find(frame => frame.kind === "damage" && frame.targetIds[0] === row.targetId);
    assert.equal(impact?.state.combatants[row.targetId].currentHp, row.hpAfter);
    assert.equal(impact?.label, `-${row.damageBreakdown?.hpLost} HP`);
  }
});

test("damage forecast separates modifier caps, the damage minimum, and HP lost to overkill", () => {
  const { state, action, order } = createDamageFixture("species_feline", "pounce");
  const [targetId] = action.targetIds;
  const target = state.combatants[targetId];
  target.currentHp = 3;
  target.statuses = [{ status: "guarded", amount: 65, duration: 2 }];

  const [overkill] = previewBattleAction(state, action);
  const breakdown = overkill.damageBreakdown;
  assert.ok(breakdown);
  assert.deepEqual([breakdown.baseDamage, breakdown.modifierTotal, breakdown.finalDamage, breakdown.hpLost, overkill.hpAfter], [40, 0.35, 14, 3, 0]);
  assert.deepEqual(breakdown.modifiers.map(({ kind, percent, damageBefore, damageAfter }) =>
    [kind, percent, damageBefore, damageAfter]), [
    ["affinity", 10, 40, 44],
    ["resistance", -20, 44, 36],
    ["guarded", -65, 36, 13],
    ["cap", undefined, 13, 14],
  ]);
  const resolved = resolveBattleTurn(state, order, action);
  assert.equal(resolved?.frames.find(frame => frame.kind === "damage")?.label, "-3 HP");

  target.battleStats.defense = 1000;
  const [minimum] = previewBattleAction(state, action);
  const minimalBreakdown = minimum.damageBreakdown;
  assert.ok(minimalBreakdown);
  assert.deepEqual([minimalBreakdown.baseDamage, minimalBreakdown.finalDamage, minimalBreakdown.hpLost, minimum.hpAfter], [0, 1, 1, 2]);
  assert.deepEqual(minimalBreakdown.modifiers.at(-1), {
    kind: "minimum", label: "Minimum damage", operation: "limit", damageBefore: 0, damageAfter: 1,
  });
});
