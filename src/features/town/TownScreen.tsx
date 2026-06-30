"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getTotalTownUpgradeTiers } from "@/data/upgrades";
import { formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./TownScreen.module.css";

type TownLocationId = "adoption" | "supply-depot" | "egg-atelier" | "guild" | "ranch" | "training-grounds" | "battle-outfitter" | "coliseum";
type TownLocation = { id: TownLocationId; title: string; badge: string; description: string; imageSrc: string; x: number; y: number; width: number; isPlanned?: boolean; futureRole?: string; futureSystems?: string[] };
type ModalMode = "none" | "town-info" | "nav-menu" | "future-location";

const TOWN_ICONS = {
  crest: "/images/ui/icons/icon_paw_crest.png",
  map: "/images/ui/icons/icon_town_map.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
  adoption: "/images/buildings/town/market_stall.png",
  supplyDepot: "/images/buildings/town/supply_depot.png",
  eggAtelier: "/images/buildings/town/egg_atelier.png",
  guild: "/images/buildings/town/guild_hall.png",
  ranch: "/images/buildings/town/ranch_gate.png",
  training: "/images/buildings/town/training_grounds.png",
  battleOutfitter: "/images/buildings/town/battle_outfitter.png",
  coliseum: "/images/buildings/town/coliseum.png",
  menu: "/images/ui/icons/icon_collection_book.png",
} as const;

const LOCATIONS: TownLocation[] = [
  { id: "adoption", title: "Vale's Adoption Hearth", badge: "Adoption", description: "Meet Tamsin Vale to review weekly adoption listings, adoption fees, and new arrivals.", imageSrc: TOWN_ICONS.adoption, x: 21, y: 66, width: 13 },
  { id: "supply-depot", title: "The Supply Depot", badge: "Pella", description: "Visit Pella Mosswick for feed, materials, energy snacks, repair kits, and practical ranch supplies.", imageSrc: TOWN_ICONS.supplyDepot, x: 38, y: 72, width: 11 },
  { id: "egg-atelier", title: "The Egg Atelier", badge: "Selene", description: "Visit Dr. Selene Virell for egg appraisal, incubation care, and small odds-based hatch improvements.", imageSrc: TOWN_ICONS.eggAtelier, x: 52, y: 73, width: 11 },
  { id: "guild", title: "Guild Hall", badge: "Contracts", description: "Review contracts, donate creatures into requests, earn Guild Points, and upgrade town services.", imageSrc: TOWN_ICONS.guild, x: 67, y: 60, width: 13 },
  { id: "training-grounds", title: "Training Grounds", badge: "Coach", description: "Train creatures with Rhea Flint for timed XP drills, stat coaching, and trainer upgrades.", imageSrc: TOWN_ICONS.training, x: 79, y: 70, width: 10 },
  { id: "battle-outfitter", title: "Battle Outfitter", badge: "Combat Prep", description: "Visit Darian Voss for early combat stock: equipment, manuals, consumables, and team-prep kits.", imageSrc: TOWN_ICONS.battleOutfitter, x: 84, y: 50, width: 10 },
  { id: "coliseum", title: "Battle Debug Lab", badge: "Combat Test", description: "Run an isolated sample 3v3 battle log from the active save before building the polished Coliseum UI.", imageSrc: TOWN_ICONS.coliseum, x: 57, y: 45, width: 12 },
  { id: "ranch", title: "Ranch Gate", badge: "Return", description: "Travel back to your ranch hub.", imageSrc: TOWN_ICONS.ranch, x: 90, y: 82, width: 9 },
];

function getLocationStyle(location: TownLocation): CSSProperties {
  return { left: `${location.x}%`, top: `${location.y}%`, width: `${location.width}%` };
}

export function TownScreen() {
  const { currentSave, goToBattleDebug, goToBattleOutfitter, goToEggAtelier, goToGuildHall, goToMainMenu, goToMarket, goToRanch, goToSupplyDepot, goToTrainingGrounds } = useGameContext();
  const [message, setMessage] = useState("Welcome to town. The Battle Debug Lab is open for early combat-engine testing.");
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedFutureLocation, setSelectedFutureLocation] = useState<TownLocation | null>(null);
  const adoptionLevel = useMemo(() => (currentSave ? getTotalTownUpgradeTiers(currentSave, "market") + 1 : 1), [currentSave]);
  const boardLevel = useMemo(() => (currentSave ? getTotalTownUpgradeTiers(currentSave, "guild") + 1 : 1), [currentSave]);
  const dateLabel = useMemo(() => currentSave ? formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth) : "Mon 1/1", [currentSave]);

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering town.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function closeModal() { setModalMode("none"); setSelectedFutureLocation(null); }
  function openFutureLocation(location: TownLocation) { setSelectedFutureLocation(location); setMessage(`${location.title} is planned as a ${location.futureRole ?? "future town service"}.`); setModalMode("future-location"); }
  function handleLocationClick(location: TownLocation) { if (location.id === "adoption") return goToMarket(); if (location.id === "supply-depot") return goToSupplyDepot(); if (location.id === "egg-atelier") return goToEggAtelier(); if (location.id === "guild") return goToGuildHall(); if (location.id === "training-grounds") return goToTrainingGrounds(); if (location.id === "battle-outfitter") return goToBattleOutfitter(); if (location.id === "coliseum") return goToBattleDebug(); if (location.id === "ranch") return goToRanch(); if (location.isPlanned) return openFutureLocation(location); setMessage("That town location is not available yet."); }
  function getDynamicBadge(location: TownLocation): string { if (location.id === "adoption") return `Network Lv. ${adoptionLevel}`; if (location.id === "guild") return `Board Lv. ${boardLevel}`; return location.badge; }

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.mapShade} aria-hidden="true" /><header className={styles.header}><div className={styles.identity}><img src={TOWN_ICONS.map} alt="" /><div><span>Town Square</span><strong>{currentSave.player.name}</strong></div></div><section className={styles.townStats} aria-label="Town resources"><div><img src={TOWN_ICONS.crest} alt="" /><span>Date</span><strong>{dateLabel}</strong></div><div><img src={TOWN_ICONS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div><img src={TOWN_ICONS.gp} alt="" /><span>GP</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div><div><img src={TOWN_ICONS.coliseum} alt="" /><span>Combat</span><strong>Debug</strong></div></section><nav className={styles.headerActions} aria-label="Town navigation"><button type="button" onClick={() => setModalMode("nav-menu")}><img src={TOWN_ICONS.menu} alt="" /> Menu</button></nav></header><section className={`${styles.titlePanel} ${styles.compactTitlePanel}`}><div><p className={styles.kicker}>Town Services</p><h1>Town Square</h1><p>{message}</p></div><button type="button" className={styles.infoButton} onClick={() => setModalMode("town-info")} aria-label="Town square details">i</button></section><section className={styles.mapLayer} aria-label="Town locations">{LOCATIONS.map((location) => <button key={location.id} type="button" style={getLocationStyle(location)} className={styles.mapButton} onClick={() => handleLocationClick(location)} aria-label={`${location.title}. ${location.description}`}><img src={location.imageSrc} alt="" onError={(event) => { event.currentTarget.src = TOWN_ICONS.crest; }} /><span className={styles.mapLabel}>{location.title}</span><span className={styles.mapBadge}>{getDynamicBadge(location)}</span></button>)}</section>{modalMode !== "none" ? <div className={styles.modalBackdrop} role="presentation">{modalMode === "nav-menu" ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.navMenuPanel}`} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><p className={styles.kicker}>Town Navigation</p><h2>Menu</h2></div><button type="button" onClick={closeModal}>Close</button></header><div className={styles.navMenuGrid}>{LOCATIONS.map((location) => <button key={location.id} type="button" onClick={() => handleLocationClick(location)}><img src={location.imageSrc} alt="" onError={(event) => { event.currentTarget.src = TOWN_ICONS.crest; }} /><span>{location.title}</span><em>{location.description}</em></button>)}<button type="button" onClick={goToMainMenu}><img src={TOWN_ICONS.crest} alt="" /><span>Main Menu</span><em>Save slots</em></button></div></section> : null}{modalMode === "future-location" && selectedFutureLocation ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.townInfoPanel}`} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><p className={styles.kicker}>Planned Location</p><h2>{selectedFutureLocation.title}</h2></div><button type="button" onClick={closeModal}>Close</button></header><p className={styles.townInfoLead}>{selectedFutureLocation.description}</p><div className={styles.townInfoStats}><div><span>Role</span><strong>{selectedFutureLocation.futureRole ?? "Future town service"}</strong></div>{selectedFutureLocation.futureSystems?.map((system) => <div key={system}><span>Possible System</span><strong>{system}</strong></div>)}</div></section> : null}{modalMode === "town-info" ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.townInfoPanel}`} role="dialog" aria-modal="true"><header className={styles.modalHeader}><div><p className={styles.kicker}>Town Square</p><h2>Current Services</h2></div><button type="button" onClick={closeModal}>Close</button></header><p className={styles.townInfoLead}>Town now includes adoption, supplies, egg care, contracts, training, the Battle Outfitter, and the temporary Battle Debug Lab for combat-engine testing.</p><div className={styles.townInfoStats}>{LOCATIONS.map((location) => <div key={location.id}><span>{location.badge}</span><strong>{location.title}</strong></div>)}</div></section> : null}</div> : null}</section></main>;
}
