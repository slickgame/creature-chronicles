import type { BattleOutfitterItem } from "@/data/battleOutfitter";
import s from "./GearBadges.module.css";
export function GearQualityBadge({item}:{item:BattleOutfitterItem}) {
  if(!item.equipmentGrade)return null;
  return <small className={s.quality} data-grade={item.equipmentGrade} aria-label={`${item.quality}, gear grade ${item.equipmentGrade}`}><b aria-hidden="true">{item.equipmentGrade}</b>{item.quality}</small>;
}
export function GearOwnershipBadge({status}:{status:"Equipped"|"Owned"|"Not Owned"}) {
  return <small className={s.ownership} data-status={status}><span aria-hidden="true">{status==="Equipped"?"✓":status==="Owned"?"◆":"○"}</span> {status}</small>;
}
