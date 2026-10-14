"use client";
import {useState} from 'react';
import {equipmentStats,enhancementCost,type EquipmentCopy} from '@/data/equipmentEnhancement';
import type {BattleOutfitterItem} from '@/data/battleOutfitter';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {GameDialog} from '@/features/ui/GameDialog';
import s from './EnhancementMilestones.module.css';
const LEVELS=[3,6,9,12,15];
export function EnhancementMilestones({item,copy,gold,onClose}:{item:BattleOutfitterItem;copy:EquipmentCopy;gold:number;onClose:()=>void}){
 const [target,setTarget]=useState(LEVELS.find(n=>n>copy.level)??15);
 const reached=target<=copy.level;
 const start=reached?target-1:copy.level;
 const before=equipmentStats(item,{...copy,level:start}),after=equipmentStats(item,{...copy,level:target});
 const milestone=after.milestones.find(m=>m.level===target)!;
 const priorSub=equipmentStats(item,{...copy,level:target-1}).substats.find(s=>s.key===milestone.key)?.value??0;
 let cost=0;for(let n=copy.level;n<target;n++)cost+=enhancementCost(item,n);
 const index=LEVELS.indexOf(target);
 return <GameDialog fullScreen title="Enhancement milestones" onClose={onClose}><section className={s.book} data-enhancement-milestones>
  <nav aria-label="Enhancement milestones">{LEVELS.map(n=><button key={n} aria-label={`Preview plus ${n}`} aria-pressed={target===n} data-reached={n<=copy.level} onClick={()=>setTarget(n)}>+{n}<small>{n<=copy.level?'Reached':'Preview'}</small></button>)}</nav>
  <div className={s.hero}><img src="/images/ui/enhancement-v1/forge-crest.webp" alt=""/><div><small>{item.name} · Currently +{copy.level}</small><h3>Milestone +{target}</h3><b>{reached?'Already unlocked':milestone.added?'New substat':'Substat improvement'}</b></div></div>
  <div className={s.stats}><div><small>Main stat · +{start} → +{target}</small><strong>{BATTLE_STAT_LABELS[after.main.key]}</strong><b>{before.main.value} → {after.main.value}</b></div><div className={s.reward}><small>At +{target} · {milestone.added?'New substat':'Improved substat'}</small><strong>{BATTLE_STAT_LABELS[milestone.key]}</strong><b>{priorSub} → {priorSub+milestone.amount} <span>(+{milestone.amount})</span></b></div></div>
  <p className={s.limit}>{after.substats.length} / 4 substats at +{target}. {reached?'Showing the original milestone change.':'The highlighted reward is this milestone only; earlier milestones also apply.'}</p>
  <div className={s.cost}><strong>{reached?'Milestone reached':`${cost} Gold total · +${copy.level} → +${target}`}</strong><small>{reached?'No purchase needed for this milestone.':gold>=cost?`Balance after reaching target: ${gold-cost} Gold`:`Need ${cost-gold} more Gold to reach this target.`}</small></div>
  <footer><button disabled={index===0} onClick={()=>setTarget(LEVELS[index-1])}>‹ Previous</button><button onClick={onClose}>Back to equipment</button><button disabled={index===4} onClick={()=>setTarget(LEVELS[index+1])}>Next ›</button></footer>
  <small className={s.note}>Preview only. Buy one guaranteed level at a time from Review upgrade.</small>
 </section></GameDialog>;
}
