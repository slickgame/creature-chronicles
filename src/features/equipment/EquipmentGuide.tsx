"use client";
import {useState} from 'react';
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {UpgradeItemArt} from './UpgradeItemArt';
import {GameDialog} from '@/features/ui/GameDialog';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {equipmentStats,substatRollRange,type EquipmentStatsCopy} from '@/data/equipmentEnhancement';
import {EQUIPMENT_RARITIES,EQUIPMENT_STAT_POOLS,EQUIPMENT_SETS,startingSubstatCount} from '@/data/equipmentRules';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {EQUIPMENT_SLOT_LABELS,type BattleOutfitterItem} from '@/data/battleOutfitter';
import s from './EquipmentInspector.module.css';

// Focused pages keep unusually long descriptions readable on short screens as well.
function textPages(text:string){const pages:string[]=[];let part='';for(const word of text.split(/\s+/)){if(part.length+word.length>240){pages.push(part);part='';}part+=(part?' ':'')+word;}if(part)pages.push(part);return pages;}
export function EquipmentGuide({item,copy,onClose}:{item:BattleOutfitterItem;copy?:EquipmentStatsCopy;onClose:()=>void}){
 const [section,setSection]=useState<'stats'|'set'>('stats'),[guide,setGuide]=useState(false),[page,setPage]=useState(0);
 const stats=equipmentStats(item,copy),pool=EQUIPMENT_STAT_POOLS[item.equipmentSlot??'weapon'];
 const hp=substatRollRange(item,'maxHp',copy),speed=substatRollRange(item,'speed',copy),other=substatRollRange(item,'defense',copy);
 const set=stats.setId?EQUIPMENT_SETS[stats.setId]:null;
 const preview=!copy||copy.id.startsWith('new_');
 const descriptions=textPages(item.description),passive=stats.passive??'No additional passive.';
 const descriptionPreview=item.description.length>150?item.description.slice(0,150).replace(/\s+\S*$/,'')+'…':item.description;
 const passiveBonuses=Object.entries(stats.passiveBonuses).filter(([,amount])=>amount);
 const pages=[
  ...descriptions.map((text,n)=>({title:descriptions.length>1?`Description ${n+1}/${descriptions.length}`:'Description',content:<p>{text}</p>})),
  {title:'Rarity & starting substats',content:<><dl className={s.rarityList}>{EQUIPMENT_RARITIES.map(r=><div key={r}><dt>{r}</dt><dd>{startingSubstatCount(r)} starting substats</dd></div>)}</dl><p>Rarity controls the starting count. Upgrading never changes rarity. A piece holds at most four substats.</p></>},
  {title:'Power & preserved stats',content:<><p>Power Grade D–S controls main-stat strength, Gold costs and roll ranges. Upgrading never changes power grade.</p><p>{stats.legacy?'This legacy piece keeps its original main stat and earned rolls.':'These stats belong to this profile; other copies can differ.'}</p></>},
  {title:`${EQUIPMENT_SLOT_LABELS[item.equipmentSlot??'weapon']} · Main-stat pool`,content:<><div className={s.pool}>{pool.main.map(key=><span key={key}><EquipmentStatIcon name={key}/>{BATTLE_STAT_LABELS[key]}</span>)}</div><p>New output follows this slot pool. Exact starting stats are shown before buying or crafting. Legacy main stats stay intact.</p></>},
  {title:'Legal substat pool',content:<><div className={s.pool}>{pool.sub.filter(key=>key!==stats.main.key).map(key=><span key={key}><EquipmentStatIcon name={key}/>{BATTLE_STAT_LABELS[key]}</span>)}</div><p>No duplicate or main-stat substats. Legacy rolls stay intact; future rolls follow this pool.</p></>},
  {title:stats.substats.length>=4?'Random substat increases':'Mystery substats',content:<><h3>+3 · +6 · +9 · +12 · +15</h3><p>Add a random new stat until four, then improve a legal existing substat. Only a successful paid upgrade rolls. Previews never reveal or reroll results.</p><p>Each eligible stat and integer in its range has equal chance.</p></>},
  {title:'Roll ranges for this power grade',content:<><dl className={s.rarityList}><div><dt>Max HP</dt><dd>+{hp[0]}–{hp[1]}</dd></div><div><dt>Speed</dt><dd>+{speed[0]}–{speed[1]}</dd></div><div><dt>Other stats</dt><dd>+{other[0]}–{other[1]}</dd></div></dl><p>Ranges describe possible future rolls. Actual results stay hidden until payment succeeds.</p></>},
  {title:'How sets work',content:<><p>{set?`${set.name}: ${set.description}`:'This piece has no equipment set.'}</p><p>Only worn pieces count. Repeated complete groups add their rates. Percentages use innate battle stats, rounded down once; gear bonuses do not compound the set.</p></>},
  ...textPages(passive).map((text,n)=>({title:n?'Passive continued':'Additional passive',content:<><p>{text}</p>{!n&&<p>Random upgrades do not unlock a passive. New battles use current gear; existing battles keep their starting snapshot.</p>}</>}))
 ];
 const topic=pages[Math.min(page,pages.length-1)];
 function openGuide(n=0){setPage(n);setGuide(true);}
 return <>
 <GameDialog title="Item details" fullScreen onClose={onClose}><main className={s.shell}><section className={s.book} data-equipment-inspector data-section={section}>
  <header className={s.heading}><h2>Item details</h2><button aria-label="Close Item details" onClick={onClose}><ForgeIcon name="close"/></button></header>
  <div className={s.body}>
   <div className={s.overview}><div className={s.hero}><div className={s.art}><UpgradeItemArt art={item.iconPath} stats={stats} slot={item.equipmentSlot}/></div><div><h3>{item.name} <span>+{stats.level}</span></h3><p className={s.metadata}>{EQUIPMENT_SLOT_LABELS[item.equipmentSlot??'weapon']} · {stats.rarity} · Power {stats.powerGrade}</p><p className={s.description}>{descriptionPreview}</p>{item.description.length>150&&<button className={s.link} onClick={()=>openGuide()}>Full description ›</button>}</div></div>{preview&&<p className={s.preview}>Blueprint preview · not an owned copy</p>}</div>
   <nav className={s.tabs} aria-label="Item detail sections"><button aria-pressed={section==='stats'} onClick={()=>setSection('stats')}>Stats</button><button aria-pressed={section==='set'} onClick={()=>setSection('set')}>Set & passive</button></nav>
   <div className={s.setPassive}>
    <section className={s.card} aria-label="Item set bonus">{stats.setId&&<img src={`/images/ui/forge-slate-v2/sets/sculpted/${stats.setId}.webp`} alt=""/>}<div><h3>{set?`${set.name} set`:'No equipment set'}</h3><p>{set?`${set.pieces} pieces: ${set.description}`:'This piece grants no set progress.'}</p></div></section>
    <section className={s.card} aria-label="Item passive"><div><h3>Passive</h3><p>{passive.length>180?passive.slice(0,180).replace(/\s+\S*$/,'')+'…':passive}</p>{passive.length>180&&<button className={s.link} onClick={()=>openGuide(pages.findIndex(p=>p.title==='Additional passive'))}>Full passive ›</button>}{!stats.passive&&passiveBonuses.length>0&&<p className={s.bonus}>Fixed bonuses: {passiveBonuses.map(([key,amount])=>`${BATTLE_STAT_LABELS[key as keyof typeof BATTLE_STAT_LABELS]} +${amount}`).join(' · ')}</p>}</div></section>
   </div>
   <section className={s.stats} aria-label="Recorded item stats"><h3>Main stat</h3><p className={s.main}><EquipmentStatIcon name={stats.main.key}/><span>{BATTLE_STAT_LABELS[stats.main.key]}</span><strong>+{stats.main.value}</strong></p><h3>Substats <small>{stats.substats.length} / 4</small></h3><dl>{Array.from({length:4},(_,n)=>{const stat=stats.substats[n];return <div key={n}><dt>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</dt><dd>{stat?`+${stat.value}`:'—'}</dd></div>;})}</dl></section>
  </div>
  <footer className={s.footer}><button onClick={onClose}>‹ Back to equipment</button><button className={s.link} onClick={()=>openGuide(descriptions.length)}>Rules & roll ranges ›</button></footer>
 </section></main></GameDialog>
 {guide&&<GameDialog title="Equipment rules" fullScreen onClose={()=>setGuide(false)}><main className={s.shell}><section className={`${s.book} ${s.guide}`} data-equipment-rules><header className={s.heading}><h2>Equipment guide</h2><button aria-label="Close Equipment rules" onClick={()=>setGuide(false)}><ForgeIcon name="close"/></button></header><select aria-label="Guide topic" value={page} onChange={e=>setPage(Number(e.target.value))}>{pages.map((p,n)=><option key={n} value={n}>{p.title}</option>)}</select><article className={s.guideBody}><h3>{topic.title}</h3>{topic.content}</article><nav className={s.pager} aria-label="Guide pages"><button disabled={!page} onClick={()=>setPage(page-1)}>‹ Previous</button><small>{page+1} / {pages.length}</small><button disabled={page+1>=pages.length} onClick={()=>setPage(page+1)}>Next ›</button></nav><footer className={s.footer}><button onClick={()=>setGuide(false)}>‹ Back to item details</button></footer></section></main></GameDialog>}
 </>;
}
