"use client";

import type { EggRecord } from '@/types/save';
import { nurseryIdentity } from '@/data/nurseryPresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './NurseryEggPickerB.module.css';

/** Browsing changes only the caller's draft; Select egg commits the selection. */
export function NurseryEggPickerB({ eggs, draft, onDraft, onCancel, onSelect, name }: {
  eggs: EggRecord[];
  draft: string;
  onDraft: (id: string) => void;
  onCancel: () => void;
  onSelect: () => void;
  name: (egg: EggRecord) => string;
}) {
  const index = eggs.findIndex(egg => egg.eggId === draft);
  const egg = eggs[index];
  const identity = egg ? nurseryIdentity(egg) : null;
  const timer = egg ? egg.status === 'ready' ? 'Ready to hatch' : `${egg.daysRemaining} day${egg.daysRemaining === 1 ? '' : 's'} remaining` : '';
  return <GameDialog title="Choose egg" onClose={onCancel} fullScreen dialogClassName={s.dialog}>
    <main className={s.book} data-nursery-picker-b>
      <header className={s.header}>
        <button onClick={onCancel}>‹ Back to Nursery</button>
        <h1>Choose egg</h1>
      </header>
      <div className={s.spread}>
        {egg && identity ? <>
          <section className={s.identity} aria-label="Previewed egg">
            <img className={s.egg} src={identity.art} alt={`${identity.species} egg`} />
            <h2>{name(egg)}</h2>
            <p>Species: {identity.species} · Type: {identity.type}</p>
            <span className={s.badge}>{egg.rarity} · {timer}</span>
          </section>
          <section className={s.details} aria-label="Egg details">
            <dl>
              <div><dt>Species</dt><dd>{identity.species}</dd></div>
              <div><dt>Type</dt><dd>{identity.type}</dd></div>
              <div><dt>Rarity</dt><dd>{egg.rarity}</dd></div>
              <div><dt>Incubation</dt><dd>{timer}</dd></div>
            </dl>
          </section>
        </> : <p className={s.empty} role="status">{eggs.length ? 'This egg is no longer available. Browse to another egg.' : 'Your Nursery has no eggs to select.'}</p>}
      </div>
      {eggs.length > 1 && <label className={s.chooser}>Browse Nursery eggs
        <select aria-label="Browse Nursery eggs" value={egg ? draft : ''} onChange={event => onDraft(event.target.value)}>
          <option value="" disabled>Choose an egg</option>
          {eggs.map(item => <option key={item.eggId} value={item.eggId}>{name(item)} · {nurseryIdentity(item).species} · {item.status === 'ready' ? 'Ready to hatch' : `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} remaining`}</option>)}
        </select>
      </label>}
      <nav className={s.pager} aria-label="Nursery eggs pages">
        <button disabled={index <= 0} onClick={() => onDraft(eggs[index - 1].eggId)}>‹ Previous</button>
        <span aria-live="polite">{index < 0 ? '—' : index + 1} / {eggs.length}</span>
        <button disabled={!eggs.length || index >= eggs.length - 1} onClick={() => onDraft(eggs[index + 1].eggId)}>Next ›</button>
      </nav>
      <footer className={s.footer}>
        <button onClick={onCancel}>Cancel</button>
        <button className={s.primary} disabled={!egg} onClick={onSelect}>Select egg</button>
      </footer>
    </main>
  </GameDialog>;
}
