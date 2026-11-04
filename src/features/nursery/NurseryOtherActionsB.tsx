"use client";
import type { EggRecord } from '@/types/save';
import { nurseryIdentity } from '@/data/nurseryPresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './NurseryOtherActionsB.module.css';

export function NurseryOtherActionsB({egg,name,onClose,onReview}:{
  egg:EggRecord; name:string; onClose:()=>void; onReview:(mode:'donate'|'release')=>void;
}) {
  const identity=nurseryIdentity(egg);
  return <GameDialog title="Other Actions" onClose={onClose} fullScreen dialogClassName={s.dialog}>
    <main className={s.book} data-nursery-other-actions-b>
      <header className={s.header}>
        <button onClick={onClose}>‹ Back to Nursery</button>
        <h1>Other Actions</h1>
      </header>
      <div className={s.spread}>
        <section className={s.identity} aria-label="Selected egg">
          <img className={s.egg} src={identity.art} alt={`${identity.species} egg`}/>
          <h2>{name}</h2>
          <span className={s.badge}>{egg.rarity} · {identity.species}</span>
        </section>
        <section className={s.options} aria-label="Egg actions">
          <p className={s.warning}>Both options permanently remove this egg.</p>
          <article className={`${s.card} ${s.donate}`}>
            <div className={s.illustration}><img src="/images/ui/nursery-other-actions-b/donate.webp" alt=""/></div>
            <div className={s.copy}><h2>Donate</h2><p>Receive 75 Gold + 1 GP.</p><button className={s.primary} onClick={()=>onReview('donate')}>Review donation</button></div>
          </article>
          <article className={`${s.card} ${s.release}`}>
            <div className={s.illustration}><img src="/images/ui/nursery-other-actions-b/release-gate-c.webp" alt=""/></div>
            <div className={s.copy}><h2>Release</h2><p>No reward.</p><button className={s.danger} onClick={()=>onReview('release')}>Review release</button></div>
          </article>
        </section>
      </div>
      <footer className={s.footer}><button onClick={onClose}>Keep egg</button></footer>
    </main>
  </GameDialog>;
}
