"use client";

import { getEquineGameplayCardSprite, getEquineGameplayProfileSprite } from "@/data/equineGameplayArt";
import { isNylaBaseFeline, getNylaGameplayCardSprite, getNylaGameplayProfileSprite } from "@/data/nylaGameplayArt";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CREATURE_PLACEHOLDER_IMAGE, FAMILY_LABELS, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { getActivePregnancyForCreature, getEstimatedDeliveryDateLabel } from "@/data/nursery";
import { getCreatureManagementStatus } from "@/data/creatureManagement";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { careMeterPercent, getCarePresentation } from "@/data/carePresentation";
import { getBestStatLabels } from "@/data/collection";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { CreatureRemovalWindow } from '@/features/creatures/CreatureRemovalWindow';
import { CreatureRenameWindow } from '@/features/creatures/CreatureRenameWindow';
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { RanchReview } from "@/features/ranch/RanchReview";
import { GameDialog } from "@/features/ui/GameDialog";


import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./HabitatCourtyard.module.css";

const ART = "/images/ui/creature-overview-a-v2/painted-r4";
function Icon({src}: {src:string}) {return <img src={src} alt="" aria-hidden="true" className={styles.icon}/>;}
function Vital({label,value,max,hearts=false}: {label:string;value:number;max:number;hearts?:boolean}) {
  const percent=careMeterPercent(value,max),pips=hearts&&max>0&&max<=5&&Number.isInteger(max);
  return <div className={styles.vital} data-habitat-vital={label}>
    <dt><Icon src={`/images/ui/creature-overview-a-v2/sculpted/${label==='Energy'?'energy':'heart'}.webp`}/>{label}</dt>
    <dd aria-label={`${label} ${value} of ${max}`}>{value} / {max}</dd>
    {pips?<div className={styles.hearts} aria-hidden="true">{Array.from({length:max},(_,i)=><span key={i}><img src="/images/ui/habitat-a/heart-empty.svg" alt=""/><i style={{width:`${careMeterPercent(value-i,1)}%`}}><img src="/images/ui/creature-overview-a-v2/sculpted/heart.webp" alt=""/></i></span>)}</div>:<div className={styles.meter} role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={Math.max(1,max)} aria-valuenow={Math.max(0,Math.min(Math.max(1,max),value))}><i style={{width:`${percent}%`}}/></div>}
  </div>;
}
const FOCUS_KEY = "creature_chronicles_habitat_focus";
type Popup = "profile" | "manage" | "rename" | "release" | "donate" | "feedback" | null;

