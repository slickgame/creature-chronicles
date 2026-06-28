"use client";

import { useMemo, useState } from "react";
import { CREATURE_PLACEHOLDER_IMAGE, FAMILY_LABELS, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { COLLECTION_ASSETS, getBestStatLabels, getOriginIcon } from "@/data/collection";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily, CreatureRecord } from "@/types/creature";
import styles from "./HabitatScreen.module.css";

const HABITAT_DESCRIPTIONS: Record<CreatureFamily, string> = {
  feline: "Home for Base Feline, Sphinx, Tiger, and future feline variants.",
  canine: "Home for Base Canine, Hellhound, Direwolf, and future canine variants.",
  bovine: "Home for Cow, Minotaur, Moon Yak, and future production-focused bovine variants.",
  lapine: "Home for Bunny, Antlerhare, Dream Lop, and future garden or nursery lapine variants.",
  equine: "Home for Horse, Unicorn, Nightmare, and future travel or field-work equine variants.",
};
function getImagePath(path: string): string { return path || CREATURE_PLACEHOLDER_IMAGE; }
function getInjuryStatus(creature: CreatureRecord, dayNumber: number): { injured: boolean; label: string; daysRemaining: number; text: string } {
  const injuredUntil = creature.injuredUntilDayNumber;
  const injured = typeof injuredUntil === "number" && injuredUntil >= dayNumber;
  const daysRemaining = injured ? Math.max(1, injuredUntil - dayNumber + 1) : 0;
  const label = creature.injuryLabel ?? "Injured";
  return { injured, label, daysRemaining, text: injured ? `${label} • ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining` : "Healthy" };
}

