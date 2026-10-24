import {writeFileSync} from 'node:fs';
import {getChapterOneStoryLog} from '@/data/chapterOneStory';
import {createNewGameSave} from '../tests/helpers/establishedSave';
const save=createNewGameSave('Inspect A QA',0);
for(const scene of getChapterOneStoryLog(save))save.flags[scene.flag]=true;
for(const c of save.creatures??[])c.energy=c.maxEnergy;
writeFileSync(process.argv[2]??'/tmp/inspect-dossier-fixture.json',JSON.stringify(save));
console.log('Prepared isolated established-ranch fixture; no user save modified.');
