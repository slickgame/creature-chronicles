import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  prepareGuildTrustPreset,
  prepareGuildTrustThresholdTest,
  prepareLegacyHallCandidate,
  prepareLegacyRetirementCandidate,
  prepareSeleneLineageQuestStage,
} from "@/data/legacyDevTools";
import { getCreatureLegacyProfile } from "@/data/creatureLegacyRankings";
import { getRetirementEligibility } from "@/data/creatureRetirement";
import { getNpcTrustRecord } from "@/data/townNpcs";
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

test("Guild Trust dev presets expose real relationship-backed requests at each threshold", () => {
  const save = createNewGameSave("Guild Trust QA Tester", 0);

  const familiar = prepareGuildTrustPreset(save, "mara_vell", 20);
  assert.equal(familiar.ok, true);
  assert.equal(getNpcTrustRecord(familiar.save, "mara_vell").points, 20);
  assert.equal(getNpcTrustRecord(familiar.save, "mara_vell").level, 2);
  assert.ok(
    familiar.save.guild?.contracts.some((contract) =>
      String(contract.contractId).startsWith(`guild_trust_${familiar.save.dayState.weekNumber}_mara_vell`),
    ),
  );

  const favored = prepareGuildTrustPreset(save, "petra_hale", 90);
  assert.equal(favored.ok, true);
  const petraRequest = favored.save.guild?.contracts.find((contract) =>
    String(contract.contractId).endsWith("_petra_hale") && String(contract.contractId).startsWith("guild_trust_"),
  );
  assert.ok(petraRequest);
  assert.equal(petraRequest.tier, "gold");
});

test("Guild Trust threshold preset starts at 18 and posts a normal Bronze completion test", () => {
  const save = createNewGameSave("Guild Threshold QA Tester", 0);
  const result = prepareGuildTrustThresholdTest(save, "kaida_thorn");
  assert.equal(result.ok, true);
  assert.equal(getNpcTrustRecord(result.save, "kaida_thorn").points, 18);
  const thresholdContract = result.save.guild?.contracts.find((contract) =>
    String(contract.contractId).startsWith("guild_dev_trust_threshold_") && contract.requesterId === "kaida_thorn",
  );
  assert.ok(thresholdContract);
  assert.equal(thresholdContract.tier, "bronze");
  assert.equal(thresholdContract.type, "service_creature");
  assert.match(thresholdContract.title, /Kaida Thorn's Familiarity Test/);
});

test("Selene dev controls can jump directly to each live personal lineage stage", () => {
  const save = createNewGameSave("Selene Lineage QA Tester", 0);
  const stage2 = prepareSeleneLineageQuestStage(save, 2);
  assert.equal(stage2.ok, true);
  assert.ok((stage2.save.townNpcTrust?.selene_virell?.points ?? 0) >= 50);
  assert.equal(Boolean(stage2.save.flags.guildSeleneLineageStage1), true);
  assert.equal(Boolean(stage2.save.flags.guildSeleneLineageStage2), false);
  assert.ok(stage2.save.guild?.contracts.some((contract) => String(contract.contractId) === "guild_personal_selene_lineage_2"));

  const stage3 = prepareSeleneLineageQuestStage(stage2.save, 3);
  assert.equal(stage3.ok, true);
  assert.equal(Boolean(stage3.save.flags.guildSeleneLineageStage1), true);
  assert.equal(Boolean(stage3.save.flags.guildSeleneLineageStage2), true);
  assert.equal(Boolean(stage3.save.flags.seleneLineageConsultationUnlocked), false);
  assert.ok(stage3.save.guild?.contracts.some((contract) => String(contract.contractId) === "guild_personal_selene_lineage_3"));
});

test("the reliable Dev Tools screen exposes Legacy and Guild Trust QA from one visible lab", () => {
  assert.match(reliableDevToolsSource, /LegacyTestPanel/);
  assert.match(panelSource, /data-legacy-test-launcher="true"/);
  assert.match(panelSource, />\s*Legacy Lab\s*</);
  assert.match(panelSource, /data-legacy-test-backdrop="true"/);
  assert.match(panelSource, /data-legacy-test-lab="true"/);
  assert.match(panelSource, /role="dialog"/);
  assert.match(panelSource, /Prepare Retirement Candidate/);
  assert.match(panelSource, /Prepare Hall-Ready Candidate/);
  assert.match(panelSource, /Retire & Create Heirloom/);
  assert.match(panelSource, /Retire & Induct into Hall/);
  assert.match(panelSource, /data-guild-trust-test-lab="true"/);
  assert.match(panelSource, /Prepare 18 → 20 Threshold Test/);
  assert.match(panelSource, /Familiar · 20/);
  assert.match(panelSource, /Trusted · 50/);
  assert.match(panelSource, /Favored · 90/);
  assert.match(panelSource, /Confidant · 140/);
  assert.match(panelSource, /data-selene-lineage-test-controls="true"/);
  assert.match(panelSource, /Prepare Selene Stage \{stage\}/);
});
