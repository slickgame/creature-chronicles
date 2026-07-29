import test from "node:test";
import assert from "node:assert/strict";

const {
  MAX_COMBINATION_INHERITED_MOVES,
  MAX_DIRECT_INHERITED_MOVES,
  getBattleMoveInheritancePreview,
  getParentBattleMoveSource,
  rollBattleMoveInheritance,
} = await import("@/data/battleMoveInheritance");
const {
  MAX_EQUIPPED_BATTLE_MOVES,
  MAX_LEARNED_BATTLE_MOVES,
  getBattleMoveInheritanceCandidates,
  getCreatureBattleMoveLoadout,
} = await import("@/data/battleLoadouts");
const { BATTLE_MOVES_BY_ID } = await import("@/data/battleMoves");
const { createNewGameSave } = await import("@/lib/save/localSave");
const { hatchEgg } = await import("@/data/nursery");

function inheritanceFixture() {
  const base = createNewGameSave("Move Lineage Test", 0);
  const feline = (base.creatures ?? []).find((creature) => String(creature.speciesId) === "species_feline");
  const canine = (base.creatures ?? []).find((creature) => String(creature.speciesId) === "species_canine");
  assert.ok(feline && canine, "fixture requires feline and canine starter creatures");

  const giver = {
    ...feline,
    affection: 100,
    battleMoveLoadout: {
      learnedMoveIds: ["strike", "pounce", "focused_stare", "mend_wounds"],
      equippedMoveIds: ["strike", "focused_stare", "mend_wounds"],
      version: 1,
    },
  };
  const receiver = {
    ...canine,
    affection: 100,
    battleMoveLoadout: {
      learnedMoveIds: ["strike", "pack_howl", "chase", "mend_wounds"],
      equippedMoveIds: ["strike", "chase"],
      version: 1,
    },
  };
  const pairKey = [String(giver.creatureId), String(receiver.creatureId)].sort().join("__");
  const save = {
    ...base,
    creatures: (base.creatures ?? []).map((creature) =>
      creature.creatureId === giver.creatureId
        ? giver
        : creature.creatureId === receiver.creatureId
          ? receiver
          : creature,
    ),
    breeding: {
      ...base.breeding!,
      streaks: [{
        pairKey,
        participantAId: String(giver.creatureId),
        participantBId: String(receiver.creatureId),
        streakCount: 4,
        lastAttemptDayNumber: base.dayState.dayNumber,
        lastOutcome: "failed" as const,
      }],
    },
    ranchUpgrades: {
      ...(base.ranchUpgrades ?? {}),
      breeding_pen_comfort: 2,
    },
  };
  return { save, giver, receiver };
}

test("move-lineage preview never treats the player as an offspring-producing parent", () => {
  const { save, giver } = inheritanceFixture();
  const preview = getBattleMoveInheritancePreview(save, String(giver.creatureId), "player");
  assert.equal(preview.canProduceOffspring, false);
  assert.equal(preview.directCandidates.length, 0);
  assert.equal(preview.combinationCandidates.length, 0);
});

test("parent move snapshots and deterministic inheritance results do not mutate the save", () => {
  const { save, giver, receiver } = inheritanceFixture();
  const before = structuredClone(save);
  const first = rollBattleMoveInheritance({
    save,
    childSpeciesId: receiver.speciesId,
    giver,
    receiver,
    seed: "stable-move-lineage",
  });
  const second = rollBattleMoveInheritance({
    save: structuredClone(save),
    childSpeciesId: receiver.speciesId,
    giver: structuredClone(giver),
    receiver: structuredClone(receiver),
    seed: "stable-move-lineage",
  });
  assert.deepEqual(first, second);
  assert.deepEqual(save, before);
  assert.deepEqual(first.giverMoveSnapshot, getParentBattleMoveSource(giver));
  assert.deepEqual(first.receiverMoveSnapshot, getParentBattleMoveSource(receiver));
});

test("equipped parent moves and shared parent knowledge receive stronger direct inheritance chances", () => {
  const { receiver } = inheritanceFixture();
  const learnedOnly = {
    learnedMoveIds: ["mend_wounds"],
    equippedMoveIds: [],
  };
  const equipped = {
    learnedMoveIds: ["mend_wounds"],
    equippedMoveIds: ["mend_wounds"],
  };
  const oneParent = getBattleMoveInheritanceCandidates(receiver.speciesId, equipped, { learnedMoveIds: [], equippedMoveIds: [] })
    .find((candidate) => candidate.moveId === "mend_wounds");
  const learnedCandidate = getBattleMoveInheritanceCandidates(receiver.speciesId, learnedOnly, { learnedMoveIds: [], equippedMoveIds: [] })
    .find((candidate) => candidate.moveId === "mend_wounds");
  const bothParents = getBattleMoveInheritanceCandidates(receiver.speciesId, equipped, equipped)
    .find((candidate) => candidate.moveId === "mend_wounds");
  assert.ok(oneParent && learnedCandidate && bothParents);
  assert.ok(oneParent.finalChance > learnedCandidate.finalChance);
  assert.ok(bothParents.finalChance > oneParent.finalChance);
  assert.equal(bothParents.knownByBothParents, true);
});

