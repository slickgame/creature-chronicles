"use client";
import {EQUIPMENT_SETS} from '@/data/equipmentRules';
import {useState} from 'react';
import {EquipmentGuide} from './EquipmentGuide';
import { equipmentStats, type EquipmentStatsCopy } from '@/data/equipmentEnhancement';
import { BATTLE_STAT_LABELS } from '@/data/equipmentComparison';
import type { BattleOutfitterItem } from '@/data/battleOutfitter';
export function EquipmentStats({item,copy}:{item:BattleOutfitterItem;copy?:EquipmentStatsCopy}){
 const [guide,setGuide]=useState(false);
 const stats=equipmentStats(item,copy);
 return <section aria-label="Equipment stats"><p><strong>Enhancement +{stats.level} / 15</strong> · {stats.rarity} rarity / Power Grade {stats.powerGrade} · {stats.setId?`${EQUIPMENT_SETS[stats.setId].name} (${EQUIPMENT_SETS[stats.setId].pieces}-piece)`:'No set'}</p><p><strong>Main stat:</strong> {BATTLE_STAT_LABELS[stats.main.key]} +{stats.main.value}</p><p><strong>Substats ({stats.substats.length}/4)</strong></p><ul>{stats.substats.map(s=><li key={s.key}>{BATTLE_STAT_LABELS[s.key]} +{s.value}</li>)}{stats.substats.length<4&&<li>{4-stats.substats.length} open slot(s) · Gains at +3 / +6 / +9 / +12 / +15</li>}</ul>{stats.passive&&<p><strong>Relic passive</strong><br/>{stats.passive}</p>}<button type="button" onClick={()=>setGuide(true)}>Slot rules &amp; roll ranges</button>{guide&&<EquipmentGuide item={item} copy={copy} onClose={()=>setGuide(false)}/>}</section>;
}
