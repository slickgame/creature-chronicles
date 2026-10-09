import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from '../src/lib/save/localSave.ts';
import { getChapterOneIntroScene, getChapterOneStoryLog } from '../src/data/chapterOneStory.ts';
import { getChapterOneGuidedTutorialStep } from '../src/data/chapterOneGuidedTutorialBattle.ts';

test('opening reuses the generated starter without mutating game state', () => {
 const save = createNewGameSave('Opening', 0);
 save.flags.m24IntroSeen = false;
 const starter = save.creatures!.find(c => c.origin === 'starter')!;
 starter.nickname = 'Existing Starter';
 starter.profilePath = '/existing-starter.webp';
 const before = JSON.stringify(save);
 const scene = getChapterOneIntroScene(save)!;
 assert.equal(scene.pages.length, 6);
 assert.equal(scene.pages[4].imagePath, '/existing-starter.webp');
 assert.match(scene.pages[4].text, /Existing Starter/);
 assert.equal(JSON.stringify(save), before);
 assert.equal(getChapterOneStoryLog(save)[0].pages[4].imagePath, '/existing-starter.webp');
});

test('seen opening stays closed and first morning remains the first tutorial step', () => {
 const save = createNewGameSave('Opening', 0);
 save.flags.m24IntroSeen = true;
 save.flags.chapterOneGuidedSkipped = false;
 save.flags.chapterOneGuidedMorningOpened = false;
 assert.equal(getChapterOneIntroScene(save), null);
 assert.equal(getChapterOneGuidedTutorialStep(save)?.id, 'read-morning-brief');
});

test('empty roster opening does not invent a creature', () => {
 const save = createNewGameSave('Opening', 0);
 save.flags.m24IntroSeen = false;
 save.creatures = [];
 assert.match(getChapterOneIntroScene(save)!.pages[4].text, /check the roster/);
 assert.equal(save.creatures.length, 0);
});
