"use client";
import { useState } from 'react';
import type { FamilyRecord } from '@/types/family';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './LineageLedger.module.css';

export function FamilyArt({ name = 'lineage' }: { name?: string }) { return <img className={s.art} src={name === 'notes' ? '/images/ui/guild-v1/quill.webp' : name === 'assessment' ? '/images/ui/icons/icon_contract_scroll.png' : `/images/ui/creature-overview-a-v2/painted-r4/${name}.webp`} alt=""/>; }
export const birthAssessment = (r: FamilyRecord) => !r.parentageRecorded || !r.assessment ? 'Not recorded' : r.assessment === 'No Risk' ? 'No close family detected' : r.assessment;

export function FamilyRecordWindow({ record, onClose, atRanch }: { record: FamilyRecord; onClose: () => void; atRanch: boolean }) {
  const [page, setPage] = useState(0);
  const pages = [
    `Generation: ${record.generation ?? 'Not recorded'}. Origin: ${record.origin ?? 'Not recorded'}. ${record.kind === 'player' ? 'Player contributor record.' : atRanch ? 'Currently at the ranch.' : record.kind === 'unknown' ? 'Parent identity is not recorded.' : 'Historical record; this relative is not currently at the ranch.'}`,
    `Birth assessment: ${birthAssessment(record)}. Recorded at hatching; check each new breeding pair separately.`,
    `Lineage markers: ${record.markers.length ? record.markers.join(', ') : 'None recorded'}.`,
    ...(record.notes.length ? record.notes : ['No additional notes recorded.']),
  ].flatMap(text => text.match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) ?? [text]);
  return <GameDialog title={`${record.name} · Family record`} titleIcon={<FamilyArt/>} onClose={onClose}>
    <div className={s.recordDialog} data-family-record><h3>{record.name}</h3><p>{pages[Math.min(page, pages.length - 1)]}</p><nav aria-label="Family record pages"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous detail</button><span aria-live="polite">{page + 1} / {pages.length}</span><button disabled={page + 1 >= pages.length} onClick={() => setPage(page + 1)}>Next detail</button></nav><button onClick={onClose}>Back to family</button></div>
  </GameDialog>;
}
