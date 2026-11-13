"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {GameDialog} from '@/features/ui/GameDialog';
import {type EquipmentSlot} from '@/data/battleOutfitter';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import type {equipmentStats} from '@/data/equipmentEnhancement';
import ledger from './UpgradeLedger.module.css';
import s from './UpgradeSuccess.module.css';
export type UpgradeReceipt={name:string;art?:string;slot?:EquipmentSlot;level:number;cost:number;goalGold?:number;before:ReturnType<typeof equipmentStats>;after:ReturnType<typeof equipmentStats>};
export function UpgradeSuccess({receipt,gold,onClose}:{receipt:UpgradeReceipt;gold:number;onClose:()=>void}){
 const {before,after,level}=receipt;const reward=after.milestones.find(m=>m.level===level);
 const prior=reward?before.substats.find(stat=>stat.key===reward.key)?.value??0:0;
 return <GameDialog fullScreen title="Upgrade successful" onClose={onClose}>
  <main className={`${ledger.shell} ${s.shell}`}>
   <section className={`${ledger.book} ${s.receipt}`} data-upgrade-success>
    <header className={s.heading}>
     <p>Iona’s Forge</p>
     <h2>Upgrade complete</h2>
     <button aria-label="Close upgrade receipt" onClick={onClose}><ForgeIcon name="close"/></button>
    </header>
    <div className={s.art}>{receipt.art&&<img src={receipt.art} alt=""/>}</div>
    <div className={s.results}>
     <div className={s.item}><h3>{receipt.name}</h3><b>+{before.level} → <em>+{level}</em></b></div>
     <div className={s.mainStat}><span><EquipmentStatIcon name={after.main.key}/>{BATTLE_STAT_LABELS[after.main.key]}</span><b>{before.main.value} → <em>{after.main.value}</em></b></div>
     <div className={s.reveal} data-rolled={Boolean(reward)}>
      <div className={s.medal}>{reward?<EquipmentStatIcon name={reward.key}/>:<ForgeIcon name="upgrade"/>}</div>
      <div>
       {reward?<><p>{reward.added?'New substat':'Substat improved'}</p><strong>{BATTLE_STAT_LABELS[reward.key]} <em>+{reward.amount}</em></strong>{!reward.added&&<small>{prior} → {prior+reward.amount}</small>}</>:<><strong>Substats unchanged</strong><small>{level===15?'Maximum level reached':`Next ${after.substats.length>=4?'random increase':'mystery'} at +${Math.min(15,Math.ceil((level+1)/3)*3)}`}</small></>}
      </div>
     </div>
    </div>
    <div className={s.summary}>
     <div className={s.saved}>{receipt.art&&<img src={receipt.art} alt=""/>}<strong>{receipt.name} +{level}</strong></div>
     <div><span>Guaranteed gain</span><strong>{BATTLE_STAT_LABELS[after.main.key]} <em>+{after.main.value-before.main.value}</em></strong></div>
     <div className={s.payment}><ForgeIcon name="coin"/><div><strong>{receipt.cost} Gold paid</strong>{!!receipt.goalGold&&<small>Ranch goal rewards: +{receipt.goalGold.toLocaleString('en-US')} Gold</small>}<span>Balance: {gold.toLocaleString('en-US')} Gold</span></div></div>
    </div>
    {after.substats.length>0&&<details className={s.substats}><summary>Saved substats ({after.substats.length}/4)</summary><dl>{after.substats.map(stat=><div key={stat.key}><dt>{BATTLE_STAT_LABELS[stat.key]}</dt><dd>+{stat.value}</dd></div>)}</dl></details>}
    <footer><button onClick={onClose}>Continue</button></footer>
   </section>
  </main>
 </GameDialog>;
}
