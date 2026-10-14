import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave,saveGameToSlot,loadSaveFromSlot} from '@/lib/save/localSave';
import {createNewGameSave as established} from './helpers/establishedSave.ts';
import {grantFarmResources,getFarmState,reserveResource} from '@/data/farmResources';
import {commissionBuilderProject,getBuilderWorkOrder,processBuilderConstruction,isBuilderProjectBuilt} from '@/data/builderProjects';
import {HABITAT_PURCHASES,isHabitatUnlocked,hasHousingForRequirement} from '@/data/ranchHabitats';
import {createDefaultGuildState,ensureCurrentGuildState,rerollGuildBoard,getGuildRerollQuote} from '@/data/guild';
import {buyMarketListing,createDefaultMarketState} from '@/data/market';
import {purchaseRanchUpgrade} from '@/data/ranchUpgrades';
import {getChapterOneGuidedTutorialStep} from '@/data/chapterOneGuidedTutorialBattle';
import {getVariantDefinition,getSpeciesDefinition} from '@/data/creatures';
import type {GameSave} from '@/types/save';
import type {CreatureFamily} from '@/types/creature';
class MemoryStorage {private values=new Map<string,string>();get length(){return this.values.size;}getItem(k:string){return this.values.get(k)??null;}setItem(k:string,v:string){this.values.set(k,String(v));}removeItem(k:string){this.values.delete(k);}clear(){this.values.clear();}key(n:number){return [...this.values.keys()][n]??null;}}
(globalThis as unknown as {window:{localStorage:MemoryStorage}}).window={localStorage:new MemoryStorage()};
const fresh=()=>createNewGameSave('Equine ranch',0);
const funded=()=>{const s=grantFarmResources(fresh(),{wood:100});return {...s,currencies:{...s.currencies,gold:5000}};};
function complete(s:GameSave){const order=getBuilderWorkOrder(s)!;return processBuilderConstruction({...s,dayState:{...s.dayState,dayNumber:order.readyDay}}).save;}
test('fresh save has exactly one equine resident and one owned habitat; reload never restores old starters',()=>{
 const s=fresh();assert.equal(s.creatures?.length,1);assert.equal(getVariantDefinition(s.creatures![0].variantId).family,'equine');assert.deepEqual(s.habitats?.map(h=>h.family),['equine']);assert.equal(s.flags.felineHabitatUnlocked,false);
 // Use the production serialization/migration path; in Node saveGameToSlot still normalizes records.
 const persisted=saveGameToSlot(s);assert.equal(persisted.creatures?.length,1);assert.equal(persisted.habitats?.length,1);
 assert.equal(loadSaveFromSlot(0)!.creatures?.length,1);assert.equal(loadSaveFromSlot(0)!.habitats?.length,1);
});
test('existing ranches retain all residents and owned family habitats without repurchasing them',()=>{
 const s=saveGameToSlot(established('Established',0));assert.equal(s.creatures?.length,5);assert.equal(s.habitats?.length,5);
 for(const p of Object.values(HABITAT_PURCHASES)){assert.equal(isBuilderProjectBuilt(s,p.projectId),true);const r=commissionBuilderProject(s,p.projectId);assert.equal(r.ok,false);assert.equal(r.save.currencies.gold,s.currencies.gold);}
});
test('each family unlock charges exact Gold and Wood once, respects reserves and grants housing only on completion',()=>{
 for(const [family,p] of Object.entries(HABITAT_PURCHASES)){
 const s=funded(),before=getFarmState(s);const blocked=reserveResource(s,'wood',before.stock.wood!).save;assert.equal(commissionBuilderProject(blocked,p.projectId).ok,false);
 const r=commissionBuilderProject(s,p.projectId);assert.equal(r.ok,true,r.message);assert.equal(r.save.currencies.gold,s.currencies.gold-p.gold);assert.equal(getFarmState(r.save).stock.wood,before.stock.wood!-p.wood);assert.equal(isHabitatUnlocked(r.save,family as CreatureFamily),false);
 assert.equal(commissionBuilderProject(r.save,p.projectId).ok,false);assert.equal(processBuilderConstruction(r.save).save.habitats?.length,1);
 const done=complete(r.save);assert.equal(isHabitatUnlocked(done,family as CreatureFamily),true);assert.equal(done.habitats?.find(h=>h.family===family)?.capacity,4);assert.equal(done.habitats?.find(h=>h.family===family)?.creatureIds.length,0);assert.deepEqual(processBuilderConstruction(done).save,done);assert.equal(commissionBuilderProject(done,p.projectId).ok,false);saveGameToSlot(done);const loaded=loadSaveFromSlot(0)!;assert.equal(loaded.habitats?.length,2);assert.equal(loaded.habitats?.find(h=>h.family===family)?.capacity,4);
 }
});
test('species and variant request eligibility follows owned habitats across new boards, refreshes and paid rerolls',()=>{
 for(let week=1;week<=20;week++){
 const s=funded();s.dayState.weekNumber=week;s.guild=createDefaultGuildState(s);
 for(const c of s.guild.contracts)assert.equal(hasHousingForRequirement(s,c.requirement),true,c.title);
 const rerolled=rerollGuildBoard(s,getGuildRerollQuote(s).count,week);assert.equal(rerolled.ok,true,rerolled.message);for(const c of rerolled.save.guild!.contracts)assert.equal(hasHousingForRequirement(s,c.requirement),true,c.title);
 }
 let s=funded();const v=getVariantDefinition('variant_base_feline' as never),species=getSpeciesDefinition(v.speciesId);
 assert.equal(hasHousingForRequirement(s,{kind:'species',speciesId:species.speciesId,label:'Cat'}),false);
 assert.equal(hasHousingForRequirement(s,{kind:'variant',variantId:v.variantId,label:'Cat'}),false);
 assert.equal(hasHousingForRequirement(s,{kind:'family',family:'feline',label:'Cat'}),false);
 const board=createDefaultGuildState(s),template=board.contracts[0];s={...s,guild:{...board,contracts:[...board.contracts,{...template,contractId:'locked-available' as never,requirement:{kind:'family',family:'feline',label:'Cat'}},{...template,contractId:'locked-accepted' as never,status:'accepted',requirement:{kind:'family',family:'feline',label:'Cat'}}]}};
 const synced=ensureCurrentGuildState(s);assert.equal(synced.guild!.contracts.some(c=>c.contractId==='locked-available'),false);assert.equal(synced.guild!.contracts.some(c=>c.contractId==='locked-accepted'),true);
 s=complete(commissionBuilderProject(s,'unlock_feline_habitat').save);assert.equal(hasHousingForRequirement(s,{kind:'family',family:'feline',label:'Cat'}),true);
});
test('new ranch market offers a horse; adoption and capacity upgrades cannot bypass locked housing',()=>{
 const s=funded();s.market=createDefaultMarketState(s);assert.equal(s.market.listings[0].family,'equine');const horse=buyMarketListing(s,s.market.listings[0].listingId);assert.equal(horse.ok,true,horse.message);assert.equal(horse.save.creatures!.length,2);
 const locked=s.market.listings.find(l=>l.family!=='equine');assert.ok(locked);const r=buyMarketListing(s,locked.listingId);assert.equal(r.ok,false);assert.equal(r.save.currencies.gold,s.currencies.gold);
 const upgrade=purchaseRanchUpgrade(s,'feline_habitat_capacity');assert.equal(upgrade.ok,false);assert.equal(upgrade.save.currencies.gold,s.currencies.gold);
});
test('one-creature tutorial directs the player to an equine partner rather than an impossible two-creature pairing',()=>{
 const s=fresh();Object.assign(s.flags,{m24IntroSeen:true,chapterOneGuidedVersion:1,chapterOneGuidedSkipped:false,chapterOneGuidedComplete:false,m15ChapterOneOnboardingComplete:false});
 // Tutorial progression uses the existing lesson flags; first-pairing branch is covered with the recorded prerequisites.
 Object.assign(s.flags,{chapterOneGuidedMorningOpened:true,chapterOneGuidedChoresAssigned:true,chapterOneGuidedSecondChoreAssigned:true,chapterOneGuidedFirstNightResolved:true,chapterOneGuidedDayTwoBriefOpened:true,chapterOneGuidedResourceSolved:true,m7GuildContractCompleted:true});
 s.dayState.dayNumber=2;
 const step=getChapterOneGuidedTutorialStep(s);assert.equal(step?.id,'first-pairing');assert.equal(step?.action,'market');assert.match(step!.body,/one equine/);
});
test('a ready egg cannot hatch into a locked family; Petra unlock enables one hatch and never duplicates it',async()=>{
 const {getBreedingParticipants}=await import('@/data/breeding');
 const {createPregnancyRecord,advanceNurseryDay,hatchEgg}=await import('@/data/nursery');
 const legacy=established('Egg parents',0),parents=getBreedingParticipants(legacy).filter(p=>p.kind==='creature'&&(p.sceneFamily==='feline'||p.sceneFamily==='canine'));
 const pregnancy=createPregnancyRecord(legacy,parents[0],parents[1],'housing-gate');
 const withEgg=advanceNurseryDay({...legacy,dayState:{...legacy.dayState,dayNumber:pregnancy.createdAtDayNumber+pregnancy.totalDays},pregnancies:[pregnancy]}).save;
 const egg={...withEgg.eggs![0],status:'ready' as const,daysRemaining:0};
 const family=getVariantDefinition(egg.variantId).family;assert.notEqual(family,'equine');
 let s={...funded(),eggs:[egg],eggIds:[egg.eggId]};const before=structuredClone(s);assert.equal(hatchEgg(s,egg.eggId),null);assert.deepEqual(s,before);
 s={...complete(commissionBuilderProject(s,HABITAT_PURCHASES[family as keyof typeof HABITAT_PURCHASES].projectId).save),eggs:[egg],eggIds:[egg.eggId]};
 const result=hatchEgg(s,egg.eggId);assert.ok(result);assert.equal(result.save.creatures!.length,2);assert.equal(hatchEgg(result.save,egg.eggId),null);
});
