import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, ROOT), "utf8");
}

test("portrait battlefield uses horizontal formations and projected order controls", async () => {
  const component = await source("src/features/battle/BattlePortraitStage.tsx");
  const styles = await source("src/features/battle/BattlePortraitStage.module.css");

  assert.match(component, /Projected Order/);
  assert.match(component, /data-side=\{combatant\.sideId\}/);
  assert.match(component, /onClick=\{combatant\.sideId === "player"/);
  assert.match(styles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.portraitWindow[\s\S]*overflow:\s*hidden/);
});

test("C2 battle HUD exposes compact move details and modal battle log", async () => {
  const c2 = await source("src/features/coliseum/ColiseumC2Screen.tsx");
  const dialogs = await source("src/features/battle/BattleCommandDialogs.tsx");

  assert.match(c2, /<BattleMoveGrid/);
  assert.match(c2, /<BattleLogButton entries=\{battleState\.log\}/);
  assert.match(c2, /className=\{battleStyles\.actionFooter\}/);
  assert.doesNotMatch(c2, /className=\{battleStyles\.queuePanel\}/);
  assert.doesNotMatch(c2, /className=\{battleStyles\.logPanel\}/);
  assert.match(dialogs, /More information about/);
  assert.match(dialogs, /Turn-by-turn record/);
});

test("guided first battle targets the portrait battlefield", async () => {
  const tutorial = await source("src/features/coliseum/ColiseumC2ScreenTutorial.tsx");
  assert.match(tutorial, /section\[aria-label="3 versus 3 battle stage"\]/);
  assert.match(tutorial, /article\[data-side="enemy"\]/);
});
