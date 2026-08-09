import test from "node:test";
import assert from "node:assert/strict";

const {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
} = await import("@/data/battleOutfitter");
const {
  equipCreatureBattleMove,
  getBattleMoveTrainingOptions,
  teachBattleMoveWithFocusManual,
  unequipCreatureBattleMove,
} = await import("../src/data/battleMoveTraining.ts");
const {
  MAX_EQUIPPED_BATTLE_MOVES,
  getCreatureBattleMoveLoadout,
} = await import("../src/data/battleLoadouts.ts");
const {
  getBattleMove,
} = await import("@/data/battleMoves");
const {
  ensureCurrentGuildState,
} = await import("@/data/guild");
const {
  createNewGameSave,
} = await import("@/lib/save/localSave");

function createFixture() {
  const save = createNewGameSave("Move Trainer", 0);
  const creature = (save.creatures ?? [])[0];
  assert.ok(creature, "fixture requires a starter creature");
  return { save, creature };
}

function getReplaceableLearnedMoveId(creature: ReturnType<typeof createFixture>["creature"]) {
  const loadout = getCreatureBattleMoveLoadout(creature);
  return loadout.learnedMoveIds.find(
    (moveId) => moveId !== "strike" && getBattleMove(moveId).rarity !== "signature",
  );
}

function putCreatureOnGuildService() {
  const fixture = createFixture();
  const synced = ensureCurrentGuildState(fixture.save);
  const guild = synced.guild;
  const original = guild?.contracts[0];
  assert.ok(guild && original);
  return {
    ...fixture,
    save: {
      ...synced,
      guild: {
        ...guild,
        contracts: [
          {
            ...original,
            type: "service_creature" as const,
            status: "completed" as const,
            title: "Move Training Absence Test",
            submittedCreatureId: fixture.creature.creatureId,
            submittedCreatureName: fixture.creature.nickname,
            completedAtDayNumber: synced.dayState.dayNumber,
            serviceDurationDays: 2,
            serviceReturnDayNumber: synced.dayState.dayNumber + 2,
          },
          ...guild.contracts.slice(1),
        ],
      },
    },
  };
}

test("Focus Manual replaces one learned move in a full library and consumes exactly one manual", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 2 },
  };
  const option = getBattleMoveTrainingOptions(creature).find(
    (candidate) => candidate.teachableByFocusManual && !candidate.blockedReason,
  );
  assert.ok(option, "fixture requires a compatible unlearned manual move");
  const replacementMoveId = option.requiresLibraryReplacement
    ? getReplaceableLearnedMoveId(creature)
    : undefined;
  if (option.requiresLibraryReplacement) assert.ok(replacementMoveId);

  const result = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    option.move.id,
    replacementMoveId,
  );
  assert.equal(result.ok, true);
  assert.equal(getBattleOutfitterStock(result.save, manual), 1);
  const updated = (result.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(updated);
  const nextLoadout = getCreatureBattleMoveLoadout(updated);
  assert.ok(nextLoadout.learnedMoveIds.includes(option.move.id));
  if (replacementMoveId) assert.equal(nextLoadout.learnedMoveIds.includes(replacementMoveId), false);
});

test("a full library requires an explicit replaceable learned move", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 1 },
  };
  const option = getBattleMoveTrainingOptions(creature).find(
    (candidate) => candidate.teachableByFocusManual && candidate.requiresLibraryReplacement,
  );
  assert.ok(option, "starter library should require replacement");
  const result = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    option.move.id,
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /library is full/i);
  assert.equal(getBattleOutfitterStock(result.save, manual), 1);
});

test("manual teaching rejects protected combination and event sources without consuming stock", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 1 },
  };
  const protectedOption = getBattleMoveTrainingOptions(creature).find(
    (candidate) => !candidate.learned && !candidate.teachableByFocusManual,
  );
  assert.ok(protectedOption, "fixture requires a protected compatible move");

  const result = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    protectedOption.move.id,
  );
  assert.equal(result.ok, false);
  assert.equal(getBattleOutfitterStock(result.save, manual), 1);
});

