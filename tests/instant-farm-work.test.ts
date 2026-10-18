import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave, saveGameToSlot } from "./helpers/establishedSave.ts";
import { workResourceSite, workPreview, getFarmState, processResourceDay, reserveResource, craftResource, commissionFacility, grantFarmResources, getProductionGuide, claimProductionGuide } from '@/data/farmResources';
import { processRanchJobsForNewDay } from '@/data/ranchJobs';
import { getFarmSecurity } from '@/data/farmSecurity';
import { getPredatorThreatAssessment } from '@/data/predatorThreat';
import { createGuardDog } from '@/data/talents/guardDog';
import { createGeneralTalent } from '@/data/talents/generalTalents';
import { repairRanchDamage } from '@/data/ranchUpgrades';
import { getChapterOneTutorialProgress } from '@/data/chapterOneGuidedTutorial';
import { acceptGuildContract } from '@/data/guild';
import { getGuildCommissionProgress, completeGuildCommission } from '@/data/guildCommissions';
import { createStrategicInheritancePreview } from '@/data/genetics';
import { getBreedingParticipants } from '@/data/breedingTutorial';
const fresh=()=>createNewGameSave('Instant farm',0);
const next=(s:ReturnType<typeof fresh>)=>({...s,dayState:{...s.dayState,dayNumber:s.dayState.dayNumber+1}});
test('work gives exact preview output immediately, spends only energy, persists and never repeats overnight',()=>{
 let s=fresh();const c=s.creatures![0], preview=workPreview(s,'woodlot',c),gold=s.currencies.gold,energy=c.energy,before=getFarmState(s).stock.wood??0;
 const r=workResourceSite(s,'woodlot',c.creatureId);assert.equal(r.ok,true,r.message);s=r.save;
 assert.equal(getFarmState(s).stock.wood,before+preview.amount);assert.equal(s.currencies.gold,gold);assert.equal(s.creatures![0].energy,energy-preview.energy);
 s=saveGameToSlot(s);const wood=getFarmState(s).stock.wood;s=processRanchJobsForNewDay(next(s)).save;
 assert.equal(getFarmState(s).stock.wood,wood);assert.deepEqual(processRanchJobsForNewDay(s).save,s);
 assert.equal(getGuildCommissionProgress(s,{objective:{kind:'chore',jobId:'field_hauling',amount:2},status:'accepted',objectiveBaseline:0,expiresAtWeekNumber:99} as never)?.current,1);
});
test('work validates locked sites, injury, energy, dairy and ignores retired assignments',()=>{
 let s=fresh();const c=s.creatures![0];assert.equal(workResourceSite(s,'quarry',c.creatureId).ok,false);assert.equal(workResourceSite(s,'dairy',c.creatureId).ok,false);
 c.energy=0;const before=JSON.stringify(s);assert.equal(workResourceSite(s,'woodlot',c.creatureId).ok,false);assert.equal(JSON.stringify(s),before);
 c.energy=c.maxEnergy;c.injuredUntilDayNumber=s.dayState.dayNumber;assert.equal(workResourceSite(s,'woodlot',c.creatureId).ok,false);delete c.injuredUntilDayNumber;
 s.ranchJobs!.assignments.security_patrol=[c.creatureId];assert.equal(workResourceSite(s,'woodlot',c.creatureId).ok,true);
 s=processRanchJobsForNewDay(next(s)).save;assert.equal(getFarmState(s).stock.wood??0,0);assert.equal(Object.values(s.ranchJobs!.assignments).flat().length,0);
});
test('Diligent, Efficient Worker and tools affect the displayed and charged work values',()=>{
 const s=fresh(),c=s.creatures![0];c.abilities=[];const plain=workPreview(s,'woodlot',c);
 c.abilities=[createGeneralTalent('diligent','C'),createGeneralTalent('efficient_worker','S')];s.ranchUpgrades!.ranch_chores_board=4;
 const boosted=workPreview(s,'woodlot',c);assert.equal(boosted.amount,plain.amount+3+4);assert.equal(boosted.energy,8);
 const r=workResourceSite(s,'woodlot',c.creatureId);assert.equal(r.save.creatures![0].energy,c.energy-8);assert.equal(getFarmState(r.save).stock.wood,boosted.amount);
});
test('Guard Dog is resident canine only, strongest wins and working or resting does not disable it',()=>{
 const s=fresh(),dog=s.creatures![1];dog.abilities=[createGuardDog('C')];const dog2={...dog,creatureId:'guard_two',nickname:'Second',abilities:[createGuardDog('S')],energy:0} as typeof dog;
 s.creatures!.push(dog2);s.habitats!.find(h=>h.family==='canine')!.creatureIds.push(dog2.creatureId);
 s.creatures![0].abilities=[createGuardDog('S')];assert.equal(getFarmSecurity(s).guard?.name,'Second');assert.equal(getFarmSecurity(s).total,14);
 const worked=workResourceSite(s,'garden',dog.creatureId).save;assert.equal(getFarmSecurity(worked).total,14);
 s.habitats!.find(h=>h.family==='canine')!.creatureIds.pop();assert.equal(getFarmSecurity(s).total,9);
 dog.abilities=[];assert.equal(getFarmSecurity(s).total,6);
});
test('fortification condition reduces protection, named repairs restore it, patrol flags cannot stack',()=>{
 let s=fresh();s.flags.ranchDamage=50;s.flags.ranchSecurityScoreToday=999;const before=getFarmSecurity(s);assert.equal(before.fortifications,3);assert.equal(getPredatorThreatAssessment(s).security,before.total);
 s=grantFarmResources(s,{wood:2,stone:1});const r=repairRanchDamage(s);assert.equal(r.ok,true);assert.equal(getFarmSecurity(r.save).condition,70);assert.equal(getFarmState(r.save).stock.wood,0);assert.equal(getFarmState(r.save).stock.stone,0);
});
test('tutorial and foundation guide advance through instant work and completed construction',()=>{
 let s=fresh();s.currencies.gold=5000;const id=s.creatures![0].creatureId;assert.equal(getChapterOneTutorialProgress(s).choresAssigned,false);
 for(let i=0;i<3;i++)s=workResourceSite(s,'woodlot',id).save;
 assert.equal(getChapterOneTutorialProgress(s).secondChoreAssigned,true);assert.equal(getChapterOneTutorialProgress(s).firstNightResolved,false);
 s=reserveResource(s,'wood',2).save;s=craftResource(s,'planks',1,s.creatures![0].creatureId).save;s=commissionFacility(s,'quarry').save;
 assert.equal(claimProductionGuide(s).ok,false);s=processResourceDay(next(s));assert.equal(getProductionGuide(s).every(x=>x.done),true);
 const gold=s.currencies.gold,gp=s.currencies.guildPoints;const r=claimProductionGuide(s);assert.equal(r.ok,true);assert.equal(r.save.currencies.gold,gold+75);assert.equal(r.save.currencies.guildPoints,gp+5);assert.equal(claimProductionGuide(r.save).ok,false);
});
test('work commissions count only matching actions after acceptance and reward once',()=>{
 let s=fresh();const c=s.guild!.contracts.find(c=>c.type==='chore_commission')!;assert.ok(c);if(c.objective?.kind!=='chore')throw Error('work objective missing');
 const site=c.objective.jobId==='field_hauling'?'woodlot':c.objective.jobId==='garden_tending'?'garden':'hunting';const id=s.creatures![0].creatureId;
 s=workResourceSite(s,site,id).save;s=acceptGuildContract(s,c.contractId).save;assert.equal(getGuildCommissionProgress(s,c)?.current,0);
 for(let i=0;i<c.objective.amount;i++)s=workResourceSite(s,site,id).save;
 const live=s.guild!.contracts.find(x=>x.contractId===c.contractId)!;assert.equal(getGuildCommissionProgress(s,live)?.ready,true);const result=completeGuildCommission(s,c.contractId);assert.equal(result.ok,true);assert.equal(completeGuildCommission(result.save,c.contractId).ok,false);
});
test('Guard Dog cannot be inherited by non-canine offspring',()=>{
 const s=fresh();s.flags.chapterOneGuidedSkipped=true;const participants=getBreedingParticipants(s).filter(c=>c.kind==='creature');
 for(const p of participants)p.abilities=[createGuardDog('S')];
 for(let n=0;n<40;n++){
  const result=createStrategicInheritancePreview(s,participants[0],participants[1],`guard-${n}`);
  if(result && result.projectedSpeciesId!=='species_canine') assert.equal(result.projectedAbilities.some(a=>a.id==='guard_dog'),false);
 }
});

test('work proficiency increases output at levels 6, 11 and 16',()=>{
 const s=fresh(),c=s.creatures![0];c.abilities=[];const baseline=workPreview(s,'woodlot',c).amount;
 for(const [level,bonus] of [[6,1],[11,2],[16,3]]) { c.choreSkills!.hauling.level=level; assert.equal(workPreview(s,'woodlot',c).amount,baseline+bonus); }
});
