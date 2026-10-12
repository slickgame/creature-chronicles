import { equipmentStats, type EquipmentCopy } from '@/data/equipmentEnhancement';
import { BATTLE_STAT_LABELS } from '@/data/equipmentComparison';
import type { BattleOutfitterItem } from '@/data/battleOutfitter';
export function EquipmentStats({item,copy}:{item:BattleOutfitterItem;copy?:Pick<EquipmentCopy,'id'|'level'>}){
 const stats=equipmentStats(item,copy);
 return <section aria-label="Equipment stats"><p><strong>Enhancement +{stats.level} / 15</strong> · {item.quality} / Grade {item.equipmentGrade}</p><p><strong>Main stat:</strong> {BATTLE_STAT_LABELS[stats.main.key]} +{stats.main.value}</p><p><strong>Substats ({stats.substats.length}/4)</strong></p><ul>{stats.substats.map(s=><li key={s.key}>{BATTLE_STAT_LABELS[s.key]} +{s.value}</li>)}{stats.substats.length<4&&<li>{4-stats.substats.length} open slot(s) · Gains at +3 / +6 / +9 / +12 / +15</li>}</ul>{stats.passive&&<p><strong>Relic passive</strong><br/>{stats.passive}</p>}</section>;
}
