import test from "node:test";
import assert from "node:assert/strict";

const { createBattleState } = await import("@/data/battleEngine");
const { applyTeamTacticsKit } = await import("@/data/battleOutfitterIntegration");
const { buildColiseumOpening, getColiseumOpeningVitals } = await import("@/data/coliseumBattleOpening");
const { COLISEUM_C2_ENCOUNTERS } = await import("@/data/coliseumC2");
const { createNewGameSave } = await import("./helpers/establishedSave.ts");

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

  const forecast = getColiseumOpeningVitals(input, false).get(creatureId);
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
  const base = getColiseumOpeningVitals(fixture, false).get(creatureId);
  assert.ok(base);
  const maxHp = Math.round(base.maxHp * 0.85);
  const energyCap = base.maxBattleEnergy + 12;
  const expectedWithoutKit = {
    currentHp: Math.round(maxHp * 0.15),
    maxHp,
    currentBattleEnergy: Math.round(energyCap * 0.25),
    maxBattleEnergy: energyCap,
  };
  assert.deepEqual(getColiseumOpeningVitals(input, false).get(creatureId), expectedWithoutKit);
  const armed = getColiseumOpeningVitals(input, true);
  assert.deepEqual(armed.get(creatureId), {
    ...expectedWithoutKit,
    currentBattleEnergy: expectedWithoutKit.currentBattleEnergy + 10,
    maxBattleEnergy: energyCap + 10,
  });
  assert.equal(save.flags.battleItem_tacticsKits, 1);

  const { state } = buildColiseumOpening(input, "actual-coliseum-start");
  const actual = applyTeamTacticsKit(save, state);
  assert.equal(actual.ok, true);
  assert.equal(actual.save.flags.battleItem_tacticsKits, 0);
  for (const id of actual.state.teams.player.combatantIds) {
    const { sourceCreatureId, currentHp, maxHp, currentBattleEnergy, maxBattleEnergy } = actual.state.combatants[id];
    assert.deepEqual(armed.get(sourceCreatureId), { currentHp, maxHp, currentBattleEnergy, maxBattleEnergy });
  }
});
