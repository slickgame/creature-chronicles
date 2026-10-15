import assert from 'node:assert/strict';
import test from 'node:test';
import {createNewGameSave} from '@/lib/save/localSave';
import {getRanchGrowthPlan} from '@/data/ranchGrowthPlan';
import {buyMarketListing,ensureCurrentMarketState} from '@/data/market';
import {commissionBuilderProject,processBuilderConstruction} from '@/data/builderProjects';
import {grantFarmResources,reserveResource} from '@/data/farmResources';

test('planner is read-only and adoption fee matches purchase; sold and full listings remain honest',()=>{
 const save=ensureCurrentMarketState(createNewGameSave('Plan',0));const before=structuredClone(save);
 const plan=getRanchGrowthPlan(save);assert.deepEqual(save,before);
 const offer=plan.adoptions.find(a=>a.listing.family==='equine')!;assert.equal(offer.blocker,null);assert.equal(offer.nightlyFood,2);
 const result=buyMarketListing(save,offer.listing.listingId);assert.equal(result.ok,true);assert.equal(save.currencies.gold-result.save.currencies.gold,offer.fee);
 assert.equal(getRanchGrowthPlan(result.save).adoptions.find(a=>a.listing.listingId===offer.listing.listingId)?.blocker,'Already adopted');
 const full={...save,habitats:save.habitats!.map(h=>({...h,capacity:h.creatureIds.length}))};
 assert.equal(getRanchGrowthPlan(full).adoptions.find(a=>a.listing.family==='equine')?.blocker,'Habitat full');
 assert.ok(plan.adoptions.filter(a=>a.listing.family!=='equine').every(a=>a.blocker==='Habitat needed'));
});
test('housing comparison respects reserves, shared crew and paid completion without charging twice',()=>{
 let save=grantFarmResources(createNewGameSave('Housing',0),{wood:20});
 save=reserveResource(save,'wood',19).save;
 let row=getRanchGrowthPlan(save).habitats.find(h=>h.family==='feline')!;
 assert.equal(row.missingWood,5);assert.equal(row.canCommission,false);
 save=reserveResource(save,'wood',0).save;row=getRanchGrowthPlan(save).habitats.find(h=>h.family==='feline')!;assert.equal(row.canCommission,true);
 const paid=commissionBuilderProject(save,'unlock_feline_habitat');assert.equal(paid.ok,true);assert.equal(save.currencies.gold-paid.save.currencies.gold,row.fee);
 row=getRanchGrowthPlan(paid.save).habitats.find(h=>h.family==='feline')!;assert.equal(row.state,'building');assert.equal(row.fee,0);assert.equal(row.afterFood,paid.save.currencies.gold-getRanchGrowthPlan(paid.save).food.topUpGold);
 assert.equal(getRanchGrowthPlan(paid.save).habitats.find(h=>h.family==='canine')?.canCommission,false);
 const complete=processBuilderConstruction({...paid.save,dayState:{...paid.save.dayState,dayNumber:row.readyDay!}}).save;
 assert.equal(getRanchGrowthPlan(complete).habitats.find(h=>h.family==='feline')?.state,'owned');
});
