import test from "node:test";
import assert from "node:assert/strict";

const {
  createBattleState,
} = await import("@/data/battleEngine");
const {
  BATTLE_OUTFITTER_ITEMS,
  assignBattleOutfitterEquipment,
  getBattleOutfitterStock,
  removeBattleOutfitterEquipment,
  useBattleOutfitterManual,
} = await import("@/data/battleOutfitter");
const {
  FIELD_TONIC_ID,
  REVIVAL_SALVE_ID,
  TEAM_TACTICS_KIT_ID,
  applyBattleOutfitterLoadouts,
  applyTeamTacticsKit,
  getBattleOutfitterCombatStock,
  useFieldTonic,
  useRevivalSalve,
} = await import("@/data/battleOutfitterIntegration");
const {
  ensureCurrentGuildState,
} = await import("@/data/guild");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function createFixture() {
  const save = createNewGameSave("Outfitter Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 2, "fixture requires starter creatures");
  const player = {
    ...creatures[0],
    creatureId: "outfitter_player" as never,
    nickname: "Outfitter Player",
  };
  const enemy = {
    ...creatures[1],
    creatureId: "outfitter_enemy" as never,
    nickname: "Outfitter Enemy",
  };
  return {
    save: {
      ...save,
      creatures: [player, enemy],
      creatureIds: [player.creatureId, enemy.creatureId],
    },
    player,
    enemy,
  };
}

function createState(
  player: ReturnType<typeof createFixture>["player"],
  enemy: ReturnType<typeof createFixture>["enemy"],
) {
  return createBattleState({
    battleId: "outfitter-integration",
    playerCreatures: [player],
    enemyCreatures: [enemy],
  });
}

function putCreatureOnGuildService() {
  const fixture = createFixture();
  const synced = ensureCurrentGuildState(fixture.save);
  const guild = synced.guild;
  const original = guild?.contracts[0];
  assert.ok(guild && original);
  const awaySave = {
    ...synced,
    guild: {
      ...guild,
      contracts: [
        {
          ...original,
          type: "service_creature" as const,
          status: "completed" as const,
          title: "Outfitter Absence Test",
          submittedCreatureId: fixture.player.creatureId,
          submittedCreatureName: fixture.player.nickname,
          completedAtDayNumber: synced.dayState.dayNumber,
          serviceDurationDays: 2,
          serviceReturnDayNumber: synced.dayState.dayNumber + 2,
        },
        ...guild.contracts.slice(1),
      ],
    },
  };
  return { ...fixture, save: awaySave };
}

test("assigned equipment and Focus training modify battle stats only for the ranch team", () => {
  const fixture = createFixture();
  const baseState = createState(fixture.player, fixture.enemy);
  const playerId = baseState.teams.player.combatantIds[0];
  const enemyId = baseState.teams.enemy.combatantIds[0];
  const equippedSave = {
    ...fixture.save,
    flags: {
      ...fixture.save.flags,
      battleLoadout_outfitter_player_offense: "sparring_wraps",
      battleLoadout_outfitter_player_defense: "guard_charm",
      battleManualRank_outfitter_player: 2,
    },
  };
  const integrated = applyBattleOutfitterLoadouts(equippedSave, baseState);
  const before = baseState.combatants[playerId];
  const after = integrated.combatants[playerId];

  assert.equal(after.battleStats.physicalPower, before.battleStats.physicalPower + 6);
  assert.equal(after.battleStats.specialPower, before.battleStats.specialPower + 4);
  assert.equal(after.battleStats.maxHp, before.battleStats.maxHp + 12);
  assert.equal(after.battleStats.defense, before.battleStats.defense + 5);
  assert.equal(after.battleStats.resistance, before.battleStats.resistance + 5);
  assert.equal(after.battleStats.accuracy, before.battleStats.accuracy + 7);
  assert.equal(after.battleStats.statusPower, before.battleStats.statusPower + 4);
  assert.equal(after.battleStats.statusResist, before.battleStats.statusResist + 3);
  assert.equal(after.battleStats.battleEnergy, before.battleStats.battleEnergy + 4);
  assert.deepEqual(integrated.combatants[enemyId], baseState.combatants[enemyId]);
});

test("Battle Outfitter refuses loadout and Focus changes while a creature is away on Guild service", () => {
  const fixture = putCreatureOnGuildService();
  const wraps = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "sparring_wraps");
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(wraps && manual);
  const stocked = {
    ...fixture.save,
    flags: {
      ...fixture.save.flags,
      [wraps.flagKey]: 1,
      [manual.flagKey]: 1,
    },
  };

  const assigned = assignBattleOutfitterEquipment(stocked, fixture.player.creatureId, "sparring_wraps");
  assert.equal(assigned.ok, false);
  assert.match(assigned.message, /Guild service:/i);
  assert.equal(getBattleOutfitterStock(assigned.save, wraps), 1);

  const equipped = {
    ...stocked,
    flags: {
      ...stocked.flags,
      [`battleLoadout_${fixture.player.creatureId}_offense`]: "sparring_wraps",
      [wraps.flagKey]: 0,
    },
  };
  const removed = removeBattleOutfitterEquipment(equipped, fixture.player.creatureId, "offense");
  assert.equal(removed.ok, false);
  assert.match(removed.message, /Guild service:/i);
  assert.equal(removed.save.flags[`battleLoadout_${fixture.player.creatureId}_offense`], "sparring_wraps");
  assert.equal(getBattleOutfitterStock(removed.save, wraps), 0);

  const trained = useBattleOutfitterManual(stocked, fixture.player.creatureId);
  assert.equal(trained.ok, false);
  assert.match(trained.message, /Guild service:/i);
  assert.equal(getBattleOutfitterStock(trained.save, manual), 1);
});

