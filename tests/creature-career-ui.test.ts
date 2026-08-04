import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function source(file: string): string {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("career panel exposes the core lifetime record categories", () => {
  const panel = source("src/features/legacy/CreatureCareerPanel.tsx");
  assert.match(panel, /Lifetime accomplishments/);
  assert.match(panel, /Battles/);
  assert.match(panel, /Guild Requests/);
  assert.match(panel, /Offspring/);
  assert.match(panel, /getCreatureCareerRecord/);
});

test("legacy creature detail presents career records and memories together", () => {
  const detail = source("src/features/legacy/CreatureDetailWithMemories.tsx");
  assert.match(detail, /CreatureCareerPanel/);
  assert.match(detail, /CreatureMemoriesPanel/);
  assert.match(detail, /SharedCreatureDetail/);
});
