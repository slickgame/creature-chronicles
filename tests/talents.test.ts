import test from "node:test";
import assert from "node:assert/strict";

const {
  GENERAL_ABILITY_POOL,
  SPECIES_DEFINITIONS,
  VARIANT_DEFINITIONS,
} = await import("../src/data/creatures.ts");
const {
  getAllTalentDefinitions,
  getTalentDefinition,
  getTalentDescription,
  normalizeTalentInstance,
} = await import("../src/data/talents/talentDefinitions.ts");
const {
  getBattleTalentSummary,
  getBreedingTalentSummary,
  getChoreTalentSummary,
} = await import("../src/data/talents/talentEngine.ts");
const {
  auditTalentDefinitions,
} = await import("../src/data/talents/talentAudit.ts");
const {
  getCreatureRoleTags,
} = await import("../src/data/talents/creatureRoleTags.ts");
const {
  calculateBattleStats,
} = await import("../src/data/battleStats.ts");
const {
  createNewGameSave,
} = await import("../src/lib/save/localSave.ts");

const GRADES = ["F", "D", "C", "B", "A", "S"] as const;

function currentPoolTalentIds(): string[] {
  return Array.from(new Set([
    ...GENERAL_ABILITY_POOL.map((talent) => talent.id),
    ...SPECIES_DEFINITIONS.flatMap((species) => species.exclusiveAbilityPool.map((talent) => talent.id)),
    ...VARIANT_DEFINITIONS.flatMap((variant) => variant.exclusiveAbilityPool.map((talent) => talent.id)),
  ])).sort();
}

function talent(id: string, name: string, grade: typeof GRADES[number] = "C") {
  return { id, name, grade, source: "general" as const, description: "legacy placeholder" };
}

test("every current general, species, and variant talent has a central definition", () => {
  const missing = currentPoolTalentIds().filter((id) => !getTalentDefinition(id));
  assert.deepEqual(missing, []);
});

test("every structured talent has F through S effects and exact descriptions", () => {
  const definitions = getAllTalentDefinitions();
  assert.ok(definitions.length > 0);
  for (const definition of definitions) {
    for (const grade of GRADES) {
      assert.ok(definition.gradeEffects[grade].length > 0, `${definition.id} ${grade} needs effects`);
      assert.ok(definition.exactDescriptionByGrade[grade].trim().length > 0, `${definition.id} ${grade} needs exact text`);
    }
  }
});

test("normalization attaches definition metadata and exact grade text", () => {
  const normalized = normalizeTalentInstance(talent("quick_learner", "Quick Learner", "C"));
  assert.equal(normalized.category, "general");
  assert.ok(normalized.tags?.includes("learner"));
  assert.equal(normalized.definitionVersion, 1);
  assert.equal(normalized.description, getTalentDescription("quick_learner", "C"));
});

test("structured breeding effects preserve representative live formula behavior", () => {
  const quickLearner = getBreedingTalentSummary([talent("quick_learner", "Quick Learner")]);
  assert.equal(quickLearner.pregnancyChance, 1);
  assert.equal(quickLearner.creatureXpFlat, 4);

  const felineGrace = getBreedingTalentSummary([talent("feline_grace", "Feline Grace", "B")]);
  assert.equal(felineGrace.pregnancyChance, 3);
  assert.equal(felineGrace.creatureXpFlat, 1);

  const steadyNerves = getBreedingTalentSummary([talent("steady_nerves", "Steady Nerves")]);
  assert.equal(steadyNerves.pregnancyChance, 1);
  assert.equal(steadyNerves.creatureXpFlat, 1);
  assert.equal(steadyNerves.energyDiscount, 3);

  const guardInstinct = getBreedingTalentSummary([talent("guard_instinct", "Guard Instinct")]);
  assert.equal(guardInstinct.breederXpFlat, 4);
  assert.deepEqual(guardInstinct.statGrowthBiases, ["WIL"]);
});

test("chore talent effects apply only to their matching job", () => {
  const fieldhand = talent("fieldhand", "Fieldhand");
  const hauling = getChoreTalentSummary([fieldhand], "field_hauling");
  const security = getChoreTalentSummary([fieldhand], "security_patrol");
  assert.ok(hauling.scoreBonus > 0);
  assert.equal(security.scoreBonus, 0);
});

test("combat talent tags produce deterministic battle-stat bonuses", () => {
  const save = createNewGameSave("Talent Test", 0);
  const creature = (save.creatures ?? [])[0];
  assert.ok(creature);
  const base = calculateBattleStats({ ...creature, abilities: [] });
  const talented = calculateBattleStats({
    ...creature,
    abilities: [talent("tiger_instinct", "Tiger Instinct", "B")],
  });
  const summary = getBattleTalentSummary([talent("tiger_instinct", "Tiger Instinct", "B")]);
  assert.ok(summary.flatStats.physicalPower && summary.flatStats.physicalPower > 0);
  assert.ok(talented.physicalPower > base.physicalPower);
});

test("derived role tags are stable for the same creature", () => {
  const save = createNewGameSave("Role Tag Test", 1);
  const creature = (save.creatures ?? [])[1];
  assert.ok(creature);
  const first = getCreatureRoleTags(creature);
  const second = getCreatureRoleTags(creature);
  assert.deepEqual(first, second);
  assert.ok(first.length > 0);
  assert.equal(first.filter((tag) => tag.primary).length, Math.min(2, first.length));
});

test("talent audit recognizes every current saved talent instance", () => {
  const save = createNewGameSave("Audit Test", 2);
  const creature = (save.creatures ?? [])[0];
  assert.ok(creature);
  const auditedSave = {
    ...save,
    creatures: (save.creatures ?? []).map((entry, index) => index === 0
      ? { ...entry, abilities: [talent("quick_learner", "Quick Learner")] }
      : entry),
  };
  const audit = auditTalentDefinitions(auditedSave);
  assert.equal(audit.unknownDefinitionCount, 0);
  assert.equal(audit.gradeCoverageCount, audit.gradeCoverageExpected);
  assert.ok(audit.records.some((record) => record.talentId === "quick_learner" && record.ownedCount >= 1));
});
