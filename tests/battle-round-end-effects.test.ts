import assert from "node:assert/strict";
import test from "node:test";
import { createBattleState, resolveBattleTurn } from "@/data/battleEngine";
import { getBattleLogEventCategory } from "@/data/battleLog";
import { createNewGameSave } from "./helpers/establishedSave.ts";

test("round-end playback records actual Bleed damage, expiries, and Battle Energy recovery in order", () => {
  const [caster, affected, persistent, enemy] = createNewGameSave("Recovery", 0).creatures!;
  const state = createBattleState({
    battleId: "round-end-effect-playback",
    playerCreatures: [caster, affected, persistent],
    enemyCreatures: [enemy],
  });
  const [actorId, affectedId, persistentId] = state.teams.player.combatantIds;
  const [targetId] = state.teams.enemy.combatantIds;
  state.combatants[affectedId].currentHp = 7;
  state.combatants[affectedId].currentBattleEnergy = 0;
  state.combatants[affectedId].statuses = [
    { status: "bleed", duration: 1, amount: 5, stacks: 3 },
    { status: "slowed", duration: 1 },
    { status: "weakened", stat: "physicalPower", duration: 1 },
    { status: "weakened", stat: "specialPower", duration: 2 },
  ];
  const maxBattleEnergy = state.combatants[persistentId].maxBattleEnergy;
  state.combatants[persistentId].currentBattleEnergy = maxBattleEnergy - 1;
  state.combatants[persistentId].statuses = [
    { status: "bleed", duration: 2, amount: 4, stacks: 2 },
    { status: "inspired", duration: 1 },
  ];

  const resolved = resolveBattleTurn(state, [actorId], { actorId, moveId: "strike", targetIds: [targetId] });
  assert.ok(resolved);
  const affectedFrames = resolved.frames.filter(frame => frame.targetIds.includes(affectedId));
  assert.deepEqual(affectedFrames.map(({ kind, roundEndEffect }) => [kind, roundEndEffect]), [
    ["damage", { kind: "bleed", stacks: 3, hpLost: 7 }],
    ["knockout", undefined],
    ["status", { kind: "expiry", statuses: ["bleed", "slowed"] }],
  ]);
  assert.equal(affectedFrames[0].state.combatants[affectedId].currentHp, 0);
  assert.equal(affectedFrames[0].state.combatants[affectedId].statuses[0].duration, 1);
  assert.deepEqual(affectedFrames[2].state.combatants[affectedId].statuses, [
    { status: "weakened", stat: "specialPower", duration: 1 },
  ]);
  assert.ok(resolved.result.log.some(line => line.endsWith("takes 15 bleed damage from 3 stacks.")));

  const persistentFrames = resolved.frames.filter(frame => frame.targetIds.includes(persistentId));
  assert.deepEqual(persistentFrames.map(({ kind, roundEndEffect }) => [kind, roundEndEffect]), [
    ["damage", { kind: "bleed", stacks: 2, hpLost: 8 }],
    ["status", { kind: "expiry", statuses: ["inspired"] }],
    ["energy", { kind: "energy", before: maxBattleEnergy - 1, after: maxBattleEnergy }],
  ]);
  assert.equal(persistentFrames[1].state.combatants[persistentId].currentBattleEnergy, maxBattleEnergy - 1);
  assert.equal(persistentFrames[2].state.combatants[persistentId].currentBattleEnergy, maxBattleEnergy);
  assert.equal(persistentFrames[2].state.combatants[persistentId].statuses[0].duration, 1);
  assert.equal(persistentFrames[2].label, "+1 BE · Recovery");
  assert.equal(resolved.frames.filter(frame => frame.roundEndEffect?.kind === "energy").length, 1);
  assert.equal(resolved.state.combatants[affectedId].currentBattleEnergy, 0);
  assert.ok(resolved.result.log.some(line => line.endsWith("regenerates 1 Battle Energy.")));
  assert.equal(resolved.state.roundNumber, state.roundNumber + 1);

  const { state: settled } = resolved;
  const affectedName = state.combatants[affectedId].name;
  const persistentName = state.combatants[persistentId].name;
  assert.deepEqual(settled.log.flatMap((line, index) => {
    const category = getBattleLogEventCategory(settled, index);
    return category ? [[category, line]] : [];
  }), [
    ["knockouts", `${affectedName} fainted.`],
    ["status-changes", `${affectedName}: Bleed, Slowed expired.`],
    ["status-changes", `${persistentName}: Inspired expired.`],
  ]);
  assert.equal(state.logEventCategories, undefined);
});
