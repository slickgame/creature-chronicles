"use client";

import { useMemo, useState } from 'react';
import { useGameContext } from '@/state/GameProvider';
import { buildFamilyArchive, creatureFamilyId } from '@/data/familyArchive';
import type { CreatureRecord } from '@/types/creature';
import { FamilyArt, FamilyRecordWindow, birthAssessment } from './FamilyRecordWindow';
import { FamilyTreeWindow } from './FamilyTreeWindow';
import s from './LineageLedger.module.css';


export function LineageLedger({ creature }: { creature: CreatureRecord }) {
  const { currentSave } = useGameContext();
  const records = useMemo(() => currentSave ? buildFamilyArchive(currentSave).records : {}, [currentSave]);
  const [tree, setTree] = useState(false), [recordId, setRecordId] = useState<string | null>(null), [parentPage, setParentPage] = useState(0), [view, setView] = useState('family');
  const id = creatureFamilyId(creature.creatureId), record = records[id];
  if (!record) return <p>Family record not available.</p>;
  const parents = record.parents.map(pid => records[pid]).filter(Boolean), pages = Math.max(1, Math.ceil(parents.length / 2));
  const page = Math.min(parentPage, pages - 1), owned = new Set(currentSave?.creatures?.map(c => creatureFamilyId(c.creatureId)));
  return <section className={s.shell} data-lineage-ledger data-view={view} aria-label="Lineage family records">
    <header className={s.heading}><FamilyArt/><h3>Lineage</h3><span>Generation {record.generation ?? '—'}</span><span>{creature.origin === 'hatched' ? 'Hatched' : creature.origin === 'starter' ? 'Starter' : 'Origin record'}</span></header>
    <nav className={s.focusTabs} aria-label="Lineage views"><button aria-pressed={view === 'family'} onClick={() => setView('family')}>Family</button><button aria-pressed={view === 'records'} onClick={() => setView('records')}>Birth record & notes</button></nav>
    <article className={s.parents}><header><h4>Recorded parents</h4><span>Names remain if a parent leaves the ranch.</span></header><div className={s.parentCards}>
      {parents.length ? parents.slice(page * 2, page * 2 + 2).map(p => <div className={s.parent} key={p.id}><FamilyArt name={p.kind === 'player' ? 'identity' : 'creatures'}/><div><strong>{p.name}</strong><small>{p.kind === 'unknown' ? 'Identity not recorded' : p.kind === 'player' ? 'Player contributor' : owned.has(p.id) ? 'At the ranch' : 'Record only'}</small></div><button onClick={() => setRecordId(p.id)}>View parent ›</button></div>) : <div className={s.noParents}><FamilyArt/><p>Parents not recorded.<small>This creature has no recorded parent links.</small></p></div>}
    </div>{pages > 1 ? <nav><button disabled={!page} onClick={() => setParentPage(page - 1)}>Previous parents</button><span>{page + 1} / {pages}</span><button disabled={page + 1 >= pages} onClick={() => setParentPage(page + 1)}>Next parents</button></nav> : null}</article>
    <button className={s.assessment} onClick={() => setRecordId(id)}><FamilyArt name="assessment"/><span><strong>Birth assessment</strong><span>{birthAssessment(record)}</span><small>Recorded at hatching. Check each new pairing separately.</small></span><span aria-hidden="true">›</span></button>
    <button className={s.markers} onClick={() => setRecordId(id)}><FamilyArt name="talents"/><span><strong>Lineage markers</strong><span>{record.markers.length ? `${record.markers.length} recorded · View details` : 'None recorded'}</span></span><span aria-hidden="true">›</span></button>
    <button className={s.notes} onClick={() => setRecordId(id)}><FamilyArt name="notes"/><span><strong>Ranch notes</strong><span>{record.notes.length ? 'View recorded notes' : 'No additional notes'}</span></span><span aria-hidden="true">›</span></button>
    <footer><button onClick={() => setTree(true)}><FamilyArt name="lineage"/>View full record ›</button></footer>
    {recordId && records[recordId] ? <FamilyRecordWindow key={recordId} record={records[recordId]} atRanch={owned.has(recordId)} onClose={() => setRecordId(null)}/> : null}
    {tree ? <FamilyTreeWindow records={records} focalId={id} owned={owned} onClose={() => setTree(false)}/> : null}
  </section>;
}
