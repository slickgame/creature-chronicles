import {createNewGameSave} from '@/lib/save/localSave';
import {workResourceSite,workerBlocker,craftResource,getFarmState,actSupplyOrder} from '@/data/farmResources';
import {buyMarketListing,getMarketListingPrice} from '@/data/market';
import {HABITAT_PURCHASES} from '@/data/ranchHabitats';
import {commissionBuilderProject} from '@/data/builderProjects';
import {performBreedingAttempt} from '@/data/breedingTutorial';
import {prepareChapterOneGuidedTutorialSave} from '@/data/chapterOneGuidedTutorialBattle';
import {useTutorialQuickhatchCatalyst as applyQuickhatchCatalyst} from '@/data/tutorialQuickhatch';
import {getFoodBudget} from '@/data/economyBudget';
import {projectRanchDay} from '@/data/ranch-day/ranchDayLifecycle';
import {enterEveningReview} from '@/data/ranch-day/ranchDayState';
import type {GameSave} from '@/types/save';
export type EquineRoute='solo'|'adoption-first'|'habitat-first';
/** Fixed timestamps seed actual new-game/stat/inheritance factories, without changing production code.
 * The synchronous scope restores Date.now before returning. No assumed income or repeated orders. */
export function simulateEquineFirstWeek(route:EquineRoute,seed=0,withoutGoalGold=false,habitatFamily:keyof typeof HABITAT_PURCHASES='lapine'){
 const clock=Date.now;Date.now=()=>1800000000000+seed*1000;
 try{
 let save=createNewGameSave('Equine audit',0);save.flags.m24IntroSeen=true;
 const startGold=save.currencies.gold,rows=[];const initialResidents=save.creatures!.length,initialFamilies=save.habitats!.map(h=>h.family);let adoptionFee=0,habitatFee=0,deliveryGold=0;const housing=HABITAT_PURCHASES[habitatFamily];let restForPairing=false;let adoptedDay:number|null=null,habitatDay:number|null=null,pairingDay:number|null=null,teamDay:number|null=null;
 const spend:(r:{ok:boolean;save:GameSave;message:string})=>void=r=>{if(!r.ok)throw Error(r.message);save=r.save;};
 for(let day=1;day<=7;day++){
  const beforeGold=save.currencies.gold,actions:string[]=[];
  if(route!=='solo'&&!adoptedDay&&day>=(route==='adoption-first'?1:2)&&(route!=='habitat-first'||habitatDay!==null)){
   const offer=save.market!.listings.find(l=>l.family==='equine'&&l.status==='available');
   if(offer&&save.currencies.gold>=getMarketListingPrice(save,offer)){adoptionFee=getMarketListingPrice(save,offer);spend(buyMarketListing(save,offer.listingId));adoptedDay=day;actions.push('Adopt equine');}
  }
  if(adoptedDay&&day>adoptedDay&&!pairingDay){
   const pair=save.creatures!.slice(0,2);const result=performBreedingAttempt(save,pair[0].creatureId,pair[1].creatureId);
   if(result){save=result.save;if(result.attempt.outcome==='pregnancy'){pairingDay=day;actions.push('Guided pairing');}}else{restForPairing=true;actions.push('Rest parents for guided pairing');}
  }
  save=prepareChapterOneGuidedTutorialSave(save);
  const egg=save.eggs?.find(e=>e.status!=='hatched');
  if(egg){const hatch=applyQuickhatchCatalyst(save,egg.eggId);if(hatch.ok){save=hatch.save;actions.push('Guided hatch');}}
  if(save.creatures!.length>=3&&teamDay===null)teamDay=day;
  // At most three instant work actions. Keep the first adoption day light for pairing Energy.
  const limit=restForPairing?0:adoptedDay===day?2:3;restForPairing=false;
  for(let action=0;action<limit;action++){
   const site=action===0?'wheat_field':action===1?'garden':'woodlot';
   // A habitat-first start gathers its building Wood before other work.
   const chosen=route==='habitat-first'&&day===1&&action===0?'woodlot':site;
   const worker=[...save.creatures!].sort((a,b)=>b.energy-a.energy).find(c=>!workerBlocker(save,c,chosen));
   if(!worker){actions.push(`Rest: no Energy for ${chosen}`);continue;}
   const r=workResourceSite(save,chosen,worker.creatureId);spend(r);actions.push(r.message);
  }
  if(route==='habitat-first'&&!habitatDay&&(getFarmState(save).stock.wood??0)>=housing.wood){const r=commissionBuilderProject(save,housing.projectId);if(r.ok){habitatFee=save.currencies.gold-r.save.currencies.gold;save=r.save;habitatDay=day;actions.push(`Commission ${habitatFamily} habitat`);}}
  // Cook only enough for tonight plus one night of buffer, protecting the existing stock path.
  for(let n=0;n<4&&getFoodBudget(save,2).shortage>0;n++){const r=craftResource(save,'rations',1);if(!r.ok)break;save=r.save;actions.push('Cook 4 rations');}
  const farm=getFarmState(save);
  if(day>=4&&farm.orders.timber!=='completed'&&(farm.stock.wood??0)>=8){if(!farm.orders.timber)spend(actSupplyOrder(save,'timber'));const goldBefore=save.currencies.gold;spend(actSupplyOrder(save,'timber'));deliveryGold+=save.currencies.gold-goldBefore;actions.push('One timber delivery');}
  const food=getFoodBudget(save,1),beforeNightGold=save.currencies.gold;const result=projectRanchDay(enterEveningReview(save));if(!result)throw Error('No day projection');save=result.save;if(withoutGoalGold)save={...save,currencies:{...save.currencies,gold:Math.min(save.currencies.gold,beforeNightGold)}};
  rows.push({day,gold:save.currencies.gold,goldChange:save.currencies.gold-beforeGold,residents:save.creatures!.length,foodRequired:food.nightlyNeed,foodShortage:food.shortage,wood:getFarmState(save).stock.wood??0,minEnergy:Math.min(...save.creatures!.map(c=>c.energy)),habitats:save.habitats!.filter(h=>h.unlocked).length,actions});
 }
 return {route,seed,withoutGoalGold,habitatFamily:route==='habitat-first'?habitatFamily:null,initialResidents,initialFamilies,startGold,adoptionFee,habitatFee,deliveryGold,rewardGold:save.currencies.gold-startGold+adoptionFee+habitatFee-deliveryGold,endGold:save.currencies.gold,adoptedDay,habitatCommissionDay:habitatDay,pairingDay,threeCreatureDay:teamDay,rows};
 }finally{Date.now=clock;}
}
if(process.argv[1]?.endsWith('equine-first-week.ts'))console.log(JSON.stringify((['solo','adoption-first','habitat-first'] as const).flatMap(r=>(r==='habitat-first'?['lapine','feline','canine','bovine'] as const:['lapine'] as const).flatMap(f=>[simulateEquineFirstWeek(r,0,false,f),simulateEquineFirstWeek(r,0,true,f)])),null,2));
