"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { getColiseumC2HighestDivision, getColiseumC2Progress } from "@/data/coliseumC2";
import { getColiseumC3Summary } from "@/data/coliseumC3";
import { getColiseumC4Summary, getColiseumC4WeeklyBoss } from "@/data/coliseumC4";
import { getRoseLanternAccess } from "@/data/roseLantern";
import { getTotalTownUpgradeTiers } from "@/data/upgrades";
import { BuilderYardPanel } from "@/features/builder/BuilderYardPanel";
import { GameDialog } from "@/features/ui/GameDialog";
import { formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import { RoseLanternScreen } from "./RoseLanternScreen";
import styles from "./TownScreen.module.css";

const AUTO_OPEN = "creature-chronicles-open-builder-yard";
const ART = "/images/ui/town-v1/";
const BUILDINGS = "/images/buildings/town/";
const NPCS = "/images/npcs/town/";
const LOCATIONS = [
  { id: "adoption", title: "Vale's Adoption Hearth", short: "Adoption Hearth", host: "Tamsin Vale", description: "Meet your next companion. Review new arrivals and adoption fees.", image: BUILDINGS + "market_stall.png", portrait: NPCS + "tamsin_vale_portrait.png" },
  { id: "supply", title: "The Supply Depot", short: "Supply Depot", host: "Pella Mosswick", description: "Feed, materials & ranch supplies.", image: BUILDINGS + "supply_depot.png", portrait: NPCS + "pella_mosswick_portrait_v2.webp" },
  { id: "builder", title: "Builder's Yard", short: "Builder's Yard", host: "Petra Hale", description: "Expand your ranch and strengthen its defenses.", image: ART + "builder.webp", portrait: null },
  { id: "eggs", title: "The Egg Atelier", short: "Egg Atelier", host: "Dr. Selene Virell", description: "Egg appraisal, incubation care & hatch improvements.", image: BUILDINGS + "egg_atelier.png", portrait: NPCS + "selene_virell_portrait.png" },
  { id: "guild", title: "Guild Hall", short: "Guild Hall", host: "Contracts & town upgrades", description: "Fulfill requests, earn Guild Points and improve town services.", image: BUILDINGS + "guild_hall.png", portrait: null },
  { id: "training", title: "Training Grounds", short: "Training Grounds", host: "Rhea Flint", description: "Timed XP drills, stat coaching & trainer upgrades.", image: BUILDINGS + "training_grounds.png", portrait: NPCS + "rhea_flint_portrait.png" },
  { id: "outfitter", title: "Battle Outfitter", short: "Battle Outfitter", host: "Daria Voss", description: "Equipment, move training & combat supplies.", image: BUILDINGS + "battle_outfitter.png", portrait: NPCS + "daria_voss_portrait.png" },
  { id: "coliseum", title: "Coliseum", short: "Coliseum", host: "Battles & challenges", description: "Challenge the circuit and take on rotating trials.", image: ART + "coliseum.webp", portrait: null },
  { id: "rose", title: "The Rose Lantern", short: "Rose Lantern", host: "Adults-only social house", description: "Optional social visits, hospitality work & town intelligence.", image: ART + "rose.webp", portrait: null },
] as const;
type LocationId = typeof LOCATIONS[number]["id"];
type Modal = "builder" | "rose" | "details" | null;

export function TownScreen() {
  const { open } = useNavigation();
  const { currentSave: save, goToMainMenu, goToRanch, goToMarket, goToSupplyDepot, goToEggAtelier, goToGuildHall, goToTrainingGrounds, goToBattleOutfitter, goToBattleDebug } = useGameContext();
  const [selectedId, setSelectedId] = useState<LocationId>("supply");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  useEffect(() => {
    if (window.localStorage.getItem(AUTO_OPEN) !== "1") return;
    window.localStorage.removeItem(AUTO_OPEN);
    setSelectedId("builder");
    setModal("builder");
  }, []);
  if (!save) return <main className={styles.emptyScreen}><h1>No active save</h1><p>Load or create a save before entering town.</p><button onClick={goToMainMenu}>Return to Main Menu</button></main>;
  const selected = LOCATIONS.find(location => location.id === selectedId)!;
  const progress = getColiseumC2Progress(save);
  const division = getColiseumC2HighestDivision(save);
  const c3 = getColiseumC3Summary(save);
  const c4 = getColiseumC4Summary(save);
  const boss = getColiseumC4WeeklyBoss(save);
  const rose = getRoseLanternAccess(save);
  const status = selectedId === "adoption" ? `Network Lv. ${getTotalTownUpgradeTiers(save, "market") + 1}`
    : selectedId === "guild" ? `Board Lv. ${getTotalTownUpgradeTiers(save, "guild") + 1}`
    : selectedId === "builder" ? `${Number(save.flags.builderProjectsCompleted ?? 0)} projects completed`
    : selectedId === "coliseum" ? `${division.name.replace(" Division", "")} · ${progress.totalWins} wins · ${progress.completedEncounterIds.length}/12 clears`
    : selectedId === "rose" ? (rose.unlocked ? "Open" : "Opens after Chapter 1 or on Ranch Day 4") : null;
  function visit() {
    switch (selectedId) {
      case "adoption": return goToMarket();
      case "supply": return goToSupplyDepot();
      case "builder": return setModal("builder");
      case "eggs": return goToEggAtelier();
      case "guild": return goToGuildHall();
      case "training": return goToTrainingGrounds();
      case "outfitter": return goToBattleOutfitter();
      case "coliseum": return goToBattleDebug();
      case "rose": return setModal("rose");
    }
  }
  function changePage(next: number) {
    setPage(next);
    setSelectedId(LOCATIONS[next * 3].id);
  }
  return <main className={styles.town}>
    <header className={styles.header}>
      <h1>Town Square</h1>
      <nav aria-label="Town navigation"><button onClick={goToRanch}>← Ranch</button><button data-navigation-launcher onClick={() => open("menu")}>☰ Menu</button></nav>
    </header>
    <section className={styles.resources} aria-label="Town resources">
      <span><img src="/images/ui/icons/icon_town_map.png" alt="" />{formatGameDate(save.dayState.weekday, save.dayState.month, save.dayState.dayOfMonth)}</span>
      <span><img src="/images/ui/currency/icon_currency_gold.png" alt="" /><strong>{formatGold(save.currencies.gold)}</strong></span>
      <span><img src="/images/ui/icons/icon_guild_points.png" alt="" /><strong>{formatGuildPoints(save.currencies.guildPoints)}</strong></span>
    </section>
    <section className={styles.workspace} aria-label="Selected destination">
      <div className={styles.scene} aria-hidden="true"><span className={styles.sign}>{selected.short}</span></div>
      <article className={styles.details} aria-labelledby="town-destination-title">
        <h2 id="town-destination-title">{selected.title}</h2>
        <div className={styles.portrait}><img src={selected.portrait ?? selected.image} alt={selected.portrait ? selected.host : selected.title} /></div>
        <div className={styles.copy} aria-live="polite"><h3>{selected.host}</h3><p>{selected.description}</p>{status && <p className={styles.status}>{status}</p>}</div>
        <div className={styles.actions}><button className={styles.visit} onClick={visit}>Visit {selected.short} <span aria-hidden="true">›</span></button><button className={styles.more} onClick={() => setModal("details")} aria-label={`Details for ${selected.title}`}>Details</button></div>
      </article>
    </section>
    <nav className={styles.dock} aria-label="Town destinations">
      <button className={styles.arrow} aria-label="Previous destinations" disabled={page === 0} onClick={() => changePage(page - 1)}>‹</button>
      <div className={styles.tiles}>{LOCATIONS.slice(page * 3, page * 3 + 3).map(location => <button key={location.id} aria-pressed={selectedId === location.id} aria-label={`Select ${location.short}`} onClick={() => setSelectedId(location.id)}><img src={location.image} alt="" /><span>{location.short}</span>{selectedId === location.id && <b className={styles.check} aria-hidden="true">✓</b>}</button>)}</div>
      <div className={styles.paging}><span aria-live="polite">{page + 1} / 3</span><button className={styles.arrow} aria-label="Next destinations" disabled={page === 2} onClick={() => changePage(page + 1)}>›</button></div>
    </nav>
    {modal === "details" && <GameDialog title={selected.title} onClose={() => setModal(null)}><div className={styles.dialogCopy}><h3>{selected.host}</h3><p>{selected.description}</p>{status && <p>{status}</p>}{selectedId === "rose" && <p>{rose.reason}</p>}{selectedId === "coliseum" && <><p>{c3.marks} Marks · {c4.weeklyScore} Weekly Score</p><p>{c4.activeRun ? `Gauntlet stage ${c4.activeRun.stageIndex + 1} waiting` : `${boss.name} · ${c4.bossClaimed ? "reward claimed" : "reward available"}`}</p></>}</div></GameDialog>}
    {modal === "builder" && <GameDialog title="Builder's Yard" onClose={() => setModal(null)} wide><BuilderYardPanel embedded onClose={() => setModal(null)} /></GameDialog>}
    {modal === "rose" && <GameDialog title="The Rose Lantern" onClose={() => setModal(null)} wide><RoseLanternScreen embedded onClose={() => setModal(null)} /></GameDialog>}
  </main>;
}
