"use client";

import { useMemo, useState } from "react";
import {
  COLLECTION_ASSETS,
  getBestStatLabels,
  getCollectionSummary,
  getHighestStatGrade,
  getOriginIcon,
  sortAndFilterCreatures,
  STAT_LABELS,
  type CreatureFilterMode,
  type CreatureSortMode,
} from "@/data/collection";
import { CREATURE_PLACEHOLDER_IMAGE, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { formatEnergy } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import styles from "./CollectionScreen.module.css";

const FILTERS: Array<{ value: CreatureFilterMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "feline", label: "Feline" },
  { value: "canine", label: "Canine" },
  { value: "bovine", label: "Bovine" },
  { value: "lapine", label: "Lapine" },
  { value: "equine", label: "Equine" },
  { value: "starter", label: "Starter" },
  { value: "market", label: "Market" },
  { value: "hatched", label: "Hatched" },
  { value: "guild", label: "Guild" },
  { value: "locked", label: "Locked" },
];

const SORTS: Array<{ value: CreatureSortMode; label: string }> = [
  { value: "name", label: "Name" },
  { value: "species", label: "Species" },
  { value: "variant", label: "Variant" },
  { value: "level", label: "Level" },
  { value: "rarity", label: "Rarity" },
  { value: "best-grade", label: "Best Grade" },
  { value: "origin", label: "Origin" },
];

function getInjuryStatus(creature: CreatureRecord, dayNumber: number): { injured: boolean; label: string; daysRemaining: number; text: string } {
  const injuredUntil = creature.injuredUntilDayNumber;
  const injured = typeof injuredUntil === "number" && injuredUntil >= dayNumber;
  const daysRemaining = injured ? Math.max(1, injuredUntil - dayNumber + 1) : 0;
  const label = creature.injuryLabel ?? "Injured";
  return { injured, label, daysRemaining, text: injured ? `${label} • ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining` : "Healthy" };
}

