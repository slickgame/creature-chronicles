"use client";
import {GameDialog} from '@/features/ui/GameDialog';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import type {equipmentStats} from '@/data/equipmentEnhancement';
import s from './EnhancementMilestones.module.css';
export type UpgradeReceipt={name:string;level:number;cost:number;before:ReturnType<typeof equipmentStats>;after:ReturnType<typeof equipmentStats>};
export function UpgradeSuccess({receipt,gold,onClose}:{receipt:UpgradeReceipt;gold:number;onClose:()=>void}){
 const {before,after,level}=receipt;const reward=after.milestones.find(m=>m.level===level);
 const prior=reward?before.substats.find(s=>s.key===reward.key)?.value??0:0;
 return <GameDialog fullScreen title="Upgrade successful" onClose={onClose}><section className={s.book} data-upgrade-success>
 <div className={s.hero}><img src="/images/ui/enhancement-v1/forge-crest.webp" alt=""/><div><small>{receipt.name}</small><h3>Upgrade +{level} complete</h3><b>{reward?'Milestone reward revealed':'Main stat increased'}</b></div></div>
 <div className={s.stats}><div><small>Main stat</small><strong>{BATTLE_STAT_LABELS[after.main.key]}</strong><b>{before.main.value} → {after.main.value}</b></div><div className={s.reward}><small>{reward?(reward.added?'New substat':'Substat improved'):'Substats unchanged'}</small><strong>{reward?BATTLE_STAT_LABELS[reward.key]:level===15?'Maximum level reached':`Next mystery reward: +${Math.min(15,Math.ceil((level+1)/3)*3)}`}</strong>{reward&&<b>{prior} → {prior+reward.amount} (+{reward.amount})</b>}</div></div>
 <p className={s.limit}>{after.substats.length} / 4 substats · Result saved to this piece. Existing rolls stay unchanged.</p>
 <div className={s.cost}><strong>{receipt.cost} Gold paid</strong><small>Current balance: {gold} Gold</small></div>
 <footer><button onClick={onClose}>Continue</button></footer>
 </section></GameDialog>;
}
