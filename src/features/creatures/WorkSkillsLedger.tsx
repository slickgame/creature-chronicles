"use client";
import { useEffect, useRef, useState } from 'react';
import { getChoreSkillAptitudeLabel, MAX_CHORE_SKILL_LEVEL } from '@/data/choreSkills';
import { getWorkSkillLedger, WORK_SKILL_FILTERS, type WorkSkillEntry, type WorkSkillFilter } from '@/data/workSkillLedger';
import type { CreatureRecord } from '@/types/creature';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './WorkSkillsLedger.module.css';

export function WorkSkillArt({ index }: { index: number }) {
  return <span className={s.art} aria-hidden="true" style={{ backgroundPosition: `${index % 4 * 100 / 3}% ${Math.floor(index / 4) * 100}%` }}/>;
}
function SkillXp({ entry, label }: { entry: WorkSkillEntry; label?: string }) {
  const p = entry.progress;
  if (!p) return <span className={s.pending}>To be defined</span>;
  if (entry.id === 'cleaning') return <span className={s.pending}>Planned habitat action</span>;
  return <span className={s.xp}><span>{p.xpToNext ? `${p.xp} / ${p.xpToNext}` : 'Mastered'}</span><progress aria-label={label ?? `${entry.title} skill XP`} value={p.xpToNext ? p.xp : 1} max={p.xpToNext || 1}/></span>;
}
export function WorkSkillsLedger({ creature }: { creature: CreatureRecord }) {
  const entries = getWorkSkillLedger(creature);
  const [filter, setFilter] = useState<WorkSkillFilter>('all');
  const [selections, setSelections] = useState<Record<WorkSkillFilter, string>>({ all: 'materials', gathering: 'materials', making: 'crafting', care: 'breeding' });
  const [view, setView] = useState<'skills' | 'selected'>('skills');
  const [detail, setDetail] = useState(false);
  const [capacity, setCapacity] = useState(3);
  const rowArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = rowArea.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry.contentRect.height) return;
      const rowHeight = window.innerHeight <= 550 ? 43 : window.innerWidth <= 850 ? 54 : 56;
      setCapacity(Math.max(1, Math.min(8, Math.floor(entry.contentRect.height / rowHeight))));
    });
    observer.observe(node);return () => observer.disconnect();
  }, []);
  const filtered = entries.filter(entry => filter === 'all' || entry.group === filter);
  const selectedIndex = Math.max(0, filtered.findIndex(entry => entry.id === selections[filter]));
  const selected = filtered[selectedIndex];
  const page = Math.floor(selectedIndex / capacity), pages = Math.max(1, Math.ceil(filtered.length / capacity));
  const visible = filtered.slice(page * capacity, (page + 1) * capacity);
  function select(id: string) { setSelections(old => ({ ...old, [filter]: id })); }
  return <section className={s.shell} data-work-ledger data-view={view} aria-label="Work Skills ledger">
    <nav className={s.filters} aria-label="Skill categories">{WORK_SKILL_FILTERS.map(group => <button key={group.id} aria-pressed={filter === group.id} onClick={() => { setFilter(group.id); setView('skills'); }}>
      {group.icon === 'all' ? <img src="/images/ui/forge-slate-v2/icons/all.svg" alt=""/> : <WorkSkillArt index={group.id === 'gathering' ? 0 : group.id === 'making' ? 4 : 6}/>}{group.label}
    </button>)}</nav>
    <div className={s.heading}><h3>Work Skills</h3><span>{filtered.length} skills</span></div>
    <div className={s.focusTabs} aria-label="Work skill view"><button aria-pressed={view === 'skills'} onClick={() => setView('skills')}>Skills</button><button aria-pressed={view === 'selected'} onClick={() => setView('selected')}>Selected skill</button></div>
    <div className={s.columns} aria-hidden="true"><span>Skill</span><span>Level</span><span>Skill XP</span></div>
    <div className={s.rows} ref={rowArea} aria-label="Work skill rows">{visible.map(entry => <button key={entry.id} className={s.row} data-work-row aria-pressed={selected.id === entry.id} aria-label={`Select ${entry.title}`} onClick={() => select(entry.id)}>
      <span className={s.name}><WorkSkillArt index={entry.icon}/><span><strong>{entry.title}</strong><small>{entry.purpose}</small>{entry.planned ? <span className={s.badge}>{entry.id === 'breeding' ? 'To be defined' : entry.id === 'cleaning' ? 'Planned' : 'Recipe training planned'}</span> : null}</span></span>
      <span className={s.level}>{entry.progress ? <><strong>Lv {entry.progress.level} / {MAX_CHORE_SKILL_LEVEL}</strong><small>{getChoreSkillAptitudeLabel(entry.progress.level)}</small></> : <small>To be defined</small>}</span><SkillXp entry={entry}/>
    </button>)}</div>
    {pages > 1 ? <nav className={s.pager} aria-label="Work skill pages"><button disabled={!page} onClick={() => select(filtered[(page - 1) * capacity].id)}>Previous</button><span aria-live="polite">{page + 1} of {pages}</span><button disabled={page + 1 >= pages} onClick={() => select(filtered[(page + 1) * capacity].id)}>Next</button></nav> : null}
    <div className={s.selected} aria-label="Selected work skill"><WorkSkillArt index={selected.icon}/><div className={s.selectedCopy}><strong>{selected.title}</strong><span>{selected.purpose}.</span></div><div className={s.selectedFacts}><span>Current level</span><strong>{selected.progress ? `${selected.progress.level} / ${MAX_CHORE_SKILL_LEVEL}` : 'To be defined'}</strong><small>{selected.baseline === null ? 'Progression planned' : `Natural starting level: ${selected.baseline}`}</small></div><button onClick={() => setDetail(true)}>View skill details <span aria-hidden="true">›</span></button></div>
    <p className={s.note}>Work uses creature Energy · No Gold operating charge</p>
    {detail ? <WorkSkillDetails key={selected.id} creature={creature} entry={selected} onClose={() => setDetail(false)}/> : null}
  </section>;
}
function WorkSkillDetails({ creature, entry, onClose }: { creature: CreatureRecord; entry: WorkSkillEntry; onClose: () => void }) {
  const [page, setPage] = useState(0);const p = entry.progress;
  return <GameDialog title={`${entry.title} · Skill details`} titleIcon={<WorkSkillArt index={entry.icon}/>} onClose={onClose}>
    <div className={s.dialog} data-work-details>
      <nav className={s.detailTabs} aria-label="Skill detail sections">{['Progress', 'Use & training', 'Creature context'].map((label, index) => <button key={label} aria-pressed={page === index} onClick={() => setPage(index)}>{label}</button>)}</nav>
      {page === 0 ? <><h3>{entry.title}</h3><div className={s.facts}><div><span>Current level</span><strong>{p ? `${p.level} / ${MAX_CHORE_SKILL_LEVEL}` : 'To be defined'}</strong></div><div><span>Natural starting level</span><strong>{entry.baseline ?? 'To be defined'}</strong></div></div>
        <div className={s.xpBox}><span>Skill XP toward next level</span><SkillXp entry={entry} label="Selected work skill XP"/></div>
        <p>{p && entry.baseline !== null ? p.level > entry.baseline ? `Trained ${p.level - entry.baseline} levels above the natural starting level.` : 'No extra skill levels trained yet.' : 'Breeding skill benefits and progression are still to be defined.'}</p>
        {entry.planned ? <p className={s.notice}>{entry.planned}. {entry.id === 'crafting' || entry.id === 'cooking' ? 'Saved proficiency is shown; recipe actions do not train this skill yet.' : 'This skill has no active action or bonus yet.'}</p> : <p className={s.notice}>Complete matching work to gain skill XP. At level 20, the skill is mastered. Creature level and skill level are separate.</p>}
      </> : page === 1 ? <><h3>Use & training</h3><p>{entry.training}</p>{!entry.planned ? <p>Higher proficiency improves work output and can reduce its Energy cost. The work preview shows the exact result and cost before you act.</p> : null}</> : <><h3>{creature.nickname}</h3><p>Creature level {creature.level}. {entry.title} {p ? `level ${p.level}` : 'progression is not defined'}.</p><p>Equipment does not improve farm work or change these skill records. Browsing this page spends no XP, Energy or Gold.</p></>}
      <footer><span>{page + 1} / 3 · Read-only</span><button onClick={onClose}>Back to Work Skills</button></footer>
    </div>
  </GameDialog>;
}
