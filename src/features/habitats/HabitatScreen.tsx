"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CREATURE_PLACEHOLDER_IMAGE, FAMILY_LABELS, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { getActivePregnancyForCreature, getEstimatedDeliveryDateLabel } from "@/data/nursery";
import { getCreatureManagementStatus } from "@/data/creatureManagement";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { getBestStatLabels } from "@/data/collection";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { IllustratedIcon } from "@/features/ui/IllustratedIcon";
import { RanchIcon } from "@/features/ui/RanchIcon";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./HabitatCourtyard.module.css";

const FOCUS_KEY = "creature_chronicles_habitat_focus";
type Popup = "profile" | "manage" | "release" | "donate" | "feedback" | null;

export function HabitatScreen() {
  const { activeHabitatFamily, currentSave, donateCreature, feedCreature, goToCollection,
    goToRanch, goToRanchOffice, goToRanchJobs, goToBreeding, releaseCreature,
    renameCreature, toggleCreatureLock } = useGameContext();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(FOCUS_KEY));
  const [renameValue, setRenameValue] = useState("");
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

  if (!currentSave || !activeHabitatFamily || !habitat) return (
    <main className={`${ui.interior} ${styles.courtyard}`}><section className={ui.paper}>
      <h1>Habitat unavailable</h1><p>Return to the ranch and select an unlocked habitat.</p>
      <button type="button" onClick={goToRanch}>Back to Ranch</button>
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
    setRenameValue(creature.nickname);
    setMessage("");
  }
  function manage() { if (selected) { setRenameValue(selected.nickname); setPopup("manage"); } }
  function feed() {
    if (!selected || feedDisabled) return;
    feedCreature(selected.creatureId);
    setMessage(`${selected.nickname} fed. Energy +${Math.min(10, selected.maxEnergy - selected.energy)} · Affection +${Math.min(5, 100 - selected.affection)}.`);
  }
  function rename() {
    if (!selected || !renameValue.trim()) return;
    renameCreature(selected.creatureId, renameValue.trim());
    setMessage(`Renamed to ${renameValue.trim()}.`);
    setPopup(null);
  }
  function remove(kind: "release" | "donate") {
    if (!selected) return;
    setMessage(kind === "release" ? releaseCreature(selected.creatureId) : donateCreature(selected.creatureId));
    setSelectedId(null);
    setPage(null);
    setPopup("feedback");
  }

  return <main className={`${ui.interior} ${styles.courtyard}`} data-habitat-courtyard>
    <section className={`${ui.page} ${styles.layout}`}>
      <header className={ui.heading}>
        <h1>{habitat.name || `${FAMILY_LABELS[activeHabitatFamily]} Habitat`}</h1>
        <ScreenNavigation><button type="button" onClick={goToCollection}>Collection Tracker</button></ScreenNavigation>
      </header>
      <section className={`${ui.summary} ${styles.occupancy}`} aria-label="Habitat occupancy">
        <div><RanchIcon name="paw" /><span>Residents</span><strong>{creatures.length} / {habitat.capacity}</strong></div>
        <div><IllustratedIcon name="capacity" /><span>Open spaces</span><strong>{Math.max(0, habitat.capacity - creatures.length)}</strong></div>
        <div><IllustratedIcon name="comfort" /><span>Needs care</span><strong>{[...statuses.values()].filter(item => item.needsAttention).length}</strong></div>
        <button type="button" onClick={goToRanchOffice}><RanchIcon name="house" /><span>Ranch Office</span></button>
      </section>
      <div className={styles.stage}>
        <section className={styles.residentView} aria-label="Selected creature">
          {selected && variant ? <img data-habitat-fullbody src={variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt={`${selected.nickname}, full body`} onError={event => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /> : <div className={`${ui.paper} ${styles.empty}`}><h2>Room to grow</h2><p>This habitat has {habitat.capacity} open spaces. New {FAMILY_LABELS[activeHabitatFamily].toLowerCase()} creatures live here automatically.</p><button type="button" className={ui.primary} onClick={goToBreeding}>Visit Breeding Pen</button></div>}
        </section>
        {selected && variant && status ? <aside className={`${ui.paper} ${styles.care}`} aria-label="Resident care">
          <div className={styles.identity}><h2 data-ui-text="single-line" title={selected.nickname}>{selected.nickname}{selected.shiny ? " ✦" : ""}{selected.isLocked ? " · Protected" : ""}</h2><p>{variant.rarity} {getSpeciesDefinition(selected.speciesId).name} · Level {selected.level}</p></div>
          <button type="button" className={`${styles.readiness} ${status.needsAttention ? styles.attention : ""}`} onClick={() => setPopup("profile")} title={statusNote}>{statusLabel(selected)} <small>Details</small></button>
          <dl className={styles.stats}>
            <div><dt><RanchIcon name="energy" />Energy</dt><dd>{selected.energy} / {selected.maxEnergy}</dd></div>
            <div><dt><span className={styles.heart} aria-hidden="true">♥</span>Hearts</dt><dd>{selected.hearts} / {selected.maxHearts}</dd></div>
            <div><dt><IllustratedIcon name="comfort" />Affection</dt><dd>{selected.affection} / 100</dd><meter min={0} max={100} value={selected.affection} aria-label="Affection" /></div>
          </dl>
          <div className={styles.careButtons}>
            <button type="button" className={`${ui.primary} ${styles.feed}`} onClick={feed} disabled={feedDisabled} title={status.isTraining ? "Unavailable during training" : feedDisabled ? "Energy and affection are full" : "Restore up to 10 energy and 5 affection"}><IllustratedIcon name="feed" />{status.isTraining ? "In training" : feedDisabled ? "Fully cared for" : "Feed"}</button>
            <button type="button" onClick={() => setPopup("profile")}><IllustratedIcon name="ledger" />Full Profile</button><button type="button" onClick={manage}><RanchIcon name="gear" />Manage</button>
            <button type="button" onClick={goToRanchJobs}><RanchIcon name="chores" />Chores</button><button type="button" onClick={goToBreeding}><IllustratedIcon name="breeding" />Breeding</button>
          </div>
        </aside> : null}
      </div>
      {message ? <button type="button" className={styles.feedback} onClick={() => setPopup("feedback")}><span role="status" data-ui-text="single-line">{message}</span><span>Details</span></button> : null}
      <section className={`${ui.paper} ${styles.dock}`} aria-label="Residents">
        <h2>Residents</h2>
        <button type="button" aria-label="Previous residents" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <div ref={stripRef} className={styles.residents}>
          {creatures.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(creature => <button type="button" key={creature.creatureId} className={`${styles.resident} ${selected?.creatureId === creature.creatureId ? styles.selected : ""}`} aria-pressed={selected?.creatureId === creature.creatureId} onClick={() => select(creature)}>
            <img src={getVariantDefinition(creature.variantId).portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" onError={event => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} />
            <span><strong data-ui-text="single-line" title={creature.nickname}>{creature.nickname}{creature.shiny ? " ✦" : ""}</strong><small className={statuses.get(creature.creatureId)?.needsAttention ? styles.warningText : ""}>{statusLabel(creature)}</small></span>
          </button>)}
          {!creatures.length ? <p>No residents yet</p> : null}
        </div>
        <span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span>
        <button type="button" aria-label="Next residents" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </section>
    </section>
    {popup === "profile" && selected ? <GameDialog title={`${selected.nickname} · Full Profile`} wide onClose={() => setPopup(null)}>
      <SharedCreatureDetail creature={selected} dayNumber={day} dossier statusNote={statusNote} bestStatLabels={getBestStatLabels(selected)} showActions={false} />
      <div className={ui.actionRow}><button type="button" onClick={manage}>Manage {selected.nickname}</button></div>
    </GameDialog> : null}
    {popup === "manage" && selected ? <GameDialog title={`Manage ${selected.nickname}`} onClose={() => setPopup(null)}><div className={styles.management}>
      <form onSubmit={event => { event.preventDefault(); rename(); }}><label htmlFor="habitat-name">Creature name</label><input id="habitat-name" value={renameValue} onChange={event => setRenameValue(event.target.value)} /><button type="submit" disabled={!renameValue.trim()}>Save Name</button></form>
      <p>Protect this creature against release or donation.</p><button type="button" onClick={() => { toggleCreatureLock(selected.creatureId); setMessage(selected.isLocked ? `${selected.nickname} is no longer protected.` : `${selected.nickname} is now protected.`); }}>{selected.isLocked ? "Remove protection" : "Protect creature"}</button>
      <p>Release and donation permanently remove this creature from your ranch.</p><div className={ui.actionRow}><button type="button" disabled={selected.isLocked} onClick={() => setPopup("release")}>Release</button><button type="button" disabled={selected.isLocked} onClick={() => setPopup("donate")}>Donate</button></div>
    </div></GameDialog> : null}
    {(popup === "release" || popup === "donate") && selected ? <GameDialog title={`${popup === "release" ? "Release" : "Donate"} ${selected.nickname}?`} onClose={() => setPopup("manage")}><p>This permanently removes {selected.nickname} from your ranch. This cannot be undone.</p><div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup("manage")}>Cancel</button><button type="button" disabled={selected.isLocked} onClick={() => remove(popup)}>{popup === "release" ? "Confirm release" : "Confirm donation"}</button></div></GameDialog> : null}
    {popup === "feedback" ? <GameDialog title="Habitat update" onClose={() => setPopup(null)}><p>{message}</p></GameDialog> : null}
  </main>;
}
