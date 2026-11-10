"use client";
import { gameplayArt } from "@/data/creatureGameplayArt";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useGameContext } from "@/state/GameProvider";
import { StatusIcon, statusLabel } from "@/features/battle/BattleStatusBadges";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { DetailButton } from "@/features/ui/DetailButton";
import { GameDialog } from "@/features/ui/GameDialog";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { getEquipmentSlots, getBattleReadinessLabel } from "@/data/battleOutfitter";
import type { ColiseumOpeningOrderEntry, ColiseumOpeningVitals } from "@/data/coliseumBattleOpening";
import type { ColiseumC4CarryoverMap, ColiseumC4ModifierDefinition } from "@/data/coliseumC4";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, VariantId } from "@/types/ids";
import type { BattleStatusStack } from "@/types/battle";
import {TeamPreparation} from "./TeamPreparation";
import s from "./ColiseumCourtyard.module.css";
type Enemy = { sourceCreatureId: CreatureId; variantId: VariantId; name:string; variantName:string; level:number; role:string; equipment:string; moves:string[] };

function speedDelta(amount: number): string {
 return amount < 0 ? `−${Math.abs(amount)}` : `+${amount}`;
}

function openingSpeedHint(entry: ColiseumOpeningOrderEntry): string {
 const { base, contributions } = entry.speedBreakdown;
 const shown = contributions.length <= 3 ? contributions : contributions.slice(0, 2);
 const sources = shown.map(({ label, amount }) => `${label} ${speedDelta(amount)}`);
 if (contributions.length > sources.length) sources.push(`Open for all ${contributions.length} adjustments.`);
 if (!sources.length) sources.push("Starts at base Speed.");
 return [`Base Speed ${base} → ${entry.speed}`, ...sources].join("\n");
}

function statusDuration(effect: BattleStatusStack): string {
 return `${effect.duration} ${effect.duration === 1 ? "round" : "rounds"}`;
}

function OpeningStatusChips({ name, effects, onOpen }: {
 name: string;
 effects: readonly BattleStatusStack[];
 onOpen: () => void;
}) {
 function openDetails(event: MouseEvent<HTMLButtonElement>) {
   event.currentTarget.focus({ preventScroll: true });
   onOpen();
 }
 const visible = effects.slice(0, 2);
 const remaining = effects.slice(visible.length);
 return <div className={s.openingStatuses} data-opening-statuses data-multiple={effects.length > 1}
   role="group" aria-label={`Starting effects for ${name}`}>
   {visible.map((effect, index) => {
     const label = statusLabel(effect);
     const duration = statusDuration(effect);
     const [summary] = getBattleStatusGlossary(effect.status).mechanics.split(/(?<=\.)\s/, 1);
     return <DetailButton key={`${effect.status}-${effect.stat ?? "all"}-${index}`} type="button"
       className={s.openingStatusChip} data-status={effect.status}
       aria-label={`${name}: ${label}, ${duration}. View starting effects`} aria-haspopup="dialog"
       hint={`${label} · ${duration}\n${summary}`} onClick={openDetails}>
       <StatusIcon status={effect.status}/>
       <span className={s.openingStatusName}>{label}</span>
       <span className={s.openingStatusDuration}>{effect.duration}r</span>
     </DetailButton>;
   })}
   {remaining.length > 0 && <DetailButton type="button" className={s.openingStatusChip}
     aria-label={`View all ${effects.length} starting effects for ${name}`} aria-haspopup="dialog"
     hint={remaining.map(effect => `${statusLabel(effect)} · ${statusDuration(effect)}`).join("\n")} onClick={openDetails}>
     +{remaining.length}
   </DetailButton>}
 </div>;
}

