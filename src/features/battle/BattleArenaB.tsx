"use client";

import { useState, type ReactNode } from "react";
import { BATTLE_MENU_CATEGORIES, getBattleMenuOptions, getBattleOrderPreview, type BattleMenuCategory } from "@/data/battleInterface";
import { getBattleMove } from "@/data/battleMoves";
import { getBattleTargetTypeLabel, type BattleUiTarget } from "@/data/battleUi";
import { getBattleEffectGlossary, getBattleStatusGlossary } from "@/data/battleGlossary";
import { getEffectiveBattleStats } from "@/data/battleEngine";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { BATTLE_STAT_LABELS } from "@/data/equipmentComparison";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import type { BattleAction, BattleCombatantId, BattleMove, BattleState, BattleStatKey } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { useBattlePresentationController } from "./useBattlePresentationController";
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
  complete: boolean; recording: boolean; result: ReactNode; message: string; rules?: ReactNode;
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

function MoveMenu({ state, actorId, target, resolving, onQueue }: { state: BattleState; actorId: string | null; target: BattleUiTarget | null; resolving: boolean; onQueue: (id:string)=>void }) {
  const [category,setCategory]=useState<BattleMenuCategory>("All");
  const [page,setPage]=useState(0),[moveId,setMoveId]=useState<string|null>(null),[details,setDetails]=useState(false);
  const options=getBattleMenuOptions(state,actorId,target);
  const filtered=options.filter(option=>category==="All"||option.category===category);
  const pages=Math.max(1,Math.ceil(filtered.length/3)),currentPage=Math.min(page,pages-1);
  const shown=filtered.slice(currentPage*3,currentPage*3+3);
  const selected=shown.find(option=>option.move.id===moveId)??shown[0];
  const actor=actorId?state.combatants[actorId]:null;
  const targetName=target?.kind==="field"?"Battlefield":target?.kind==="combatant"?state.combatants[target.combatantId]?.name:"Choose target";
  return <div className={s.moveMenu}>
    <h2>{actor?`${actor.name} → ${targetName}`:"All actions planned"}</h2>
    <div className={s.categories} role="group" aria-label="Move categories">{BATTLE_MENU_CATEGORIES.map(name=><button key={name} aria-pressed={category===name} disabled={resolving||!actor} onClick={()=>{setCategory(name);setPage(0);setMoveId(null);}}><img src={ART+name.toLowerCase()+".webp"} alt=""/><span>{name} ({options.filter(o=>name==="All"||o.category===name).length})</span></button>)}</div>
    <div className={s.moves} aria-label="Equipped moves">{shown.map(option=><button key={option.move.id} aria-pressed={selected?.move.id===option.move.id} data-unavailable={!option.usable} disabled={resolving} onClick={()=>setMoveId(option.move.id)}><strong>{option.move.name}</strong><small>Energy {option.move.battleEnergyCost}{option.cooldown>0?` · Cooldown ${option.cooldown}`:""}</small><small>{option.reasons[0]??"Ready"}</small></button>)}{!shown.length&&<p>{actor?"No equipped moves in this category.":"Edit a teammate’s action or confirm the round."}</p>}</div>
    <div className={s.pager}><button aria-label="Previous moves" disabled={currentPage===0||resolving} onClick={()=>{setPage(currentPage-1);setMoveId(null);}}>‹</button><span>Page {currentPage+1}/{pages} · {filtered.length} moves</span><button aria-label="Next moves" disabled={currentPage===pages-1||resolving} onClick={()=>{setPage(currentPage+1);setMoveId(null);}}>›</button></div>
    <section className={s.moveSummary}>{selected?<><h3>{selected.move.name}</h3><p>Power {selected.move.power} · Accuracy {selected.move.accuracy}%</p><p>Energy {selected.move.battleEnergyCost} · Cooldown {selected.move.cooldown} rounds</p><p className={s.reason}>{selected.reasons.join(" ")||getBattleTargetTypeLabel(selected.move.targetType)}</p><button onClick={()=>setDetails(true)}>Full details</button><button className={s.primary} disabled={resolving||!selected.usable} onClick={()=>onQueue(selected.move.id)}>Queue Move</button></>:<p>Choose a target on the battlefield, then inspect and queue an equipped move.</p>}</section>
    {details&&selected&&<GameDialog title="Move Details" onClose={()=>setDetails(false)}><MoveDetails move={selected.move}/><p>{selected.reasons.join(" ")}</p><button disabled={resolving||!selected.usable} onClick={()=>{onQueue(selected.move.id);setDetails(false);}}>Queue {selected.move.name}</button></GameDialog>}
  </div>;
}

