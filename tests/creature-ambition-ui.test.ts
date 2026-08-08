import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const panelSource = fs.readFileSync("src/features/legacy/CreatureAmbitionPanel.tsx", "utf8");
const detailSource = fs.readFileSync("src/features/legacy/CreatureDetailWithMemories.tsx", "utf8");

test("ambition panel renders progress, milestones, and completion state", () => {
  assert.match(panelSource, /getCreatureAmbitionProgress/);
  assert.match(panelSource, /data-legacy-panel="ambition"/);
  assert.match(panelSource, /milestoneTargets/);
  assert.match(panelSource, /Ambition fulfilled/);
});

test("Legacy creature details compose ambition before career and memories", () => {
  const ambitionIndex = detailSource.indexOf("<CreatureAmbitionPanel");
  const careerIndex = detailSource.indexOf("<CreatureCareerPanel");
  const memoryIndex = detailSource.indexOf("<CreatureMemoriesPanel");
  assert.ok(ambitionIndex >= 0);
  assert.ok(careerIndex > ambitionIndex);
  assert.ok(memoryIndex > careerIndex);
});
