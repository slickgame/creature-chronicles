"use client";
import {useState} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import {equipmentStats,substatRollRange,type EquipmentCopy} from '@/data/equipmentEnhancement';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {EQUIPMENT_SLOT_LABELS,type BattleOutfitterItem} from '@/data/battleOutfitter';
import s from './EquipmentGuide.module.css';
type StatCopy=Pick<EquipmentCopy,'id'|'level'|'enhancementVersion'|'legacyThrough'|'rolls'>;
const PAGES=['Current stats','Slot rules','Roll ranges','Passives'];
export function EquipmentGuide({item,copy,onClose}:{item:BattleOutfitterItem;copy?:StatCopy;onClose:()=>void}){
 const [page,setPage]=useState(0),stats=equipmentStats(item,copy);
 const hp=substatRollRange(item,'maxHp'),speed=substatRollRange(item,'speed'),other=substatRollRange(item,'defense');
 const legacy=copy&&copy.enhancementVersion!==2;
 return <GameDialog fullScreen title="Equipment guide" onClose={onClose}><section className={s.guide} data-equipment-guide>
 <header><img src={item.iconPath} alt=""/><div><small>{item.equipmentSlot?EQUIPMENT_SLOT_LABELS[item.equipmentSlot]:'Equipment'} · {item.quality} / Grade {item.equipmentGrade}</small><h2>{item.name}</h2><b>+{stats.level} / 15 · {PAGES[page]}</b></div></header>
 <nav aria-label="Equipment guide pages">{PAGES.map((name,n)=><button key={name} aria-pressed={n===page} onClick={()=>setPage(n)}>{name}</button>)}</nav>
 <div className={s.panel}>
 {page===0&&<><div className={s.main}><span>Main stat</span><strong>{BATTLE_STAT_LABELS[stats.main.key]} +{stats.main.value}</strong><small>Every level: +{stats.main.key==='maxHp'?2:1} · Guaranteed</small></div><h3>Substats · {stats.substats.length} / 4</h3><div className={s.substats}>{stats.substats.map(stat=><div key={stat.key}><span>{BATTLE_STAT_LABELS[stat.key]}</span><strong>+{stat.value}</strong></div>)}{stats.substats.length<4&&<div><span>Open slots</span><strong>{4-stats.substats.length}</strong></div>}</div><p>Shown values belong to this piece. {stats.level===15?'Maximum level reached; no further upgrades.':'Future milestone rewards remain a mystery until purchased.'}</p></>}
 {page===1&&<><h3>Main stats on new equipment</h3><dl className={s.rules}><div><dt>Weapon</dt><dd>Physical Power · Special Power for special weapons</dd></div><div><dt>Armor</dt><dd>Defense</dd></div><div><dt>Headgear</dt><dd>Max HP</dd></div><div><dt>Hands / feet</dt><dd>Item-specific main stat</dd></div><div><dt>Accessory</dt><dd>Item-specific main stat</dd></div></dl><p>{legacy?'This previously owned piece keeps its original main stat and earned bonuses.':'This piece follows the current slot rule.'} Creature base stats and innate grades stay unchanged.</p></>}
 {page===2&&<><h3>Grade {item.equipmentGrade} · Random increment</h3><dl className={s.rules}><div><dt>Max HP</dt><dd>+{hp[0]}–{hp[1]}</dd></div><div><dt>Speed</dt><dd>+{speed[0]}–{speed[1]}</dd></div><div><dt>Other stats</dt><dd>+{other[0]}–{other[1]}</dd></div></dl><p><strong>+3 · +6 · +9 · +12 · +15</strong><br/>Below four substats: a random new stat. At four: a random existing substat improves.</p><p>Main stat and fixed passive bonuses cannot become new substats. Each eligible stat and each integer in its range have equal chances. The paid result is saved permanently.</p></>}
 {page===3&&<><h3>{stats.passive?'Relic passive':'No special passive'}</h3><p className={s.passive}>{stats.passive??'This piece provides its listed numeric stats. Random upgrades do not unlock a special passive.'}</p><p>Passive effects belong to the item. Enhancement does not change its grade or passive strength.</p><p>Equipment applies when a new battle starts. An ongoing battle keeps its starting loadout.</p></>}
 </div>
 <footer><button disabled={page===0} onClick={()=>setPage(n=>n-1)}>‹ Previous</button><button onClick={onClose}>Back to equipment</button><button disabled={page===PAGES.length-1} onClick={()=>setPage(n=>n+1)}>Next ›</button></footer>
 </section></GameDialog>;
}
