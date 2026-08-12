import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Chronicle screen presents ranch history and a return action", async () => {
  const text = await source("src/features/legacy/ChronicleScreen.tsx");
  assert.match(text, /The Chronicle/);
  assert.match(text, /ChronicleFeed/);
  assert.match(text, /Back to Ranch/);
  assert.match(text, /save\.player\.ranchName/);
});

test("memory-aware creature detail composes existing detail UI without replacing it", async () => {
  const text = await source("src/features/legacy/CreatureDetailWithMemories.tsx");
  assert.match(text, /SharedCreatureDetail/);
  assert.match(text, /CreatureMemoriesPanel/);
  assert.match(text, /creature\.creatureId/);
});
