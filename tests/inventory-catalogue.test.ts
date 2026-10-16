import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getInventoryCatalogue,getOwnedInventory,inventoryRecipientBlocker} from '@/data/inventoryCatalogue';
import {BREEDING_SUPPORT_ITEMS,useBreedingSupportItem as applySupportItem} from '@/data/breedingItems';
import {RESOURCE_IDS} from '@/data/farmResources';
import {BATTLE_OUTFITTER_ITEMS,purchaseBattleOutfitterItem,assignBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentCopies} from '@/data/equipmentInstances';
test('inventory catalogue keeps named stock, upgraded instances and source save intact',()=>{
 let save=createNewGameSave('Inventory test',0);save={...save,currencies:{...save.currencies,gold:10000}};
 const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.category==='Equipment'&&!i.coliseumExclusive)!;
 const bought=purchaseBattleOutfitterItem(save,gear.itemId);assert.equal(bought.ok,true);save=bought.save;
 const before=structuredClone(save),rows=getInventoryCatalogue(save),copies=getEquipmentCopies(save);
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const item of BREEDING_SUPPORT_ITEMS)assert.ok(rows.some(r=>r.support?.itemId===item.itemId));
 for(const id of RESOURCE_IDS)assert.ok(rows.some(r=>r.resource===id));
 for(const copy of copies)assert.ok(rows.some(r=>r.copy?.id===copy.id&&r.copy.level===copy.level));
 assert.ok(rows.some(r=>r.category==='Key items'));assert.deepEqual(save,before);
});
test('recipient eligibility preserves creature-only restrictions and exact capped effects',()=>{
 const save=createNewGameSave('Recipient test',0);save.flags.energySnackStock=3;save.flags.affectionTreatStock=2;
 const c=save.creatures![0];c.energy=c.maxEnergy-4;c.affection=90;
 const rows=getInventoryCatalogue(save),snack=rows.find(r=>r.id==='energy_snack')!,treat=rows.find(r=>r.id==='affection_treat')!,before=structuredClone(save);
 assert.equal(inventoryRecipientBlocker(save,snack,c.creatureId),null);const capped=applySupportItem(save,'energy_snack',{source:'inventory',targetId:c.creatureId});assert.equal(capped.ok,true);assert.equal(capped.save.creatures![0].energy,c.maxEnergy);assert.equal(capped.save.flags.energySnackStock,2);
 assert.match(inventoryRecipientBlocker(save,treat,'player')!,/only.*creature/i);
 assert.equal(inventoryRecipientBlocker(save,treat,c.creatureId),null);
 assert.match(inventoryRecipientBlocker(save,snack,'missing')!,/no longer/);
 assert.deepEqual(save,before);
});
test('unowned equipment and named reserves cannot become phantom equipment or direct item use',()=>{
 const save=createNewGameSave('Empty stock',0),rows=getInventoryCatalogue(save),unowned=rows.find(r=>r.gear&&!r.copy)!;
 assert.equal(unowned.count,0);assert.match(inventoryRecipientBlocker(save,unowned,save.creatures![0].creatureId)!,/No owned/);
 const iron=rows.find(r=>r.resource==='iron')!,ore=rows.find(r=>r.resource==='iron_ore')!;
 assert.equal(iron.name,'Iron ingots');assert.equal(ore.name,'Iron ore');assert.match(inventoryRecipientBlocker(save,iron,'player')!,/Storage/);
});
test('pregnancy recipient selection maps exact participant IDs, rejects due timers and remains read-only',()=>{
 const save=createNewGameSave('Pregnancy targets',0);save.flags.gestationTonicStock=2;
 const [a,b]=save.creatures!;
 const snapshot=(c:typeof a)=>({participantId:c.creatureId,creatureId:c.creatureId,displayName:c.nickname,familyLabel:'Recorded creature',kind:'creature' as const,speciesId:c.speciesId,variantId:c.variantId,portraitPath:''});
 const pregnancy=(c:typeof a,id:string,days:number)=>({pregnancyId:id as never,createdAtDayNumber:0,createdAt:'test',daysRemaining:days,totalDays:3,status:'pregnant' as const,giver:snapshot(a),receiver:snapshot(c),inheritance:{projectedSpeciesId:c.speciesId,projectedVariantId:c.variantId,projectedStats:c.stats,projectedStatGrades:c.statGrades,projectedAbilities:c.abilities,statRollNotes:[],abilityRollNotes:[],lineageRisk:'none' as const,lineageRiskLabel:'No Risk',lineageNotes:[],lineageTraits:[],suggestedName:c.nickname}});
 save.pregnancies=[pregnancy(a,'exact-a',3),pregnancy(b,'exact-b',1)];
 const item=getInventoryCatalogue(save).find(r=>r.id==='gestation_tonic')!,before=structuredClone(save);
 assert.equal(inventoryRecipientBlocker(save,item,a.creatureId),null);
 assert.match(inventoryRecipientBlocker(save,item,b.creatureId)!,/already due/);
 assert.match(inventoryRecipientBlocker(save,item,'player')!,/No active pregnancy/);
 assert.deepEqual(save,before);
});

test('owned inventory omits zero stock and shop previews, retaining equipped instances and removing depleted supplies',()=>{
 let save=createNewGameSave('Owned stock',0);
 save={...save,currencies:{...save.currencies,gold:10000}};
 save.flags.energySnackStock=1;save.flags.affectionTreatStock=0;
 const gear=BATTLE_OUTFITTER_ITEMS.find(i=>i.category==='Equipment'&&!i.coliseumExclusive)!;
 const purchase=purchaseBattleOutfitterItem(save,gear.itemId);assert.equal(purchase.ok,true);save=purchase.save;
 const instance=getEquipmentCopies(save).find(i=>i.itemId===gear.itemId)!;
 const equipped=assignBattleOutfitterEquipment(save,save.creatures![0].creatureId,gear.itemId,instance.id);assert.equal(equipped.ok,true);save=equipped.save;
 const before=structuredClone(save),owned=getOwnedInventory(save);
 assert.ok(owned.every(i=>i.count>0));assert.ok(owned.every(i=>!i.gear||!!i.copy));
 assert.ok(!owned.some(i=>i.id==='affection_treat'));assert.ok(owned.some(i=>i.id==='energy_snack'));
 assert.equal(owned.filter(i=>i.gear).length,getEquipmentCopies(save).length);
 assert.equal(owned.find(i=>i.id===instance.id)?.copy?.owner,save.creatures![0].creatureId);
 assert.deepEqual(save,before);
 save.creatures![0].energy=save.creatures![0].maxEnergy-12;
 const used=applySupportItem(save,'energy_snack',{source:'inventory',targetId:save.creatures![0].creatureId});assert.equal(used.ok,true);
 assert.ok(!getOwnedInventory(used.save).some(i=>i.id==='energy_snack'));
 const reloaded=JSON.parse(JSON.stringify(used.save));assert.deepEqual(getOwnedInventory(reloaded),getOwnedInventory(used.save));
});