test("Team Tactics Kit consumes one stock and prepares every living ranch combatant", () => {
  const fixture = createFixture();
  const state = createState(fixture.player, fixture.enemy);
  const preparedSave = {
    ...fixture.save,
    flags: {
      ...fixture.save.flags,
      battleItem_tacticsKits: 1,
    },
  };
  const result = applyTeamTacticsKit(preparedSave, state);
  assert.equal(result.ok, true);
  assert.equal(getBattleOutfitterCombatStock(result.save, TEAM_TACTICS_KIT_ID), 0);
  state.teams.player.combatantIds.forEach((combatantId) => {
    const before = state.combatants[combatantId];
    const combatant = result.state.combatants[combatantId];
    assert.ok(combatant.statuses.some((status) => status.status === "inspired"));
    assert.equal(combatant.maxBattleEnergy, before.maxBattleEnergy + 10);
    assert.equal(combatant.currentBattleEnergy, before.currentBattleEnergy + 10);
  });
});

test("Field Tonic consumes stock and restores a living ally without exceeding caps", () => {
  const fixture = createFixture();
  const state = createState(fixture.player, fixture.enemy);
  const targetId = state.teams.player.combatantIds[0];
  const target = state.combatants[targetId];
  const damagedState = {
    ...state,
    combatants: {
      ...state.combatants,
      [targetId]: {
        ...target,
        currentHp: Math.max(1, target.maxHp - 40),
        currentBattleEnergy: Math.max(0, target.maxBattleEnergy - 30),
      },
    },
  };
  const stockedSave = {
    ...fixture.save,
    flags: {
      ...fixture.save.flags,
      battleItem_fieldTonics: 1,
    },
  };
  const result = useFieldTonic(stockedSave, damagedState, targetId);
  assert.equal(result.ok, true);
  assert.equal(getBattleOutfitterCombatStock(result.save, FIELD_TONIC_ID), 0);
  assert.ok(result.state.combatants[targetId].currentHp > damagedState.combatants[targetId].currentHp);
  assert.ok(result.state.combatants[targetId].currentBattleEnergy > damagedState.combatants[targetId].currentBattleEnergy);
  assert.ok(result.state.combatants[targetId].currentHp <= target.maxHp);
  assert.ok(result.state.combatants[targetId].currentBattleEnergy <= target.maxBattleEnergy);
});

test("Revival Salve consumes stock, revives a ranch ally, and clears statuses", () => {
  const fixture = createFixture();
  const state = createState(fixture.player, fixture.enemy);
  const targetId = state.teams.player.combatantIds[0];
  const target = state.combatants[targetId];
  const faintedState = {
    ...state,
    outcome: "enemy_won" as const,
    combatants: {
      ...state.combatants,
      [targetId]: {
        ...target,
        currentHp: 0,
        currentBattleEnergy: 0,
        statuses: [{ status: "bleed" as const, duration: 2, amount: 4 }],
        isFainted: true,
      },
    },
  };
  const stockedSave = {
    ...fixture.save,
    flags: {
      ...fixture.save.flags,
      battleItem_revivalSalves: 1,
    },
  };
  const result = useRevivalSalve(stockedSave, faintedState, targetId);
  assert.equal(result.ok, true);
  assert.equal(getBattleOutfitterCombatStock(result.save, REVIVAL_SALVE_ID), 0);
  assert.equal(result.state.outcome, "ongoing");
  assert.equal(result.state.combatants[targetId].isFainted, false);
  assert.ok(result.state.combatants[targetId].currentHp >= Math.round(target.maxHp * 0.35));
  assert.equal(result.state.combatants[targetId].statuses.length, 0);
});