export function HabitatScreen() {
  const { activeHabitatFamily, currentSave, feedCreature, goToCollection,
    goToRanch, goBack, goToBreeding,
    toggleCreatureLock } = useGameContext();
  const {setRanchView}=useNavigation();
  const [compact,setCompact]=useState(false);
  function house(){setRanchView("house");goToRanch();}
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(FOCUS_KEY));
  const [message, setMessage] = useState("");
  const [popup, setPopup] = useState<Popup>(null);
  const [page, setPage] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(1);
  const pageSizeRef = useRef(1);
  const stripRef = useRef<HTMLDivElement>(null);
  const habitat = currentSave?.habitats?.find(item => item.family === activeHabitatFamily);
  const creatures = useMemo(() => (currentSave?.creatures ?? []).filter(creature =>
    getVariantDefinition(creature.variantId).family === activeHabitatFamily), [activeHabitatFamily, currentSave?.creatures]);
  const statuses = useMemo(() => new Map(creatures.map(creature => [creature.creatureId,
    getCreatureManagementStatus(currentSave!, creature)])), [creatures, currentSave]);
  const selected = creatures.find(creature => creature.creatureId === selectedId) ?? creatures[0] ?? null;
  const selectedIndex = selected ? creatures.indexOf(selected) : 0;
  const pages = Math.max(1, Math.ceil(creatures.length / pageSize));
  const currentPage = Math.min(page ?? Math.floor(selectedIndex / pageSize), pages - 1);

  useEffect(() => { window.sessionStorage.removeItem(FOCUS_KEY); }, []);
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width <= 0) return;
      const nextSize = Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 10) / 230)));
      if (nextSize !== pageSizeRef.current) {
        pageSizeRef.current = nextSize;
        setPageSize(nextSize);
        setPage(null);
      }
    });
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  if (!currentSave || !activeHabitatFamily || !habitat?.unlocked) return (
    <main className={styles.courtyard}><section className={ui.paper}>
      <h1>Habitat unavailable</h1><p>Return to the ranch and select an unlocked habitat.</p>
      <button type="button" onClick={goBack}>Previous screen</button>
    </section></main>
  );

  const day = currentSave.dayState.dayNumber;
  const status = selected ? statuses.get(selected.creatureId)! : null;
  const variant = selected ? getVariantDefinition(selected.variantId) : null;
  const pregnancy = selected ? getActivePregnancyForCreature(currentSave, selected.creatureId) : null;
  const statusLabel = (creature: CreatureRecord) => {
    const state = statuses.get(creature.creatureId)!;
    if (state.isTraining) return "Training";
    if (state.isInjured) return `Recovery: ${Math.max(1, (creature.injuredUntilDayNumber ?? day) - day + 1)}d`;
    return state.primaryStatus === "Ready" ? "Healthy · Available" : state.primaryStatus;
  };
  const trainingNote = selected ? getTrainingUnavailableReason(currentSave, selected.creatureId) : null;
  const statusNote = trainingNote ?? (pregnancy
    ? `${statusLabel(selected!)}. Pregnant: ${pregnancy.daysRemaining} days remaining; expected ${getEstimatedDeliveryDateLabel(currentSave.dayState, pregnancy.daysRemaining)}.`
    : selected ? statusLabel(selected) : "");
  const feedDisabled = !selected || status?.isTraining || (selected.energy >= selected.maxEnergy && selected.affection >= 100);

  function select(creature: CreatureRecord) {
    setSelectedId(creature.creatureId);
    setMessage("");
  }
  function manage() { if (selected) setPopup("manage"); }
  function feed() {
    if (!selected || feedDisabled) return;
    feedCreature(selected.creatureId);
    setMessage(`${selected.nickname} fed. Energy +${Math.min(10, selected.maxEnergy - selected.energy)} · Affection +${Math.min(5, 100 - selected.affection)}.`);
  }
  function removed(message: string) {
    setMessage(message);
    setSelectedId(null);
    setPage(null);
    setPopup("feedback");
  }

  return <main className={styles.courtyard} data-habitat-courtyard style={{backgroundImage:`url(/images/ui/ranch-v3/${activeHabitatFamily}.webp)`,"--scene":`url(/images/ui/ranch-v3/${activeHabitatFamily}.webp)`} as CSSProperties}>
    <section className={styles.layout}>
      <header className={styles.heading}>
        <h1>{habitat.name || `${FAMILY_LABELS[activeHabitatFamily]} Habitat`}</h1>
        <ScreenNavigation backIcon={<Icon src="/images/ui/creature-overview-a-v2/icons/back.svg"/>}><button type="button" onClick={()=>setCompact(!compact)}>{compact?"Expand creature art":"Minimize creature art"}</button></ScreenNavigation>
      </header>
      <section className={styles.occupancy} aria-label="Habitat occupancy">
        <div><Icon src={`${ART}/creatures.webp`}/><span>Residents</span><strong>{creatures.length} / {habitat.capacity}</strong></div>
        <div><Icon src={`${ART}/habitat.webp`}/><span>Open spaces</span><strong>{Math.max(0, habitat.capacity - creatures.length)}</strong></div>
        <div><Icon src={`${ART}/care.webp`}/><span>Needs care</span><strong>{[...statuses.values()].filter(item => item.needsAttention).length}</strong></div>

      </section>
      <div className={`${styles.stage} ${compact?styles.compact:""}`} data-compact={compact}>
        <section className={styles.residentView} aria-label="Selected creature">
          {selected && variant ? <img data-habitat-fullbody src={getEquineGameplayProfileSprite(selected, getNylaGameplayProfileSprite(selected, variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE))} alt={`${selected.nickname}, full body`} onError={event => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /> : <div className={styles.empty}><h2>Room to grow</h2><p>This habitat has {habitat.capacity} open spaces. New {FAMILY_LABELS[activeHabitatFamily].toLowerCase()} creatures live here automatically.</p><button type="button" data-primary onClick={goToBreeding}>Visit Breeding Pen</button></div>}
        </section>
        {selected && variant && status ? <aside className={styles.care} aria-label="Resident care">
          <div className={styles.identity}><h2 data-long-name={selected.nickname.length>16} title={`${selected.nickname}${selected.isLocked?" · Protected":""}`}>{selected.nickname}{selected.shiny ? " ✦" : ""}{selected.isLocked ? " · Protected" : ""}</h2><p>{variant.rarity} {getSpeciesDefinition(selected.speciesId).name} · Level {selected.level}</p></div>
          <button type="button" className={styles.readiness} data-tone={getCarePresentation(selected,status.isInjured,status.primaryStatus).tone} onClick={() => setPopup("profile")} title={statusNote}><Icon src={`/images/ui/care-b/icons/${getCarePresentation(selected,status.isInjured,status.primaryStatus).icon}.webp`}/><span>{statusLabel(selected)}</span><small>Details</small></button>
          <dl className={styles.stats}>
            <Vital label="Energy" value={selected.energy} max={selected.maxEnergy}/>
            <Vital label="Hearts" value={selected.hearts} max={selected.maxHearts} hearts/>
            <Vital label="Affection" value={selected.affection} max={100}/>
          </dl>
          <div className={styles.careButtons}>
            <button type="button" data-primary className={styles.feed} onClick={feed} disabled={feedDisabled} title={status.isTraining ? "Unavailable during training" : feedDisabled ? "Energy and affection are full" : "Restore up to 10 energy and 5 affection"}><Icon src="/images/ui/habitat-a/feed.webp"/>{status.isTraining ? "In training" : feedDisabled ? "Fully cared for" : "Feed"}</button>
            <button type="button" onClick={() => setPopup("profile")}><Icon src={`${ART}/profile.webp`}/>Open profile</button><button type="button" onClick={manage}><Icon src="/images/ui/care-b/icons/management.webp"/>Manage</button>

          </div>
        </aside> : null}
      </div>
      {message ? <button type="button" className={styles.feedback} onClick={() => setPopup("feedback")}><span role="status" data-ui-text="single-line">{message}</span><span>Details</span></button> : null}
      <section className={styles.dock} aria-label="Residents">
        <h2 className={styles.dockTitle}>Residents</h2>
        <button type="button" aria-label="Previous residents" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><Icon src="/images/ui/creature-overview-a-v2/icons/back.svg"/></button>
        <div ref={stripRef} className={styles.residents}>
          {creatures.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(creature => <button type="button" key={creature.creatureId} className={`${styles.resident} ${selected?.creatureId === creature.creatureId ? styles.selected : ""}`} aria-pressed={selected?.creatureId === creature.creatureId} onClick={() => select(creature)}>
            <img data-nyla-card={isNylaBaseFeline(creature) ? "true" : undefined} src={getEquineGameplayCardSprite(creature, getNylaGameplayCardSprite(creature, getVariantDefinition(creature.variantId).portraitPath || CREATURE_PLACEHOLDER_IMAGE))} alt="" onError={event => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} />
            <span><strong title={creature.nickname}>{creature.nickname}{creature.shiny ? " ✦" : ""}</strong><small className={styles.residentLevel}>Level {creature.level}</small><small data-status className={statuses.get(creature.creatureId)?.needsAttention ? styles.warningText : ""}>{statusLabel(creature)}</small></span>
          </button>)}
          {!creatures.length ? <p>No residents yet</p> : null}
        </div>
        <span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span>
        <button type="button" aria-label="Next residents" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><Icon src="/images/ui/creature-overview-a-v2/icons/back.svg"/></button>
        <nav className={styles.destinations} aria-label="Habitat destinations"><button type="button" onClick={house}><Icon src={`${ART}/habitat.webp`}/>Ranch House</button><button type="button" onClick={goToBreeding}><Icon src={`${ART}/lineage.webp`}/>Breeding</button><button type="button" onClick={goToCollection}><Icon src={`${ART}/creatures.webp`}/>Collection</button></nav>
      </section>
    </section>
    {popup === "profile" && selected ? <GameDialog title={`${selected.nickname} · Full Profile`} fullScreen onClose={()=>setPopup(null)}><main className={styles.profileFrame} data-habitat-profile><header><button onClick={()=>setPopup(null)}>‹ Habitat</button><h2>{selected.nickname} · Full Profile</h2><button onClick={manage}>Manage</button></header><SharedCreatureDetail useGameplayArt creature={selected} dayNumber={day} dossier ranchDossier fitViewport statusNote={statusNote} bestStatLabels={getBestStatLabels(selected)} showActions={false}/></main></GameDialog> : null}
    {popup === "manage" && selected ? <RanchReview title={`Manage ${selected.nickname}`} onClose={()=>setPopup(null)} pages={[
      {title:"Name",content:<div className={styles.management}><p>Current name: {selected.nickname}</p><button onClick={()=>setPopup('rename')}>Rename creature</button></div>},
      {title:"Protection",content:<div className={styles.management}><p>Protect this creature against release or donation.</p><button onClick={()=>{toggleCreatureLock(selected.creatureId);setMessage(selected.isLocked?"Protection removed.":"Creature protected.");}}><Icon src={`/images/ui/care-b/icons/${selected.isLocked?"lock-closed":"lock-open"}.webp`}/>{selected.isLocked?"Unlock creature":"Lock creature"}</button></div>},
      {title:"Release or donate",content:<div className={styles.management}><p>These actions permanently remove this creature from your ranch. Protected creatures cannot be removed.</p><div className={ui.actionRow}><button disabled={selected.isLocked} onClick={()=>setPopup("release")}>Release</button><button disabled={selected.isLocked} onClick={()=>setPopup("donate")}>Donate</button></div></div>}
    ]}/> : null}
    {popup === 'rename' && selected ? <CreatureRenameWindow key={selected.creatureId} creature={selected} onClose={() => setPopup('manage')} onRenamed={(_name, message) => {setMessage(message); setPopup('manage');}}/> : null}
    {(popup === "release" || popup === "donate") && selected ? <CreatureRemovalWindow key={`${popup}-${selected.creatureId}`} creatureId={selected.creatureId} mode={popup} onClose={() => setPopup('manage')} onRemoved={removed}/> : null}
    {popup === "feedback" ? <GameDialog title="Habitat update" onClose={() => setPopup(null)}><p>{message}</p></GameDialog> : null}
  </main>;
}
