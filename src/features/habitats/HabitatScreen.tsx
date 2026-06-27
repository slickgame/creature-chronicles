"use client";

import { useMemo, useState } from "react";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  FAMILY_LABELS,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import { COLLECTION_ASSETS, getBestStatLabels, getOriginIcon } from "@/data/collection";
import { formatEnergy } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureAbility, CreatureFamily, CreatureRecord } from "@/types/creature";
import styles from "./HabitatScreen.module.css";

const STAT_LABELS = { STR: "Strength", DEX: "Dexterity", STA: "Stamina", CHA: "Charm", WIL: "Willpower", FER: "Fertility" } as const;
const HABITAT_DESCRIPTIONS: Record<CreatureFamily, string> = {
  feline: "Home for Base Feline, Sphinx, Tiger, and future feline variants.",
  canine: "Home for Base Canine, Hellhound, and Direwolf variants.",
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
function getLineageText(creature: CreatureRecord): string {
  if (creature.parentDisplayNames?.length) return `Parents: ${creature.parentDisplayNames.join(" × ")}`;
  if (creature.origin === "hatched") return creature.originLabel;
  return "Foundation creature: no recorded parents.";
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

  return <main className={styles.screen}><section className={styles.frame}><header className={styles.header}><div><p className={styles.kicker}>M15 Habitat Lineage</p><h1>{habitatTitle}</h1><p>{habitatDescription}</p></div><div className={styles.headerActions}><div className={styles.capacityCard}><span>Capacity</span><strong>{creatures.length} / {habitat.capacity}</strong></div><button type="button" onClick={goToCollection}>Collection Tracker</button><button type="button" onClick={goToRanch}>Back to Ranch</button></div></header><section className={styles.contentGrid}><aside className={styles.creatureList} aria-label="Creature list"><h2>Creatures</h2><p className={styles.helpText}>{message}</p><div className={styles.cards}>{creatures.map((creature) => { const variant = getVariantDefinition(creature.variantId); const species = getSpeciesDefinition(creature.speciesId); const isSelected = selectedCreature?.creatureId === creature.creatureId; const injury = getInjuryStatus(creature, dayNumber); return <button key={creature.creatureId} type="button" className={`${styles.creatureCard} ${isSelected ? styles.selectedCard : ""} ${injury.injured ? styles.injuredCard : ""}`} onClick={() => handleSelectCreature(creature)}><img src={getImagePath(variant.portraitPath)} alt="" onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /><div><strong>{creature.nickname}{creature.isLocked ? " 🔒" : ""}</strong><span>{variant.name} {species.name} • Gen {creature.generation}</span><em>{injury.injured ? injury.text : `${variant.rarity} • ${creature.originLabel}`}</em>{injury.injured ? <b className={styles.injuryBadge}>{injury.label}</b> : null}</div></button>; })}</div></aside><section className={styles.profilePanel} aria-label="Creature profile">{selectedCreature ? <CreatureProfile creature={selectedCreature} dayNumber={dayNumber} onDonate={handleDonate} onFeed={handleFeed} onRelease={handleRelease} onRename={handleRename} onToggleLock={handleToggleLock} renameValue={renameValue || selectedCreature.nickname} setRenameValue={setRenameValue} /> : <div className={styles.noSelection}>No creature selected.</div>}</section></section></section></main>;
}

function CreatureProfile({ creature, dayNumber, onDonate, onFeed, onRelease, onRename, onToggleLock, renameValue, setRenameValue }: { creature: CreatureRecord; dayNumber: number; onDonate: () => void; onFeed: () => void; onRelease: () => void; onRename: () => void; onToggleLock: () => void; renameValue: string; setRenameValue: (value: string) => void }) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const [activeAbility, setActiveAbility] = useState<CreatureAbility | null>(null);
  const [confirmMode, setConfirmMode] = useState<"release" | "donate" | null>(null);
  const bestStats = getBestStatLabels(creature);
  const injury = getInjuryStatus(creature, dayNumber);
  const lineageText = getLineageText(creature);
  return <div className={styles.profileGrid}><div className={styles.profileArtWrap}><div className={styles.artResourceRow}><div><span>Energy</span><strong>{formatEnergy(creature.energy, creature.maxEnergy)}</strong></div><div><span>Affection</span><strong>{creature.affection} / 100</strong></div></div><img src={getImagePath(variant.profilePath)} alt={`${creature.nickname} profile`} className={styles.profileArt} onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /><div className={styles.artResourceRow}><div><span>Level</span><strong>{creature.level}</strong></div><div><span>Status</span><strong>{injury.injured ? injury.label : "Healthy"}</strong></div></div></div><div className={styles.profileInfo}><div className={styles.profileHeaderRow}><div><p className={styles.kicker}>{variant.rarity} Variant</p><p className={styles.variantLine}>{variant.name} {species.name} • Generation {creature.generation}</p></div><label className={styles.inlineRename}>Name<input type="text" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={24} /></label></div><div className={styles.originRow}><span><img src={getOriginIcon(creature.origin)} alt="" />{creature.originLabel}</span><span><img src={COLLECTION_ASSETS.lock} alt="" />{creature.isLocked ? "Locked" : "Unlocked"}</span><span>Best: {bestStats.join(", ")}</span>{injury.injured ? <span className={styles.injuryPill}>Bandaged: {injury.daysRemaining} day{injury.daysRemaining === 1 ? "" : "s"} left</span> : <span>Healthy</span>}</div><div className={styles.injuryNotice}><strong>Lineage</strong><p>{lineageText}</p><p>{creature.lineageNote ?? `Generation ${creature.generation}.`}</p></div>{injury.injured ? <div className={styles.injuryNotice}><strong>{injury.text}</strong><p>This creature cannot be assigned to ranch chores or breeding until recovered. Feeding, locking, renaming, release, and donation still work.</p></div> : null}<p>{variant.description}</p><div className={styles.statGrid}>{Object.entries(creature.stats).map(([statKey, value]) => { const grade = creature.statGrades?.[statKey as keyof typeof STAT_LABELS] ?? "D"; return <div key={statKey}><span>{STAT_LABELS[statKey as keyof typeof STAT_LABELS]}</span><strong className={styles.statValueRow}>{value}<b>Grade {grade}</b></strong></div>; })}</div><section className={styles.abilityPanel}><h3>Abilities</h3>{creature.abilities.map((ability) => <article key={ability.id}><div><strong>{ability.name}</strong><span>Grade {ability.grade} • {ability.source}</span></div><button type="button" className={styles.infoButton} onClick={() => setActiveAbility(ability)} aria-label={`View details for ${ability.name}`}>i</button></article>)}</section><section className={styles.actionPanel}><button type="button" onClick={onRename}>Save Name</button><button type="button" onClick={onToggleLock}>{creature.isLocked ? "Unlock" : "Lock"}</button><button type="button" onClick={onFeed}>Feed</button><button type="button" onClick={() => setConfirmMode("release")}>Release</button><button type="button" onClick={() => setConfirmMode("donate")}>Donate</button></section></div>{activeAbility ? <div className={styles.abilityModalBackdrop} role="presentation" onClick={() => setActiveAbility(null)}><section className={styles.abilityModal} role="dialog" aria-modal="true" aria-labelledby="ability-modal-title" onClick={(event) => event.stopPropagation()}><button type="button" className={styles.closeModalButton} onClick={() => setActiveAbility(null)} aria-label="Close ability details">×</button><p className={styles.kicker}>Ability Details</p><h2 id="ability-modal-title">{activeAbility.name}</h2><p className={styles.variantLine}>Grade {activeAbility.grade} • {activeAbility.source}</p><p>{activeAbility.description}</p></section></div> : null}{confirmMode ? <div className={styles.abilityModalBackdrop} role="presentation" onClick={() => setConfirmMode(null)}><section className={styles.abilityModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button type="button" className={styles.closeModalButton} onClick={() => setConfirmMode(null)} aria-label="Close confirmation">×</button><p className={styles.kicker}>{confirmMode === "donate" ? "Donate Creature" : "Release Creature"}</p><h2>{creature.nickname}</h2><p>{creature.isLocked ? "This creature is locked. Unlock them before removing them from the ranch." : "This permanently removes the creature from your ranch."}</p><section className={styles.actionPanel}><button type="button" onClick={() => setConfirmMode(null)}>Cancel</button><button type="button" disabled={creature.isLocked} onClick={confirmMode === "donate" ? onDonate : onRelease}>{confirmMode === "donate" ? "Confirm Donate" : "Confirm Release"}</button></section></section></div> : null}</div>;
}
