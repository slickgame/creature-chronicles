import test from "node:test";
import assert from "node:assert/strict";

const {
  BATTLE_OUTFITTER_ITEMS,
  assignBattleOutfitterEquipment,
  getBattleLoadout,
  getBattleOutfitterStock,
} = await import("@/data/battleOutfitter");
const {
  applyBattleOutfitterLoadouts,
} = await import("@/data/battleOutfitterIntegration");
const {
  getCreatureBattleMoveLoadout,
  canSpeciesLearnBattleMove,
} = await import("@/data/battleLoadouts");
const {
  COLISEUM_EXCLUSIVE_MOVES,
  getBattleMove,
} = await import("@/data/battleMoves");
const {
  createBattleState,
} = await import("@/data/battleEngine");
const {
  COLISEUM_C2_PROGRESS_FLAG,
  COLISEUM_C2_ENCOUNTERS,
  createColiseumPerformance,
  getColiseumC2Progress,
  recordColiseumC2BattleResult,
} = await import("../src/data/coliseumC2.ts");
const {
  COLISEUM_C3_SHOP_REWARDS,
  COLISEUM_C3_STATE_FLAG,
  COLISEUM_CREATURE_CONTRACTS,
  getColiseumC3State,
  getColiseumContractCapacity,
  getColiseumTechniqueStock,
  purchaseColiseumC3Reward,
  redeemColiseumCreatureContract,
  syncColiseumC3Rewards,
  teachColiseumTechnique,
} = await import("../src/data/coliseumC3.ts");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");
const {
  getBattleSpeciesProfile,
} = await import("@/data/battleProfiles");

function fixture() {
  const save = createNewGameSave("C3 Tester", 0);
  const creatures = save.creatures ?? [];
  assert.ok(creatures.length >= 3, "fixture needs three creatures");
  return { save, teamIds: creatures.slice(0, 3).map((creature) => creature.creatureId) };
}

function grantMarks(save: ReturnType<typeof createNewGameSave>, marks = 999) {
  const state = getColiseumC3State(save);
  return {
    ...save,
    flags: {
      ...save.flags,
      [COLISEUM_C3_STATE_FLAG]: JSON.stringify({ ...state, marks, legacyStipendApplied: true }),
    },
  };
}

function grantC2Clears(save: ReturnType<typeof createNewGameSave>, encounterIds: string[]) {
  const progress = getColiseumC2Progress(save);
  return {
    ...save,
    flags: {
      ...save.flags,
      [COLISEUM_C2_PROGRESS_FLAG]: JSON.stringify({
        ...progress,
        completedEncounterIds: Array.from(new Set([...progress.completedEncounterIds, ...encounterIds])),
        claimedFirstClearEncounterIds: Array.from(new Set([...progress.claimedFirstClearEncounterIds, ...encounterIds])),
      }),
    },
  };
}

test("C3 registers four dedicated non-inheritable Coliseum moves", () => {
  assert.equal(COLISEUM_EXCLUSIVE_MOVES.length, 4);
  const { save } = fixture();
  for (const move of COLISEUM_EXCLUSIVE_MOVES) {
    assert.equal(move.sourceType, "coliseum");
    assert.equal(move.inheritable, false);
    assert.equal(getBattleMove(move.id).id, move.id);
    for (const creature of save.creatures ?? []) {
      assert.equal(canSpeciesLearnBattleMove(creature.speciesId, move.id), true, `${creature.speciesId} should be compatible with ${move.id}`);
    }
  }
});

test("recorded C2 results award Marks and loot exactly once", () => {
  const { save, teamIds } = fixture();
  const encounter = COLISEUM_C2_ENCOUNTERS[0];
  const performance = createColiseumPerformance(teamIds);
  const recorded = recordColiseumC2BattleResult(save, encounter.encounterId, "player_won", 4, teamIds, performance, "c3_sync_once");
  const first = syncColiseumC3Rewards(recorded.save);
  assert.equal(first.changed, true);
  assert.ok(first.state.marks > 0);
  const marks = first.state.marks;
  const historyCount = first.state.awardHistory.length;
  const second = syncColiseumC3Rewards(first.save);
  assert.equal(second.changed, false);
  assert.equal(second.state.marks, marks);
  assert.equal(second.state.awardHistory.length, historyCount);
});

test("legacy completed encounters receive one stipend without repeat grants", () => {
  const { save } = fixture();
  const legacy = grantC2Clears(save, ["novice_opening_scrimmage", "novice_support_drill", "novice_echo_trial"]);
  const first = syncColiseumC3Rewards(legacy);
  assert.equal(first.state.marks, 6);
  assert.equal(first.state.legacyStipendApplied, true);
  const second = syncColiseumC3Rewards(first.save);
  assert.equal(second.state.marks, 6);
  assert.equal(second.changed, false);
});

test("Marks Exchange purchases standard stock and respects item caps", () => {
  const { save } = fixture();
  const funded = grantMarks(save, 100);
  const tonicReward = COLISEUM_C3_SHOP_REWARDS.find((reward) => reward.rewardId === "tonic_bundle");
  const tonic = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "field_tonic");
  assert.ok(tonicReward && tonic);
  const before = getBattleOutfitterStock(funded, tonic);
  const purchased = purchaseColiseumC3Reward(funded, tonicReward.rewardId);
  assert.equal(purchased.ok, true);
  assert.equal(purchased.state.marks, 100 - tonicReward.costMarks);
  assert.equal(getBattleOutfitterStock(purchased.save, tonic), before + 1);
});