test("eligible parent techniques expose active combination recipes without revealing the final roll", () => {
  const { save, giver, receiver } = inheritanceFixture();
  const preview = getBattleMoveInheritancePreview(
    save,
    String(giver.creatureId),
    String(receiver.creatureId),
  );
  const predator = preview.combinationCandidates.find((candidate) => candidate.recipeId === "recipe_predator_pursuit");
  assert.equal(preview.canProduceOffspring, true);
  assert.ok(predator);
  assert.equal(predator.outputMoveId, "predator_pursuit");
  assert.deepEqual(new Set(predator.contributingMoveNames), new Set(["Focused Stare", "Chase"]));
  assert.ok(predator.chance > 12, "pair quality and equipped contributors should improve the recipe chance");
});

test("combination discovery is deterministic and respects direct and combination limits", () => {
  const { save, giver, receiver } = inheritanceFixture();
  let successfulSeed: string | null = null;
  let result: ReturnType<typeof rollBattleMoveInheritance> | null = null;
  for (let index = 0; index < 500; index += 1) {
    const seed = `combination-search-${index}`;
    const candidate = rollBattleMoveInheritance({
      save,
      childSpeciesId: receiver.speciesId,
      giver,
      receiver,
      seed,
    });
    if (candidate.combinationMoveIds.includes("predator_pursuit")) {
      successfulSeed = seed;
      result = candidate;
      break;
    }
  }
  assert.ok(successfulSeed && result, "a deterministic seed should exist for the eligible recipe");
  const repeated = rollBattleMoveInheritance({
    save,
    childSpeciesId: receiver.speciesId,
    giver,
    receiver,
    seed: successfulSeed,
  });
  assert.deepEqual(repeated, result);
  assert.ok(result.directInheritedMoveIds.length <= MAX_DIRECT_INHERITED_MOVES);
  assert.ok(result.combinationMoveIds.length <= MAX_COMBINATION_INHERITED_MOVES);
  assert.ok(result.projectedLoadout.learnedMoveIds.length <= MAX_LEARNED_BATTLE_MOVES);
  assert.ok(result.projectedLoadout.equippedMoveIds.length <= MAX_EQUIPPED_BATTLE_MOVES);
  assert.ok(result.projectedLoadout.learnedMoveIds.includes("predator_pursuit"));
  assert.ok(result.projectedLoadout.equippedMoveIds.every((moveId) => result.projectedLoadout.learnedMoveIds.includes(moveId)));
  assert.ok(result.projectedLoadout.equippedMoveIds.some((moveId) => {
    const move = BATTLE_MOVES_BY_ID[moveId];
    return move.battleEnergyCost === 0 && move.cooldown === 0;
  }));
});

test("a ready egg applies its stored move lineage to the hatchling and birth history", () => {
  const { save, giver, receiver } = inheritanceFixture();
  let inheritance = rollBattleMoveInheritance({
    save,
    childSpeciesId: receiver.speciesId,
    giver,
    receiver,
    seed: "hatch-lineage-fallback",
  });
  for (let index = 0; index < 500 && !inheritance.combinationMoveIds.length; index += 1) {
    inheritance = rollBattleMoveInheritance({
      save,
      childSpeciesId: receiver.speciesId,
      giver,
      receiver,
      seed: `hatch-lineage-${index}`,
    });
  }
  assert.ok(inheritance.combinationMoveIds.length, "fixture should discover a combination move");
  const habitatId = (save.habitats ?? []).find((habitat) =>
    habitat.creatureIds.includes(receiver.creatureId),
  )?.habitatId ?? save.habitatIds[0];
  assert.ok(habitatId, "fixture requires a receiver habitat");
  const eggId = "egg_move_lineage_regression" as never;
  const egg = {
    eggId,
    ownerSaveId: save.saveId,
    createdAtDayNumber: save.dayState.dayNumber,
    createdAt: new Date(0).toISOString(),
    daysRemaining: 0,
    totalDays: 1,
    status: "ready" as const,
    rarity: "Common" as const,
    speciesId: receiver.speciesId,
    variantId: receiver.variantId,
    habitatId,
    parents: {
      giver: {
        participantId: String(giver.creatureId),
        creatureId: giver.creatureId,
        displayName: giver.nickname,
        familyLabel: "Feline",
        kind: "creature" as const,
      },
      receiver: {
        participantId: String(receiver.creatureId),
        creatureId: receiver.creatureId,
        displayName: receiver.nickname,
        familyLabel: "Canine",
        kind: "creature" as const,
      },
    },
    projectedStats: { ...receiver.stats },
    projectedStatGrades: { ...receiver.statGrades },
    projectedAbilities: [],
    battleMoveInheritance: inheritance,
    statRollNotes: [],
    abilityRollNotes: [],
    geneticsNotes: [...inheritance.notes],
    lineageRisk: "none" as const,
    lineageRiskLabel: "No Risk",
    lineageNotes: [],
    lineageTraits: [],
    suggestedName: "Move Lineage Pup",
  };
  const withEgg = {
    ...save,
    eggs: [egg],
    eggIds: [eggId],
  };
  const hatched = hatchEgg(withEgg, eggId, "Move Lineage Pup");
  assert.ok(hatched);
  const loadout = getCreatureBattleMoveLoadout(hatched.creature);
  assert.deepEqual(loadout, inheritance.projectedLoadout);
  for (const moveId of [...inheritance.combinationMoveIds, ...inheritance.directInheritedMoveIds]) {
    assert.ok(loadout.learnedMoveIds.includes(moveId));
  }
  const birth = hatched.save.birthHistory?.find((record) => record.creatureId === hatched.creature.creatureId);
  assert.ok(birth);
  assert.deepEqual(birth.combinationMoveIds, inheritance.combinationMoveIds);
  assert.deepEqual(birth.startingBattleMoveLoadout, inheritance.projectedLoadout);
});
