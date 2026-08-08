import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
const safeAreaSource = readFileSync("src/app/battle-overlay-safe-area.css", "utf8");
const tutorialDockSource = readFileSync("src/app/tutorial-dock.css", "utf8");

test("battle overlay and universal tutorial dock stylesheets are globally mounted", () => {
  assert.match(layoutSource, /import "\.\/battle-overlay-safe-area\.css"/);
  assert.match(layoutSource, /import "\.\/tutorial-dock\.css"/);
});

test("battle controls wrap without reserving a hard-coded tutorial footprint", () => {
  assert.match(safeAreaSource, /\[class\*="actionFooter"\]:has\(\[class\*="confirmButton"\]\)/);
  assert.match(safeAreaSource, /flex-wrap:\s*wrap/);
  assert.doesNotMatch(safeAreaSource, /padding-right:\s*clamp/);
});

test("tutorial spacing is now universal instead of battle-only", () => {
  assert.match(tutorialDockSource, /data-tutorial-dock-side="right"/);
  assert.match(tutorialDockSource, /padding-right:\s*max\(var\(--tutorial-dock-space\)/);
  assert.match(tutorialDockSource, /data-tutorial-dock-side="bottom"/);
  assert.match(tutorialDockSource, /padding-bottom:\s*max\(var\(--tutorial-dock-space\)/);
});
