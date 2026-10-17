"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {UpgradeItemArt} from './UpgradeItemArt';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {GameDialog} from '@/features/ui/GameDialog';
import {EQUIPMENT_SLOT_LABELS,type EquipmentSlot} from '@/data/battleOutfitter';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import type {equipmentStats} from '@/data/equipmentEnhancement';
import s from './UpgradeLedger.module.css';
export type UpgradeReceipt={name:string;art?:string;slot?:EquipmentSlot;level:number;cost:number;before:ReturnType<typeof equipmentStats>;after:ReturnType<typeof equipmentStats>};
export function UpgradeSuccess({receipt,gold,onClose}:{receipt:UpgradeReceipt;gold:number;onClose:()=>void}){
 const {before,after,level}=receipt;const reward=after.milestones.find(m=>m.level===level);
 const prior=reward?before.substats.find(stat=>stat.key===reward.key)?.value??0:0;
 return <GameDialog fullScreen title="Upgrade successful" onClose={onClose}><main className={s.shell}><section className={s.book} data-upgrade-success>
 <header className={s.heading}><h2>Upgrade complete</h2><button aria-label="Close upgrade receipt" onClick={onClose}><ForgeIcon name="close"/></button></header>
 <div className={s.hero}><UpgradeItemArt art={receipt.art} stats={after} slot={receipt.slot} celebrate/><div><h3>{receipt.name}</h3><small>{receipt.slot?EQUIPMENT_SLOT_LABELS[receipt.slot]:'Equipment'} · {after.rarity}</small><b>+{before.level} → +{level}</b></div></div>
 <p className={s.row}><strong><EquipmentStatIcon name={after.main.key}/>{BATTLE_STAT_LABELS[after.main.key]}</strong><b>{before.main.value} <span>→</span> <em>{after.main.value}</em></b></p>
 <dl className={s.substats} aria-label="Saved substats">{after.substats.filter(stat=>stat.key!==reward?.key).map(stat=>{const previous=before.substats.find(old=>old.key===stat.key)?.value??0;return <div key={stat.key}><dt><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</dt><dd>{previous===stat.value?`+${stat.value}`:previous} <span>→</span> +{stat.value}</dd></div>;})}</dl>
 <div className={s.reward} data-revealed={!!reward}>{reward?<EquipmentStatIcon name={reward.key}/>:<ForgeIcon name="upgrade"/>}<div><strong>{reward?`${reward.added?'New':'Improved'}: ${BATTLE_STAT_LABELS[reward.key]}`:'Substats unchanged'}</strong><small>{reward?`${prior} → ${prior+reward.amount} (+${reward.amount})`:level===15?'Maximum level reached':`Next mystery at +${Math.min(15,Math.ceil((level+1)/3)*3)}`}</small></div></div>
 <p className={s.limit}>{after.substats.length} / 4 substats · Result saved to this piece. Rarity and power grade unchanged.</p>
 <div className={s.cost}><ForgeIcon name="coin"/><div><strong>{receipt.cost} Gold paid</strong><small>Current balance: {gold.toLocaleString('en-US')} Gold</small></div></div>
 <footer><button onClick={onClose}>Continue</button></footer>
 </section></main></GameDialog>;
}
