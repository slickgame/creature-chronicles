import test from "node:test";
import assert from "node:assert/strict";

const {
  COLISEUM_C2_ENCOUNTERS,
  COLISEUM_C2_PROGRESS_FLAG,
  accumulateColiseumRoundPerformance,
  applyAuthoredColiseumEquipment,
  buildAuthoredColiseumEnemyTeam,
  createColiseumPerformance,
  getColiseumC2Access,
  getColiseumC2Encounter,
  getColiseumC2Progress,
  getColiseumCreatureBattleRecord,
  previewColiseumCombatXp,
  recordColiseumC2BattleResult,
} = await import("../src/data/coliseumC2.ts");
const {
  COLISEUM_PROGRESS_FLAG,
  recordColiseumBattleResult,
} = await import("../src/data/coliseum.ts");
const {
  createBattleState,
  resolveBattleRound,
} = await import("@/data/battleEngine");
const {
  getBattleMove,
} = await import("@/data/battleMoves");
const {
  getCreatureBattleMoveLoadout,
} = await import("../src/data/battleLoadouts.ts");
const {
  getVariantDefinition,
} = await import("../src/data/creatures.ts");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function createFixture() {
  const save = createNewGameSave("C2 Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 3, "fixture requires three starter creatures");
  const team = creatures.slice(0, 3);
  return { save, team };
}

function encounter(id: string) {
  const result = getColiseumC2Encounter(id);
  assert.ok(result, `missing authored encounter ${id}`);
  return result;
}

function teamIds(team: ReturnType<typeof createFixture>["team"]) {
  return team.map((creature) => creature.creatureId);
}

test("C2 defines three authored opponents in each of twelve encounters", () => {
  assert.equal(COLISEUM_C2_ENCOUNTERS.length, 12);
  const counts = new Map<string, number>();
  const opponentIds = new Set<string>();

  for (const current of COLISEUM_C2_ENCOUNTERS) {
    counts.set(current.divisionId, (counts.get(current.divisionId) ?? 0) + 1);
    assert.equal(current.enemyTeam.length, 3);
    assert.ok(current.baseCombatXp > 0);
    assert.equal(current.repeatRewardPool.reduce((total, entry) => total + entry.weight, 0), 100);

    current.enemyTeam.forEach((slot) => {
      getVariantDefinition(slot.variantId);
      slot.learnedMoveIds.forEach((moveId) => getBattleMove(moveId));
      slot.equippedMoveIds.forEach((moveId) => getBattleMove(moveId));
      assert.ok(slot.equippedMoveIds.length >= 1 && slot.equippedMoveIds.length <= 4);
      assert.ok(slot.learnedMoveIds.length <= 8);
      assert.ok(slot.equippedMoveIds.every((moveId) => slot.learnedMoveIds.includes(moveId)));
      const uniqueId = `${current.encounterId}_${slot.slotId}`;
      assert.equal(opponentIds.has(uniqueId), false);
      opponentIds.add(uniqueId);
    });
  }

  assert.deepEqual(Object.fromEntries(counts), { novice: 3, bronze: 3, silver: 3, crown: 3 });
});

test("authored teams are fixed and do not mirror the selected ranch species", () => {
  const { save, team } = createFixture();
  const current = encounter("bronze_breaker_squad");
  const first = buildAuthoredColiseumEnemyTeam(save.saveId, current);
  const second = buildAuthoredColiseumEnemyTeam(save.saveId, current);
  assert.deepEqual(
    first.map((creature) => [creature.creatureId, creature.variantId, creature.level]),
    second.map((creature) => [creature.creatureId, creature.variantId, creature.level]),
  );
  assert.deepEqual(first.map((creature) => creature.level), [4, 4, 4]);
  assert.notDeepEqual(first.map((creature) => creature.speciesId), [...team].reverse().map((creature) => creature.speciesId));
  first.forEach((creature) => assert.ok(String(creature.creatureId).startsWith(`coliseum_c2_${current.encounterId}_`)));
});

test("authored enemies initialize with usable battle loadouts and enemy-only equipment", () => {
  const { save, team } = createFixture();
  const current = encounter("crown_tactical_finale");
  const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, current);
  const base = createBattleState({
    battleId: "c2-authored-loadout",
    playerCreatures: team,
    enemyCreatures: enemies,
  });
  const integrated = applyAuthoredColiseumEquipment(base, current);

  integrated.teams.enemy.combatantIds.forEach((combatantId) => {
    const combatant = integrated.combatants[combatantId];
    const usableFallback = combatant.loadout.equippedMoveIds
      .map((moveId) => getBattleMove(moveId))
      .some((move) => move.battleEnergyCost === 0 && move.cooldown === 0);
    assert.equal(usableFallback, true);
  });

  integrated.teams.player.combatantIds.forEach((combatantId) => {
    assert.deepEqual(integrated.combatants[combatantId], base.combatants[combatantId]);
  });
  assert.ok(integrated.log.some((line) => line.includes("Champion Harness")));
});

