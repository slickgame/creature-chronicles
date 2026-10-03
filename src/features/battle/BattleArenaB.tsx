"use client";

import { useState, type ReactNode } from "react";
import { BATTLE_MENU_CATEGORIES, getBattleMenuOptions, getBattleOrderPreview, type BattleMenuCategory } from "@/data/battleInterface";
import { getBattleMove } from "@/data/battleMoves";
import { getBattleTargetTypeLabel, getBattleUiMoveAvailability, type BattleUiTarget } from "@/data/battleUi";
import { getBattleEffectGlossary, getBattleStatusGlossary } from "@/data/battleGlossary";
import { getEffectiveBattleStats, previewBattleAction, getLegalBattleTargetIds } from "@/data/battleEngine";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { BATTLE_STAT_LABELS } from "@/data/equipmentComparison";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import type { BattleAction, BattleCombatantId, BattleMove, BattleState, BattleStatKey } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { useBattlePresentationController } from "./useBattlePresentationController";
import { BattleResultLedger, type BattleResultLedgerData } from "./BattleResultLedger";
import { BattleStatusBadges, StatusIcon, statusLabel } from "./BattleStatusBadges";
import s from "./BattleArenaB.module.css";

const ART = "/images/ui/battle-v1/";
const FALLBACK = "/images/ui/coliseum-v1/circuit.webp";
type Presentation = ReturnType<typeof useBattlePresentationController>;
export type BattleArenaBProps = {
  title: string; battleState: BattleState; sourceById: ReadonlyMap<string, CreatureRecord>;
  selectedTarget: BattleUiTarget | null; activeActorId: BattleCombatantId | null;
  queuedActions: ReadonlyMap<BattleCombatantId, BattleAction>; presentation: Presentation;
  onTarget: (target: BattleUiTarget) => void; onPlan: (id: BattleCombatantId) => void;
  onQueue: (moveId: string) => void; onConfirm: () => void; onReturn: () => void; onForfeit: () => void;
  onItem: (item: "tonic" | "revival") => void; tonicStock: number; revivalStock: number;
  usedTonic: boolean; usedRevival: boolean; aidRestricted?: boolean;
  resultLedger?: BattleResultLedgerData; complete: boolean; recording: boolean; result: ReactNode; message: string; rules?: ReactNode;
};

function artwork(source: CreatureRecord | undefined, full = false) {
  if (!source) return FALLBACK;
  const variant = getVariantDefinition(source.variantId);
  return full ? source.profilePath || variant.profilePath || source.portraitPath || variant.portraitPath || FALLBACK
    : source.portraitPath || variant.portraitPath || FALLBACK;
}
function Meter({ label, value, max }: { label: "HP" | "BE"; value: number; max: number }) {
  return <span className={s.meter} data-kind={label}><i style={{ width: `${Math.max(0,Math.min(100,value/Math.max(1,max)*100))}%` }} /><b>{label} {value}/{max}</b></span>;
}
function MoveDetails({ move }: { move: BattleMove }) {
  return <><h3>{move.name}</h3><p>{move.description}</p><p>Power {move.power} · Move accuracy {move.accuracy}% · Energy {move.battleEnergyCost} · Cooldown {move.cooldown} rounds · Priority {move.priority}</p><p>Targets: {getBattleTargetTypeLabel(move.targetType)}. Move accuracy is a base value; actual hit chance also depends on combat stats and effects.</p>{move.effects.map((effect,i)=>{const entry=getBattleEffectGlossary(effect.type);return <section key={i}><h4>{entry.label}{effect.status?` · ${getBattleStatusGlossary(effect.status).label}`:""}</h4><p>{entry.mechanics}</p><p>{effect.amount!==undefined?`Amount: ${effect.amount}. `:""}{effect.chance!==undefined?`Base chance: ${effect.chance}%. `:""}{effect.duration!==undefined?`Duration: ${effect.duration} rounds. `:""}{effect.target?`Recipient: ${effect.target.replaceAll("_"," ")}. `:""}{effect.note}</p></section>;})}</>;
}

