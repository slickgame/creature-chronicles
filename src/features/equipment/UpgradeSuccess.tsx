"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {GameDialog} from '@/features/ui/GameDialog';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import type {equipmentStats} from '@/data/equipmentEnhancement';
import s from './UpgradeLedger.module.css';
export type UpgradeReceipt={name:string;art?:string;level:number;cost:number;before:ReturnType<typeof equipmentStats>;after:ReturnType<typeof equipmentStats>};
export function UpgradeSuccess({receipt,gold,onClose}:{receipt:UpgradeReceipt;gold:number;onClose:()=>void}){
 const {before,after,level}=receipt;const reward=after.milestones.find(m=>m.level===level);
 const prior=reward?before.substats.find(s=>s.key===reward.key)?.value??0:0;
 return <GameDialog fullScreen title="Upgrade successful" onClose={onClose}><main className={s.shell}><section className={s.book} data-upgrade-success>
 <header className={s.heading}><h2>Upgrade complete</h2><button onClick={onClose}>Close ×</button></header>
 <div className={s.hero}><img className={s.resultArt} src={receipt.art??'/images/ui/equipment-windows-v1/forge-anvil.webp'} alt=""/><div><h3>{receipt.name}</h3><small>{after.rarity} · Power {after.powerGrade}</small><b>+{before.level} → +{level}</b></div></div>
 <p className={s.row}><strong><EquipmentStatIcon name={after.main.key}/>{BATTLE_STAT_LABELS[after.main.key]}</strong><b>{before.main.value} → {after.main.value}</b></p>
 <dl className={s.substats} aria-label="Saved substats">{Array.from({length:4},(_,n)=>{const stat=after.substats[n],previous=stat?before.substats.find(s=>s.key===stat.key)?.value??0:0;return <div key={n}><dt>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</dt><dd>{stat?previous===stat.value?`+${stat.value}`:`${previous} → ${stat.value}`:'—'}</dd></div>;})}</dl>
 <div className={s.reward} data-revealed="true"><img src="/images/ui/equipment-windows-v1/forge-anvil.webp" alt=""/><div><strong>{reward?`${reward.added?'New':'Improved'}: ${BATTLE_STAT_LABELS[reward.key]}`:'Substats unchanged'}</strong><small>{reward?`${prior} → ${prior+reward.amount} (+${reward.amount})`:level===15?'Maximum level reached':`Next mystery at +${Math.min(15,Math.ceil((level+1)/3)*3)}`}</small></div></div>
 <p className={s.limit}>{after.substats.length} / 4 substats · Result saved to this piece. Rarity and power grade unchanged.</p>
 <div className={s.cost}><strong>{receipt.cost} Gold paid</strong><small>Current balance: {gold} Gold</small></div>
 <footer><button onClick={onClose}>Continue</button></footer>
 </section></main></GameDialog>;
}
