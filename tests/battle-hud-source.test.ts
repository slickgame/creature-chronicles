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
  const polish = await source("src/features/battle/BattlePortraitStagePolish.module.css");

  assert.match(component, /Projected Order/);
  assert.match(component, /data-side=\{combatant\.sideId\}/);
  assert.match(component, /onClick=\{combatant\.sideId === "player"/);
  assert.match(component, /portrait\.scale \* 0\.78/);
  assert.match(component, /portrait\.offsetY \* 0\.62 - 10/);
  assert.match(styles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.portraitWindow[\s\S]*overflow:\s*hidden/);
  assert.match(polish, /min-height:\s*480px/);
  assert.match(polish, /width:\s*min\(100%, 250px\)/);
  assert.match(polish, /height:\s*clamp\(260px, 19vw, 338px\)/);
  assert.match(polish, /bovine[\s\S]*--portrait-scale:\s*1\.3/);
  assert.match(polish, /equine[\s\S]*--portrait-scale:\s*1\.17/);
  assert.match(polish, /canine[\s\S]*--portrait-scale:\s*1\.04/);
  assert.match(polish, /feline[\s\S]*--portrait-scale:\s*0\.93/);
  assert.match(polish, /lapine[\s\S]*--portrait-scale:\s*0\.88/);
});

test("both active battle modes share categorized commands and actual resolution order", async () => {
  for (const path of ["src/features/coliseum/ColiseumC2Screen.tsx", "src/features/coliseum/ColiseumC4Battle.tsx"]) {
    const screen = await source(path);
    assert.match(screen, /<BattleArenaB/);
    assert.match(screen, /resolved.result.actions.map\(action => action.actorId\)/);
  }
  const arena = await source("src/features/battle/BattleArenaB.tsx");
  assert.match(arena, /BATTLE_MENU_CATEGORIES.map/);
  assert.match(arena, /Queue Move/);
  assert.match(arena, /Confirm Round/);
  assert.match(arena, /presentation.actionOrder/);
  assert.match(arena, /title="Battle Log"/);
  assert.match(arena, /full body/);
});

test("battle glossary documents every live status with mechanical values", async () => {
  const glossary = await source("src/data/battleGlossary.ts");
  for (const status of ["bleed", "stun", "guarded", "inspired", "marked", "taunted", "exhausted", "weakened", "slowed"]) {
    assert.match(glossary, new RegExp(`\\b${status}: \\{`));
  }
  assert.match(glossary, /15% more incoming damage/);
  assert.match(glossary, /adds 2 Battle Energy/);
  assert.match(glossary, /halves end-of-round Battle Energy recovery/);
  assert.match(glossary, /reduces Evasion by half that amount/);
  assert.match(glossary, /Guard Break moves gain 25% damage/);
});

test("guided first battle targets the portrait battlefield", async () => {
  const tutorial = await source("src/features/coliseum/ColiseumC2ScreenTutorial.tsx");
  assert.match(tutorial, /section\[aria-label="3 versus 3 battle stage"\]/);
  assert.match(tutorial, /article\[data-side="enemy"\]/);
});
