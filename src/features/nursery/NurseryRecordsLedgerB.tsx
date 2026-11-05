"use client";
import { LedgerPageTurn, useLedgerPageTurn } from "@/features/ui/LedgerPageTurn";
import { GameDialog } from '@/features/ui/GameDialog';
import s from './NurseryRecordsLedgerB.module.css';

export type NurseryLedgerRecord = {
  id:string; name:string; art?:string; badge?:string; parents:string;
  daysRemaining?:number; progress?:number; expected?:string;
  hatchedDay?:number; legacy?:boolean;
};

/** Read-only collection navigation. All timers and inheritance come from the saved record. */
export function NurseryRecordsLedgerB({kind,records,selectedId,onSelect,onBack,onDetails,onVisitBreeding}:{
  kind:'pregnancies'|'births'; records:NurseryLedgerRecord[]; selectedId?:string;
  onSelect:(id:string)=>void; onBack:()=>void;
  onDetails:(id:string)=>void; onVisitBreeding:()=>void;
}) {
  const { direction, turning, turnPage, finishTurn } = useLedgerPageTurn();
  const index=Math.max(0,records.findIndex(r=>r.id===selectedId));
  const record=records[index];
  const pregnancy=kind==='pregnancies';
  const emptyTitle=pregnancy?'No active pregnancies':'No births recorded yet';
  const title=record?(pregnancy?'Expected egg delivery':record.name):emptyTitle;
  return <GameDialog title={pregnancy?'Pregnancy records':'Birth records'} onClose={onBack} fullScreen dialogClassName={s.dialog}>
    <main className={s.book} aria-busy={turning} data-nursery-records-b data-kind={kind} data-empty={!record}>
      <section className={s.left} aria-label={record?'Record identity':'Nursery archive'}>
        <button className={s.back} onClick={onBack}>‹ Back to Nursery</button>
        <div className={s.identity}>
          <div className={s.portrait}>
            {record?.art?<img src={record.art} alt={`${record.name} portrait`}/>:<div className={s.blank}>
              <svg viewBox="0 0 160 140" aria-hidden="true"><path d="M18 27Q48 15 80 31Q112 15 142 27V112Q110 103 80 118Q50 103 18 112Z"/><path d="M80 31V118M30 42Q53 34 69 42M30 55Q53 47 69 55M30 68Q53 60 69 68M91 42Q112 34 130 42M91 55Q112 47 130 55M91 68Q112 60 130 68"/></svg>
              {record&&<span>Portrait not recorded</span>}
            </div>}
          </div>
          <h2 className={s.ribbon}>{record?.name??(pregnancy?'A new beginning':'Ranch memories')}</h2>
        </div>
        {record&&<nav className={s.pager} aria-label={pregnancy?'Pregnancy records pages':'Birth records pages'}>
          <button aria-label="Previous record" disabled={index===0} aria-disabled={turning || index===0} onClick={()=>{ const previous=records[index-1]; if(previous) turnPage("previous",()=>onSelect(previous.id)); }}>‹</button>
          <span aria-live="polite">{index+1} of {records.length}</span>
          <button aria-label="Next record" disabled={index===records.length-1} aria-disabled={turning || index===records.length-1} onClick={()=>{ const next=records[index+1]; if(next) turnPage("next",()=>onSelect(next.id)); }}>›</button>
        </nav>}
      </section>
      <section className={s.right} aria-label="Selected record summary">
        <div className={s.summary}>
          <h1>{title}</h1>
          {record?.badge&&<p className={s.badge}>{record.badge}</p>}
          <div className={s.rule} aria-hidden="true">✦</div>
          {record?<>
            {pregnancy?<>
              <p className={s.parents}><b>Parents:</b> {record.parents}</p>
              <div className={s.timing}>
                <p className={s.days}>{record.daysRemaining===0?'Delivery due':`${record.daysRemaining} day${record.daysRemaining===1?'':'s'} remaining`}</p>
                <progress max={100} value={record.progress??0} aria-label="Pregnancy progress"/>
                <p className={s.expected}>Expected {record.expected}</p>
              </div>
              <p className={s.note}>Sleep advances delivery.</p>
              <p className={s.incubation}>A delivered egg begins its own incubation.</p>
            </>:<>
              <p className={s.hatched}>{record.legacy?'Legacy hatch record':`Hatched on Ranch Day ${record.hatchedDay}`}</p>
              <p className={s.parents}><b>Parents:</b> {record.parents}</p>
              {record.legacy&&<p className={s.note}>This older save retains its original egg record.</p>}
            </>}
          </>:<p className={s.emptyNote}>{pregnancy?'Successful breeding starts a pregnancy. Sleep advances egg delivery.':'Hatched offspring appear here with their parents and inherited grades.'}</p>}
          <div className={s.rule} aria-hidden="true">✦</div>
          <button className={s.primary} disabled={turning} onClick={()=>record?onDetails(record.id):onVisitBreeding()}>{record?(pregnancy?'Inheritance details':'Birth details'):'Visit Breeding'}</button>
        </div>
      </section>
      <LedgerPageTurn direction={direction} onFinish={finishTurn} />
    </main>
  </GameDialog>;
}