export function CollectionScreen() {
  const { currentSave, goToRanch, renameCreature, toggleCreatureLock, releaseCreature, donateCreature } = useGameContext();
  const [filter, setFilter] = useState<CreatureFilterMode>("all");
  const [sort, setSort] = useState<CreatureSortMode>("best-grade");
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmMode, setConfirmMode] = useState<"release" | "donate" | null>(null);
  const [message, setMessage] = useState("Review, sort, protect, release, donate, and track your creature collection.");

  const creatures = currentSave?.creatures ?? [];
  const summary = useMemo(() => (currentSave ? getCollectionSummary(currentSave) : null), [currentSave]);
  const visibleCreatures = useMemo(() => sortAndFilterCreatures(creatures, filter, sort), [creatures, filter, sort]);
  const selectedCreature = useMemo(() => { if (!visibleCreatures.length) return null; return visibleCreatures.find((creature) => creature.creatureId === selectedCreatureId) ?? visibleCreatures[0]; }, [selectedCreatureId, visibleCreatures]);

  if (!currentSave || !summary) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before viewing the collection tracker.</p><button type="button" onClick={goToRanch}>Back to Ranch</button></section></main>;
  }

  const dayNumber = currentSave.dayState.dayNumber;
  const injuredCount = creatures.filter((creature) => getInjuryStatus(creature, dayNumber).injured).length;
  function handleSelect(creature: CreatureRecord) { const injury = getInjuryStatus(creature, dayNumber); setSelectedCreatureId(creature.creatureId); setRenameValue(creature.nickname); setConfirmMode(null); setMessage(injury.injured ? `${creature.nickname} selected. ${injury.text}.` : `${creature.nickname} selected.`); }
  function handleRename() { if (!selectedCreature || !renameValue.trim()) return; renameCreature(selectedCreature.creatureId, renameValue.trim()); setMessage(`${selectedCreature.nickname} was renamed to ${renameValue.trim()}.`); }
  function handleConfirmedAction() { if (!selectedCreature || !confirmMode) return; const resultMessage = confirmMode === "donate" ? donateCreature(selectedCreature.creatureId) : releaseCreature(selectedCreature.creatureId); setMessage(resultMessage); setConfirmMode(null); setSelectedCreatureId(null); }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}><div><p className={styles.kicker}>M14 Creature Collection</p><h1>Collection Tracker</h1><p>{message}</p></div><div className={styles.headerActions}><button type="button" onClick={goToRanch}>Back to Ranch</button></div></header>
        <section className={styles.summaryGrid}>
          <SummaryCard icon={COLLECTION_ASSETS.collection} label="Species" value={String(summary.discoveredSpecies)} detail={summary.speciesNames.join(", ") || "None"} />
          <SummaryCard icon={COLLECTION_ASSETS.collection} label="Variants" value={String(summary.discoveredVariants)} detail={summary.variantNames.join(", ") || "None"} />
          <SummaryCard icon={COLLECTION_ASSETS.statGrade} label="Highest Grade" value={summary.highestGrade} detail="Best stat grade currently owned" />
          <SummaryCard icon={COLLECTION_ASSETS.originHatched} label="Injured" value={String(injuredCount)} detail="Cannot chore or breed while injured" />
          <SummaryCard icon={COLLECTION_ASSETS.release} label="Released / Donated" value={`${summary.totalReleased} / ${summary.totalDonated}`} detail="Lifetime collection removals" />
        </section>
        <section className={styles.contentGrid}>
          <aside className={styles.listPanel}>
            <div className={styles.listHeader}><h2>Creatures</h2><img src={COLLECTION_ASSETS.sortFilter} alt="" /></div>
            <div className={styles.controls}><label>Filter<select value={filter} onChange={(event) => setFilter(event.target.value as CreatureFilterMode)}>{FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value as CreatureSortMode)}>{SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
            <div className={styles.creatureList}>{visibleCreatures.map((creature) => { const variant = getVariantDefinition(creature.variantId); const species = getSpeciesDefinition(creature.speciesId); const injury = getInjuryStatus(creature, dayNumber); return <button key={creature.creatureId} type="button" className={`${styles.creatureCard} ${selectedCreature?.creatureId === creature.creatureId ? styles.selectedCard : ""} ${injury.injured ? styles.injuredCard : ""}`} onClick={() => handleSelect(creature)}><img src={variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /><div><strong>{creature.nickname}{creature.isLocked ? " 🔒" : ""}</strong><span>{variant.name} {species.name} • Lv {creature.level}</span><em>{injury.injured ? injury.text : `${variant.rarity} • Best Grade ${getHighestStatGrade(creature)}`}</em>{injury.injured ? <b className={styles.injuryBadge}>{injury.label}</b> : null}</div><img className={styles.originMiniIcon} src={getOriginIcon(creature.origin)} alt="" /></button>; })}</div>
          </aside>
          <section className={styles.detailPanel}>{selectedCreature ? <CreatureDetail creature={selectedCreature} dayNumber={dayNumber} renameValue={renameValue || selectedCreature.nickname} setRenameValue={setRenameValue} onRename={handleRename} onToggleLock={() => toggleCreatureLock(selectedCreature.creatureId)} onConfirm={setConfirmMode} /> : <div className={styles.noSelection}>No creature selected.</div>}</section>
        </section>
      </section>
      {confirmMode && selectedCreature ? <div className={styles.modalBackdrop} role="presentation" onClick={() => setConfirmMode(null)}><section className={styles.confirmModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button type="button" className={styles.closeButton} onClick={() => setConfirmMode(null)}>×</button><img src={confirmMode === "donate" ? COLLECTION_ASSETS.donate : COLLECTION_ASSETS.release} alt="" /><h2>{confirmMode === "donate" ? "Donate Creature?" : "Release Creature?"}</h2><p>{selectedCreature.isLocked ? `${selectedCreature.nickname} is locked. Unlock them first.` : `This will remove ${selectedCreature.nickname} from your ranch.`}</p><div className={styles.modalActions}><button type="button" onClick={() => setConfirmMode(null)}>Cancel</button><button type="button" disabled={selectedCreature.isLocked} onClick={handleConfirmedAction}>{confirmMode === "donate" ? "Donate" : "Release"}</button></div></section></div> : null}
    </main>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) { return <article className={styles.summaryCard}><img src={icon} alt="" /><div><span>{label}</span><strong>{value}</strong><em>{detail}</em></div></article>; }

function CreatureDetail({ creature, dayNumber, renameValue, setRenameValue, onRename, onToggleLock, onConfirm }: { creature: CreatureRecord; dayNumber: number; renameValue: string; setRenameValue: (value: string) => void; onRename: () => void; onToggleLock: () => void; onConfirm: (mode: "release" | "donate") => void }) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const bestStats = getBestStatLabels(creature);
  const injury = getInjuryStatus(creature, dayNumber);
  return <div className={styles.profileGrid}><div className={styles.artPanel}><div className={styles.originBadge}><img src={getOriginIcon(creature.origin)} alt="" /><span>{creature.originLabel}</span></div><img className={styles.profileArt} src={variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /><div className={styles.lockState}>{injury.injured ? injury.text : creature.isLocked ? "Locked / Protected" : "Unlocked"}</div></div><div className={styles.infoPanel}><div className={styles.titleRow}><div><p className={styles.kicker}>{variant.rarity} Variant</p><h2>{creature.nickname}</h2><p>{variant.name} {species.name} • Generation {creature.generation}</p></div><button type="button" className={styles.lockButton} onClick={onToggleLock}><img src={COLLECTION_ASSETS.lock} alt="" />{creature.isLocked ? "Unlock" : "Lock"}</button></div>{injury.injured ? <div className={styles.injuryNotice}><strong>{injury.text}</strong><p>This creature cannot be assigned to ranch chores or breeding until recovered.</p></div> : null}<p>{variant.description}</p><div className={styles.resourceGrid}><div><span>Energy</span><strong>{formatEnergy(creature.energy, creature.maxEnergy)}</strong></div><div><span>Status</span><strong>{injury.injured ? injury.label : "Healthy"}</strong></div><div><span>Affection</span><strong>{creature.affection} / 100</strong></div><div><span>Level</span><strong>{creature.level}</strong></div><div><span>XP</span><strong>{creature.xp} / {creature.xpToNext}</strong></div><div><span>Best Stats</span><strong>{bestStats.join(", ")}</strong></div></div><div className={styles.renameRow}><label>Rename<input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={24} /></label><button type="button" onClick={onRename}>Save Name</button></div><div className={styles.statGrid}>{Object.entries(creature.stats).map(([statKey, value]) => <div key={statKey}><span>{STAT_LABELS[statKey as keyof typeof STAT_LABELS]}</span><strong>{value}<b>Grade {creature.statGrades[statKey as keyof typeof STAT_LABELS]}</b></strong></div>)}</div><section className={styles.abilityPanel}><h3>Abilities</h3>{creature.abilities.map((ability) => <article key={ability.id}><strong>{ability.name}</strong><span>Grade {ability.grade} • {ability.source}</span><p>{ability.description}</p></article>)}</section><section className={styles.actionPanel}><button type="button" onClick={() => onConfirm("release")}><img src={COLLECTION_ASSETS.release} alt="" />Release</button><button type="button" onClick={() => onConfirm("donate")}><img src={COLLECTION_ASSETS.donate} alt="" />Donate</button></section></div></div>;
}
