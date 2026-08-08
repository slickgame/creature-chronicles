import assert from "node:assert/strict";
import test from "node:test";

import {
  TUTORIAL_IDS,
  beginTutorialReplay,
  dismissTutorial,
  isTutorialCompleted,
  isTutorialDismissed,
  markTutorialCompleted,
  shouldShowTutorial,
} from "../src/data/tutorialLifecycle.ts";
import {
  normalizeGameSave,
  createNewGameSave,
} from "../src/lib/save/localSave.ts";

test("new saves persist the universal tutorial lifecycle state", () => {
  const save = createNewGameSave("Tutorial Tester", 0);
  assert.equal(save.tutorials?.version, 1);
  assert.deepEqual(save.tutorials?.completedIds, []);
  assert.deepEqual(save.tutorials?.dismissedIds, []);
  assert.equal(shouldShowTutorial(save, TUTORIAL_IDS.chapterOneGuided), true);
});

test("legacy completion flags retroactively suppress completed tutorials", () => {
  const base = createNewGameSave("Legacy Tutorial Tester", 0);
  const normalized = normalizeGameSave({
    ...base,
    tutorials: undefined,
    flags: {
      ...base.flags,
      chapterOneGuidedComplete: true,
      m62FirstBattleWon: true,
    },
  });

  assert.equal(isTutorialCompleted(normalized, TUTORIAL_IDS.chapterOneGuided), true);
  assert.equal(isTutorialCompleted(normalized, TUTORIAL_IDS.chapterOneFirstBattle), true);
  assert.equal(shouldShowTutorial(normalized, TUTORIAL_IDS.chapterOneGuided), false);
  assert.equal(shouldShowTutorial(normalized, TUTORIAL_IDS.chapterOneFirstBattle), false);
});

test("completed tutorials stay suppressed until an explicit replay begins", () => {
  const base = createNewGameSave("Replay Tester", 0);
  const completed = markTutorialCompleted(base, TUTORIAL_IDS.chapterOneFirstBattle);
  assert.equal(shouldShowTutorial(completed, TUTORIAL_IDS.chapterOneFirstBattle), false);

  const replay = beginTutorialReplay(completed, TUTORIAL_IDS.chapterOneFirstBattle);
  assert.equal(shouldShowTutorial(replay, TUTORIAL_IDS.chapterOneFirstBattle), true);

  const finishedReplay = markTutorialCompleted(replay, TUTORIAL_IDS.chapterOneFirstBattle);
  assert.equal(shouldShowTutorial(finishedReplay, TUTORIAL_IDS.chapterOneFirstBattle), false);
  assert.equal(finishedReplay.tutorials?.replayIds.includes(TUTORIAL_IDS.chapterOneFirstBattle), false);
});

test("dismissed tutorials remain suppressed across normalization", () => {
  const base = createNewGameSave("Dismiss Tester", 0);
  const dismissed = dismissTutorial(base, TUTORIAL_IDS.chapterOneGuided);
  const normalized = normalizeGameSave(dismissed);
  assert.equal(isTutorialDismissed(normalized, TUTORIAL_IDS.chapterOneGuided), true);
  assert.equal(shouldShowTutorial(normalized, TUTORIAL_IDS.chapterOneGuided), false);
});
