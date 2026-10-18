"use client";

import { useEffect, useRef, useState } from 'react';
import type { CreatureRecord } from '@/types/creature';
import { careDetailPages, careMeterPercent, getCarePresentation } from '@/data/carePresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './CareLedger.module.css';

export type CareLedgerProps = {
  creature: CreatureRecord; injury: boolean; statusNote?: string; bestStatLabels: string[];
  renameValue?: string; onRenameValueChange?: (value: string) => void; onRename?: () => void;
  onToggleLock?: () => void; onFeed?: () => void; onRelease?: () => void; onDonate?: () => void;
};
function Art({ name, resource = false }: { name: string; resource?: boolean }) {
  return <img className={s.art} src={resource ? `/images/ui/creature-overview-a-v2/sculpted/${name}.webp` : `/images/ui/care-b/icons/${name}.webp`} alt=""/>;
}
function Meter({ label, value, max, icon, hearts = false }: { label: string; value: number; max: number; icon: string; hearts?: boolean }) {
  const percent = careMeterPercent(value, max);
  return <div className={s.resource} data-resource={label} data-level={percent <= 25 ? 'danger' : percent <= 60 ? 'warning' : 'ready'}>
    <Art name={hearts ? 'heart-gold' : icon} resource={!hearts}/><strong>{label}</strong>
    {hearts && max > 0 && max <= 5 && Number.isInteger(max) ? <div className={s.hearts} aria-hidden="true">{Array.from({ length: max }, (_, i) => <span key={i}><img src="/images/ui/care-b/icons/heart-gold.webp" alt=""/><i style={{width:`${careMeterPercent(value - i, 1)}%`}}><img src="/images/ui/care-b/icons/heart-gold.webp" alt=""/></i></span>)}</div> : <div className={s.meter} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max > 0 ? max : 1} aria-valuenow={Math.max(0, Math.min(max > 0 ? max : 1, value))}><i style={{width:`${percent}%`}}/></div>}
    <span className={s.value} aria-label={`${label} ${value} of ${max}`}>{value} / {max}</span>
  </div>;
}