test("utility equipment occupies its own slot and applies combat bonuses", () => {
  const { save } = fixture();
  const unlocked = grantC2Clears(grantMarks(save), ["silver_guard_circuit"]);
  const purchase = purchaseColiseumC3Reward(unlocked, "tactician_emblem");
  assert.equal(purchase.ok, true);
  const creature = purchase.save.creatures![0];
  const assigned = assignBattleOutfitterEquipment(purchase.save, creature.creatureId, "tactician_emblem");
  assert.equal(assigned.ok, true);
  assert.equal(getBattleLoadout(assigned.save, creature.creatureId).utilityItemId, "tactician_emblem");
  const enemies = purchase.save.creatures!.slice(1, 4);
  const base = createBattleState({ battleId: "c3_utility", playerCreatures: [creature], enemyCreatures: enemies.slice(0, 1) });
  const playerId = base.teams.player.combatantIds[0];
  const before = base.combatants[playerId];
  const applied = applyBattleOutfitterLoadouts(assigned.save, base);
  const after = applied.combatants[playerId];
  assert.equal(after.battleStats.speed, before.battleStats.speed + 3);
  assert.equal(after.maxBattleEnergy, before.maxBattleEnergy + 8);
});

test("Coliseum manuals teach dedicated moves and consume only on success", () => {
  const { save } = fixture();
  const unlocked = grantC2Clears(grantMarks(save), ["bronze_breaker_squad"]);
  const purchased = purchaseColiseumC3Reward(unlocked, "manual_arena_breaker");
  assert.equal(purchased.ok, true);
  assert.equal(getColiseumTechniqueStock(purchased.save, "arena_breaker"), 1);
  const creature = purchased.save.creatures![0];
  const loadout = getCreatureBattleMoveLoadout(creature);
  const profile = getBattleSpeciesProfile(creature.speciesId);
  const replacement = loadout.learnedMoveIds.find((id) => id !== "strike" && id !== profile.signatureMoveId);
  assert.ok(replacement);
  const taught = teachColiseumTechnique(purchased.save, creature.creatureId, "arena_breaker", replacement);
  assert.equal(taught.ok, true);
  assert.equal(getColiseumTechniqueStock(taught.save, "arena_breaker"), 0);
  const updated = taught.save.creatures!.find((entry) => entry.creatureId === creature.creatureId)!;
  assert.ok(getCreatureBattleMoveLoadout(updated).learnedMoveIds.includes("arena_breaker"));
  const duplicate = teachColiseumTechnique(taught.save, creature.creatureId, "arena_breaker");
  assert.equal(duplicate.ok, false);
  assert.equal(getColiseumTechniqueStock(duplicate.save, "arena_breaker"), 0);
});

test("creature contracts stay pending when full and redeem after capacity opens", () => {
  const { save } = fixture();
  const unlocked = grantC2Clears(grantMarks(save), ["bronze_pack_clash"]);
  const purchased = purchaseColiseumC3Reward(unlocked, "bronze_duelist_contract");
  assert.equal(purchased.ok, true);
  const contract = COLISEUM_CREATURE_CONTRACTS.find((entry) => entry.contractId === "bronze_duelist")!;
  const targetHabitat = purchased.save.habitats!.find((habitat) => habitat.habitatId === purchased.save.creatures!.find((creature) => creature.variantId === contract.variantId)?.habitatId)
    ?? purchased.save.habitats!.find((habitat) => habitat.family === "feline")!;
  const occupied = purchased.save.creatures!.filter((creature) => creature.habitatId === targetHabitat.habitatId).length;
  const fullSave = { ...purchased.save, habitats: purchased.save.habitats!.map((habitat) => habitat.habitatId === targetHabitat.habitatId ? { ...habitat, capacity: occupied } : habitat) };
  assert.equal(getColiseumContractCapacity(fullSave, contract.contractId).canRedeem, false);
  const blocked = redeemColiseumCreatureContract(fullSave, contract.contractId);
  assert.equal(blocked.ok, false);
  assert.ok(getColiseumC3State(blocked.save).pendingContractIds.includes(contract.contractId));
  const opened = { ...blocked.save, habitats: blocked.save.habitats!.map((habitat) => habitat.habitatId === targetHabitat.habitatId ? { ...habitat, capacity: occupied + 1 } : habitat) };
  const redeemed = redeemColiseumCreatureContract(opened, contract.contractId);
  assert.equal(redeemed.ok, true);
  assert.ok(redeemed.save.creatures!.some((creature) => creature.creatureId === "creature_coliseum_bronze_duelist"));
  assert.equal(getColiseumC3State(redeemed.save).pendingContractIds.includes(contract.contractId), false);
  assert.equal(redeemColiseumCreatureContract(redeemed.save, contract.contractId).ok, false);
});

test("C3 defines three one-time unique creature contracts", () => {
  assert.equal(COLISEUM_CREATURE_CONTRACTS.length, 3);
  assert.equal(new Set(COLISEUM_CREATURE_CONTRACTS.map((contract) => contract.contractId)).size, 3);
  COLISEUM_CREATURE_CONTRACTS.forEach((contract) => {
    assert.ok(contract.learnedMoveIds.length >= 5);
    assert.equal(contract.equippedMoveIds.length, 4);
    assert.ok(contract.cosmeticVariant.startsWith("coliseum_"));
  });
});
