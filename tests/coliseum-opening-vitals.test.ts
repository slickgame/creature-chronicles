import test from "node:test";
import assert from "node:assert/strict";
import type { ColiseumC2EncounterDefinition } from "@/data/coliseumC2";
import type { ColiseumC4ModifierId } from "@/data/coliseumC4";

const { createBattleState, getBattleOrderPreview } = await import("@/data/battleEngine");
const { BATTLE_OUTFITTER_ITEMS, previewEquipmentSave } = await import("@/data/battleOutfitter");
const { applyTeamTacticsKit } = await import("@/data/battleOutfitterIntegration");
const { buildColiseumOpening, createColiseumBattleId, getColiseumOpeningPreview } = await import("@/data/coliseumBattleOpening");
const { COLISEUM_C2_ENCOUNTERS } = await import("@/data/coliseumC2");
const { createEquipmentCopy } = await import("@/data/equipmentEnhancement");
const { createNewGameSave } = await import("./helpers/establishedSave.ts");
const TEST_BATTLE_ID = "actual-coliseum-start";

function createFixture() {
  const save = createNewGameSave("Coliseum Opening Tester", 0);
  const team = (save.creatures ?? []).slice(0, 3);
  assert.equal(team.length, 3);
  const encounter = COLISEUM_C2_ENCOUNTERS[0];
  return { save, encounter, team, playerTeamName: "Opening Test Team" };
}

test("fresh Coliseum forecasts include equipped HP and full starting Battle Energy", () => {
  const input = createFixture();
  const creatureId = input.team[0].creatureId;
  input.save.flags = {
    ...input.save.flags,
    [`battleLoadout_${creatureId}_defense`]: "guard_charm",
  };
  delete input.save.flags.equipmentRulesVersion;
  const base = createBattleState({ battleId: "base", playerCreatures: input.team, enemyCreatures: [] });
  const baseCreature = base.combatants[base.teams.player.combatantIds[0]];

  const forecast = getColiseumOpeningPreview(input, TEST_BATTLE_ID, false).vitals.get(creatureId);
  assert.deepEqual(forecast, {
    currentHp: baseCreature.maxHp + 12,
    maxHp: baseCreature.maxHp + 12,
    currentBattleEnergy: baseCreature.maxBattleEnergy,
    maxBattleEnergy: baseCreature.maxBattleEnergy,
  });
});

test("a resumed Coliseum forecast scales saved ratios to modified caps before the armed kit", () => {
  const fixture = createFixture();
  const creatureId = fixture.team[0].creatureId;
  const save = { ...fixture.save, flags: { ...fixture.save.flags, battleItem_tacticsKits: 1 } };
  const input = {
    ...fixture,
    save,
    challenge: {
      modifierIds: ["fragile_ground", "deep_reserves"] as ("fragile_ground" | "deep_reserves")[],
      carryover: { [creatureId]: { hpRatio: 0.15, battleEnergyRatio: 0.25 } },
    },
  };
  const base = getColiseumOpeningPreview(fixture, TEST_BATTLE_ID, false).vitals.get(creatureId);
  assert.ok(base);
  const maxHp = Math.round(base.maxHp * 0.85);
  const energyCap = base.maxBattleEnergy + 12;
  const expectedWithoutKit = {
    currentHp: Math.round(maxHp * 0.15),
    maxHp,
    currentBattleEnergy: Math.round(energyCap * 0.25),
    maxBattleEnergy: energyCap,
  };
  assert.deepEqual(getColiseumOpeningPreview(input, TEST_BATTLE_ID, false).vitals.get(creatureId), expectedWithoutKit);
  const armed = getColiseumOpeningPreview(input, TEST_BATTLE_ID, true).vitals;
  assert.deepEqual(armed.get(creatureId), {
    ...expectedWithoutKit,
    currentBattleEnergy: expectedWithoutKit.currentBattleEnergy + 10,
    maxBattleEnergy: energyCap + 10,
  });
  assert.equal(save.flags.battleItem_tacticsKits, 1);

  const { state } = buildColiseumOpening(input, TEST_BATTLE_ID);
  const actual = applyTeamTacticsKit(save, state);
  assert.equal(actual.ok, true);
  assert.equal(actual.save.flags.battleItem_tacticsKits, 0);
  for (const id of actual.state.teams.player.combatantIds) {
    const { sourceCreatureId, currentHp, maxHp, currentBattleEnergy, maxBattleEnergy } = actual.state.combatants[id];
    assert.deepEqual(armed.get(sourceCreatureId), { currentHp, maxHp, currentBattleEnergy, maxBattleEnergy });
  }
});

