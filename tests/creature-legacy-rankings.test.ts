import assert from "node:assert/strict";
import test from "node:test";
import {
  getCreatureLegacyProfile,
  getHallOfLegendsCandidates,
  getRanchLegacySummary,
} from "@/data/creatureLegacyRankings";
import {
  normalizeCreatureCareerSave,
  recordCreatureBattleCareer,
  recordCreatureGuildCareer,
} from "@/data/creatureCareerRecords";
import { createNewGameSave } from "@/lib/save/localSave";

function buildLegacySave() {
  let save = normalizeCreatureCareerSave(createNewGameSave("Legacy Tester", 0));
  const creature = save.creatures[0];
  for (let index = 0; index < 25; index += 1) {
    save = recordCreatureBattleCareer(save, {
      eventKey: `ranking-battle-${index}`,
      creatureId: creature.creatureId,
      dayNumber: save.dayState.dayNumber,
      outcome: "victory",
      damageDealt: 80,
      knockouts: 1,
    });
  }
  for (let index = 0; index < 3; index += 1) {
    save = recordCreatureGuildCareer(save, {
      eventKey: `ranking-guild-${index}`,
      creatureId: creature.creatureId,
      dayNumber: save.dayState.dayNumber,
      featured: index === 2,
    });
  }
  save.flags.legacyPrestige = 7;
  return { save, creature };
}

test("career contributions produce stable Legacy titles and scores", () => {
  const { save, creature } = buildLegacySave();
  const profile = getCreatureLegacyProfile(save, creature);
  assert.ok(profile.legacyScore >= 150);
  assert.equal(profile.hallEligible, true);
  assert.ok(["Coliseum Veteran", "Ranch Legend"].includes(profile.title));
  assert.equal(profile.strongestContribution, "Coliseum victories");
});

test("Hall candidates are ordered by fulfilled ambitions and Legacy score", () => {
  const { save, creature } = buildLegacySave();
  const candidates = getHallOfLegendsCandidates(save);
  assert.ok(candidates.length >= 1);
  assert.equal(candidates[0]?.creature.creatureId, creature.creatureId);
  assert.ok(candidates.every((candidate) => candidate.hallEligible));
});

test("ranch Legacy summary combines prestige, Chronicle, and creature rankings", () => {
  const { save, creature } = buildLegacySave();
  const summary = getRanchLegacySummary(save);
  assert.equal(summary.prestige, 7);
  assert.ok(summary.fulfilledAmbitions >= 1);
  assert.ok(summary.hallEligibleCreatures >= 1);
  assert.equal(summary.topCreature?.creature.creatureId, creature.creatureId);
});
