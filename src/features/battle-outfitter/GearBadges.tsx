import {equipmentStats,type EquipmentStatsCopy} from '@/data/equipmentEnhancement';
import {getEquipmentRarity} from '@/data/equipmentRules';
import type { BattleOutfitterItem } from "@/data/battleOutfitter";
import s from "./GearBadges.module.css";
export function GearQualityBadge({item,copy}:{item:BattleOutfitterItem;copy?:EquipmentStatsCopy}) {
  if(!item.equipmentGrade)return null;
  const stats=copy?equipmentStats(item,copy):null,rarity=stats?.rarity??getEquipmentRarity(item),grade=stats?.powerGrade??item.equipmentGrade;
  return <small className={s.quality} data-grade={grade} data-rarity={rarity} aria-label={`${rarity} rarity, power grade ${grade}`}><b aria-hidden="true">{grade}</b>{rarity}</small>;
}
export function GearOwnershipBadge({status}:{status:"Equipped"|"Owned"|"Not Owned"}) {
  return <small className={s.ownership} data-status={status}><span aria-hidden="true">{status==="Equipped"?"✓":status==="Owned"?"◆":"○"}</span> {status}</small>;
}
