import test from "node:test";
import assert from "node:assert/strict";

const {
  buildBattleUiAction,
  getBattleUiMoveAvailability,
  getBattleUiMoveOptions,
  getNextUnqueuedPlayerActorId,
} = await import("../src/data/battleUi.ts");
const { createBattleState } = await import("@/data/battleEngine");
const { createNewGameSave } = await import("@/lib/save/localSave");

function createUiBattle() {
  const save = createNewGameSave("UI Tester", 0);
  const source = save.creatures ?? [];
  assert.ok(source.length >= 2);
  const clone = (creature: (typeof source)[number], id: string, nickname: string) => ({
    ...creature,
    creatureId: id as never,
    nickname,
  });
  const players = [
    clone(source[0], "ui_player_1", "Player One"),
    clone(source[1], "ui_player_2", "Player Two"),
    clone(source[0], "ui_player_3", "Player Three"),
  ];
  const enemies = [
    clone(source[1], "ui_enemy_1", "Enemy One"),
    clone(source[0], "ui_enemy_2", "Enemy Two"),
    clone(source[1], "ui_enemy_3", "Enemy Three"),
  ];
  const state = createBattleState({ battleId: "ui-regression", playerCreatures: players, enemyCreatures: enemies });
  const actorId = state.teams.player.combatantIds[0];
  state.combatants[actorId] = {
    ...state.combatants[actorId],
    loadout: {
      learnedMoveIds: ["strike", "defend", "first_aid", "resonant_bark"],
      equippedMoveIds: ["strike", "defend", "first_aid", "resonant_bark"],
      version: 1,
    },
  };
  return state;
}

test("enemy targets reveal enemy-compatible moves and hide self moves", () => {
  const state = createUiBattle();
  const actorId = state.teams.player.combatantIds[0];
  const enemyId = state.teams.enemy.combatantIds[0];
  const options = getBattleUiMoveOptions(state, actorId, { kind: "combatant", combatantId: enemyId });
  const strike = options.find((option) => option.move.id === "strike");
  const defend = options.find((option) => option.move.id === "defend");
  assert.equal(strike?.compatible, true);
  assert.equal(strike?.usable, true);
  assert.equal(defend?.compatible, false);
});

test("self and ally targets reveal defensive and healing moves", () => {
  const state = createUiBattle();
  const actorId = state.teams.player.combatantIds[0];
  const allyId = state.teams.player.combatantIds[1];
  const selfOptions = getBattleUiMoveOptions(state, actorId, { kind: "combatant", combatantId: actorId });
  assert.equal(selfOptions.find((option) => option.move.id === "defend")?.compatible, true);
  assert.equal(selfOptions.find((option) => option.move.id === "strike")?.compatible, false);
  const allyOptions = getBattleUiMoveOptions(state, actorId, { kind: "combatant", combatantId: allyId });
  assert.equal(allyOptions.find((option) => option.move.id === "first_aid")?.compatible, true);
  assert.equal(allyOptions.find((option) => option.move.id === "strike")?.compatible, false);
});

test("area moves build actions containing every living enemy", () => {
  const state = createUiBattle();
  const actorId = state.teams.player.combatantIds[0];
  const enemyId = state.teams.enemy.combatantIds[1];
  const action = buildBattleUiAction(state, actorId, "resonant_bark", { kind: "combatant", combatantId: enemyId });
  assert.ok(action);
  assert.deepEqual(action.targetIds, state.teams.enemy.combatantIds);
});

test("cooldowns and Battle Energy make compatible moves visibly unavailable", () => {
  const state = createUiBattle();
  const actorId = state.teams.player.combatantIds[0];
  const enemyId = state.teams.enemy.combatantIds[0];
  state.combatants[actorId] = {
    ...state.combatants[actorId],
    currentBattleEnergy: 0,
    cooldowns: { resonant_bark: 2 },
  };
  const cooldown = getBattleUiMoveAvailability(state, actorId, "resonant_bark", { kind: "combatant", combatantId: enemyId });
  assert.equal(cooldown.compatible, true);
  assert.equal(cooldown.usable, false);
  assert.match(cooldown.reason ?? "", /cooldown/i);
  const heal = getBattleUiMoveAvailability(state, actorId, "first_aid", { kind: "combatant", combatantId: state.teams.player.combatantIds[1] });
  assert.equal(heal.usable, false);
  assert.match(heal.reason ?? "", /Battle Energy/i);
});

test("actor planning advances to the next living unqueued creature", () => {
  const state = createUiBattle();
  const first = state.teams.player.combatantIds[0];
  const second = state.teams.player.combatantIds[1];
  const third = state.teams.player.combatantIds[2];
  const queue = new Map();
  assert.equal(getNextUnqueuedPlayerActorId(state, queue), first);
  queue.set(first, { actorId: first, moveId: "strike", targetIds: [state.teams.enemy.combatantIds[0]] });
  assert.equal(getNextUnqueuedPlayerActorId(state, queue, first), second);
  queue.set(second, { actorId: second, moveId: "strike", targetIds: [state.teams.enemy.combatantIds[0]] });
  assert.equal(getNextUnqueuedPlayerActorId(state, queue, second), third);
  queue.set(third, { actorId: third, moveId: "strike", targetIds: [state.teams.enemy.combatantIds[0]] });
  assert.equal(getNextUnqueuedPlayerActorId(state, queue, third), null);
});
