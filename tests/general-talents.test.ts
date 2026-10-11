import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave, saveGameToSlot, loadSaveFromSlot } from "../src/lib/save/localSave.ts";
import { GENERAL_ABILITY_POOL, GENERAL_TALENT_GRADES, createGeneralTalent } from "../src/data/talents/generalTalents.ts";
import { getTalentDefinition, getTalentEffects, getTalentDescription } from "../src/data/talents/talentDefinitions.ts";
import { getBreedingTalentSummary, getChoreTalentSummary, getRecoveryTalentSummary } from "../src/data/talents/talentEngine.ts";
import { getBreedingParticipants, getBreedingPreview, performBreedingAttempt } from "../src/data/breedingTutorial.ts";
import { createStrategicInheritancePreview } from "../src/data/genetics.ts";
import { rollMarketAbilitiesForTier } from "../src/data/abilityBalance.ts";
import { calculateBattleStats } from "../src/data/battleStats.ts";

const allowed = new Set(GENERAL_ABILITY_POOL.map(t => t.id));
test("every launch talent has one unrestricted effect that strengthens at every grade", () => {
  for (const talent of GENERAL_ABILITY_POOL) {
    const definition = getTalentDefinition(talent.id)!;
    assert.deepEqual(definition.sourceRestrictions, []);
    let previous = 0;
    for (const grade of GENERAL_TALENT_GRADES) {
      const effects = getTalentEffects(talent.id, grade);
      assert.equal(effects.length, 1);
      assert.ok(effects[0].value > previous);
      assert.ok(getTalentDescription(talent.id, grade)?.includes(String(effects[0].value)));
      previous = effects[0].value;
    }
  }
});

test("Hot-Blooded increases actual breeding fertility without changing innate stats or hidden rewards", () => {
  const save = createNewGameSave("Fertility", 0);
  save.creatures = save.creatures!.map(c => ({ ...c, abilities: [] }));
  save.flags.chapterOneGuidedSkipped = true;
  const [a,b] = save.creatures;
  const base = getBreedingPreview(save, a.creatureId, b.creatureId)!;
  const snapshot = JSON.stringify(a.stats);
  a.abilities = [createGeneralTalent("hot_blooded", "A")];
  const boosted = getBreedingPreview(save, a.creatureId, b.creatureId)!;
  assert.equal(boosted.pregnancyChance - base.pregnancyChance, 2); // +6 FER / 3
  assert.equal(boosted.xpGain, base.xpGain);
  assert.equal(boosted.energyCost, base.energyCost);
  assert.equal(boosted.abilityBonus, base.abilityBonus); // fertility, not a hidden flat chance bonus
  assert.ok(boosted.abilityTriggers.some(t => t.includes("+ 6 talent =")));
  assert.equal(JSON.stringify(a.stats), snapshot);
  const result = performBreedingAttempt(save, a.creatureId, b.creatureId)!;
  assert.ok(result);
  assert.equal(result.attempt.pregnancyChance, boosted.pregnancyChance);
  for (const talent of GENERAL_ABILITY_POOL.filter(t => t.id !== "hot_blooded" && t.id !== "lasting_vigor")) {
    assert.equal(getBreedingTalentSummary([talent]).pregnancyChance, 0);
    assert.equal(getBreedingTalentSummary([talent]).creatureXpFlat, 0);
  }
});

test("general talents reach chore, recovery and battle calculations", () => {
  for (const job of ["security_patrol", "field_hauling"] as const) {
    assert.equal(getChoreTalentSummary([createGeneralTalent("diligent", "S")], job).scoreBonus, 2);
    assert.equal(getChoreTalentSummary([createGeneralTalent("eager_learner", "C")], job).xpPercent, 10);
  }
  assert.equal(getRecoveryTalentSummary([createGeneralTalent("sound_sleeper", "A")]).energyPercent, 20);
  const creature = createNewGameSave("Combat", 0).creatures![0];
  const base = calculateBattleStats({ ...creature, abilities: [] });
  for (const [id, stat] of [["sure_strike", "physicalPower"], ["thick_hide", "defense"], ["light_footed", "speed"]] as const) {
    const boosted = calculateBattleStats({ ...creature, abilities: [createGeneralTalent(id, "B")] });
    assert.equal(boosted[stat] - base[stat], 4);
  }
});

