import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getVariantDefinition} from '@/data/creatures';
import {grantFarmResources,getFarmState,setAutomaticFood,setIngredientFeeding,reserveResource,planNightFeeding} from '@/data/farmResources';
import {getDailyFeedCost,processRanchJobsForNewDay} from '@/data/ranchJobsPredator';
import {getNightCareReview} from '@/data/nightCareReview';
import {getFoodBudget} from '@/data/economyBudget';
import {advanceRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {enterEveningReview} from '@/data/ranch-day/ranchDayState';

function fresh(){const s=createNewGameSave('Feeding Station',0);s.flags.ranchFeedStock=0;s.flags.ranchDamage=0;return s;}
function family(s:ReturnType<typeof fresh>,name:string){return s.creatures!.find(c=>getVariantDefinition(c.variantId).family===name)!;}
function needs(s:ReturnType<typeof fresh>){return s.creatures!.map(creature=>({creature,amount:getDailyFeedCost(creature)}));}

test('omnivores cannot consume a carnivore’s only food even when first in the roster',()=>{
 let s=fresh();const canine=family(s,'canine'),feline=family(s,'feline');
 s.creatures=[canine,feline];s=setIngredientFeeding(grantFarmResources(s,{meat:1,vegetables:1}),true).save;
 const original=structuredClone(s),plan=planNightFeeding(s,needs(s));
 assert.equal(plan.covered,2);assert.deepEqual(plan.meals.find(m=>m.creatureId===feline.creatureId)?.used,{meat:1});
 assert.deepEqual(plan.meals.find(m=>m.creatureId===canine.creatureId)?.used,{vegetables:1});assert.deepEqual(s,original);
});
test('diet ingredients precede universal supplies so a restricted creature is not needlessly hungry',()=>{
 let s=fresh();s.creatures=[family(s,'equine'),family(s,'feline')];
 s=setIngredientFeeding(grantFarmResources(s,{vegetables:2,rations:1}),true).save;
 const plan=planNightFeeding(s,needs(s));assert.equal(plan.covered,3);assert.ok(plan.meals.every(m=>m.required===m.covered));
 assert.deepEqual(plan.meals.find(m=>m.creatureId===s.creatures![1].creatureId)?.used,{rations:1});
});
test('food permissions and reserves protect stock; recipes and meals remain separate',()=>{
 let s=fresh();s.creatures=[family(s,'equine')];
 s=setIngredientFeeding(grantFarmResources(s,{vegetables:3,wheat:3,rations:4,stew:2}),true).save;
 s=reserveResource(s,'vegetables',2).save;s=setAutomaticFood(s,'wheat',false).save;
 s=setAutomaticFood(s,'rations',false).save;s.flags.ranchFeedStock=10;s=setAutomaticFood(s,'legacy_feed',false).save;
 const plan=planNightFeeding(s,needs(s));assert.equal(plan.covered,1);assert.equal(plan.legacyUsed,0);
 assert.equal(getFarmState(plan.save).stock.vegetables,2);assert.equal(getFarmState(plan.save).stock.wheat,3);
 assert.equal(getFarmState(plan.save).stock.rations,4);assert.equal(getFarmState(plan.save).stock.stew,2);assert.equal(plan.save.flags.ranchFeedStock,10);
 assert.equal(getFoodBudget(s,1).days[0].covered,plan.covered);assert.equal(getFoodBudget(s,1).topUpAllowed,false);
});
test('hunger penalties affect only the underfed creature and feeding commits exactly once',()=>{
 let s=fresh();const equine=family(s,'equine'),feline=family(s,'feline');
 s.creatures=[equine,feline].map(c=>({...c,energy:c.maxEnergy,affection:50,abilities:[]}));
 s=setIngredientFeeding(grantFarmResources(s,{vegetables:2}),true).save;
 const fed=processRanchJobsForNewDay(s).save;
 assert.equal(fed.flags.ranchCreaturesFedToday,1);assert.equal(fed.flags.ranchCreaturesEatingToday,2);
 assert.equal(fed.creatures![0].energy,equine.maxEnergy);assert.equal(fed.creatures![0].affection,50);
 assert.ok(fed.creatures![1].energy<feline.maxEnergy);assert.equal(fed.creatures![1].affection,47);
 assert.deepEqual(processRanchJobsForNewDay(fed).save,fed);
});
test('night projection matches persisted food allocations and recovery with exclusions',()=>{
 let s=fresh();s=setIngredientFeeding(grantFarmResources(s,{meat:1,vegetables:3,rations:1}),true).save;
 s=setAutomaticFood(s,'milk',false).save;s=reserveResource(s,'vegetables',1).save;
 const original=structuredClone(s),preview=getNightCareReview(s),actual=advanceRanchDay(enterEveningReview(s))!.save;
 assert.deepEqual(s,original);assert.equal(preview.covered,actual.flags.ranchFeedConsumedToday);
 assert.equal(preview.creaturesFed,actual.flags.ranchCreaturesFedToday);
 const meals=JSON.parse(String(actual.flags.ranchFeedingMealsToday));
 for(const row of preview.creatures){assert.deepEqual(row.meal,meals.find((m:{creatureId:string})=>m.creatureId===row.before.creatureId));assert.equal(row.after.energy,actual.creatures!.find(c=>c.creatureId===row.before.creatureId)!.energy);}
});
test('existing saves preserve their ration and Feed value without a migration write',()=>{
 const s=grantFarmResources(fresh(),{rations:100});s.flags.ranchFeedStock=7;
 const original=structuredClone(s);const plan=planNightFeeding(s,needs(s));
 assert.equal(plan.covered,needs(s).reduce((n,c)=>n+c.amount,0));assert.equal(plan.legacyUsed,0);
 assert.equal(plan.save.flags.ranchFeedStock,7);assert.deepEqual(s,original);
});
