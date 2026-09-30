"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  NURSERY_ASSETS,
  getEstimatedDeliveryDateLabel,
  getLineageRiskLabel,
  getPregnancyProgressPercent,
  suggestHatchlingName,
} from "@/data/nursery";
import { getNurseryCapacity } from "@/data/ranchUpgrades";
import { CREATURE_PLACEHOLDER_IMAGE, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { useGameContext } from "@/state/GameProvider";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import type { CreatureRecord } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type {
  BirthRecord,
  DayState,
  EggRecord,
  PregnancyRecord,
} from "@/types/save";
import { GameDialog } from "@/features/ui/GameDialog";
import { RanchIcon } from "@/features/ui/RanchIcon";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./NurseryScreen.module.css";

const STAT_LABELS = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
} as const;

type HatchResult = { egg: EggRecord; creature: CreatureRecord };

export function NurseryScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  const {
    currentSave,
    goToRanch,
    goToBreeding,
    hatchReadyEgg,
    removeNurseryEgg,
    renameCreature,
  } = useGameContext();

  const pregnancies = currentSave?.pregnancies ?? [];
  const eggs = currentSave?.eggs ?? [];
  const birthHistory = currentSave?.birthHistory ?? [];
  const nurseryCapacity = currentSave ? getNurseryCapacity(currentSave) : 6;
  const activePregnancies = pregnancies.filter(
    (pregnancy) => pregnancy.status === "pregnant",
  );
  const activeEggs = eggs.filter((egg) => egg.status !== "hatched").sort((a, b) => Number(b.status === "ready") - Number(a.status === "ready") || a.daysRemaining - b.daysRemaining);
  const legacyHatchedEggs = eggs.filter((egg) => egg.status === "hatched");
  const readyEggs = activeEggs.filter((egg) => egg.status === "ready");

  const [selectedEggId, setSelectedEggId] = useState<EggId | null>(
    readyEggs[0]?.eggId ?? activeEggs[0]?.eggId ?? null,
  );
  const [showEggDetail, setShowEggDetail] = useState(true);
  const [activeTab, setActiveTab] = useState<"eggs" | "pregnancies" | "history">("eggs");
  const [pendingRemoval, setPendingRemoval] = useState<{egg: EggRecord; mode: "release" | "donate"} | null>(null);
  const [hatchName, setHatchName] = useState("");
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);
  const [revealName, setRevealName] = useState("");
  const [message, setMessage] = useState(
    "",
  );

  const selectedEgg = useMemo(
    () =>
      activeEggs.find((egg) => egg.eggId === selectedEggId) ??
      activeEggs[0] ??
      null,
    [activeEggs, selectedEggId],
  );

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before using the Egg Nursery.</p>
          <button type="button" onClick={goToRanch}>
            Back to Ranch
          </button>
        </section>
      </main>
    );
  }

  function handleHatch(egg: EggRecord) {
    const finalName =
      hatchName.trim() || egg.suggestedName || suggestHatchlingName(egg);
    const creature = hatchReadyEgg(egg.eggId, finalName);
    if (!creature) {
      setMessage("This egg is not ready or the target habitat is full.");
      return;
    }
    setHatchName("");
    setRevealName(creature.nickname);
    setHatchResult({ egg, creature });
    setSelectedEggId(null);
    setMessage(
      `${creature.nickname} hatched. The birth ledger was updated automatically.`,
    );
  }

  function handleConfirmReveal() {
    if (!hatchResult) return;
    const nextName = revealName.trim();
    if (nextName && nextName !== hatchResult.creature.nickname) {
      renameCreature(hatchResult.creature.creatureId, nextName);
    }
    setMessage(
      `${nextName || hatchResult.creature.nickname} joined the ranch and remains in the nursery birth ledger.`,
    );
    setHatchResult(null);
  }

  function handleRemoveEgg(egg: EggRecord, mode: "release" | "donate") {
    removeNurseryEgg(egg.eggId, mode);
    setSelectedEggId(null);
    setMessage(
      mode === "donate"
        ? "Egg donated for 75 Gold and 1 GP."
        : "Egg released from the nursery.",
    );
  }

  return (
    <main className={`${ui.interior} ${styles.interior}`}>
      <div className={ui.page}>
        <header className={ui.heading}><div><p className={ui.eyebrow}>A little care. A new beginning.</p><h1>Egg Nursery</h1></div><ScreenNavigation>{headerLinks}</ScreenNavigation></header>
        <section className={ui.summary} aria-label="Nursery status"><div><span>Ready to hatch</span><strong>{readyEggs.length}</strong></div><div><span>Incubating</span><strong>{activeEggs.length - readyEggs.length}</strong></div><div><span>Pregnancies</span><strong>{activePregnancies.length}</strong></div><div><span>Nursery spaces</span><strong>{activeEggs.length}/{nurseryCapacity}</strong></div></section>
        <nav className={`${ui.paper} ${styles.tabs}`} aria-label="Nursery sections">
          <button type="button" aria-pressed={activeTab === "eggs"} onClick={() => setActiveTab("eggs")}>Eggs ({activeEggs.length})</button>
          <button type="button" aria-pressed={activeTab === "pregnancies"} onClick={() => setActiveTab("pregnancies")}>Pregnancies ({activePregnancies.length})</button>
          <button type="button" aria-pressed={activeTab === "history"} onClick={() => setActiveTab("history")}>Birth History ({birthHistory.length || legacyHatchedEggs.length})</button>
        </nav>
        {message ? <p className={`${ui.paper} ${ui.feedback}`} role="status">{message}</p> : null}
        {activeTab === "eggs" ? <div className={styles.workspace} data-detail={showEggDetail && Boolean(selectedEgg)}>
          <aside className={`${ui.paper} ${styles.eggList}`}><h2>Eggs in your care</h2><p>Ready eggs appear first.</p>
            {activeEggs.length ? activeEggs.map(egg => <button type="button" key={egg.eggId} className={`${styles.eggListCard} ${selectedEgg?.eggId === egg.eggId ? styles.selectedEgg : ""}`} aria-pressed={selectedEgg?.eggId === egg.eggId} onClick={() => {setSelectedEggId(egg.eggId);setHatchName("");setShowEggDetail(true);}}><img src={egg.status === "ready" ? NURSERY_ASSETS.hatch : NURSERY_ASSETS.egg} alt="" /><span><strong>{egg.suggestedName || suggestHatchlingName(egg)}</strong><span>{egg.rarity} · {getSpeciesDefinition(egg.speciesId).name}</span><em>{egg.status === "ready" ? "Ready to Hatch" : `${egg.daysRemaining} day${egg.daysRemaining === 1 ? "" : "s"} remaining`}</em></span></button>) : <p className={styles.emptyText}>No eggs in the nursery yet.</p>}
            <div className={styles.pendingSummary}><h3>Pending Births</h3><p>{activePregnancies.length ? `${activePregnancies.length} active pregnanc${activePregnancies.length === 1 ? "y" : "ies"}. Next delivery in ${Math.min(...activePregnancies.map(p => p.daysRemaining))} days.` : "No active pregnancies."}</p>{activePregnancies.length ? <button type="button" onClick={() => setActiveTab("pregnancies")}>View Pregnancies</button> : null}</div>
            <p className={styles.sleepNote}>Pregnancies and incubation advance when you sleep.</p>
          </aside>
          <section className={`${ui.paper} ${styles.selectedPanel}`} aria-label="Selected egg">
            {selectedEgg ? <button type="button" className={styles.mobileBack} onClick={() => setShowEggDetail(false)}>← All Eggs ({activeEggs.length})</button> : null}
            {selectedEgg ? <EggDetail egg={selectedEgg} hatchName={hatchName} onHatchNameChange={setHatchName} onHatch={handleHatch} onRemove={(egg,mode) => setPendingRemoval({egg,mode})} /> : <div className={styles.emptyChamber}><RanchIcon name="nest" className={styles.emptyNest} /><h2>A new beginning awaits</h2><p>Successful creature-receiver breeding starts a pregnancy. Sleep until delivery, then care for the egg until it is ready.</p><button className={ui.primary} type="button" onClick={goToBreeding}>Visit Breeding</button></div>}
          </section>
        </div> : null}
        {activeTab === "pregnancies" ? <section className={`${ui.paper} ${styles.records}`}><h2>Pending Births</h2>{activePregnancies.length ? activePregnancies.map(pregnancy => <PregnancyCard key={pregnancy.pregnancyId} pregnancy={pregnancy} dayState={currentSave.dayState} />) : <p>No active pregnancies. Successful creature-receiver breeding attempts create one.</p>}<p className={styles.sleepNote}>Delivery timers advance when you sleep.</p></section> : null}
        {activeTab === "history" ? <section className={`${ui.paper} ${styles.records}`}><h2>Birth History</h2>{birthHistory.length ? birthHistory.map(birth => <BirthHistoryCard key={birth.birthId} birth={birth} />) : legacyHatchedEggs.length ? legacyHatchedEggs.map(egg => <LegacyBirthCard key={egg.eggId} egg={egg} />) : <p>Hatched offspring will be recorded here permanently.</p>}</section> : null}
      </div>
      {pendingRemoval ? <GameDialog title={pendingRemoval.mode === "donate" ? "Donate Egg?" : "Release Egg?"} onClose={() => setPendingRemoval(null)}><p>This removes {pendingRemoval.egg.suggestedName || suggestHatchlingName(pendingRemoval.egg)} from your nursery.{pendingRemoval.mode === "donate" ? " You will receive 75 Gold and 1 GP." : " This cannot be undone."}</p><div className={ui.actionRow}><button type="button" onClick={() => setPendingRemoval(null)}>Cancel</button><button type="button" onClick={() => {handleRemoveEgg(pendingRemoval.egg,pendingRemoval.mode);setHatchName("");setPendingRemoval(null);}}>{pendingRemoval.mode === "donate" ? "Donate Egg" : "Release Egg"}</button></div></GameDialog> : null}
      {hatchResult ? <HatchRevealModal result={hatchResult} renameValue={revealName} onRenameValueChange={setRevealName} onConfirm={handleConfirmReveal} /> : null}
    </main>
  );
}