function MoveMenu({ state, actorId, target, resolving, onQueue, onTarget, onSelectMove }: { onSelectMove:(id:string|null)=>void; onTarget:(target:BattleUiTarget)=>void; state: BattleState; actorId: string | null; target: BattleUiTarget | null; resolving: boolean; onQueue: (id:string)=>void }) {
  const [category,setCategory]=useState<BattleMenuCategory>("All");
  const [page,setPage]=useState(0),[moveId,setMoveId]=useState<string|null>(null),[details,setDetails]=useState(false);
  const [view,setView]=useState<"moves"|"preview">("moves");
  const [effectPage,setEffectPage]=useState(0);
  const options=getBattleMenuOptions(state,actorId,target);
  const filtered=options.filter(option=>category==="All"||option.category===category);
  const pages=Math.max(1,Math.ceil(filtered.length/3)),currentPage=Math.min(page,pages-1);
  const shown=filtered.slice(currentPage*3,currentPage*3+3);
  const selected=shown.find(option=>option.move.id===moveId)??shown[0];
  const actor=actorId?state.combatants[actorId]:null;
  const targetName=target?.kind==="field"?"Battlefield":target?.kind==="combatant"?state.combatants[target.combatantId]?.name:"Choose target";
  const availability=actor&&selected&&target?getBattleUiMoveAvailability(state,actor.battleCombatantId,selected.move.id,target):null;
  const targetNames=availability?.normalizedTargetIds.map(id=>state.combatants[id].name)??[];
  const projections=actor&&selected&&target&&availability?.compatible?previewBattleAction(state,{actorId:actor.battleCombatantId,moveId:selected.move.id,targetIds:target.kind==="combatant"?[target.combatantId]:[]}):[];
  return <div className={s.moveMenu} data-view={view}>
    <div className={s.moveTabs}><button aria-pressed={view==="moves"} onClick={()=>setView("moves")}>Choose move</button><button aria-pressed={view==="preview"} onClick={()=>setView("preview")}>Preview & queue</button></div>
    <h2>{actor?`${actor.name} · Choose a Move`:"All actions planned"}</h2>
    <div className={s.categories} role="group" aria-label="Move categories">{BATTLE_MENU_CATEGORIES.map(name=><button key={name} aria-pressed={category===name} disabled={resolving||!actor} onClick={()=>{setCategory(name);setPage(0);setMoveId(null);onSelectMove(null);}}><img src={ART+name.toLowerCase()+".webp"} alt=""/><span>{name} ({options.filter(o=>name==="All"||o.category===name).length})</span></button>)}</div>
    <div className={s.moves} aria-label="Equipped moves">{shown.map(option=><button key={option.move.id} aria-pressed={selected?.move.id===option.move.id} data-unavailable={!option.usable} disabled={resolving} onClick={()=>{setMoveId(option.move.id);onSelectMove(option.move.id);setEffectPage(0);setView("preview");}}><strong>{option.move.name}</strong><small>Energy {option.move.battleEnergyCost}{option.cooldown>0?` · Cooldown ${option.cooldown}`:""}</small><small>{option.reasons[0]??"Ready"}</small></button>)}{!shown.length&&<p>{actor?"No equipped moves in this category.":"Edit a teammate’s action or confirm the round."}</p>}</div>
    <div className={s.pager}><button aria-label="Previous moves" disabled={currentPage===0||resolving} onClick={()=>{setPage(currentPage-1);setMoveId(null);onSelectMove(null);}}>‹</button><span>Page {currentPage+1}/{pages} · {filtered.length} moves</span><button aria-label="Next moves" disabled={currentPage===pages-1||resolving} onClick={()=>{setPage(currentPage+1);setMoveId(null);onSelectMove(null);}}>›</button></div>
    <section className={s.moveSummary}>{selected?<><h3>{selected.move.name}</h3><p>Energy {selected.move.battleEnergyCost} · Power {selected.move.power} · Accuracy {selected.move.accuracy}%</p><div className={s.targetPicker}><strong title={targetNames.join(", ")}>{targetNames.length>1?`Targets · ${targetNames.join(", ")}`:`Target · ${targetName}`}</strong>{selected.move.targetType==="field"?<button onClick={()=>onTarget({kind:"field"})}>Select battlefield</button>:<small>Click a target, then click it again to queue.</small>}</div>
      <div className={s.projections} aria-label="Projected effects">{!availability?.compatible?<p>Choose a compatible target to preview effects.</p>:projections.slice(Math.min(effectPage,Math.max(0,projections.length-1)),Math.min(effectPage,Math.max(0,projections.length-1))+1).map((entry,i)=><p key={i}><strong>{entry.name}</strong>: {entry.description}<small>Hit {entry.hitChance}%{entry.effectChance<100?` · Effect ${entry.effectChance}% if hit`:""}</small></p>)}{projections.length>1&&<div className={s.effectPager}><button aria-label="Previous projected effect" disabled={effectPage===0} onClick={()=>setEffectPage(Math.max(0,effectPage-1))}>‹</button><span>Effect {Math.min(effectPage+1,projections.length)}/{projections.length}</span><button aria-label="Next projected effect" disabled={effectPage>=projections.length-1} onClick={()=>setEffectPage(effectPage+1)}>›</button></div>}<small>Estimate · earlier actions can change effects.</small></div><p className={s.reason}>{selected.reasons.join(" ")||getBattleTargetTypeLabel(selected.move.targetType)}</p><div className={s.moveActions}><button onClick={()=>setDetails(true)}>Full details</button><button className={s.primary} disabled={resolving||!selected.usable} onClick={()=>onQueue(selected.move.id)}>Queue Move</button></div></>:<p>Choose a target on the battlefield, then inspect and queue an equipped move.</p>}</section>
    {details&&selected&&<GameDialog title="Move Details" onClose={()=>setDetails(false)}><MoveDetails move={selected.move}/><h3>Projected effects</h3>{projections.map((entry,i)=><p key={i}>{entry.name}: {entry.description} · Hit {entry.hitChance}% · Effect {entry.effectChance}% if hit</p>)}<p>{selected.reasons.join(" ")}</p><button disabled={resolving||!selected.usable} onClick={()=>{onQueue(selected.move.id);setDetails(false);}}>Queue {selected.move.name}</button></GameDialog>}
  </div>;
}

