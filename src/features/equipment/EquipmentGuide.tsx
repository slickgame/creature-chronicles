"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {BreedingPreviewBook} from '@/features/breeding/BreedingPreviewBook';
import {equipmentStats,substatRollRange,type EquipmentStatsCopy} from '@/data/equipmentEnhancement';
import {EQUIPMENT_RARITIES,EQUIPMENT_STAT_POOLS,EQUIPMENT_SETS,startingSubstatCount} from '@/data/equipmentRules';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {EQUIPMENT_SLOT_LABELS,type BattleOutfitterItem} from '@/data/battleOutfitter';
export function EquipmentGuide({item,copy,onClose}:{item:BattleOutfitterItem;copy?:EquipmentStatsCopy;onClose:()=>void}){
 const stats=equipmentStats(item,copy),pool=EQUIPMENT_STAT_POOLS[item.equipmentSlot??'weapon'];
 const hp=substatRollRange(item,'maxHp',copy),speed=substatRollRange(item,'speed',copy),other=substatRollRange(item,'defense',copy);
 return <BreedingPreviewBook title="Equipment guide" marker="equipment-guide" art={item.iconPath} onClose={onClose} pages={[
 {key:'current',title:`${stats.rarity} · Power ${stats.powerGrade} · +${stats.level}`,content:<><p><EquipmentStatIcon name={stats.main.key}/>Main: {BATTLE_STAT_LABELS[stats.main.key]} +{stats.main.value}</p><div>{stats.substats.length?stats.substats.map(st=><p key={st.key}><EquipmentStatIcon name={st.key}/>{BATTLE_STAT_LABELS[st.key]} +{st.value}</p>):'No substats yet.'}</div><p>{stats.legacy?'Existing stats and earned rolls are preserved. Rarity reflects its starting substat count.':'New profile saved to this individual item.'}</p></>},
 {key:'description',title:item.name,content:<p>{item.description}</p>},
 {key:'rarity',title:'Rarity and power are separate',content:<><p>{EQUIPMENT_RARITIES.map(r=>`${r}: ${startingSubstatCount(r)}`).join(' · ')} starting substats.</p><p>Power Grade D–S controls main-stat strength, Gold cost and roll ranges. Upgrading changes neither rarity nor power grade. At most four substats.</p></>},
 {key:'main',title:`${EQUIPMENT_SLOT_LABELS[item.equipmentSlot??'weapon']} · Main-stat pool`,content:<><p>{pool.main.map(k=>BATTLE_STAT_LABELS[k]).join(' · ')}</p><p>New output follows this slot pool. The exact main stat and starting substats are shown before purchase or crafting. Owned legacy main stats remain intact.</p></>},
 {key:'sub',title:'Legal substat pool',content:<><p>{pool.sub.filter(k=>k!==stats.main.key).map(k=>BATTLE_STAT_LABELS[k]).join(' · ')}</p><p>No duplicate or main-stat substats. Existing out-of-pool legacy rolls remain, but future rolls follow the current pool.</p></>},
 {key:'roll',title:'Mystery milestone rolls',content:<><p>+3 · +6 · +9 · +12 · +15</p><p>HP +{hp[0]}–{hp[1]}; Speed +{speed[0]}–{speed[1]}; others +{other[0]}–{other[1]}. Each eligible stat and integer in its range has equal chance. Add a stat until four, then improve a legal existing stat.</p><p>Only successful confirmed upgrades roll. Previews never reveal or reroll results.</p></>},
 {key:'set',title:stats.setId?`${EQUIPMENT_SETS[stats.setId].name} set`:'No equipment set',content:<><p>{stats.setId?EQUIPMENT_SETS[stats.setId].description:'This item has no set bonus.'}</p><p>Only equipped items count. Repeated complete groups add their rates; all percentages use innate battle stats, rounded down once. Gear bonuses never compound the set.</p></>},
 {key:'passive',title:'Additional passive',content:<><p>{stats.passive??'No special passive effect. Random upgrades do not unlock one.'}</p><p>New battles use the current equipment and sets. Existing battles retain their starting snapshot.</p></>}
 ]}/>;
}