function PregnancyCard({
  pregnancy,
  dayState,
}: {
  pregnancy: PregnancyRecord;
  dayState: DayState;
}) {
  const progress = getPregnancyProgressPercent(pregnancy);
  const estimatedDate = getEstimatedDeliveryDateLabel(
    dayState,
    pregnancy.daysRemaining,
  );

  return (
    <article className={styles.pregnancyCard}>
      <img src={NURSERY_ASSETS.pregnancy} alt="" />
      <div>
        <strong>{pregnancy.receiver.displayName}</strong>
        <span>
          {pregnancy.daysRemaining} day{pregnancy.daysRemaining === 1 ? "" : "s"} until egg
        </span>
        <em>Expected {estimatedDate}</em>
        <em>
          {pregnancy.giver.displayName} × {pregnancy.receiver.displayName}
        </em>
        <div
          aria-label={`${progress}% pregnancy progress`}
          style={{
            height: 7,
            marginTop: 6,
            overflow: "hidden",
            borderRadius: 999,
            background: "rgba(255,255,255,.13)",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg,#f5c980,#7fdbff)",
            }}
          />
        </div>
      </div>
    </article>
  );
}

function BirthHistoryCard({ birth }: { birth: BirthRecord }) {
  const variant = getVariantDefinition(birth.variantId);
  const species = getSpeciesDefinition(birth.speciesId);
  return (
    <article className={styles.pregnancyCard}>
      <img src={NURSERY_ASSETS.hatch} alt="" />
      <div>
        <strong>{birth.nickname}</strong>
        <span>
          {birth.rarity} {variant.name} {species.name}
        </span>
        <em>Hatched Day {birth.hatchedAtDayNumber}</em>
        <em>
          {birth.parents.giver.displayName} × {birth.parents.receiver.displayName}
        </em>
      </div>
    </article>
  );
}

