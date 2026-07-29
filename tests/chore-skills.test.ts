import test from "node:test";
import assert from "node:assert/strict";

const {
  CHORE_SKILL_DEFINITIONS,
  DOMESTIC_CHORE_SKILL_IDS,
  RANCH_CHORE_SKILL_IDS,
  gainCreatureChoreSkillXp,
  getChoreSkillXpToNext,
  getCreatureChoreSkillGroup,
  getCreatureChoreSkillProgress,
  normalizeCreatureChoreSkills,
} = await import("../src/data/choreSkills.ts");
const {
  RANCH_JOB_DEFINITIONS,
  calculateCreatureChoreScore,
  isCreatureEligibleForJob,
} = await import("../src/data/ranchJobs.ts");
const {
  getCreatureRoleTags,
} = await import("../src/data/talents/creatureRoleTags.ts");
const {
  getVariantDefinition,
} = await import("../src/data/creatures.ts");
const {
  createNewGameSave,
} = await import("../src/lib/save/localSave.ts");

function starterByFamily(family: "feline" | "canine" | "bovine" | "lapine" | "equine") {
  const save = createNewGameSave(`Chore ${family}`, 0);
  const creature = (save.creatures ?? []).find(
    (entry) => getVariantDefinition(entry.variantId).family === family,
  );
  assert.ok(creature, `fixture needs a ${family} starter`);
  return creature;
}

test("chore skill registry separates five domestic and five ranch proficiencies", () => {
  assert.equal(CHORE_SKILL_DEFINITIONS.length, 10);
  assert.deepEqual(DOMESTIC_CHORE_SKILL_IDS, [
    "cooking",
    "cleaning",
    "crafting",
    "caregiving",
    "hospitality",
  ]);
  assert.deepEqual(RANCH_CHORE_SKILL_IDS, [
    "security",
    "harvesting",
    "production",
    "hauling",
    "ranch_care",
  ]);
});

test("old creature records receive complete species-based chore baselines", () => {
  const canine = starterByFamily("canine");
  const normalized = normalizeCreatureChoreSkills({ ...canine, choreSkills: undefined });
  assert.equal(Object.keys(normalized).length, 10);
  assert.equal(getCreatureChoreSkillGroup(canine, "domestic").length, 5);
  assert.equal(getCreatureChoreSkillGroup(canine, "ranch").length, 5);
  assert.ok(normalized.security.level >= 1);
  assert.ok(normalized.cooking.level >= 1);
});

test("species baselines create strengths without blocking other chores", () => {
  const canine = starterByFamily("canine");
  const lapine = starterByFamily("lapine");
  const bovine = starterByFamily("bovine");
  const equine = starterByFamily("equine");

  assert.ok(
    getCreatureChoreSkillProgress(canine, "security").level >
      getCreatureChoreSkillProgress(lapine, "security").level,
  );
  assert.ok(
    getCreatureChoreSkillProgress(lapine, "harvesting").level >
      getCreatureChoreSkillProgress(canine, "harvesting").level,
  );
  assert.ok(getCreatureChoreSkillProgress(bovine, "production").level >= 5);
  assert.ok(getCreatureChoreSkillProgress(equine, "hauling").level >= 5);

  for (const creature of [canine, lapine, bovine, equine]) {
    for (const job of RANCH_JOB_DEFINITIONS) {
      assert.equal(
        isCreatureEligibleForJob(creature, job),
        true,
        `${getVariantDefinition(creature.variantId).family} should be allowed to perform ${job.jobId}`,
      );
    }
  }
});

test("persistent chore levels directly improve live ranch job score", () => {
  const lapine = starterByFamily("lapine");
  const securityJob = RANCH_JOB_DEFINITIONS.find((job) => job.jobId === "security_patrol");
  assert.ok(securityJob);
  const baseSkills = normalizeCreatureChoreSkills(lapine);
  const novice = {
    ...lapine,
    abilities: [],
    choreSkills: {
      ...baseSkills,
      security: {
        level: 1,
        xp: 0,
        xpToNext: getChoreSkillXpToNext(1),
        lifetimeXp: 0,
      },
    },
  };
  const trained = {
    ...novice,
    choreSkills: {
      ...novice.choreSkills,
      security: {
        level: 10,
        xp: 0,
        xpToNext: getChoreSkillXpToNext(10),
        lifetimeXp: 800,
      },
    },
  };
  assert.ok(
    calculateCreatureChoreScore(trained, securityJob) >
      calculateCreatureChoreScore(novice, securityJob),
  );
});

test("completed work grants only the mapped skill XP and persists level-ups", () => {
  const feline = starterByFamily("feline");
  const normalized = normalizeCreatureChoreSkills(feline);
  const fixture = {
    ...feline,
    choreSkills: {
      ...normalized,
      ranch_care: {
        level: 1,
        xp: getChoreSkillXpToNext(1) - 2,
        xpToNext: getChoreSkillXpToNext(1),
        lifetimeXp: 0,
      },
    },
  };
  const beforeSecurity = fixture.choreSkills.security;
  const result = gainCreatureChoreSkillXp(fixture, "comfort_care", 5);
  assert.equal(result.gain.skillId, "ranch_care");
  assert.equal(result.gain.levelBefore, 1);
  assert.equal(result.gain.levelAfter, 2);
  assert.equal(result.gain.levelUps, 1);
  assert.deepEqual(result.creature.choreSkills?.security, beforeSecurity);
  assert.equal(result.creature.choreSkills?.ranch_care.level, 2);
  assert.ok((result.creature.choreSkills?.ranch_care.lifetimeXp ?? 0) >= 5);
});

test("skill-derived role tags update when a creature trains beyond its baseline", () => {
  const canine = starterByFamily("canine");
  const skills = normalizeCreatureChoreSkills(canine);
  const trained = {
    ...canine,
    choreSkills: {
      ...skills,
      cooking: {
        level: 10,
        xp: 0,
        xpToNext: getChoreSkillXpToNext(10),
        lifetimeXp: 900,
      },
    },
  };
  const tags = getCreatureRoleTags(trained);
  assert.ok(tags.some((tag) => tag.label === "Cook"));
  assert.ok(tags.some((tag) => tag.category === "domestic"));
});