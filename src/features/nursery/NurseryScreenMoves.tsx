"use client";
import {useMemo,useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {pregnancyInheritanceModel,eggInheritanceModel,birthInheritanceModel} from '@/data/nurseryInheritanceLedger';
import {NurseryScreen as LedgerNurseryScreen} from './NurseryScreenLedger';
import {NurseryInheritanceLedgerC} from './NurseryInheritanceLedgerC';
import {GameDialog} from '@/features/ui/GameDialog';
export function NurseryScreen(){
 const {currentSave}=useGameContext();const [open,setOpen]=useState(false),[selected,setSelected]=useState<string|null>(null),[page,setPage]=useState(0);
 const records=useMemo(()=>currentSave?[
 ...(currentSave.pregnancies??[]).filter(p=>p.inheritance.battleMoveInheritance).map(pregnancyInheritanceModel),
 ...(currentSave.eggs??[]).filter(e=>e.status!=='hatched'&&e.battleMoveInheritance).map(eggInheritanceModel),
 ...(currentSave.birthHistory??[]).filter(b=>b.startingBattleMoveLoadout||b.inheritedMoveIds?.length||b.combinationMoveIds?.length).map(b=>birthInheritanceModel(b,currentSave.eggs?.find(e=>e.eggId===b.eggId)))
 ]:[],[currentSave]);const record=records.find(r=>r.id===selected);const pages=Math.max(1,Math.ceil(records.length/6)),currentPage=Math.min(page,pages-1);
 return <><LedgerNurseryScreen headerLinks={currentSave?<button onClick={()=>setOpen(true)}>Move Lineage {records.length?`(${records.length})`:''}</button>:null}/>{open&&!record&&<GameDialog title="Move Lineage" onClose={()=>setOpen(false)} wide>{records.length?<div style={{display:'grid',gap:12}}>{records.slice(currentPage*6,currentPage*6+6).map(r=><button key={`${r.stage}-${r.id}`} onClick={()=>setSelected(r.id)}>{r.name} · {r.stage} · {r.direct.length} inherited · {r.combinations.length} combinations</button>)}<nav aria-label="Move lineage record pages"><button disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>‹ Previous</button><span> {currentPage+1} / {pages} </span><button disabled={currentPage>=pages-1} onClick={()=>setPage(currentPage+1)}>Next ›</button></nav></div>:<p>No saved move-inheritance records yet.</p>}</GameDialog>}{open&&record&&<NurseryInheritanceLedgerC key={record.id} record={record} initialTab="Combat Moves" onClose={()=>setSelected(null)}/>}</>;
}