function LegacyBirthCard({ egg }: { egg: EggRecord }) {
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  return (
    <article className={styles.pregnancyCard}>
      <img src={NURSERY_ASSETS.hatch} alt="" />
      <div>
        <strong>{egg.suggestedName || suggestHatchlingName(egg)}</strong>
        <span>
          {egg.rarity} {variant.name} {species.name}
        </span>
        <em>Legacy hatch record</em>
        <em>
          {egg.parents.giver.displayName} × {egg.parents.receiver.displayName}
        </em>
      </div>
    </article>
  );
}

function EggDetail({
  egg,
  hatchName,
  onHatchNameChange,
  onHatch,
  onRemove,
}: {
  egg: EggRecord;
  hatchName: string;
  onHatchNameChange: (value: string) => void;
  onHatch: (egg: EggRecord) => void;
  onRemove: (egg: EggRecord, mode: "release" | "donate") => void;
}) {
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  const isReady = egg.status === "ready";
  const highestStat = Math.max(...Object.values(egg.projectedStats));
  const statHighlights = Object.entries(egg.projectedStats)
    .filter(([, value]) => value === highestStat)
    .map(([statKey]) => STAT_LABELS[statKey as keyof typeof STAT_LABELS]);
  const suggestedName = egg.suggestedName || suggestHatchlingName(egg);

  return <article className={styles.eggDetail}>
    <div className={styles.eggHero}><div className={styles.eggArtPanel}><RanchIcon name="nest" className={styles.nestIcon} /></div><div><p className={ui.eyebrow}>{egg.rarity} Egg · {egg.lineageRiskLabel ?? getLineageRiskLabel(egg.lineageRisk)}</p><h2>{suggestedName}</h2><p>{variant.name} {species.name}</p><strong className={isReady ? styles.ready : styles.timer}>{isReady ? "Ready to Hatch" : `${egg.daysRemaining} day${egg.daysRemaining === 1 ? "" : "s"} remaining`}</strong></div></div>
    {!isReady ? <progress className={styles.incubationProgress} max={Math.max(1,egg.totalDays)} value={Math.max(0,egg.totalDays-egg.daysRemaining)} aria-label="Incubation progress" /> : null}
    <div className={styles.hatchControls}><label htmlFor="hatch-name">Hatchling name<input id="hatch-name" value={hatchName} onChange={event => onHatchNameChange(event.target.value)} placeholder={suggestedName} disabled={!isReady} maxLength={24} /></label><button className={ui.primary} type="button" disabled={!isReady} onClick={() => onHatch(egg)}>Hatch</button></div>
    {!isReady ? <p className={styles.sleepNote}>Sleep to advance incubation. You can name and hatch this egg when it is ready.</p> : null}
    <div className={styles.parents}><span>Parents</span><strong>{egg.parents.giver.displayName} × {egg.parents.receiver.displayName}</strong><small>{egg.parents.giver.familyLabel} · {egg.parents.receiver.familyLabel}</small></div>
    <details className={styles.disclosure}><summary>Projected Stats & Abilities</summary><p>Strongest projected stat: {statHighlights.join(", ")}</p><div className={styles.statGrid}>{Object.entries(egg.projectedStats).map(([key,value]) => <div key={key}><span>{STAT_LABELS[key as keyof typeof STAT_LABELS]}</span><strong>{value} <small>Grade {egg.projectedStatGrades[key as keyof typeof STAT_LABELS]}</small></strong></div>)}</div>{egg.projectedAbilities.length ? egg.projectedAbilities.map(ability => <div key={ability.id}><h3>{ability.name}</h3><p>Grade {ability.grade} · {ability.source}</p><p>{ability.description}</p></div>) : <p>No ability projected. Abilities mostly come from parents; new mutations are extremely rare.</p>}</details>
    <details className={styles.disclosure}><summary>Lineage & Inheritance</summary><p>{variant.rarity} {variant.name} {species.name} · {egg.lineageRiskLabel ?? getLineageRiskLabel(egg.lineageRisk)}</p><ul>{[...(egg.lineageNotes ?? []),...(egg.lineageTraits ?? []).map(trait => `Trait marker: ${trait}`),...egg.statRollNotes,...egg.abilityRollNotes].map((note,index) => <li key={`${index}-${note}`}>{note}</li>)}</ul></details>
    <details className={styles.disclosure}><summary>Other Actions</summary><p>Remove this egg from your nursery.</p><div className={ui.actionRow}><button type="button" onClick={() => onRemove(egg,"release")}>Release</button><button type="button" onClick={() => onRemove(egg,"donate")}>Donate</button></div></details>
  </article>;
}

