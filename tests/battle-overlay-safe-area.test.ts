import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
const safeAreaSource = readFileSync("src/app/battle-overlay-safe-area.css", "utf8");

test("battle overlay safe-area stylesheet is globally mounted", () => {
  assert.match(layoutSource, /import "\.\/battle-overlay-safe-area\.css"/);
});

test("desktop battle controls reserve the bottom-right tutorial footprint", () => {
  assert.match(safeAreaSource, /\[class\*="actionFooter"\]:has\(\[class\*="confirmButton"\]\)/);
  assert.match(safeAreaSource, /padding-right:\s*clamp\(360px,\s*23vw,\s*430px\)/);
  assert.match(safeAreaSource, /flex-wrap:\s*wrap/);
});

test("small battle layouts remove the desktop overlay reservation", () => {
  assert.match(safeAreaSource, /@media \(max-width: 800px\)/);
  assert.match(safeAreaSource, /padding-right:\s*0/);
});
