"use client";

import { useEffect, useRef, useState } from 'react';
import { getCreatureTalentPresentations, TALENT_FILTERS, type TalentFilter, type TalentPresentation } from '@/data/talents/talentPresentation';
import type { CreatureRecord } from '@/types/creature';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './TalentsLedger.module.css';

const FILTERS = { all: ['All', '/images/ui/forge-slate-v2/icons/all.svg'], work: ['Work', '/images/ui/creature-overview-a-v2/painted-r4/work.webp'], battle: ['Battle', '/images/ui/creature-overview-a-v2/painted-r4/equipment.webp'], care: ['Care', '/images/ui/creature-overview-a-v2/painted-r4/care.webp'] };
function TalentArt({ talent }: { talent: TalentPresentation }) { return <img className={s.art} src={talent.iconPath} alt=""/>; }

export function TalentsLedger({ creature, onWorkSkills }: { creature: CreatureRecord; onWorkSkills?: () => void }) {
  const { currentSave } = useGameContext();
  const talents = getCreatureTalentPresentations(creature, currentSave ?? undefined);
  const [filter, setFilter] = useState<TalentFilter>('all');
  const [selection, setSelection] = useState<Partial<Record<TalentFilter, string>>>({});
  const [detail, setDetail] = useState(false);
  const [focused, setFocused] = useState(false);
  const [capacity, setCapacity] = useState(2);
  const rowArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = rowArea.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height) setCapacity(Math.max(1, Math.min(6, Math.floor(entry.contentRect.height / (window.innerHeight <= 550 ? 40 : window.innerWidth <= 850 ? 74 : 64)))));
    });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  const filtered = talents.filter(t => filter === 'all' || t.filters.includes(filter));
  const index = Math.max(0, filtered.findIndex(t => t.id === selection[filter]));
  const selected = filtered[index];
  const page = Math.floor(index / capacity), pages = Math.max(1, Math.ceil(filtered.length / capacity));
  const select = (id: string) => setSelection(old => ({ ...old, [filter]: id }));
  return <section className={s.shell} data-talents-ledger data-focused={focused} aria-label="Talents register">
    <nav className={s.filters} aria-label="Talent categories">{TALENT_FILTERS.map(id => <button key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setFocused(false); }}><img src={FILTERS[id][1]} alt=""/>{FILTERS[id][0]}</button>)}<span>{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span></nav>
    <div className={s.columns} aria-hidden="true"><span>Talent</span><span>Grade</span><span>Effect</span><span>Applies to</span></div>
    <div className={s.rows} ref={rowArea} aria-label="Owned talents">{filtered.slice(page * capacity, (page + 1) * capacity).map(t => <button className={s.row} key={t.id} data-talent-row aria-pressed={selected?.id === t.id} aria-label={`Select ${t.name}`} onClick={() => select(t.id)} onDoubleClick={() => { select(t.id); setDetail(true); }}>
      <span className={s.name}><TalentArt talent={t}/><span><strong>{t.name}</strong><small>Grade {t.grade}</small></span></span><span className={s.grade}>{t.grade}</span><span className={s.effect}>{t.effectSummary}</span><span className={s.applies}>{t.appliesTo.join(', ') || 'See full details'}</span>
    </button>)}{!filtered.length ? <p className={s.empty}>{talents.length ? 'No talents match this category.' : 'No talents recorded for this creature.'}</p> : null}</div>
    <nav className={s.pager} aria-label="Talent pages"><button disabled={!page} onClick={() => select(filtered[(page - 1) * capacity].id)}>Previous</button><span aria-live="polite">{page + 1} / {pages}</span><button disabled={page + 1 >= pages} onClick={() => select(filtered[(page + 1) * capacity].id)}>Next</button></nav>
    {selected ? <article className={s.selected} aria-label="Selected talent">
      <header><TalentArt talent={selected}/><div><h3>{selected.name}</h3><span>Grade {selected.grade} · {selected.sourceLabel}</span></div><button className={s.full} onClick={() => setDetail(true)}>View full details ›</button></header>
      <dl><dt>Effect</dt><dd>{selected.effectSummary}</dd><dt>Applies to</dt><dd>{selected.appliesTo.join(', ') || 'See full details'}</dd><dt>Source</dt><dd>{selected.sourceLabel}</dd><dt>When it works</dt><dd>{selected.condition ?? (selected.when.join(' ') || 'See full details')}</dd></dl>
      <footer>{selected.filters.includes('work') && onWorkSkills ? <button onClick={onWorkSkills}>View Work Skills ›</button> : <span>Talents apply automatically</span>}<button className={s.focus} onClick={() => setFocused(!focused)}>{focused ? 'Back to talents' : 'Selected talent ›'}</button></footer>
    </article> : null}
    {detail && selected ? <TalentDetails key={selected.id} talent={selected} onClose={() => setDetail(false)}/> : null}
  </section>;
}

export function TalentDetails({ talent, onClose }: { talent: TalentPresentation; onClose: () => void }) {
  const [page, setPage] = useState(0);
  // Bounded text pages retain every saved description and condition, including legacy records.
  const entries = [
    { title: 'Effect', text: talent.effectSummary },
    ...talent.effects.flatMap(e => [{ title: `${e.status === 'active' ? 'Applies to' : e.status[0].toUpperCase() + e.status.slice(1) + ' effect'}`, text: `${e.label}. ${e.appliesTo.join(', ')}. ${e.when}` }, ...e.notes.map(text => ({ title: 'Details', text }))]),
    { title: 'Source', text: `${talent.sourceLabel} · Grade ${talent.grade}` },
    ...(talent.condition ? [{ title: 'Current condition', text: talent.condition }] : []),
    { title: 'Stacking', text: talent.stacking },
    ...talent.notes.map(text => ({ title: 'Availability', text })),
    ...(talent.inheritanceOrigin ? [{ title: 'Inheritance record', text: talent.inheritanceOrigin.kind === 'parent' ? `Inherited from ${talent.inheritanceOrigin.parentName ?? 'a recorded parent'}.` : 'Acquired through a mutation.' }] : []),
  ].flatMap(entry => {
    const words = entry.text.split(/\s+/), result: { title: string; text: string }[] = []; let text = '';
    for (const word of words) { if (text.length + word.length > 220 && text) { result.push({ title: entry.title, text }); text = ''; } text += `${text ? ' ' : ''}${word}`; }
    if (text) result.push({ title: entry.title, text }); return result;
  });
  const entry = entries[Math.min(page, entries.length - 1)];
  return <GameDialog title={`${talent.name} · Talent details`} titleIcon={<TalentArt talent={talent}/>} onClose={onClose}>
    <div className={s.dialog} data-talent-details><div className={s.detailIdentity}><TalentArt talent={talent}/><div><h3>{talent.name}</h3><span>Grade {talent.grade} · {talent.sourceLabel}</span></div></div>
      <article className={s.detailCard}><h4>{entry.title}</h4><p>{entry.text}</p></article>
      <nav className={s.pager} aria-label="Talent detail pages"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous detail</button><span aria-live="polite">{page + 1} / {entries.length}</span><button disabled={page + 1 >= entries.length} onClick={() => setPage(page + 1)}>Next detail</button></nav>
      <footer><span>Automatic · No talent training required</span><button onClick={onClose}>Back to Talents</button></footer>
    </div>
  </GameDialog>;
}