function HatchRevealModal({
  result,
  renameValue,
  onRenameValueChange,
  onConfirm,
}: {
  result: HatchResult;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const { egg, creature } = result;
  const lineageLabel =
    creature.lineage?.label ??
    egg.lineageRiskLabel ??
    getLineageRiskLabel(egg.lineageRisk);
  const notes = [
    ...(egg.lineageNotes ?? []),
    ...(egg.statRollNotes ?? []),
    ...(egg.abilityRollNotes ?? []),
  ].slice(0, 12);

  return <GameDialog title={`${creature.nickname} hatched!`} onClose={onConfirm} wide>
    <div className={styles.reveal}><img className={styles.hatchPortrait} src={getVariantDefinition(creature.variantId).portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt={`${creature.nickname} portrait`} onError={event => {event.currentTarget.onerror=null;event.currentTarget.src=CREATURE_PLACEHOLDER_IMAGE;}} /><p>{egg.parents.giver.displayName} × {egg.parents.receiver.displayName} · {lineageLabel}</p>
      <SharedCreatureDetail creature={creature} mode="full" showActions={false} dossier />
      <details><summary>Roll Notes</summary><ul>{notes.length ? notes.map((note,index) => <li key={`${index}-${note}`}>{note}</li>) : <li>No additional roll notes recorded.</li>}</ul></details>
      <div className={styles.hatchControls}><label>Hatchling name<input value={renameValue} onChange={event => onRenameValueChange(event.target.value)} maxLength={24} placeholder={creature.nickname} /></label><button type="button" onClick={onConfirm}>Confirm Hatchling</button></div>
    </div>
  </GameDialog>;
}