test("fresh C2 progression begins at the Opening Scrimmage and unlocks sequentially", () => {
  const { save, team } = createFixture();
  const opening = encounter("novice_opening_scrimmage");
  const support = encounter("novice_support_drill");
  assert.equal(getColiseumC2Access(save, opening).unlocked, true);
  assert.equal(getColiseumC2Access(save, support).unlocked, false);

  const performance = createColiseumPerformance(teamIds(team));
  const cleared = recordColiseumC2BattleResult(save, opening.encounterId, "player_won", 3, teamIds(team), performance, "opening-clear");
  assert.equal(getColiseumC2Access(cleared.save, support).unlocked, true);
});

test("C1 clears migrate without relocking new C2 preliminary encounters or duplicating their first clears", () => {
  const { save, team } = createFixture();
  const legacy = recordColiseumBattleResult(save, "novice_echo_trial", "player_won", 4, teamIds(team));
  assert.equal(typeof legacy.save.flags[COLISEUM_PROGRESS_FLAG], "string");
  assert.equal(legacy.save.flags[COLISEUM_C2_PROGRESS_FLAG], undefined);

  const migrated = getColiseumC2Progress(legacy.save);
  assert.equal(migrated.migratedFromC1, true);
  assert.ok(migrated.completedEncounterIds.includes("novice_echo_trial"));
  assert.ok(migrated.completedEncounterIds.includes("novice_opening_scrimmage"));
  assert.ok(migrated.completedEncounterIds.includes("novice_support_drill"));
  assert.ok(migrated.claimedFirstClearEncounterIds.includes("novice_opening_scrimmage"));
  assert.ok(migrated.claimedFirstClearEncounterIds.includes("novice_support_drill"));
  assert.equal(getColiseumC2Access(legacy.save, encounter("bronze_breaker_squad")).unlocked, true);
});

test("first clears grant one purse, repeat rewards are deterministic, and result ids are idempotent", () => {
  const { save, team } = createFixture();
  const current = encounter("novice_opening_scrimmage");
  const ids = teamIds(team);
  const performance = createColiseumPerformance(ids);
  const startingGold = save.currencies.gold;

  const first = recordColiseumC2BattleResult(save, current.encounterId, "player_won", 4, ids, performance, "first-result");
  assert.equal(first.firstClear, true);
  assert.equal(first.save.currencies.gold, startingGold + current.firstClearReward.gold);
  assert.equal(first.xpSummaries.length, 3);

  const repeatedA = recordColiseumC2BattleResult(first.save, current.encounterId, "player_won", 3, ids, performance, "repeat-result");
  const repeatedB = recordColiseumC2BattleResult(first.save, current.encounterId, "player_won", 3, ids, performance, "repeat-result");
  assert.deepEqual(repeatedA.reward, repeatedB.reward);
  assert.equal(repeatedA.firstClear, false);

  const duplicate = recordColiseumC2BattleResult(repeatedA.save, current.encounterId, "player_won", 3, ids, performance, "repeat-result");
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.save.currencies.gold, repeatedA.save.currencies.gold);
  assert.equal(duplicate.progress.totalAttempts, repeatedA.progress.totalAttempts);
  assert.equal(duplicate.xpSummaries.length, 0);
});