test("opening order shares the launch seed for tied Speed and applies opening Speed modifiers", () => {
  const fixture = createFixture();
  const [first, second, third] = fixture.team;
  const team = [first, { ...first, creatureId: second.creatureId, nickname: second.nickname }, third];
  const save = { ...fixture.save, saveId: "opening_test", dayState: { ...fixture.save.dayState, dayNumber: 1 } };
  const input = { ...fixture, save, team, challenge: { modifierIds: ["quickened_field", "exhausting_heat"] as ("quickened_field" | "exhausting_heat")[] } };
  const prefix = "coliseum_c2_novice_opening_scrimmage";

  const tiedOrders = ["attempt-0", "attempt-3"].map(attemptKey => {
    const battleId = createColiseumBattleId(prefix, save, attemptKey);
    const { order } = getColiseumOpeningPreview(input, battleId, false);
    const { state } = buildColiseumOpening(input, battleId);
    const actualOrder = getBattleOrderPreview(state, new Map());
    assert.deepEqual(order.map(({ actorId, speed }) => ({ actorId, score: speed })), actualOrder.map(({ actorId, score }) => ({ actorId, score })));
    const tied = order.filter(({ sideId, sourceCreatureId }) => sideId === "player" && [first.creatureId, second.creatureId].includes(sourceCreatureId));
    assert.equal(tied.length, 2);
    const base = getColiseumOpeningPreview({ ...fixture, save, team }, battleId, false).order.find(entry => entry.sourceCreatureId === first.creatureId);
    assert.ok(base);
    assert.equal(tied[0].speed, base.speed + 1);
    assert.equal(tied[1].speed, base.speed + 1);
    return tied.map(entry => entry.sourceCreatureId);
  });
  assert.deepEqual(tiedOrders, [[first.creatureId, second.creatureId], [second.creatureId, first.creatureId]]);
});

test("opening vitals remain available for an incomplete team before its full order is known", () => {
  const fixture = createFixture();
  const preview = getColiseumOpeningPreview({ ...fixture, team: fixture.team.slice(0, 2) }, TEST_BATTLE_ID, false);
  assert.equal(preview.vitals.size, 2);
  assert.deepEqual(preview.order, []);
});

test("opening statuses follow equipment, side-specific modifiers, carryover and the armed kit", () => {
  const fixture = createFixture();
  const [first, second] = fixture.team;
  const harness = BATTLE_OUTFITTER_ITEMS.find(item => item.itemId === "champion_harness");
  assert.ok(harness);
  const equipped = previewEquipmentSave(fixture.save, first.creatureId, harness);
  const save = { ...equipped, flags: { ...equipped.flags, battleItem_tacticsKits: 1 } };
  const fresh = getColiseumOpeningPreview({ ...fixture, save, team: fixture.team.slice(0, 2) }, TEST_BATTLE_ID, false);
  assert.deepEqual(fresh.statuses.get(first.creatureId), [{ status: "guarded", duration: 1 }]);
  assert.deepEqual(fresh.statuses.get(second.creatureId), []);
  assert.deepEqual(fresh.order, []);

  const modifierIds: ColiseumC4ModifierId[] = ["enemy_bulwark", "marked_opening", "exhausting_heat"];
  const carryover = { [first.creatureId]: { hpRatio: 0.15, battleEnergyRatio: 0.25 } };
  const resumed = { ...fixture, save, challenge: { modifierIds, carryover } };
  const unarmed = getColiseumOpeningPreview(resumed, TEST_BATTLE_ID, false).statuses;
  assert.deepEqual(unarmed.get(first.creatureId)?.map(({ status, duration }) => [status, duration]), [
    ["marked", 2], ["exhausted", 2], ["guarded", 1],
  ]);
  const { state } = buildColiseumOpening(resumed, TEST_BATTLE_ID);
  const armed = getColiseumOpeningPreview(resumed, TEST_BATTLE_ID, true).statuses;
  assert.equal(armed.get(first.creatureId)?.find(effect => effect.status === "inspired")?.duration, 1);
  for (const id of state.teams.enemy.combatantIds) {
    const enemy = state.combatants[id];
    assert.deepEqual(armed.get(enemy.sourceCreatureId)?.map(({ status, duration }) => [status, duration]), [
      ["guarded", 2], ["marked", 2],
    ]);
  }
  const launched = applyTeamTacticsKit(save, state);
  assert.ok(launched.ok);
  for (const combatant of Object.values(launched.state.combatants)) {
    assert.deepEqual(armed.get(combatant.sourceCreatureId), combatant.statuses);
  }

  const rallying = { ...resumed, challenge: { carryover, modifierIds: [...modifierIds, "rallying_start" as const] } };
  const rallyingStatuses = getColiseumOpeningPreview(rallying, TEST_BATTLE_ID, true).statuses.get(first.creatureId);
  assert.equal(rallyingStatuses?.find(effect => effect.status === "inspired")?.duration, 2);
});

