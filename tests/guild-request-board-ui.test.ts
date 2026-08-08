import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screenSource = readFileSync("src/features/guild/GuildHallScreen.tsx", "utf8");
const baseCss = readFileSync("src/features/guild/GuildHallScreen.module.css", "utf8");
const polishCss = readFileSync("src/features/guild/GuildHallScreen.polish.module.css", "utf8");

test("Guild Hall composes base and polish CSS modules instead of replacing structural classes", () => {
  assert.match(screenSource, /function composeStyleModules\(/);
  assert.match(screenSource, /const styles = composeStyleModules\(baseStyles, polishStyles\);/);
  assert.doesNotMatch(screenSource, /\{\s*\.\.\.baseStyles,\s*\.\.\.polishStyles\s*\}/);

  for (const className of ["contractOverlay", "contractGrid", "contractList", "filterButton", "primaryButton", "secondaryButton"]) {
    assert.match(baseCss, new RegExp(`\\.${className}`), `${className} must retain its base structural class`);
    assert.match(polishCss, new RegExp(`\\.${className}`), `${className} intentionally has polish rules and therefore must be composed`);
  }
});

test("Request Board mode still mounts the visible board surface and five-contract list container", () => {
  assert.match(screenSource, /onClick=\{\(\) => setHallMode\("board"\)\}/);
  assert.match(screenSource, /hallMode === "board"/);
  assert.match(screenSource, /data-contract-board="list"/);
  assert.match(screenSource, /data-contract-list="true"/);

  assert.match(baseCss, /\.contractOverlay\{position:absolute;inset:18px;display:grid;/);
  assert.match(baseCss, /\.header,.hallIntro,.boardHotspot,.quartermasterHotspot,.contractOverlay,.versionFooter\{position:relative;z-index:2\}/);
});
