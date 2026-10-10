import test from "node:test";
import assert from "node:assert/strict";
import { getTitleScene } from "../src/data/titleScenes.ts";
import { createNewGameSave } from "../src/lib/save/localSave.ts";

test("title follows the active save and does not leak progress between slots", () => {
 const fresh = createNewGameSave("Fresh", 0);
 const welcome = { ...fresh, flags: { ...fresh.flags, m24IntroSeen: true } };
 const complete = { ...welcome, flags: { ...welcome.flags, chapterOneGuidedComplete: true } };
 const snapshot = JSON.stringify(complete);
 assert.equal(getTitleScene(null).id, "arrival");
 assert.equal(getTitleScene(fresh).id, "arrival");
 assert.equal(getTitleScene(welcome).id, "welcome");
 assert.equal(getTitleScene(complete).id, "established");
 assert.equal(getTitleScene(fresh).id, "arrival");
 assert.equal(JSON.stringify(complete), snapshot);
});

test("story completion survives tutorial replay and tutorial skip is not completion", () => {
 const s = createNewGameSave("Legacy", 0);
 assert.equal(getTitleScene({ ...s, flags: { ...s.flags, m24ChapterOneStoryComplete: true, chapterOneGuidedComplete: false } }).id, "established");
 assert.equal(getTitleScene({ ...s, flags: { ...s.flags, m24IntroSeen: true, chapterOneGuidedSkipped: true } }).id, "welcome");
});