export function ColiseumTeamStaging({title,roster,selected,onChange,onReturn,onStart,unavailable,enemyPreview,opponent,strategy,locked=false,carryover,tacticsStock,armed,onArm,rules,message,battleModifiers,openingVitals,openingOrder,openingStatuses}: {
 title:string; roster:CreatureRecord[];selected:CreatureId[];onChange:(ids:CreatureId[])=>void;onReturn:()=>void;onStart:()=>void;unavailable:(creature:CreatureRecord)=>string|null;enemyPreview:Enemy[];opponent:string;strategy:string;locked?:boolean;carryover?:ColiseumC4CarryoverMap;tacticsStock:number;armed:boolean;onArm:()=>void;rules:ReactNode;message:string;
 battleModifiers?: readonly ColiseumC4ModifierDefinition[];
 openingVitals: ReadonlyMap<CreatureId, ColiseumOpeningVitals>;
 openingOrder: readonly ColiseumOpeningOrderEntry[];
 openingStatuses: ReadonlyMap<CreatureId, readonly BattleStatusStack[]>;
}){
 const {currentSave:save}=useGameContext();const {open}=useNavigation();
 const [popup,setPopup]=useState<"roster"|"opponent"|"rules"|"prep"|"profile"|"gear"|"order"|null>(null);
 const [slot,setSlot]=useState(0),[page,setPage]=useState(0),[profileId,setProfileId]=useState<CreatureId|null>(null);
 const [speedActorId, setSpeedActorId] = useState<ColiseumOpeningOrderEntry["actorId"] | null>(null);
 const [statusCreatureId, setStatusCreatureId] = useState<CreatureId | null>(null);
 const [opponentIndex, setOpponentIndex] = useState(0);
 const [opponentRulesOpen, setOpponentRulesOpen] = useState(false);
 if(!save)return null;
 const team=selected.map(id=>roster.find(c=>c.creatureId===id)).filter((c):c is CreatureRecord=>!!c);
 const pages=Math.max(1,Math.ceil(roster.length/4)),currentPage=Math.min(page,pages-1);
 const profile=roster.find(c=>c.creatureId===profileId);
 const speedEntry = popup === "order" ? openingOrder.find(entry => entry.actorId === speedActorId) : undefined;
 const statusName = team.find(creature => creature.creatureId === statusCreatureId)?.nickname
   ?? enemyPreview.find(enemy => enemy.sourceCreatureId === statusCreatureId)?.name;
 const inspectedEffects = statusCreatureId ? openingStatuses.get(statusCreatureId) : undefined;
 const canStart=team.length===3&&team.every(c=>!unavailable(c))&&(!armed||tacticsStock>0);
 function choose(c:CreatureRecord,targetSlot=slot){if(locked||unavailable(c))return;const ids=[...selected];const existing=ids.indexOf(c.creatureId);if(existing!==-1){if(targetSlot<ids.length){[ids[targetSlot],ids[existing]]=[ids[existing],ids[targetSlot]];}}else if(targetSlot<ids.length)ids[targetSlot]=c.creatureId;else ids.push(c.creatureId);onChange(ids);setPopup(null);}
 function change(ix:number){setSlot(ix);setPopup("roster");}
 const gearCount=(c:CreatureRecord)=>Object.values(getEquipmentSlots(save,c.creatureId)).filter(Boolean).length;
 const orderButton = <button type="button" aria-haspopup="dialog" disabled={!canStart || !openingOrder.length} onClick={() => setPopup("order")}>Turn order</button>;
 const prep=<><h2>Your Team · {team.length} / 3</h2><p>{locked?"Roster locked for this run.":"Choose three available creatures."}</p><p className={s.muted}>Select a teammate’s Gear button to compare, buy or equip. Gear is optional.</p><button onClick={()=>setPopup("prep")}>Team preparation</button><button aria-pressed={armed} disabled={tacticsStock===0&&!armed} onClick={onArm}>Tactics Kit · {armed?"On":"Off"} ({tacticsStock})</button><p className={s.muted}>Consumed when battle starts.</p><div className={s.actions}>{orderButton}<button className={s.primary} disabled={!canStart} onClick={onStart}>Enter Battle</button></div></>;
 return <main className={s.courtyard} data-coliseum="team"><header className={s.header}><div><button onClick={onReturn}>‹ Back</button></div><h1>{title}</h1><div><button onClick={()=>open("menu")} data-navigation-launcher>Menu</button></div></header><section className={`${s.layout} ${s.team}`}><aside className={s.panel}><h2>Opponent</h2><p>{opponent}</p><p className={s.desktop}>{strategy}</p><button onClick={()=>setPopup("opponent")}>View team</button><button onClick={()=>setPopup("rules")}>Rules</button></aside><section className={s.stage} aria-label="Selected full-body team">
   {battleModifiers?.length ? <section className={s.battleModifiers} aria-label="Battle modifiers">
     <h2>Battle modifiers</h2>
     <ul>{battleModifiers.map(modifier => <li key={modifier.modifierId} data-tone={modifier.tone}>
       <strong>{modifier.name}</strong>{" "}<span>{modifier.description}</span>
     </li>)}</ul>
   </section> : null}
   {[0, 1, 2].map(ix => {
     const creature = team[ix];
     const variant = creature ? getVariantDefinition(creature.variantId) : null;
     const blocked = creature ? unavailable(creature) : null;
     const vitals = creature && !blocked ? openingVitals.get(creature.creatureId) : undefined;
     const effects = creature && !blocked ? openingStatuses.get(creature.creatureId) : undefined;
     return <article className={s.creature} key={ix} data-team-slot={ix + 1} aria-label={`Team slot ${ix + 1}`}>
       <div className={s.body}>{creature && variant ? <img src={gameplayArt(creature)} alt={`${creature.nickname}, full body`}/> : <span className={s.wood}>Slot {ix + 1}</span>}</div>
       <div className={s.plinth} data-starting-effects={!!effects?.length}>
         <div className={s.slotHeading}>
           <span className={s.slotNumber}><span>TEAM </span>{ix + 1}</span>
           <span className={s.slotName}>{creature?.nickname ?? "Choose creature"}</span>
           <small>{creature ? blocked ? "Unavailable" : <><span className={s.levelFull}>Level </span><span className={s.levelShort}>Lv </span>{creature.level}</> : "Empty"}</small>
         </div>
         {vitals && <dl className={s.openingVitals} aria-label="Starting battle vitals">
           <div><dt>HP</dt><dd>{vitals.currentHp} / {vitals.maxHp}</dd></div>
           <div><dt aria-label="Battle Energy">BE</dt><dd>{vitals.currentBattleEnergy} / {vitals.maxBattleEnergy}</dd></div>
         </dl>}
         {creature && effects?.length ? <OpeningStatusChips name={creature.nickname} effects={effects}
           onOpen={() => setStatusCreatureId(creature.creatureId)}/> : null}
       </div>
       <div className={s.slotActions}>
         <button disabled={locked || ix > team.length} onClick={() => change(ix)}>{locked ? "Locked" : "Change"}</button>
         {creature && <button aria-label={`Gear for ${creature.nickname}`} onClick={() => { setProfileId(creature.creatureId); setPopup("gear"); }}>Gear · {gearCount(creature)}/5</button>}
       </div>
     </article>;
   })}</section><aside className={s.panel}>{prep}<button onClick={()=>setPopup("opponent")}>Opponent & Rules</button></aside><div className={s.mobileActions}><button onClick={()=>setPopup("opponent")}>Opponent</button><button onClick={()=>setPopup("prep")}>Prep · {team.length}/3</button>{orderButton}<button className={s.primary} disabled={!canStart} onClick={onStart}>Enter Battle</button></div></section><nav className={s.roster} aria-label="Creature roster"><button aria-label="Previous creatures" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>‹</button>{roster.slice(currentPage*4,currentPage*4+4).map(c=><button key={c.creatureId} aria-label={`Inspect ${c.nickname}`} aria-pressed={selected.includes(c.creatureId)} onClick={()=>{setProfileId(c.creatureId);setPopup("profile");}}><img src={gameplayArt(c,true)} alt=""/><span>{c.nickname}</span></button>)}<span className={s.wood}>{currentPage+1}/{pages}</span><button aria-label="Next creatures" disabled={currentPage===pages-1} onClick={()=>setPage(currentPage+1)}>›</button></nav>
 {popup === "order" && <GameDialog title="Round 1 turn order" onClose={() => { setSpeedActorId(null); setPopup(null); }}>
   <p className={s.openingOrderNote}>Select a Speed value to see its gear and opening effects.</p>
   <ol className={s.openingOrderList} role="list" aria-label="Opening turn order">
     {openingOrder.map((entry, index) => <li key={entry.actorId} data-side={entry.sideId} data-order-actor={entry.actorId}>
       <b className={s.openingRank}>{index + 1}</b>
       <img src={gameplayArt(entry, true)} alt=""/>
       <div><strong>{entry.name}</strong><small>{entry.sideId === "player" ? "Your team" : "Opponent"}</small></div>
       <DetailButton type="button" className={s.openingSpeed} hint={openingSpeedHint(entry)}
         aria-label={`Speed breakdown for ${entry.name}, Speed ${entry.speed}`} aria-haspopup="dialog"
         onClick={event => { event.currentTarget.focus({ preventScroll: true }); setSpeedActorId(entry.actorId); }}>
         Speed {entry.speed} <span aria-hidden="true">i</span>
       </DetailButton>
     </li>)}
   </ol>
 </GameDialog>}
 {statusName && inspectedEffects?.length ? <GameDialog title={`${statusName} · Starting effects`}
   onClose={() => setStatusCreatureId(null)} dialogClassName={s.openingEffectsDialog}>
   <ul className={s.openingEffectsList} role="list">
     {inspectedEffects.map((effect, index) => <li key={`${effect.status}-${effect.stat ?? "all"}-${index}`} data-status={effect.status}>
       <h3><StatusIcon status={effect.status}/>{statusLabel(effect)}</h3>
       <strong>{statusDuration(effect)}{(effect.stacks ?? 1) > 1 ? ` · ${effect.stacks} stacks` : ""}</strong>
       <p>{getBattleStatusGlossary(effect.status).mechanics}</p>
     </li>)}
   </ul>
 </GameDialog> : null}
 {speedEntry && <GameDialog title={`${speedEntry.name} · Speed breakdown`} dialogClassName={s.openingSpeedDialog} onClose={() => setSpeedActorId(null)}>
   <dl className={s.openingSpeedSources} aria-label="Opening Speed calculation">
     <div className={s.speedBase}><dt>Base Speed</dt><dd>{speedEntry.speedBreakdown.base}</dd></div>
     {speedEntry.speedBreakdown.contributions.map(({ label, amount }, index) => <div key={`${label}-${index}`}>
       <dt>{label}</dt><dd data-direction={amount < 0 ? "loss" : "gain"}>{speedDelta(amount)}</dd>
     </div>)}
     <div className={s.speedTotal}><dt>Opening Speed</dt><dd>{speedEntry.speed}</dd></div>
   </dl>
   {!speedEntry.speedBreakdown.contributions.length && <p className={s.speedEmpty}>This creature opens at base Speed.</p>}
 </GameDialog>}
 {popup==="roster"&&<GameDialog title={`Choose creature · Slot ${slot+1}`} onClose={()=>setPopup(null)} wide><p>Choosing a teammate already selected swaps their position.</p><div className={s.dialogGrid}>{roster.map(c=><article key={c.creatureId}><img src={gameplayArt(c,true)} alt=""/><h3>{c.nickname} · Level {c.level}</h3><p>{unavailable(c)||getBattleReadinessLabel(save,c.creatureId)}</p><button disabled={locked||!!unavailable(c)} onClick={()=>choose(c)}>Choose {c.nickname}</button></article>)}</div>{selected[slot]&&<button onClick={()=>{onChange(selected.filter((_,ix)=>ix!==slot));setPopup(null);}}>Clear Slot {slot+1}</button>}</GameDialog>}
 {popup === "opponent" && <GameDialog title="Opponent & Rules" dialogClassName={s.opponentDialog}
   onClose={() => { setOpponentRulesOpen(false); setPopup(null); }} wide>
   <h3 className={s.opponentTitle}>{opponent}</h3>
   <nav className={s.opponentPicker} aria-label="Choose opponent">
     {enemyPreview.map((enemy, index) => <button type="button" key={enemy.sourceCreatureId}
       aria-pressed={opponentIndex === index} onClick={() => setOpponentIndex(index)}>{enemy.name}</button>)}
   </nav>
   <div className={s.opponentGrid}>
     {enemyPreview.map((enemy, index) => {
       const effects = openingStatuses.get(enemy.sourceCreatureId) ?? [];
       const vitals = openingVitals.get(enemy.sourceCreatureId);
       return <article key={enemy.sourceCreatureId} data-opponent-card={enemy.sourceCreatureId}
         data-selected={opponentIndex === index} aria-label={`${enemy.name} · Opponent`}>
         <div className={s.opponentIdentity}>
           <img src={gameplayArt(enemy, true)} alt={`${enemy.name}, ${enemy.variantName} portrait`} width={64} height={64}/>
           <div><h3>{enemy.name}</h3><p>Level {enemy.level} · {enemy.variantName} · {enemy.role}</p></div>
         </div>
         {vitals && <dl className={s.opponentVitals} aria-label={`Starting battle vitals for ${enemy.name}`}>
           <div data-vital="hp"><dt>HP</dt><dd>{vitals.currentHp} / {vitals.maxHp}</dd></div>
           <div data-vital="be"><dt aria-label="Battle Energy">BE</dt><dd>{vitals.currentBattleEnergy} / {vitals.maxBattleEnergy}</dd></div>
         </dl>}
         <div className={s.opponentBrief}>
           <p>{enemy.equipment}</p>
           <p>{enemy.moves.join(" · ")}</p>
           {effects.length ? <OpeningStatusChips name={enemy.name} effects={effects}
             onOpen={() => setStatusCreatureId(enemy.sourceCreatureId)}/> : <p className={s.opponentNeutral}>Starts without status effects.</p>}
         </div>
       </article>;
     })}
   </div>
   <button type="button" className={s.opponentRulesButton} aria-haspopup="dialog" onClick={event => {
     event.currentTarget.focus({ preventScroll: true });
     setOpponentRulesOpen(true);
   }}>Battle rules & strategy</button>
 </GameDialog>}
 {(popup === "rules" || opponentRulesOpen) && <GameDialog title="Battle Rules"
   dialogClassName={s.opponentRulesDialog} onClose={() => opponentRulesOpen ? setOpponentRulesOpen(false) : setPopup(null)}>
   <div className={s.opponentRulesBody}><p>{strategy}</p>{rules}</div>
 </GameDialog>}
 {(popup==="prep"||popup==="gear")&&<TeamPreparation selected={selected} initialCreatureId={popup==="gear"?profileId:null} locked={locked} unavailable={unavailable} message={message} tacticsStock={tacticsStock} armed={armed} onArm={onArm} onClose={()=>setPopup(null)}/>}
 {popup==="profile"&&profile&&<GameDialog title={`${profile.nickname} · Profile`} onClose={()=>setPopup(null)}><p>{getVariantDefinition(profile.variantId).name} · Level {profile.level}</p><p>{unavailable(profile)||getBattleReadinessLabel(save,profile.creatureId)}</p><p>Base numbers · Innate grades</p><dl className={s.stats}>{STAT_KEYS.map(key=><div key={key}><dt>{key}</dt><dd>{profile.stats[key]}<b>{profile.statGrades[key]}</b></dd></div>)}</dl>{carryover?.[profile.creatureId]&&<p>Saved gauntlet condition: HP {Math.round(carryover[profile.creatureId].hpRatio*100)}% · Battle Energy {Math.round(carryover[profile.creatureId].battleEnergyRatio*100)}%.</p>}<button onClick={()=>setPopup("prep")}>Team loadouts</button>{!locked&&<div className={s.actions}>{[0,1,2].map(ix=><button key={ix} disabled={!!unavailable(profile)||ix>selected.length} onClick={()=>choose(profile,ix)}>Choose for slot {ix+1}</button>)}</div>}</GameDialog>}
 </main>;
}
