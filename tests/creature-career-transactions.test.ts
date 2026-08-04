import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/data/creatureCareerTransactions.ts"),
  "utf8",
);

test("ranch career adapter uses deterministic day, job, and creature keys", () => {
  assert.match(
    source,
    /ranch-job:\$\{save\.dayState\.dayNumber\}:\$\{result\.jobId\}:\$\{String\(result\.creatureId\)\}/,
  );
  assert.match(source, /recordCreatureWorkCareer/);
  assert.match(source, /resourcesProduced: parseProducedResources\(result\)/);
});

test("Legacy hatch adapter writes memories and parent career credit", () => {
  assert.match(source, /recordBirthMemories/);
  assert.match(source, /recordCreatureBreedingCareer/);
  assert.match(source, /role: "parent"/);
  assert.match(source, /offspringRarity: birth\.rarity/);
  assert.match(source, /offspring:\$\{String\(birth\.birthId\)\}/);
});
