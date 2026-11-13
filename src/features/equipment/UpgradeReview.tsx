"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {GameDialog} from '@/features/ui/GameDialog';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {substatRollRange} from '@/data/equipmentEnhancement';
import type {getEnhancementQuote} from '@/data/equipmentInstances';
import ledger from './UpgradeLedger.module.css';
import s from './UpgradeReview.module.css';
export function UpgradeReview({quote,gold,stale,onClose,onConfirm}:{quote:NonNullable<ReturnType<typeof getEnhancementQuote>>;gold:number;stale:boolean;onClose:()=>void;onConfirm:()=>void}){
 const next=quote.copy.level+1,milestone=next%3===0,full=quote.before.substats.length>=4,range=substatRollRange(quote.item,'defense',quote.copy);
 const outcome=milestone?(full?'Random substat increase':'Mystery substat'):'Substats unchanged';
 return <GameDialog fullScreen title="Confirm equipment upgrade" onClose={onClose}>
  <main className={`${ledger.shell} ${s.shell}`}>
   <section className={`${ledger.book} ${s.workbench}`} data-upgrade-review>
    <header className={s.heading}>
     <p className={s.plaque}>Iona’s Forge</p>
     <h2>Review Upgrade Confirmation</h2>
     <button aria-label="Cancel upgrade" onClick={onClose}><ForgeIcon name="close"/></button>
    </header>
    <div className={s.art}><img src={quote.item.iconPath} alt=""/></div>
    <div className={s.details}>
     <div className={s.line}><EquipmentStatIcon name="physicalPower"/><h3>{quote.item.name}</h3><b>+{quote.copy.level} → <em>+{next}</em></b></div>
     <div className={s.line}><EquipmentStatIcon name={quote.after.main.key}/><div><strong>Guaranteed gain</strong><br/>{BATTLE_STAT_LABELS[quote.after.main.key]}</div><b>{quote.before.main.value} → <em>{quote.after.main.value}</em></b></div>
     <div className={s.line}><span className={s.spark} aria-hidden="true">✦</span><div><strong>{outcome}</strong><p>{milestone?(full?'One existing substat improves at random after confirmation.':'One random new substat, revealed after confirmation.'):`Next ${full?'random increase':'mystery substat'} at +${Math.ceil(next/3)*3}.`}</p></div></div>
     <details className={s.disclosure}>
      <summary>Substat details</summary>
      <dl aria-label="Recorded substats">{quote.before.substats.map(stat=><div key={stat.key}><dt>{BATTLE_STAT_LABELS[stat.key]}</dt><dd>+{stat.value}</dd></div>)}</dl>
      <p>{milestone?`Possible increases: HP +${range[0]*2}–${range[1]*2}, Speed +1–2, others +${range[0]}–${range[1]}.`:'Existing substats stay unchanged.'} Rarity and power grade stay the same.</p>
     </details>
     <dl className={s.totals}>
      <div><dt><ForgeIcon name="coin"/>Cost</dt><dd>{quote.cost} Gold</dd></div>
      <div><dt><span aria-hidden="true">⚖</span>Balance</dt><dd>{gold.toLocaleString('en-US')} → <em>{(gold-quote.cost).toLocaleString('en-US')}</em></dd></div>
     </dl>
     {stale&&<p role="status">Equipment changed. Cancel and review again.</p>}
     <footer><button onClick={onClose}>Cancel</button><button disabled={!quote.canUpgrade||stale} onClick={onConfirm}>Confirm upgrade</button></footer>
    </div>
   </section>
  </main>
 </GameDialog>;
}
