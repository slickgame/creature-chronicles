"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {GameDialog} from '@/features/ui/GameDialog';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {substatRollRange} from '@/data/equipmentEnhancement';
import type {getEnhancementQuote} from '@/data/equipmentInstances';
import s from './UpgradeLedger.module.css';
export function UpgradeReview({quote,gold,stale,onClose,onConfirm}:{quote:NonNullable<ReturnType<typeof getEnhancementQuote>>;gold:number;stale:boolean;onClose:()=>void;onConfirm:()=>void}){
 const next=quote.copy.level+1,milestone=next%3===0,range=substatRollRange(quote.item,'defense',quote.copy);
 return <GameDialog fullScreen title="Confirm equipment upgrade" onClose={onClose}><main className={s.shell}><section className={s.book} data-upgrade-review>
 <header className={s.heading}><h2>Review upgrade</h2><button onClick={onClose}>Cancel ×</button></header>
 <div className={s.hero}><img src={quote.item.iconPath} alt=""/><div><h3>{quote.item.name}</h3><small>{quote.before.rarity} · Power {quote.before.powerGrade}</small><b>+{quote.copy.level} → +{next}</b></div></div>
 <p className={s.row}><strong><EquipmentStatIcon name={quote.after.main.key}/>{BATTLE_STAT_LABELS[quote.after.main.key]}</strong><b>{quote.before.main.value} → {quote.after.main.value}</b></p>
 <dl className={s.substats} aria-label="Recorded substats">{Array.from({length:4},(_,n)=>{const stat=quote.before.substats[n];return <div key={n}><dt>{stat?<><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</>:'Empty substat'}</dt><dd>{stat?`+${stat.value}`:'—'}</dd></div>;})}</dl>
 <div className={s.reward}><img src="/images/ui/equipment-windows-v1/mystery-seal.webp" alt=""/><div><strong>{milestone?'? Mystery substat':'Substats unchanged'}</strong><small>{milestone?'Revealed after payment':`Next mystery at +${Math.ceil(next/3)*3}`}</small></div></div>
 <p className={s.limit}>{milestone?`Random new stat until four; then a random existing stat improves. HP +${range[0]*2}–${range[1]*2}, Speed +1–2, others +${range[0]}–${range[1]}.`:'Existing substats stay unchanged.'} Rarity and power grade stay the same.{stale?' Equipment changed; cancel and review again.':''}</p>
 <div className={s.cost}><strong>{quote.cost} Gold · No materials</strong><small>Balance: {gold} → {gold-quote.cost} Gold</small></div>
 <footer><button onClick={onClose}>Cancel</button><button disabled={!quote.canUpgrade||stale} onClick={onConfirm}>Confirm upgrade</button></footer>
 </section></main></GameDialog>;
}
