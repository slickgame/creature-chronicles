"use client";
import {EquipmentStatIcon} from './EquipmentStatIcon';
import {UpgradeItemArt} from './UpgradeItemArt';
import {ForgeIcon} from '@/features/builder/ForgeWindow';
import {GameDialog} from '@/features/ui/GameDialog';
import {EQUIPMENT_SLOT_LABELS} from '@/data/battleOutfitter';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {substatRollRange} from '@/data/equipmentEnhancement';
import type {getEnhancementQuote} from '@/data/equipmentInstances';
import s from './UpgradeLedger.module.css';
export function UpgradeReview({quote,gold,stale,onClose,onConfirm}:{quote:NonNullable<ReturnType<typeof getEnhancementQuote>>;gold:number;stale:boolean;onClose:()=>void;onConfirm:()=>void}){
 const next=quote.copy.level+1,milestone=next%3===0,full=quote.before.substats.length>=4,range=substatRollRange(quote.item,'defense',quote.copy);
 return <GameDialog fullScreen title="Confirm equipment upgrade" onClose={onClose}><main className={s.shell}><section className={s.book} data-upgrade-review>
 <header className={s.heading}><h2>Review upgrade</h2><button aria-label="Cancel upgrade" onClick={onClose}><ForgeIcon name="close"/></button></header>
 <div className={s.hero}><UpgradeItemArt art={quote.item.iconPath} stats={quote.before} slot={quote.item.equipmentSlot}/><div><h3>{quote.item.name}</h3><small>{quote.item.equipmentSlot?EQUIPMENT_SLOT_LABELS[quote.item.equipmentSlot]:'Equipment'} · {quote.before.rarity}</small><b>+{quote.copy.level} → +{next}</b></div></div>
 <p className={s.row}><strong><EquipmentStatIcon name={quote.after.main.key}/>{BATTLE_STAT_LABELS[quote.after.main.key]}</strong><b>{quote.before.main.value} <span>→</span> <em>{quote.after.main.value}</em></b></p>
 <dl className={s.substats} aria-label="Recorded substats">{quote.before.substats.map(stat=><div key={stat.key}><dt><EquipmentStatIcon name={stat.key}/>{BATTLE_STAT_LABELS[stat.key]}</dt><dd>+{stat.value} <span>→</span> +{stat.value}</dd></div>)}</dl>
 <div className={s.reward}>{milestone?<img src="/images/ui/forge-slate-v2/upgrade/mystery-envelope.webp" alt="Sealed mystery envelope"/>:<ForgeIcon name="upgrade"/>}<div><strong>{milestone?(full?'Random substat increase':'Mystery substat'):'Substats unchanged'}</strong><small>{milestone?'Revealed after payment':`Next ${full?'random increase':'mystery'} at +${Math.ceil(next/3)*3}`}</small></div></div>
 <p className={s.limit}>{milestone?`${quote.before.substats.length}/4 saved substats. ${quote.before.substats.length<4?'Adds a random new stat.':'Improves a random existing stat.'} HP +${range[0]*2}–${range[1]*2}, Speed +1–2, others +${range[0]}–${range[1]}.`:`${quote.before.substats.length}/4 substats · Existing substats stay unchanged.`} Rarity and power grade stay the same.{stale?' Equipment changed; cancel and review again.':''}</p>
 <div className={s.cost}><ForgeIcon name="coin"/><div><strong>{quote.cost} Gold</strong><small>No materials required</small><small>Balance: {gold.toLocaleString('en-US')} → {(gold-quote.cost).toLocaleString('en-US')}</small></div></div>
 <footer><button onClick={onClose}>Cancel</button><button disabled={!quote.canUpgrade||stale} onClick={onConfirm}><ForgeIcon name="upgrade"/>Confirm upgrade</button></footer>
 </section></main></GameDialog>;
}