export function HabitatScreen() {
  const { activeHabitatFamily, currentSave, donateCreature, feedCreature, goToCollection, goToRanch, releaseCreature, renameCreature, toggleCreatureLock } = useGameContext();
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [message, setMessage] = useState("Select a creature to view its profile.");
  const habitat = useMemo(() => (currentSave?.habitats ?? []).find((item) => item.family === activeHabitatFamily), [activeHabitatFamily, currentSave?.habitats]);
  const creatures = useMemo(() => { if (!activeHabitatFamily || !currentSave?.creatures) return []; return currentSave.creatures.filter((creature) => getVariantDefinition(creature.variantId).family === activeHabitatFamily); }, [activeHabitatFamily, currentSave?.creatures]);
  const selectedCreature = useMemo(() => { if (!selectedCreatureId) return creatures[0] ?? null; return creatures.find((creature) => creature.creatureId === selectedCreatureId) ?? creatures[0] ?? null; }, [creatures, selectedCreatureId]);

  if (!currentSave || !activeHabitatFamily || !habitat) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>Habitat unavailable</h1><p>Return to the ranch and select an unlocked habitat.</p><button type="button" onClick={goToRanch}>Back to Ranch</button></section></main>;
  const habitatTitle = habitat.name || `${FAMILY_LABELS[activeHabitatFamily]} Habitat`;
  const habitatDescription = HABITAT_DESCRIPTIONS[activeHabitatFamily];
  const dayNumber = currentSave.dayState.dayNumber;
  function handleSelectCreature(creature: CreatureRecord) { const injury = getInjuryStatus(creature, dayNumber); setSelectedCreatureId(creature.creatureId); setRenameValue(creature.nickname); setMessage(injury.injured ? `${creature.nickname} selected. ${injury.text}.` : `${creature.nickname} selected.`); }
  function handleRename() { if (!selectedCreature || !renameValue.trim()) return; renameCreature(selectedCreature.creatureId, renameValue); setMessage(`${selectedCreature.nickname} was renamed to ${renameValue.trim()}.`); }
  function handleFeed() { if (!selectedCreature) return; feedCreature(selectedCreature.creatureId); setMessage(`${selectedCreature.nickname} was fed. Affection and creature energy increased.`); }
  function handleToggleLock() { if (!selectedCreature) return; toggleCreatureLock(selectedCreature.creatureId); setMessage(selectedCreature.isLocked ? `${selectedCreature.nickname} was unlocked.` : `${selectedCreature.nickname} is now locked and protected.`); }
  function handleRelease() { if (!selectedCreature) return; const result = releaseCreature(selectedCreature.creatureId); setSelectedCreatureId(null); setMessage(result); }
  function handleDonate() { if (!selectedCreature) return; const result = donateCreature(selectedCreature.creatureId); setSelectedCreatureId(null); setMessage(result); }

  return <main className={styles.screen}><section className={styles.frame}><header className={styles.header}><div><p className={styles.kicker}>M32 Habitat Profile Refresh</p><h1>{habitatTitle}</h1><p>{habitatDescription}</p></div><div className={styles.headerActions}><div className={styles.capacityCard}><span>Capacity</span><strong>{creatures.length} / {habitat.capacity}</strong></div><button type="button" onClick={goToCollection}>Collection Tracker</button><button type="button" onClick={goToRanch}>Back to Ranch</button></div></header><section className={styles.contentGrid}><aside className={styles.creatureList} aria-label="Creature list"><h2>Creatures</h2><p className={styles.helpText}>{message}</p><div className={styles.cards}>{creatures.map((creature) => { const variant = getVariantDefinition(creature.variantId); const species = getSpeciesDefinition(creature.speciesId); const isSelected = selectedCreature?.creatureId === creature.creatureId; const injury = getInjuryStatus(creature, dayNumber); return <button key={creature.creatureId} type="button" className={`${styles.creatureCard} ${isSelected ? styles.selectedCard : ""} ${injury.injured ? styles.injuredCard : ""}`} onClick={() => handleSelectCreature(creature)}><img src={getImagePath(variant.portraitPath)} alt="" onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /><div><strong>{creature.nickname}{creature.isLocked ? " 🔒" : ""}</strong><span>{variant.name} {species.name} • Lv {creature.level}</span><em>{injury.injured ? injury.text : `${variant.rarity} • ${creature.originLabel}`}</em>{injury.injured ? <b className={styles.injuryBadge}>{injury.label}</b> : null}</div></button>; })}</div></aside><section className={styles.profilePanel} aria-label="Creature profile">{selectedCreature ? <CreatureProfile creature={selectedCreature} dayNumber={dayNumber} onDonate={handleDonate} onFeed={handleFeed} onRelease={handleRelease} onRename={handleRename} onToggleLock={handleToggleLock} renameValue={renameValue || selectedCreature.nickname} setRenameValue={setRenameValue} /> : <div className={styles.noSelection}>No creature selected.</div>}</section></section></section></main>;
}

function CreatureProfile({ creature, dayNumber, onDonate, onFeed, onRelease, onRename, onToggleLock, renameValue, setRenameValue }: { creature: CreatureRecord; dayNumber: number; onDonate: () => void; onFeed: () => void; onRelease: () => void; onRename: () => void; onToggleLock: () => void; renameValue: string; setRenameValue: (value: string) => void }) {
  const injury = getInjuryStatus(creature, dayNumber);
  const bestStats = getBestStatLabels(creature);
  return <div className={styles.sharedHabitatProfile}><section className={styles.profileTopChips}><span><img src={getOriginIcon(creature.origin)} alt="" />{creature.originLabel}</span><span><img src={COLLECTION_ASSETS.lock} alt="" />{creature.isLocked ? "Locked" : "Unlocked"}</span><span>Best: {bestStats.join(", ")}</span>{injury.injured ? <span className={styles.injuryPill}>Bandaged: {injury.daysRemaining} day{injury.daysRemaining === 1 ? "" : "s"} left</span> : <span>Healthy</span>}<button type="button" onClick={onFeed}>Feed</button></section>{injury.injured ? <div className={styles.injuryNotice}><strong>{injury.text}</strong><p>This creature cannot be assigned to ranch chores or breeding until recovered. Feeding, locking, renaming, release, and donation still work.</p></div> : null}<SharedCreatureDetail creature={creature} dayNumber={dayNumber} renameValue={renameValue} onRenameValueChange={setRenameValue} onRename={onRename} onToggleLock={onToggleLock} onRelease={onRelease} onDonate={onDonate} /></div>;
}
