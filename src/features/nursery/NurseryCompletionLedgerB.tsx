"use client";
import type { EggRecord } from '@/types/save';
import { nurseryIdentity } from '@/data/nurseryPresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import frame from './NurseryRemovalLedgerB.module.css';
import s from './NurseryCompletionLedgerB.module.css';

export type NurseryCompletion = {
  egg: EggRecord;
  name: string;
  mode: 'donate' | 'release';
};

/** A receipt of the completed action; closing it never repeats that action. */
export function NurseryCompletionLedgerB({receipt,onClose}:{
  receipt:NurseryCompletion; onClose:()=>void;
}) {
  const {egg,name,mode}=receipt;
  const identity=nurseryIdentity(egg);
  const donate=mode==='donate';
  const title=donate?'Donation complete':'Release complete';
  return <GameDialog title={title} onClose={onClose} fullScreen dialogClassName={frame.dialog}>
    <main className={frame.book} data-nursery-completion-b data-mode={mode}>
      <header className={frame.header}><h1 className={s.title}>{title}</h1></header>
      <div className={frame.spread}>
        <section className={`${frame.identity} ${s.identity}`} aria-label="Completed egg record">
          <img className={frame.egg} src={identity.art} alt={`${identity.species} egg`}/>
          <h2>{name}</h2>
          <span className={frame.badge}>{egg.rarity} · {identity.species}</span>
        </section>
        <section className={s.outcome} aria-label="Completed outcome">
          <div className={`${s.card} ${donate?'':s.release}`} role="status">
            <div className={s.illustration}><img src={donate?'/images/ui/nursery-other-actions-b/donate.webp':'/images/ui/nursery-other-actions-b/release-gate-c.webp'} alt=""/></div>
            <div className={s.summary}>
              <h2>{name} was {donate?'donated.':'released.'}</h2>
              <p>{donate?'Received 75 Gold + 1 GP.':'No reward granted.'}</p>
            </div>
          </div>
        </section>
      </div>
      <footer className={frame.footer}><button className={`${frame.primary} ${s.returnButton}`} onClick={onClose}>Back to Nursery</button></footer>
    </main>
  </GameDialog>;
}
