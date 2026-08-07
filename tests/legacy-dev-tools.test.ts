import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  prepareLegacyHallCandidate,
  prepareLegacyRetirementCandidate,
} from "@/data/legacyDevTools";
import { getCreatureLegacyProfile } from "@/data/creatureLegacyRankings";
import { getRetirementEligibility } from "@/data/creatureRetirement";
import { createNewGameSave } from "@/lib/save/localSave";

const panelSource = readFileSync("src/features/dev-tools/LegacyTestPanel.tsx", "utf8");
const reliableDevToolsSource = readFileSync(
  "src/features/dev-tools/DevToolsScreenReliable.tsx",
  "utf8",
);

test("Legacy dev presets prepare real retirement and Hall candidates", () => {
  const save = createNewGameSave("Legacy QA Tester", 0);
  const creature = save.creatures?.[0];
  assert.ok(creature);

  const retirement = prepareLegacyRetirementCandidate(save, creature.creatureId);
  assert.equal(retirement.ok, true);
  assert.ok(
    (retirement.save.creatures ?? []).find((entry) => entry.creatureId === creature.creatureId)!
      .level >= 20,
  );
  assert.equal(getRetirementEligibility(retirement.save, creature.creatureId).eligible, true);

  const hall = prepareLegacyHallCandidate(save, creature.creatureId);
  assert.equal(hall.ok, true);
  const hallCreature = (hall.save.creatures ?? []).find(
    (entry) => entry.creatureId === creature.creatureId,
  );
  assert.ok(hallCreature);
  assert.equal(getCreatureLegacyProfile(hall.save, hallCreature).hallEligible, true);
});

test("the reliable Dev Tools screen exposes the Legacy Test Lab and real-flow instructions", () => {
  assert.match(reliableDevToolsSource, /LegacyTestPanel/);
  assert.match(panelSource, /data-legacy-test-lab="true"/);
  assert.match(panelSource, /Prepare Retirement Candidate/);
  assert.match(panelSource, /Prepare Hall-Ready Candidate/);
  assert.match(panelSource, /Retire & Create Heirloom/);
  assert.match(panelSource, /Retire & Induct into Hall/);
});