test("all species can roll the same market talents with real grade variety", () => {
  const save = createNewGameSave("Market", 0);
  for (const creature of save.creatures!) {
    const ids = new Set<string>(); const grades = new Set<string>();
    for (let n = 0; n < 300; n++) {
      const talents = rollMarketAbilitiesForTier(`market-${n}`, creature.speciesId, creature.variantId, 4);
      for (const talent of talents) { assert.ok(allowed.has(talent.id)); assert.equal(talent.source, "general"); ids.add(talent.id); grades.add(talent.grade); }
    }
    assert.equal(ids.size, allowed.size);
    assert.ok(grades.size >= 4);
  }
});

test("inheritance retains parent talent grades and new mutations stay general", () => {
  const save = createNewGameSave("Inheritance", 0);
  save.creatures = save.creatures!.map(c => ({ ...c, abilities: [createGeneralTalent("hot_blooded", "S")] }));
  const parents = getBreedingParticipants(save).filter(p => p.kind === "creature");
  for (const parent of parents) {
    let inherited = 0;
    for (let n = 0; n < 100; n++) {
      const preview = createStrategicInheritancePreview(save, parent, parents[(parents.indexOf(parent) + 1) % parents.length], `inherit-${n}`);
      for (const talent of preview.projectedAbilities) {
        assert.ok(allowed.has(talent.id)); assert.equal(talent.source, "general");
        if (talent.id === "hot_blooded") { assert.equal(talent.grade, "S"); inherited++; }
      }
    }
    assert.ok(inherited > 0);
  }
});

test("starter talents and legitimately talentless creatures survive save reload", () => {
  const memory = new Map<string,string>();
  const storage = { getItem: (k:string) => memory.get(k) ?? null, setItem: (k:string,v:string) => memory.set(k,v), removeItem: (k:string) => memory.delete(k), key: (n:number) => [...memory.keys()][n] ?? null, get length() { return memory.size; } };
  Object.defineProperty(globalThis, "window", { value: { localStorage: storage }, configurable: true });
  try {
    const save = createNewGameSave("Persistence", 0);
    assert.ok(save.creatures!.every(c => c.abilities.length === 1 && allowed.has(c.abilities[0].id)));
    save.creatures![0].abilities = [createGeneralTalent("hot_blooded", "S")];
    save.creatures![1].abilities = [];
    const expected = save.creatures!.map(c => c.abilities.map(t => [t.id,t.grade]));
    saveGameToSlot(save);
    const loaded = loadSaveFromSlot(0)!;
    assert.ok(loaded);
    assert.deepEqual(loaded.creatures!.map(c => c.abilities.map(t => [t.id,t.grade])), expected);
  } finally { Reflect.deleteProperty(globalThis, "window"); }
});


test("egg shop offers use general talents with grade-correct descriptions", async () => {
  const { buyEggFromSelene } = await import("../src/data/eggAtelier.ts");
  const { grantNpcTrust } = await import("../src/data/townNpcs.ts");
  const save = grantNpcTrust(createNewGameSave("Egg shop", 0), "selene_virell", 10000);
  save.currencies.gold = 10000;
  for (const offer of ["appraised_field_egg", "rare_lineage_egg"] as const) {
    const result = buyEggFromSelene(save, offer);
    assert.ok(result.ok, result.message);
    const egg = result.save.eggs!.at(-1)!;
    assert.ok(egg.projectedAbilities.length > 0);
    for (const talent of egg.projectedAbilities) {
      assert.ok(allowed.has(talent.id));
      assert.equal(talent.grade, offer === "rare_lineage_egg" ? "B" : "C");
      assert.ok(talent.description.includes(String(getTalentEffects(talent.id, talent.grade)[0].value)));
    }
  }
});