export function BattleArenaB(props: BattleArenaBProps) {
  const { battleState:resolvedState, sourceById, activeActorId, selectedTarget, queuedActions:queue, presentation, complete, recording }=props;
  const state=presentation.displayState??resolvedState;
  const { open }=useNavigation();
  const [popup,setPopup]=useState<"planning"|"statuses"|"inspect"|"items"|"log"|"menu"|"order"|"result"|"leave"|"forfeit"|null>(null);
  const [reviewClosed,setReviewClosed]=useState(false);
  const [movesOpen,setMovesOpen]=useState(false);
  const [draft,setDraft]=useState<{actorId:string;moveId:string}|null>(null);
  const [tappedTarget,setTappedTarget]=useState<string|null>(null);
  const [statusId,setStatusId]=useState<string|null>(null);
  const [inspectId,setInspectId]=useState<string|null>(null);
  const combatants=Object.values(state.combatants);
  const players=state.teams.player.combatantIds.map(id=>state.combatants[id]);
  const living=players.filter(c=>!c.isFainted),resolving=presentation.isPlaying,finished=complete&&!resolving;
  const target=selectedTarget?.kind==="combatant"?state.combatants[selectedTarget.combatantId]:null;
  const selectedInspect=inspectId?state.combatants[inspectId]:target;
  const preview=getBattleOrderPreview(state,queue);
  const actionIndex=presentation.activeEvent?.actorId?presentation.actionOrder.indexOf(presentation.activeEvent.actorId):-1;
  const order=resolving?(actionIndex>=0?presentation.actionOrder.slice(actionIndex):[]):preview.map(entry=>entry.actorId);
  const currentEvent=presentation.activeEvent;
  const actionCaption=currentEvent?`${currentEvent.actorId?state.combatants[currentEvent.actorId]?.name:"End of round"}${currentEvent.moveName?` · ${currentEvent.moveName}`:""}${currentEvent.targetIds.length?` → ${currentEvent.targetIds.map(id=>state.combatants[id]?.name).join(", ")}`:""}`:"";
  const highlight=resolving?presentation.activeEvent?.actorId:activeActorId;
  function inspect(id?:string){setInspectId(id??target?.battleCombatantId??activeActorId??players[0]?.battleCombatantId??null);setPopup("inspect");}
  function clearDraft(){setDraft(null);setTappedTarget(null);}
  function queueMove(id:string){props.onQueue(id);clearDraft();setMovesOpen(false);setPopup(null);}
  const draftMove=movesOpen&&draft?.actorId===activeActorId&&!resolving&&!complete?getBattleMove(draft.moveId):null;
  const draftActor=activeActorId?state.combatants[activeActorId]:null;
  const validTargets=draftMove&&draftActor?getLegalBattleTargetIds(state,draftActor,draftMove):[];
  const draftAvailability=draftMove&&activeActorId&&selectedTarget?getBattleUiMoveAvailability(state,activeActorId,draftMove.id,selectedTarget):null;
  const highlightedTargets=draftAvailability?.compatible?draftAvailability.normalizedTargetIds:[];
  function selectTarget(next:BattleUiTarget){
    if(resolving)return;
    const key=next.kind==="field"?"field":next.combatantId;
    const sameSelection=selectedTarget?.kind===next.kind&&(next.kind==="field"||selectedTarget?.kind==="combatant"&&selectedTarget.combatantId===next.combatantId);
    if(draftMove&&activeActorId&&tappedTarget===key&&sameSelection&&getBattleUiMoveAvailability(state,activeActorId,draftMove.id,next).usable){queueMove(draftMove.id);return;}
    props.onTarget(next);setTappedTarget(draftMove?key:null);
  }
  function openStatuses(id:string){setStatusId(id);setPopup("statuses");if(resolving)presentation.setPaused(true);}
  const statusCreature=statusId?state.combatants[statusId]:null;
  const menu=<MoveMenu key={activeActorId??"none"} state={state} actorId={activeActorId} target={selectedTarget} resolving={resolving||complete} onQueue={queueMove} onTarget={selectTarget} onSelectMove={id=>{setDraft(id&&activeActorId?{actorId:activeActorId,moveId:id}:null);setTappedTarget(null);}}/>;
  const targetPlans=new Map<string,string[]>();
  for(const c of living){const action=queue.get(c.battleCombatantId);if(action)for(const id of new Set(action.targetIds)){targetPlans.set(id,[...(targetPlans.get(id)??[]),c.battleCombatantId]);}}
  const sharedTargets=[...targetPlans].filter(([,actors])=>actors.length>1);
  const canConfirm=living.length>0&&living.every(c=>queue.has(c.battleCombatantId))&&!resolving&&!complete;
  const itemTarget=target?.sideId==="player"?target:null;
  const canTonic=!!itemTarget&&!itemTarget.isFainted&&!props.usedTonic&&props.tonicStock>0&&!complete&&!resolving&&!props.aidRestricted;
  const canRevive=!!itemTarget&&itemTarget.isFainted&&!props.usedRevival&&props.revivalStock>0&&(!complete||state.outcome==="enemy_won")&&!resolving&&!props.aidRestricted;
  if(finished&&props.resultLedger&&!reviewClosed) return <BattleResultLedger title={props.title} outcome={state.outcome} creatures={players.map(c=>sourceById.get(String(c.sourceCreatureId))).filter((c):c is CreatureRecord=>!!c)} data={props.resultLedger} recording={recording} onBack={()=>setReviewClosed(true)} details={props.result} log={state.log}/>;
  return <main className={s.arena} data-battle-b data-moves-open={movesOpen&&!resolving&&!complete} data-resolving={resolving} data-reduced-motion={presentation.reducedMotion}>
    <header className={s.header}><strong>Round {resolving?state.roundNumber:complete?Math.max(1,state.roundNumber-1):state.roundNumber}</strong><h1>{props.title}</h1><div><button onClick={()=>setPopup("log")}>Battle Log</button><button onClick={()=>setPopup("menu")} data-navigation-launcher>Menu</button></div></header>
    <section className={s.order} aria-label={resolving?"Resolution order":"Order preview"}><button className={s.orderHeading} onClick={()=>setPopup("order")}><strong>{resolving?currentEvent?.actorId?"ACTING NOW → UP NEXT":"ROUND RECOVERY":"ORDER PREVIEW"}</strong><small>{resolving?"":"Estimate · changes with moves"}</small></button><div className={s.tokens}>{order.map((id,index)=>{const c=state.combatants[id];if(!c)return null;return <button key={id} data-side={c.sideId} data-rank={index} data-active={resolving&&index===0} aria-label={`Inspect ${c.name} in turn order`} onClick={()=>inspect(id)}><img src={artwork(sourceById.get(String(c.sourceCreatureId)))} alt=""/><span><small>{index===0?resolving?"ACTING NOW":"FIRST":index===1?resolving?"UP NEXT":"NEXT":`${index+1}`}</small><strong>{c.name}</strong>{index===0&&resolving&&currentEvent?.moveName&&<em>{currentEvent.moveName}</em>}</span></button>;})}</div></section>
    <section className={s.field} aria-label="3 versus 3 battle stage"><span className={s.teamLabel} data-side="player">YOUR TEAM</span><span className={s.teamLabel} data-side="enemy">OPPONENTS</span>{combatants.map(c=>{
      const selected=target?.battleCombatantId===c.battleCombatantId,acting=highlight===c.battleCombatantId;
      const event=presentation.activeEvent,affected=event?.targetIds.includes(c.battleCombatantId);
      return <article key={c.battleCombatantId} className={s.figure} data-side={c.sideId} data-slot={c.slotIndex} data-selected={resolving?!!affected:draftMove?highlightedTargets.includes(c.battleCombatantId):selected} data-valid-target={!resolving&&validTargets.includes(c.battleCombatantId)} data-active={acting} data-fainted={c.isFainted} data-event={acting&&resolving&&event?.kind==="attack"?"attack":affected&&event?.kind!=="attack"?event?.kind:""}>
        <button className={s.figureButton} aria-label={`Select ${c.name}`} disabled={resolving||c.isFainted&&c.sideId==="enemy"} onClick={()=>selectTarget({kind:"combatant",combatantId:c.battleCombatantId})}>
          <span className={s.art}><img key={event&&(affected||acting)?event.eventId:"idle"} src={artwork(sourceById.get(String(c.sourceCreatureId)),true)} alt={`${c.name}, full body`}/>{acting&&<b className={s.marker}>{resolving?"ACTING":"PLANNING"}</b>}{(resolving?affected:draftMove?highlightedTargets.includes(c.battleCombatantId):selected)&&<b className={s.targetMarker}>TARGET</b>}{affected&&event&&event.kind!=="attack"&&<b key={event.eventId} className={s.effect} data-kind={event.kind}>{event.label}</b>}</span>
          <span className={s.nameplate}><strong title={c.name}>{c.name}</strong><Meter label="HP" value={c.currentHp} max={c.maxHp}/><Meter label="BE" value={c.currentBattleEnergy} max={c.maxBattleEnergy}/>{c.isFainted&&<small>K.O.</small>}</span>
        </button>
        <BattleStatusBadges name={c.name} effects={c.statuses} onOpen={()=>openStatuses(c.battleCombatantId)}/>
      </article>;
    })}</section>
    <div className={s.playback} aria-live="polite">{resolving&&<><strong>{actionCaption}</strong><span>{currentEvent?.kind==="attack"?"Preparing action…":currentEvent?.label}</span><div><button onClick={()=>presentation.setPaused(!presentation.paused)}>{presentation.paused?"Resume":"Pause"}</button><button disabled={!presentation.paused} onClick={presentation.step}>Next beat</button><button onClick={()=>presentation.setSpeed(presentation.speed===1?2:1)}>{presentation.speed}×</button></div></>}</div>
    <footer className={s.queue} aria-label="Planned ranch actions">
      <section className={s.planLedger} aria-label="Round ledger">
        <div className={s.planHead}><span>Creature</span><span>Move</span><span>Target</span><span>Energy</span><span/></div>
        {players.map(c=>{const action=queue.get(c.battleCombatantId),move=action?getBattleMove(action.moveId):null;const names=action? action.targetIds.map(id=>state.combatants[id]?.name??"Unknown").join(", ")||"Battlefield":"—";return <button className={s.planRow} key={c.battleCombatantId} aria-label={`Plan ${c.name}`} aria-pressed={activeActorId===c.battleCombatantId} disabled={resolving||complete||c.isFainted} onClick={()=>{clearDraft();props.onPlan(c.battleCombatantId);setMovesOpen(true);}}>
          <span className={s.planCreature}><img src={artwork(sourceById.get(String(c.sourceCreatureId)))} alt=""/><strong>{c.name}</strong></span>
          <span title={move?.name}>{c.isFainted?"K.O.":move?.name??"Choose a move"}</span><span title={names}>{names}</span><span>{move?`${move.battleEnergyCost} BE`:"—"}</span><span aria-hidden="true">{c.isFainted?"—":action?"✎":"+"}</span>
        </button>})}
        <button className={s.planNotice} onClick={()=>setPopup("planning")} disabled={resolving||complete}>{sharedTargets.length?`${sharedTargets.map(([id,actors])=>`${state.combatants[id]?.name}: ${actors.length} planned actions`).join(" · ")} · Review`:"Round ledger · Review plans"}</button>
      </section>
      <div className={s.planControls}><div className={s.confirm}><small aria-live="polite">{resolving?"Resolving…":`${living.filter(c=>queue.has(c.battleCombatantId)).length}/${living.length} ready`}</small>{finished?<button className={s.primary} disabled={recording} onClick={()=>{setReviewClosed(false);if(!props.resultLedger)setPopup("result");}}>Review Result</button>:<button className={s.primary} disabled={!canConfirm} onClick={()=>{clearDraft();setMovesOpen(false);props.onConfirm();}}>Confirm Round</button>}</div>
      <div className={s.dockTools}><button disabled={resolving||finished||!activeActorId} aria-expanded={movesOpen} aria-controls="battle-move-dock" onClick={()=>{clearDraft();setMovesOpen(!movesOpen);}}>{movesOpen?"Collapse":"Moves"}</button><button onClick={()=>setPopup("items")}>Items</button><button onClick={()=>inspect()}>Inspect</button></div></div>
    </footer>
    {popup==="planning"&&<GameDialog title="Round Ledger" onClose={()=>setPopup(null)}><p>Plans can be edited until you confirm. Shared targets are allowed; estimates do not guarantee hits or effects.</p>{players.map(c=>{const a=queue.get(c.battleCombatantId),m=a?getBattleMove(a.moveId):null;return <section className={s.statusDetail} key={c.battleCombatantId}><h3>{c.name}</h3><p>{c.isFainted?"K.O. · No action required":m&&a?`${m.name} → ${a.targetIds.map(id=>state.combatants[id]?.name??"Unknown").join(", ")||"Battlefield"} · ${m.battleEnergyCost} BE (currently ${c.currentBattleEnergy})`:"Action needed"}</p><button disabled={resolving||complete||c.isFainted} onClick={()=>{clearDraft();props.onPlan(c.battleCombatantId);setMovesOpen(true);setPopup(null);}}>Edit {c.name}</button></section>})}</GameDialog>}

    {movesOpen&&!resolving&&!complete&&<section id="battle-move-dock" className={s.expandedDock} aria-label="Choose a move">{menu}</section>}
    {popup==="statuses"&&statusCreature&&<GameDialog title={`${statusCreature.name} · Active Effects`} onClose={()=>setPopup(null)}><p>Durations are remaining rounds. During playback, inspecting effects pauses the action. Close this panel, then select Resume to continue.</p>{statusCreature.statuses.filter(e=>e.duration>0).map((effect,i)=><section className={s.statusDetail} key={i}><h3><StatusIcon status={effect.status}/>{statusLabel(effect)}</h3><p><strong>{effect.duration} rounds · {effect.stacks??1} stack(s)</strong>{effect.amount!==undefined?` · Amount ${effect.amount}`:""}</p><p>{getBattleStatusGlossary(effect.status).mechanics}</p>{effect.sourceCombatantId&&<p>Source: {state.combatants[effect.sourceCombatantId]?.name??"Unknown"}</p>}</section>)}{!statusCreature.statuses.some(e=>e.duration>0)&&<p>No active effects.</p>}</GameDialog>}
    {popup==="order"&&<GameDialog title="Turn Order" onClose={()=>setPopup(null)}><p>During planning this is an estimate: effective Speed + 10 × the queued move’s Priority. Unplanned allies and hidden enemy choices use zero Priority in this preview. Ties use the engine’s seeded initiative rule.</p><p>During resolution the strip follows the recorded action order and highlights the creature whose action is being shown. Enemy moves remain hidden during planning.</p><p>Allies plan one move per round. The bottom slots show your plans, not execution order.</p></GameDialog>}
    {popup==="inspect"&&selectedInspect&&<GameDialog title={`${selectedInspect.name} · Battle Profile`} onClose={()=>setPopup(null)} wide><div className={s.profile}><img src={artwork(sourceById.get(String(selectedInspect.sourceCreatureId)),true)} alt={`${selectedInspect.name}, full body`}/><div><p>Level {selectedInspect.level} · HP {selectedInspect.currentHp}/{selectedInspect.maxHp} · Battle Energy {selectedInspect.currentBattleEnergy}/{selectedInspect.maxBattleEnergy}</p><h3>Current battle numbers</h3><dl className={s.stats}>{Object.entries(getEffectiveBattleStats(selectedInspect)).map(([key,value])=><div key={key}><dt>{BATTLE_STAT_LABELS[key as BattleStatKey]}</dt><dd>{value}</dd></div>)}</dl><h3>Statuses</h3>{selectedInspect.statuses.length?selectedInspect.statuses.map((status,i)=><p key={i}><strong>{getBattleStatusGlossary(status.status).label} · {status.duration} rounds{(status.stacks??1)>1?` · ${status.stacks} stacks`:""}</strong><br/>{getBattleStatusGlossary(status.status).mechanics}</p>):<p>No status effects.</p>}{(()=>{const source=sourceById.get(String(selectedInspect.sourceCreatureId));return source?<><h3>Base numbers · Innate grades</h3><dl className={s.stats}>{STAT_KEYS.map(key=><div key={key}><dt>{key}</dt><dd>{source.stats[key]} · {source.statGrades[key]}</dd></div>)}</dl><p>Equipment and battle effects change numeric battle values; innate grades stay unchanged.</p></>:null;})()}</div></div></GameDialog>}
    {popup==="items"&&<GameDialog title="Support Items" onClose={()=>setPopup(null)}><p role="status">{props.message}</p><p>{props.aidRestricted?"Restricted Aid: Field Tonics and Revival Salves cannot be used in this challenge.":"Each item type can be used once per battle. Select a ranch creature below before using an item."}</p><div className={s.itemTargets}>{players.map(c=><button key={c.battleCombatantId} aria-pressed={itemTarget?.battleCombatantId===c.battleCombatantId} disabled={resolving} onClick={()=>props.onTarget({kind:"combatant",combatantId:c.battleCombatantId})}>{c.name} · {c.isFainted?"K.O.":`${c.currentHp}/${c.maxHp} HP`}</button>)}</div><div className={s.itemCards}><section><img src="/images/ui/outfitter-v1/field_tonic.webp" alt=""/><h3>Field Tonic ({props.tonicStock})</h3><p>Restore 30% maximum HP and 20% maximum Battle Energy to a living ally.</p><button disabled={!canTonic} onClick={()=>props.onItem("tonic")}>{props.usedTonic?"Used this battle":"Use Field Tonic"}</button></section><section><img src="/images/ui/outfitter-v1/revival_salve.webp" alt=""/><h3>Revival Salve ({props.revivalStock})</h3><p>Revive a fainted ally at 35% HP and 10% Battle Energy, clearing statuses.</p><button disabled={!canRevive} onClick={()=>props.onItem("revival")}>{props.usedRevival?"Used this battle":"Use Revival Salve"}</button></section></div></GameDialog>}
    {popup==="log"&&<GameDialog title="Battle Log" onClose={()=>setPopup(null)} wide><p>Turn-by-turn record. {resolving?"Playback in progress; the complete round log appears when playback finishes.":""}</p>{resolving?<p>{actionCaption} · {currentEvent?.label}</p>:state.log.map((line,i)=><p key={i}>{line}</p>)}</GameDialog>}
    {popup==="menu"&&<GameDialog title="Battle Menu" onClose={()=>setPopup(null)}><p role="status">{props.message}</p><div className={s.menuButtons}><button onClick={()=>{setPopup(null);open("menu");}}>Game Menu</button><button onClick={()=>presentation.setSpeed(presentation.speed===1?2:1)}>Animation speed · {presentation.speed}×</button><button aria-pressed={presentation.reducedMotion} onClick={()=>presentation.setReducedMotion(!presentation.reducedMotion)}>Reduced motion · {presentation.reducedMotion?"On":"Off"}</button><button disabled={resolving||recording||complete} onClick={()=>setPopup("forfeit")}>Forfeit & Record Loss</button><button disabled={resolving||recording} onClick={()=>setPopup("leave")}>Leave Without Record</button></div>{props.rules}</GameDialog>}
    {popup==="leave"&&<GameDialog title="Leave Without Record?" onClose={()=>setPopup("menu")}><p>This match grants no result, XP or rewards. Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording} onClick={props.onReturn}>Confirm Leave</button></GameDialog>}
    {popup==="forfeit"&&<GameDialog title="Record a Loss?" onClose={()=>setPopup("menu")}><p>End this match as a defeat and record its result? Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording||complete} onClick={props.onForfeit}>Confirm Forfeit</button></GameDialog>}
    {popup==="result"&&finished&&<GameDialog title="Battle Result" onClose={()=>setPopup(null)}>{props.result}</GameDialog>}
  </main>;
}