export function BattleArenaB(props: BattleArenaBProps) {
  const { battleState:state, sourceById, activeActorId, selectedTarget, queuedActions:queue, presentation, complete, recording }=props;
  const { open }=useNavigation();
  const [popup,setPopup]=useState<"moves"|"inspect"|"items"|"log"|"menu"|"order"|"result"|"leave"|"forfeit"|null>(null);
  const [inspectId,setInspectId]=useState<string|null>(null);
  const combatants=Object.values(state.combatants);
  const players=state.teams.player.combatantIds.map(id=>state.combatants[id]);
  const living=players.filter(c=>!c.isFainted),resolving=presentation.isPlaying,finished=complete&&!resolving;
  const target=selectedTarget?.kind==="combatant"?state.combatants[selectedTarget.combatantId]:null;
  const selectedInspect=inspectId?state.combatants[inspectId]:target;
  const preview=getBattleOrderPreview(state,queue);
  const order=resolving?presentation.actionOrder:preview.map(entry=>entry.actorId);
  const highlight=resolving?presentation.activeEvent?.actorId:activeActorId;
  function inspect(id?:string){setInspectId(id??target?.battleCombatantId??activeActorId??players[0]?.battleCombatantId??null);setPopup("inspect");}
  function queueMove(id:string){props.onQueue(id);setPopup(null);}
  const menu=<MoveMenu key={activeActorId??"none"} state={state} actorId={activeActorId} target={selectedTarget} resolving={resolving||complete} onQueue={queueMove}/>;
  const canConfirm=living.length>0&&living.every(c=>queue.has(c.battleCombatantId))&&!resolving&&!complete;
  const itemTarget=target?.sideId==="player"?target:null;
  const canTonic=!!itemTarget&&!itemTarget.isFainted&&!props.usedTonic&&props.tonicStock>0&&!complete&&!resolving&&!props.aidRestricted;
  const canRevive=!!itemTarget&&itemTarget.isFainted&&!props.usedRevival&&props.revivalStock>0&&(!complete||state.outcome==="enemy_won")&&!resolving&&!props.aidRestricted;
  return <main className={s.arena} data-battle-b data-reduced-motion={presentation.reducedMotion}>
    <header className={s.header}><strong>Round {resolving||complete?Math.max(1,state.roundNumber-1):state.roundNumber}</strong><h1>{props.title}</h1><div><button onClick={()=>setPopup("log")}>Battle Log</button><button onClick={()=>setPopup("menu")} data-navigation-launcher>Menu</button></div></header>
    <section className={s.order} aria-label={resolving?"Resolution order":"Order preview"}><button className={s.orderHeading} onClick={()=>setPopup("order")}><strong>{resolving?"RESOLVING":"ORDER PREVIEW"}</strong><small>{resolving?"Recorded action order":"Changes with chosen moves"}</small></button><div className={s.tokens}>{order.map(id=>{const c=state.combatants[id];if(!c)return null;return <button key={id} data-active={highlight===id} aria-label={`Inspect ${c.name} in turn order`} onClick={()=>inspect(id)}><img src={artwork(sourceById.get(String(c.sourceCreatureId)))} alt=""/><span>{c.name}</span></button>;})}</div></section>
    <section className={s.field} aria-label="3 versus 3 battle stage">{combatants.map(c=>{
      const selected=target?.battleCombatantId===c.battleCombatantId,acting=highlight===c.battleCombatantId;
      const event=presentation.activeEvent,affected=event?.targetIds.includes(c.battleCombatantId);
      return <article key={c.battleCombatantId} className={s.figure} data-side={c.sideId} data-slot={c.slotIndex} data-selected={selected} data-active={acting} data-fainted={c.isFainted} data-event={affected?event?.kind:acting&&resolving?"attack":""}>
        <button className={s.figureButton} aria-label={`Select ${c.name}`} disabled={resolving||c.isFainted&&c.sideId==="enemy"} onClick={()=>props.onTarget({kind:"combatant",combatantId:c.battleCombatantId})}>
          <span className={s.art}><img src={artwork(sourceById.get(String(c.sourceCreatureId)),true)} alt={`${c.name}, full body`}/>{acting&&<b className={s.marker}>{resolving?"ACTING":"PLANNING"}</b>}{selected&&<b className={s.targetMarker}>TARGET</b>}{affected&&event&&event.kind!=="attack"&&<b className={s.effect}>{event.label}</b>}</span>
          <span className={s.nameplate}><strong title={c.name}>{c.name}</strong><Meter label="HP" value={c.currentHp} max={c.maxHp}/><Meter label="BE" value={c.currentBattleEnergy} max={c.maxBattleEnergy}/><small>{c.isFainted?"K.O.":c.statuses.length?`${getBattleStatusGlossary(c.statuses[0].status).label} · ${c.statuses[0].duration}r${c.statuses.length>1?` +${c.statuses.length-1}`:""}`:"No status"}</small></span>
        </button>
      </article>;
    })}</section>
    <aside className={s.sidebar}>{finished?<div className={s.finish}><h2>{state.outcome==="player_won"?"Victory":state.outcome==="enemy_won"?"Defeat":"Draw"}</h2><p>Review the result before recording.</p><button className={s.primary} onClick={()=>setPopup("result")}>Review Result</button><button onClick={()=>setPopup("items")}>Items</button></div>:menu}<div className={s.tools}><button onClick={()=>setPopup("items")}>Items</button><button disabled={resolving||complete} aria-pressed={selectedTarget?.kind==="field"} onClick={()=>props.onTarget({kind:"field"})}>Battlefield</button><button onClick={()=>inspect()}>Inspect</button></div></aside>
    <div className={s.mobileTools}><button className={s.primary} disabled={resolving} onClick={()=>setPopup(finished?"result":"moves")}>{finished?"Result":"Moves"}</button><button onClick={()=>setPopup("items")}>Items</button><button disabled={resolving||complete} aria-pressed={selectedTarget?.kind==="field"} onClick={()=>props.onTarget({kind:"field"})}>Field</button><button onClick={()=>inspect()}>Inspect</button></div>
    <footer className={s.queue} aria-label="Planned ranch actions">{players.map(c=>{const action=queue.get(c.battleCombatantId);return <button key={c.battleCombatantId} aria-label={`Plan ${c.name}`} aria-pressed={activeActorId===c.battleCombatantId} disabled={resolving||complete||c.isFainted} onClick={()=>props.onPlan(c.battleCombatantId)}><img src={artwork(sourceById.get(String(c.sourceCreatureId)))} alt=""/><span><strong>{c.name}</strong><small>{c.isFainted?"K.O.":action?getBattleMove(action.moveId).name:activeActorId===c.battleCombatantId?"Choosing move":"Not planned"}</small><small className={s.queueTarget}>{action?`→ ${action.targetIds.map(id=>state.combatants[id]?.name??"Unknown").join(", ")||"Battlefield"}`:"Select to plan"}</small></span></button>})}<div className={s.confirm}><small>{resolving?"Resolving…":`${queue.size}/${living.length} planned`}</small>{finished?<button className={s.primary} disabled={recording} onClick={()=>setPopup("result")}>Review Result</button>:<button className={s.primary} disabled={!canConfirm} onClick={props.onConfirm}>Confirm Round</button>}</div></footer>
    {popup==="moves"&&<GameDialog title="Move Menu" onClose={()=>setPopup(null)}>{menu}</GameDialog>}
    {popup==="order"&&<GameDialog title="Turn Order" onClose={()=>setPopup(null)}><p>During planning this is an estimate: effective Speed + 10 × the queued move’s Priority. Unplanned allies and hidden enemy choices use zero Priority in this preview. Ties use the engine’s seeded initiative rule.</p><p>During resolution the strip follows the recorded action order and highlights the creature whose action is being shown. Enemy moves remain hidden during planning.</p><p>Allies plan one move per round. The bottom slots show your plans, not execution order.</p></GameDialog>}
    {popup==="inspect"&&selectedInspect&&<GameDialog title={`${selectedInspect.name} · Battle Profile`} onClose={()=>setPopup(null)} wide><div className={s.profile}><img src={artwork(sourceById.get(String(selectedInspect.sourceCreatureId)),true)} alt={`${selectedInspect.name}, full body`}/><div><p>Level {selectedInspect.level} · HP {selectedInspect.currentHp}/{selectedInspect.maxHp} · Battle Energy {selectedInspect.currentBattleEnergy}/{selectedInspect.maxBattleEnergy}</p><h3>Current battle numbers</h3><dl className={s.stats}>{Object.entries(getEffectiveBattleStats(selectedInspect)).map(([key,value])=><div key={key}><dt>{BATTLE_STAT_LABELS[key as BattleStatKey]}</dt><dd>{value}</dd></div>)}</dl><h3>Statuses</h3>{selectedInspect.statuses.length?selectedInspect.statuses.map((status,i)=><p key={i}><strong>{getBattleStatusGlossary(status.status).label} · {status.duration} rounds{(status.stacks??1)>1?` · ${status.stacks} stacks`:""}</strong><br/>{getBattleStatusGlossary(status.status).mechanics}</p>):<p>No status effects.</p>}{(()=>{const source=sourceById.get(String(selectedInspect.sourceCreatureId));return source?<><h3>Base numbers · Innate grades</h3><dl className={s.stats}>{STAT_KEYS.map(key=><div key={key}><dt>{key}</dt><dd>{source.stats[key]} · {source.statGrades[key]}</dd></div>)}</dl><p>Equipment and battle effects change numeric battle values; innate grades stay unchanged.</p></>:null;})()}</div></div></GameDialog>}
    {popup==="items"&&<GameDialog title="Support Items" onClose={()=>setPopup(null)}><p role="status">{props.message}</p><p>{props.aidRestricted?"Restricted Aid: Field Tonics and Revival Salves cannot be used in this challenge.":"Each item type can be used once per battle. Select a ranch creature below before using an item."}</p><div className={s.itemTargets}>{players.map(c=><button key={c.battleCombatantId} aria-pressed={itemTarget?.battleCombatantId===c.battleCombatantId} disabled={resolving} onClick={()=>props.onTarget({kind:"combatant",combatantId:c.battleCombatantId})}>{c.name} · {c.isFainted?"K.O.":`${c.currentHp}/${c.maxHp} HP`}</button>)}</div><div className={s.itemCards}><section><img src="/images/ui/outfitter-v1/field_tonic.webp" alt=""/><h3>Field Tonic ({props.tonicStock})</h3><p>Restore 30% maximum HP and 20% maximum Battle Energy to a living ally.</p><button disabled={!canTonic} onClick={()=>props.onItem("tonic")}>{props.usedTonic?"Used this battle":"Use Field Tonic"}</button></section><section><img src="/images/ui/outfitter-v1/revival_salve.webp" alt=""/><h3>Revival Salve ({props.revivalStock})</h3><p>Revive a fainted ally at 35% HP and 10% Battle Energy, clearing statuses.</p><button disabled={!canRevive} onClick={()=>props.onItem("revival")}>{props.usedRevival?"Used this battle":"Use Revival Salve"}</button></section></div></GameDialog>}
    {popup==="log"&&<GameDialog title="Battle Log" onClose={()=>setPopup(null)} wide><p>Turn-by-turn record. {resolving?"The round has resolved; its action animation is playing.":""}</p>{state.log.map((line,i)=><p key={i}>{line}</p>)}</GameDialog>}
    {popup==="menu"&&<GameDialog title="Battle Menu" onClose={()=>setPopup(null)}><p role="status">{props.message}</p><div className={s.menuButtons}><button onClick={()=>{setPopup(null);open("menu");}}>Game Menu</button><button onClick={()=>presentation.setSpeed(presentation.speed===1?2:1)}>Animation speed · {presentation.speed}×</button><button aria-pressed={presentation.reducedMotion} onClick={()=>presentation.setReducedMotion(!presentation.reducedMotion)}>Reduced motion · {presentation.reducedMotion?"On":"Off"}</button><button disabled={resolving||recording||complete} onClick={()=>setPopup("forfeit")}>Forfeit & Record Loss</button><button disabled={resolving||recording} onClick={()=>setPopup("leave")}>Leave Without Record</button></div>{props.rules}</GameDialog>}
    {popup==="leave"&&<GameDialog title="Leave Without Record?" onClose={()=>setPopup("menu")}><p>This match grants no result, XP or rewards. Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording} onClick={props.onReturn}>Confirm Leave</button></GameDialog>}
    {popup==="forfeit"&&<GameDialog title="Record a Loss?" onClose={()=>setPopup("menu")}><p>End this match as a defeat and record its result? Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording||complete} onClick={props.onForfeit}>Confirm Forfeit</button></GameDialog>}
    {popup==="result"&&finished&&<GameDialog title="Battle Result" onClose={()=>setPopup(null)}>{props.result}</GameDialog>}
  </main>;
}