test("move teaching and loadout editing refuse creatures away on Guild service without consuming stock", () => {
  const fixture = putCreatureOnGuildService();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...fixture.save,
    flags: { ...fixture.save.flags, [manual.flagKey]: 2 },
  };
  const teachable = getBattleMoveTrainingOptions(fixture.creature).find(
    (candidate) => candidate.teachableByFocusManual && !candidate.blockedReason,
  );
  assert.ok(teachable);
  const replacementMoveId = teachable.requiresLibraryReplacement
    ? getReplaceableLearnedMoveId(fixture.creature)
    : undefined;
  const beforeLoadout = getCreatureBattleMoveLoadout(fixture.creature);
  const equippedMoveId = beforeLoadout.equippedMoveIds[0];
  assert.ok(equippedMoveId);

  const taught = teachBattleMoveWithFocusManual(
    stockedSave,
    fixture.creature.creatureId,
    teachable.move.id,
    replacementMoveId,
  );
  assert.equal(taught.ok, false);
  assert.match(taught.message, /Guild service:/i);
  assert.equal(getBattleOutfitterStock(taught.save, manual), 2);

  const equipped = equipCreatureBattleMove(
    stockedSave,
    fixture.creature.creatureId,
    equippedMoveId,
  );
  assert.equal(equipped.ok, false);
  assert.match(equipped.message, /Guild service:/i);

  const unequipped = unequipCreatureBattleMove(
    stockedSave,
    fixture.creature.creatureId,
    equippedMoveId,
  );
  assert.equal(unequipped.ok, false);
  assert.match(unequipped.message, /Guild service:/i);

  const persistedCreature = (unequipped.save.creatures ?? []).find(
    (entry) => entry.creatureId === fixture.creature.creatureId,
  );
  assert.ok(persistedCreature);
  assert.deepEqual(getCreatureBattleMoveLoadout(persistedCreature), beforeLoadout);
});

test("newly learned moves can replace an equipped move while respecting the four-move limit", () => {
  const { save, creature } = createFixture();
  const manual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  assert.ok(manual);
  const stockedSave = {
    ...save,
    flags: { ...save.flags, [manual.flagKey]: 2 },
  };
  const teachable = getBattleMoveTrainingOptions(creature).find(
    (candidate) => candidate.teachableByFocusManual && !candidate.blockedReason,
  );
  assert.ok(teachable);
  const replacementMoveId = teachable.requiresLibraryReplacement
    ? getReplaceableLearnedMoveId(creature)
    : undefined;
  const taught = teachBattleMoveWithFocusManual(
    stockedSave,
    creature.creatureId,
    teachable.move.id,
    replacementMoveId,
  );
  assert.equal(taught.ok, true);
  const taughtCreature = (taught.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(taughtCreature);
  const before = getCreatureBattleMoveLoadout(taughtCreature);
  const replaceEquippedMoveId = before.equippedMoveIds.at(-1);
  assert.ok(replaceEquippedMoveId);

  const equipped = equipCreatureBattleMove(
    taught.save,
    creature.creatureId,
    teachable.move.id,
    before.equippedMoveIds.length >= MAX_EQUIPPED_BATTLE_MOVES
      ? replaceEquippedMoveId
      : undefined,
  );
  assert.equal(equipped.ok, true);
  const equippedCreature = (equipped.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(equippedCreature);
  const after = getCreatureBattleMoveLoadout(equippedCreature);
  assert.ok(after.equippedMoveIds.includes(teachable.move.id));
  assert.ok(after.equippedMoveIds.length <= MAX_EQUIPPED_BATTLE_MOVES);
});

test("unequipping cannot remove the final zero-cost fallback action", () => {
  const { save, creature } = createFixture();
  const loadout = getCreatureBattleMoveLoadout(creature);
  const isolatedCreature = {
    ...creature,
    battleMoveLoadout: {
      ...loadout,
      equippedMoveIds: ["strike"],
    },
  };
  const isolatedSave = {
    ...save,
    creatures: (save.creatures ?? []).map((entry) =>
      entry.creatureId === creature.creatureId ? isolatedCreature : entry,
    ),
  };
  const result = unequipCreatureBattleMove(
    isolatedSave,
    creature.creatureId,
    "strike",
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /zero-cost, zero-cooldown/i);
});
