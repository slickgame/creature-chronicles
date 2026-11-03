import {readFileSync,writeFileSync} from 'node:fs';
import {performBreedingAttempt} from '@/data/breeding';
import type {GameSave} from '@/types/save';
const base=JSON.parse(readFileSync('/tmp/inspect-dossier-fixture.json','utf8')) as GameSave;
for(const c of base.creatures){c.energy=c.maxEnergy=500;if(['Rook','Mira'].includes(c.nickname))c.xp=74;}
const realNow=Date.now;let level;
try{for(let k=0;k<500;k++){Date.now=()=>Date.UTC(2026,10,3,12)+k*1000;const r=performBreedingAttempt(structuredClone(base),'creature_starter_canine','creature_starter_feline');if(r&&r.attempt.progressionEvents.some(e=>e.levelUps>0)){level=r.save;break;}}}finally{Date.now=realNow;}
if(!level)throw Error('No engine level-up fixture');
const normal=JSON.parse(readFileSync('/tmp/ledger-review-fixture.json','utf8')) as GameSave;
const legacy=structuredClone(normal);legacy.breeding.attempts[0].progressionEvents=[];
const long=structuredClone(normal);const a=long.breeding.attempts[0];a.giverName='A remarkably lengthy parent name';a.receiverName='Another exceptionally long nickname';for(const e of a.progressionEvents)e.displayName=e.participantId===a.giverId?a.giverName:a.receiverName;
writeFileSync('/tmp/complete-record-fixtures.json',JSON.stringify({normal,level,legacy,long}));console.log('Detached level-up events',level.breeding.attempts[0].progressionEvents);