test("win, draw, and defeat all grant participation XP while only wins grant purses", () => {
  const { save, team } = createFixture();
  const current = encounter("novice_opening_scrimmage");
  const ids = teamIds(team);
  const performance = createColiseumPerformance(ids);

  const loss = recordColiseumC2BattleResult(save, current.encounterId, "enemy_won", 5, ids, performance, "loss-xp");
  assert.equal(loss.reward.gold, 0);
  assert.ok(loss.xpSummaries.every((summary) => summary.xpGained > 0));
  assert.equal(loss.progress.totalLosses, 1);

  const draw = recordColiseumC2BattleResult(save, current.encounterId, "draw", 6, ids, performance, "draw-xp");
  assert.equal(draw.reward.gold, 0);
  assert.ok(draw.xpSummaries.every((summary) => summary.xpGained > loss.xpSummaries[0].xpGained));

  const win = recordColiseumC2BattleResult(save, current.encounterId, "player_won", 4, ids, performance, "win-xp");
  assert.ok(win.reward.gold > 0);
  assert.ok(win.xpSummaries.every((summary) => summary.xpGained > draw.xpSummaries[0].xpGained));
});

test("overleveled creatures receive reduced repeat XP", () => {
  const { save, team } = createFixture();
  const current = encounter("novice_opening_scrimmage");
  const ids = teamIds(team);
  const performance = createColiseumPerformance(ids);
  const fresh = previewColiseumCombatXp(save, current, "player_won", ids, performance);
  const overleveledCreatures = (save.creatures ?? []).map((creature) => ids.includes(creature.creatureId) ? { ...creature, level: current.recommendedLevel + 10 } : creature);
  const overleveledSave = { ...save, creatures: overleveledCreatures };
  const reduced = previewColiseumCombatXp(overleveledSave, current, "player_won", ids, performance);
  assert.ok(reduced.every((entry, index) => entry.xp < fresh[index].xp));
});

test("combat XP can level creatures through the shared stat-growth system", () => {
  const { save, team } = createFixture();
  const current = encounter("novice_opening_scrimmage");
  const ids = teamIds(team);
  const targetId = ids[0];
  const preparedCreatures = (save.creatures ?? []).map((creature) => creature.creatureId === targetId ? { ...creature, xp: 4, xpToNext: 5 } : creature);
  const prepared = { ...save, creatures: preparedCreatures };
  const before = preparedCreatures.find((creature) => creature.creatureId === targetId);
  assert.ok(before);

  const result = recordColiseumC2BattleResult(prepared, current.encounterId, "player_won", 3, ids, createColiseumPerformance(ids), "level-up-result");
  const after = (result.save.creatures ?? []).find((creature) => creature.creatureId === targetId);
  assert.ok(after);
  assert.ok(after.level > before.level);
  assert.ok(after.maxEnergy >= before.maxEnergy);
  const totalGrowth = Object.keys(before.stats).reduce((total, key) => total + Math.max(0, after.stats[key as keyof typeof after.stats] - before.stats[key as keyof typeof before.stats]), 0);
  assert.ok(totalGrowth > 0);
});

test("round performance and per-creature records persist combat contributions", () => {
  const { save, team } = createFixture();
  const current = encounter("novice_opening_scrimmage");
  const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, current);
  const state = createBattleState({ battleId: "performance-test", playerCreatures: team, enemyCreatures: enemies });
  const playerId = state.teams.player.combatantIds[0];
  const enemyId = state.teams.enemy.combatantIds[0];
  const actor = state.combatants[playerId];
  const fallback = getCreatureBattleMoveLoadout(team[0]).equippedMoveIds.find((moveId) => getBattleMove(moveId).targetType === "single_enemy") ?? "strike";
  const resolved = resolveBattleRound(state, [{ actorId: actor.battleCombatantId, moveId: fallback, targetIds: [enemyId] }]);
  const performance = accumulateColiseumRoundPerformance(createColiseumPerformance(teamIds(team)), state, resolved.result);
  const actorPerformance = performance[String(team[0].creatureId)];
  assert.ok(actorPerformance.actionsTaken >= 1);
  assert.ok(actorPerformance.damageDealt >= 0);

  actorPerformance.damageDealt = 77;
  actorPerformance.healingDone = 22;
  actorPerformance.statusesApplied = 2;
  actorPerformance.alliesProtected = 1;
  const recorded = recordColiseumC2BattleResult(save, current.encounterId, "player_won", 4, teamIds(team), performance, "performance-record");
  const record = getColiseumCreatureBattleRecord(recorded.save, team[0].creatureId);
  assert.equal(record.battles, 1);
  assert.equal(record.wins, 1);
  assert.equal(record.damageDealt, 77);
  assert.equal(record.healingDone, 22);
  assert.equal(record.statusesApplied, 2);
  assert.equal(record.alliesProtected, 1);
});
