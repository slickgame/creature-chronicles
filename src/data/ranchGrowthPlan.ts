import {getFoodBudget} from './economyBudget';
import {getFarmState} from './farmResources';
import {ensureCurrentMarketState,getMarketListingPrice} from './market';
import {getHabitatSite} from './ranchHabitatSites';
import {HABITAT_PURCHASES} from './ranchHabitats';
import {getBuilderWorkOrder} from './builderProjects';
import type {GameSave} from '@/types/save';

/** Read-only comparison; no prospective rewards, purchases or residents are applied. */
export function getRanchGrowthPlan(save:GameSave){
 const food=getFoodBudget(save,3),farm=getFarmState(save);
 const availableWood=Math.max(0,(farm.stock.wood??0)-(farm.reserves.wood??0));
 const crewBusy=!!getBuilderWorkOrder(save)||!!farm.project;
 const habitats=(Object.keys(HABITAT_PURCHASES) as (keyof typeof HABITAT_PURCHASES)[]).map(family=>{
  const cost=HABITAT_PURCHASES[family],site=getHabitatSite(save,family);
  const fee=site.state==='planned'?cost.gold:0;
  const missingWood=site.state==='planned'?Math.max(0,cost.wood-availableWood):0;
  const afterFood=save.currencies.gold-fee-food.topUpGold;
  return {family,...site,...cost,fee,missingWood,afterFood,crewBusy,
   canCommission:site.state==='planned'&&!crewBusy&&!missingWood&&save.currencies.gold>=fee};
 });
 const market=ensureCurrentMarketState(save);
 const adoptions=(market.market?.listings??[]).map(listing=>{
  const habitat=save.habitats?.find(h=>h.family===listing.family&&h.unlocked);
  const fee=getMarketListingPrice(market,listing);
  const blocker=listing.status==='sold'?'Already adopted':!habitat?'Habitat needed':habitat.creatureIds.length>=habitat.capacity?'Habitat full':save.currencies.gold<fee?'More Gold needed':null;
  const nightlyFood=(listing.family==='equine'||listing.family==='bovine'?2:1)+(listing.rarity==='Rare'||listing.rarity==='Epic'?1:0);
  return {listing,fee,blocker,nightlyFood,afterFood:save.currencies.gold-fee-food.topUpGold};
 });
 return {food,availableWood,reservedWood:farm.reserves.wood??0,gold:save.currencies.gold,habitats,adoptions};
}
