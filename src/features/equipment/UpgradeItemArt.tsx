import type {EquipmentSlot} from '@/data/battleOutfitter';
import type {equipmentStats} from '@/data/equipmentEnhancement';
import {EQUIPMENT_SETS} from '@/data/equipmentRules';
import s from './UpgradeLedger.module.css';
export function UpgradeItemArt({art,stats,slot,celebrate=false}:{art?:string;stats:ReturnType<typeof equipmentStats>;slot?:EquipmentSlot;celebrate?:boolean}){
 return <div className={`${s.itemArt} ${celebrate?s.celebrate:''}`} data-rarity={stats.rarity}>
 <img className={s.gearArt} src={art??'/images/ui/equipment-windows-v1/forge-anvil.webp'} alt=""/>
 <img className={s.itemFrame} src={`/images/ui/forge-slate-v2/frames/item-${stats.rarity.toLowerCase()}.svg`} alt=""/>
 <span className={s.grade}>{stats.powerGrade}</span><span className={s.level}>+{stats.level}</span>
 {stats.setId&&<span className={s.setBadge}><img src={`/images/ui/forge-slate-v2/sets/sculpted/${stats.setId}.webp`} alt={`${EQUIPMENT_SETS[stats.setId].name} set`}/></span>}
 {slot&&<span className={s.category}><img src={`/images/ui/forge-slate-v2/categories/${slot}.webp`} alt=""/></span>}
 </div>;
}