export function CareLedger({ creature, injury, statusNote, bestStatLabels, renameValue, onRenameValueChange, onRename, onToggleLock, onFeed, onRelease, onDonate }: CareLedgerProps) {
  const [view, setView] = useState('care'), [dialog, setDialog] = useState<'health' | 'rename' | null>(null), [detailPage, setDetailPage] = useState(0);
  const shell = useRef<HTMLElement>(null);
  const [compactManagement, setCompactManagement] = useState(false), [managementPage, setManagementPage] = useState(0);
  useEffect(() => {
    const element = shell.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setCompactManagement(entry.contentRect.height < 480));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const state = getCarePresentation(creature, injury, statusNote);
  const details = [
    { title: 'Health & availability', lines: [`Current status: ${state.status}.`, injury ? `Recorded injury: ${creature.injuryLabel ?? 'Injured'}.` : 'No injury recorded.', state.description] },
    { title: 'Current resources', lines: [`Energy: ${creature.energy} / ${creature.maxEnergy}.`, `Affection: ${creature.affection} / 100.`, `Hearts: ${creature.hearts} / ${creature.maxHearts}.`] },
    { title: 'Creature record', lines: [`Origin: ${creature.originLabel}.`, `Strongest attributes: ${bestStatLabels.join(', ') || 'Balanced'}.`, creature.isLocked ? 'Protected from removal. Unlock before releasing or donating.' : 'Currently unlocked. Lock this creature to protect against removal.'] },
  ].flatMap(record => careDetailPages(record.lines).map(lines => ({ title: record.title, lines })));
  const canRename = renameValue !== undefined && onRenameValueChange && onRename;
  return <section ref={shell} className={s.shell} data-care-ledger data-view={view} aria-label="Care & Management">
    <nav className={s.focusTabs} aria-label="Care views"><button aria-pressed={view === 'care'} onClick={() => setView('care')}>Care</button><button aria-pressed={view === 'management'} onClick={() => setView('management')}>Management</button></nav>
    <article className={`${s.panel} ${s.health}`}>
      <header><Art name="heart-gold"/><h3>Health & care</h3><button onClick={() => {setDetailPage(0); setDialog('health');}}>View details ›</button></header>
      <div className={s.hero}><Art name={state.icon}/><div><h4>{state.title}</h4><p>{state.description}</p><strong className={s.badge} data-tone={state.tone}>{state.status}</strong></div></div>
      {state.status !== 'Ready' ? <p className={s.note}>{injury ? `Injury: ${creature.injuryLabel ?? 'Injured'}` : 'No injury recorded.'}</p> : null}
      <div className={s.resources}><Meter label="Energy" value={creature.energy} max={creature.maxEnergy} icon="energy"/><Meter label="Affection" value={creature.affection} max={100} icon="heart"/><Meter label="Hearts" value={creature.hearts} max={creature.maxHearts} icon="heart" hearts/></div>
      {onFeed ? <button className={s.feed} onClick={onFeed}>Feed creature ›</button> : null}
    </article>
    <aside className={s.management} data-paged={compactManagement} data-page={managementPage}>
      <article className={`${s.panel} ${s.identity}`}><header><Art name="management"/><h3>Management</h3></header>
        {canRename ? <button className={s.action} onClick={() => setDialog('rename')}><Art name="rename"/><span><strong>Rename</strong><small>{creature.nickname}</small></span><span aria-hidden="true">›</span></button> : null}
        {onToggleLock ? <button className={s.action} onClick={onToggleLock} aria-label={creature.isLocked ? 'Unlock creature' : 'Lock creature'}><Art name={creature.isLocked ? 'lock-closed' : 'lock-open'}/><span><strong>{creature.isLocked ? 'Unlock creature' : 'Lock creature'}</strong><small>{creature.isLocked ? 'Protected from removal.' : 'Currently unlocked.'}</small></span><span aria-hidden="true">›</span></button> : null}
      </article>
      {onRelease || onDonate ? <article className={`${s.panel} ${s.removal}`}><header><h3>Transfer or release</h3></header>
        {onRelease ? <button className={s.action} data-caution onClick={onRelease}><Art name="release"/><span><strong>Release</strong><small>Requires confirmation.</small></span><span aria-hidden="true">›</span></button> : null}
        {onDonate ? <button className={s.action} onClick={onDonate}><Art name="donate"/><span><strong>Donate</strong><small>Requires confirmation.</small></span><span aria-hidden="true">›</span></button> : null}
        <p>Review confirmation before removing a creature.</p>
      </article> : null}
      {compactManagement && (onRelease || onDonate) ? <nav className={s.managementPages} aria-label="Management pages"><button disabled={!managementPage} onClick={() => setManagementPage(0)}>Previous</button><span>{managementPage === 0 ? 'Identity & protection' : 'Transfer or release'}</span><button disabled={managementPage === 1} onClick={() => setManagementPage(1)}>Next</button></nav> : null}
    </aside>
    {dialog === 'health' ? <GameDialog title={`${creature.nickname} · Health & care`} onClose={() => setDialog(null)}><div className={s.dialog}><h3>{details[detailPage].title}</h3>{details[detailPage].lines.map((line, i) => <p key={i}>{line}</p>)}<nav aria-label="Health detail pages"><button disabled={!detailPage} onClick={() => setDetailPage(detailPage - 1)}>Previous detail</button><span>{detailPage + 1} / {details.length}</span><button disabled={detailPage + 1 >= details.length} onClick={() => setDetailPage(detailPage + 1)}>Next detail</button></nav><button onClick={() => setDialog(null)}>Back to Care</button></div></GameDialog> : null}
    {dialog === 'rename' && canRename ? <GameDialog title="Rename creature" onClose={() => setDialog(null)}><div className={s.dialog}><label>Creature name<input aria-label="Creature name" maxLength={24} value={renameValue} onChange={event => onRenameValueChange(event.target.value)}/></label><nav><button onClick={() => setDialog(null)}>Cancel</button><button disabled={!renameValue?.trim()} onClick={() => {onRename(); setDialog(null);}}>Save name</button></nav></div></GameDialog> : null}
  </section>;
}
