import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
const dockCss = readFileSync("src/app/tutorial-dock.css", "utf8");
const guidedSource = readFileSync("src/features/tutorial/ChapterOneGuidedTutorial.tsx", "utf8");
const battleCoachSource = readFileSync("src/features/coliseum/ColiseumC2ScreenTutorial.tsx", "utf8");
const dockHookSource = readFileSync("src/features/tutorial/useTutorialViewportDock.ts", "utf8");

test("tutorial dock stylesheet is mounted globally", () => {
  assert.match(layoutSource, /import "\.\/tutorial-dock\.css"/);
});

test("all current fixed tutorial cards use the shared viewport dock", () => {
  assert.match(guidedSource, /useTutorialViewportDock\("chapter-one-guided-card"/);
  assert.match(battleCoachSource, /useTutorialViewportDock\("chapter-one-first-battle-coach"/);
  assert.match(guidedSource, /data-tutorial-dock-card="true"/);
  assert.match(battleCoachSource, /data-tutorial-dock-card="true"/);
});

test("desktop tutorial cards reserve a right-side lane and small viewports reserve bottom space", () => {
  assert.match(dockHookSource, /DESKTOP_DOCK_MIN_WIDTH = 1100/);
  assert.match(dockHookSource, /tutorialDockSide = "right"/);
  assert.match(dockHookSource, /tutorialDockSide = "bottom"/);
  assert.match(dockCss, /padding-right:\s*max\(var\(--tutorial-dock-space\)/);
  assert.match(dockCss, /padding-bottom:\s*max\(var\(--tutorial-dock-space\)/);
});

test("hidden tutorial cards release their reserved space", () => {
  assert.match(dockHookSource, /style\.display === "none"/);
  assert.match(dockHookSource, /reservations\.delete\(reservationId\)/);
  assert.match(dockHookSource, /removeAttribute\("data-tutorial-dock-side"\)/);
});