test("opening Speed names upgraded equipment, rounded set bonuses, and applied field effects", () => {
  const input = createFixture();
  const creatureId = input.team[0].creatureId;
  const loadout = ["channeling_prism", "focus_circlet", "runner_bands", "focus_emblem"];
  const copies = loadout.map((itemId, index) => {
    const item = BATTLE_OUTFITTER_ITEMS.find(candidate => candidate.itemId === itemId);
    assert.ok(item?.equipmentSlot);
    input.save.flags[`battleEquipment_${creatureId}_${item.equipmentSlot}`] = itemId;
    return {
      ...createEquipmentCopy(`gear_${index + 1}`, item, creatureId),
      level: itemId === "runner_bands" ? 3 : 0,
      initialSubstats: itemId === "focus_circlet" ? [{ key: "speed", value: 2 }] : [],
    };
  });
  input.save.flags.equipmentRulesVersion = 3;
  input.save.flags.equipmentCopiesV1 = JSON.stringify({ version: 1, serial: copies.length, copies });
  const [firstEnemy, secondEnemy, thirdEnemy] = input.encounter.enemyTeam;
  const encounter: ColiseumC2EncounterDefinition = {
    ...input.encounter,
    enemyTeam: [{ ...firstEnemy, equipment: { name: "Fleet harness", bonuses: { speed: 1.6 } } }, secondEnemy, thirdEnemy],
  };
  const fixture = {
    ...input,
    encounter,
    challenge: { modifierIds: ["quickened_field", "exhausting_heat", "quickened_field"] as ("quickened_field" | "exhausting_heat")[] },
  };
  const { order } = getColiseumOpeningPreview(fixture, TEST_BATTLE_ID, false);
  const ally = order.find(entry => entry.sourceCreatureId === creatureId);
  assert.ok(ally);
  const base = createBattleState({ battleId: TEST_BATTLE_ID, playerCreatures: input.team, enemyCreatures: [] });
  const baseSpeed = base.combatants[base.teams.player.combatantIds[0]].battleStats.speed;
  assert.deepEqual(ally.speedBreakdown, {
    base: baseSpeed,
    contributions: [
      { label: "Focus Circlet", amount: 2 },
      { label: "Runner Bands +3", amount: 5 },
      { label: "Swift set", amount: Math.floor(baseSpeed / 10) },
      { label: "Quickened Field", amount: 4 },
      { label: "Exhausting Heat", amount: -3 },
    ],
  });
  const enemy = order.find(entry => entry.sideId === "enemy" && entry.name === firstEnemy.nickname);
  assert.ok(enemy);
  assert.deepEqual(enemy.speedBreakdown.contributions, [
    { label: "Fleet harness", amount: 2 },
    { label: "Quickened Field", amount: 4 },
  ]);
  const { state } = buildColiseumOpening(fixture, TEST_BATTLE_ID);
  const actualOrder = getBattleOrderPreview(state, new Map());
  assert.deepEqual(order.map(({ actorId, speedBreakdown }) => ({
    actorId,
    speed: speedBreakdown.contributions.reduce((total, row) => total + row.amount, speedBreakdown.base),
  })), actualOrder.map(({ actorId, score }) => ({ actorId, speed: score })));
});

test("opening Speed explains when Exhausted reaches the combat Speed floor", () => {
  const fixture = createFixture();
  const [first, second, third] = fixture.team;
  const team = [first, { ...second, stats: { ...second.stats, DEX: 1 }, abilities: [] }, third];
  const input = { ...fixture, team, challenge: { modifierIds: ["exhausting_heat"] as "exhausting_heat"[] } };
  const { order } = getColiseumOpeningPreview(input, TEST_BATTLE_ID, false);
  const ally = order.find(entry => entry.sourceCreatureId === second.creatureId);
  assert.ok(ally);
  assert.equal(ally.speed, 1);
  assert.deepEqual(ally.speedBreakdown, {
    base: 2,
    contributions: [{ label: "Exhausting Heat", amount: -3 }, { label: "Speed floor", amount: 2 }],
  });
});
