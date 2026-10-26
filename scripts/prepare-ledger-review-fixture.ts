import {readFileSync,writeFileSync} from 'node:fs';
import {performBreedingAttempt} from '@/data/breeding';
import type {GameSave} from '@/types/save';
const base=JSON.parse(readFileSync('/tmp/inspect-dossier-fixture.json','utf8')) as GameSave;
const plan=[['creature_starter_canine','creature_starter_feline','pregnancy'],['creature_starter_equine','creature_starter_bovine','failed'],['creature_starter_canine','player','blocked'],['creature_starter_lapine','creature_starter_equine','pregnancy'],['creature_starter_canine','creature_starter_feline','failed'],['player','creature_starter_equine','failed']] as const;
const attempts=[];const pregnancies=[];const realNow=Date.now;
try{for(let i=0;i<plan.length;i++){const[a,b,wanted]=plan[i];let found=false;for(let k=0;k<1000;k++){const clone=structuredClone(base);clone.dayState.dayNumber=12-i;const time=Date.UTC(2026,9,25-i,12)+k*1000;Date.now=()=>time;const r=performBreedingAttempt(clone,a,b);if(!r)continue;const outcome=r.attempt.pregnancyBlockedReason?'blocked':r.attempt.outcome;if(outcome!==wanted)continue;r.attempt.createdAt=new Date(time).toISOString();attempts.push(r.attempt);pregnancies.push(...(r.save.pregnancies??[]));found=true;break;}if(!found)throw Error('No fixture outcome '+wanted);}}finally{Date.now=realNow;}
base.breeding.attempts=attempts;base.pregnancies=pregnancies;base.dayState.dayNumber=12;
writeFileSync('/tmp/ledger-review-fixture.json',JSON.stringify(base));console.log('Prepared isolated engine-generated history',attempts.map(a=>({day:a.dayNumber,pair:a.giverName+' / '+a.receiverName,outcome:a.pregnancyBlockedReason?'blocked':a.outcome,chance:a.pregnancyChance})));
