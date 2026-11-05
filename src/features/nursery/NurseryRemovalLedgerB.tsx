"use client";
import { useRef } from 'react';
import type { EggRecord } from '@/types/save';
import { nurseryIdentity } from '@/data/nurseryPresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './NurseryRemovalLedgerB.module.css';

export function NurseryRemovalLedgerB({egg,name,mode,onBack,onKeep,onConfirm}:{
  egg:EggRecord; name:string; mode:'donate'|'release';
  onBack:()=>void; onKeep:()=>void; onConfirm:()=>void;
}) {
  const identity=nurseryIdentity(egg);
  const opened=useRef(Date.now());
  const submitted=useRef(false);
  const donate=mode==='donate';
  const title=donate?'Donate egg?':'Release egg?';
  const confirm=()=>{
    if(submitted.current||Date.now()-opened.current<250)return;
    submitted.current=true;
    onConfirm();
  };
  return <GameDialog title={title} onClose={onBack} fullScreen dialogClassName={s.dialog}>
    <main className={s.book} data-nursery-removal-b data-mode={mode}>
      <header className={s.header}>
        <button onClick={onBack}>‹ Back</button>
        <h1>{title}</h1>
      </header>
      <div className={s.spread}>
        <section className={s.identity} aria-label="Egg to remove">
          <img className={s.egg} src={identity.art} alt={`${identity.species} egg`}/>
          <h2>{name}</h2>
          <span className={s.badge}>{egg.rarity} · {identity.species}</span>
        </section>
        <section className={`${s.outcome} ${donate?s.donation:s.release}`} aria-label="Review consequences">
          {donate?<div className={s.reward}>
            <img src="/images/ui/nursery-other-actions-b/donate.webp" alt=""/>
            <p>Receive 75 Gold + 1 GP.</p>
          </div>:<>
            <img className={s.gate} src="/images/ui/nursery-other-actions-b/release-gate-c.webp" alt=""/>
            <p className={s.noReward}>No reward.</p>
          </>}
          <p className={s.warning}>This permanently removes the egg.</p>
        </section>
      </div>
      <footer className={s.footer}>
        <button onClick={onKeep}>Keep egg</button>
        <button className={donate?s.primary:s.danger} onClick={confirm}>{donate?'Confirm donation':'Confirm release'}</button>
      </footer>
    </main>
  </GameDialog>;
}
