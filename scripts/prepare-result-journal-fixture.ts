import {readFileSync,writeFileSync} from 'node:fs';
import {performBreedingAttempt} from '@/data/breeding';
import type {GameSave} from '@/types/save';
const base=JSON.parse(readFileSync('/tmp/inspect-dossier-fixture.json','utf8')) as GameSave;
const plans=[['success','creature_starter_canine','creature_starter_feline','pregnancy'],['failed','creature_starter_canine','creature_starter_feline','failed'],['blocked','creature_starter_canine','player','blocked']] as const;
const cases=[];const original=Date.now;
try{for(const[name,giverId,receiverId,wanted]of plans){let found=false;for(let k=0;k<1000;k++){const time=Date.UTC(2026,10,2,12)+k*1000;Date.now=()=>time;const result=performBreedingAttempt(structuredClone(base),giverId,receiverId);if(!result)continue;const kind=result.attempt.pregnancyBlockedReason?'blocked':result.attempt.outcome;if(kind!==wanted)continue;cases.push({name,giverId,receiverId,time,expected:result.attempt});found=true;break;}if(!found)throw Error('No isolated case '+name);}}finally{Date.now=original;}
writeFileSync('/tmp/result-journal-cases.json',JSON.stringify({save:base,cases}));console.log('Prepared deterministic engine cases',cases.map(c=>({name:c.name,time:c.time,chance:c.expected.pregnancyChance})));
