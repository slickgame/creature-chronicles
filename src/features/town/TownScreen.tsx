"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { COLISEUM_C2_ENCOUNTERS, getColiseumC2HighestDivision, getColiseumC2Progress } from "@/data/coliseumC2";
import { getColiseumC3Summary } from "@/data/coliseumC3";
import { getColiseumC4Summary, getColiseumC4WeeklyBoss } from "@/data/coliseumC4";
import { getRoseLanternAccess } from "@/data/roseLantern";
import { getTotalTownUpgradeTiers } from "@/data/upgrades";
import { BlacksmithWorkshop } from "@/features/builder/BlacksmithWorkshop";
import { BuilderYardPanel } from "@/features/builder/BuilderYardPanel";
import { GameDialog } from "@/features/ui/GameDialog";
import { formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import { RoseLanternScreen } from "./RoseLanternScreen";
import styles from "./TownScreen.module.css";

const AUTO_OPEN = "creature-chronicles-open-builder-yard";
const LOCATIONS = [
  { id: "adoption", title: "Vale's Adoption Hearth", short: "Adoption Hearth", host: "Tamsin Vale", description: "Meet your next companion. Review new arrivals and adoption fees." },
  { id: "supply", title: "The Supply Depot", short: "Supply Depot", host: "Pella Mosswick", description: "Feed, materials & ranch supplies." },
  { id: "builder", title: "Builder's Yard", short: "Builder's Yard", host: "Petra Hale & Iona Flint", description: "Construction with Petra. Equipment crafting with Iona." },
  { id: "eggs", title: "The Egg Atelier", short: "Egg Atelier", host: "Dr. Selene Virell", description: "Egg appraisal, incubation care & hatch improvements." },
  { id: "guild", title: "Guild Hall", short: "Guild Hall", host: "Contracts & town upgrades", description: "Fulfill requests, earn Guild Points and improve town services." },
  { id: "training", title: "Training Grounds", short: "Training Grounds", host: "Rhea Flint", description: "Timed XP drills, stat coaching & trainer upgrades." },
  { id: "outfitter", title: "Battle Outfitter", short: "Battle Outfitter", host: "Daria Voss", description: "Equipment, move training & combat supplies." },
  { id: "coliseum", title: "Coliseum", short: "Coliseum", host: "Battles & challenges", description: "Challenge the circuit and take on rotating trials." },
  { id: "rose", title: "The Rose Lantern", short: "Rose Lantern", host: "Adults-only social house", description: "Optional social visits, hospitality work & town intelligence." },
] as const;
type LocationId = typeof LOCATIONS[number]["id"];
type Modal = "builder" | "petra" | "forge" | "rose" | "details" | null;
const MAP = "/images/ui/town-map/";
const DISTRICTS = [
  { name: "Market Square", art: "market.webp", stops: ["builder", "outfitter", "coliseum", "supply"] },
  { name: "Civic Quarter", art: "civic.webp", stops: ["adoption", "eggs", "guild", "training", "rose"] },
] as const satisfies readonly { name: string; art: string; stops: readonly LocationId[] }[];
const MARKS: Record<LocationId, string> = {
  builder: "⚒", outfitter: "◆", coliseum: "⚔", supply: "⚖",
  adoption: "♥", eggs: "◈", guild: "✦", training: "◎", rose: "✿",
};
const POSITIONS = [[25,32], [75,32], [25,73], [75,73], [50,91]] as const;
const PREVIEWS: Partial<Record<LocationId, string>> = {
  builder: "/images/ui/locations-v2/builder-yard.webp",
  outfitter: "/images/ui/outfitter-v1/background.webp",
  coliseum: "/images/ui/coliseum-v1/background.webp",
  supply: "/images/ui/forge-gallery-v1/pella-market-stall.webp",
};

export function TownScreen() {
  const { open } = useNavigation();
  const { currentSave: save, goToMainMenu, goToRanch, goToMarket, goToSupplyDepot, goToEggAtelier, goToGuildHall, goToTrainingGrounds, goToBattleOutfitter, goToBattleDebug } = useGameContext();
  const [selectedId, setSelectedId] = useState<LocationId>("builder");
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
    : selectedId === "coliseum" ? `${division.name.replace(" Division", "")} · ${progress.totalWins} wins · ${progress.completedEncounterIds.filter(id => COLISEUM_C2_ENCOUNTERS.some(e => e.encounterId === id && !e.optional)).length}/12 circuit clears`
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
    setSelectedId(DISTRICTS[next].stops[0]);
  }
  if (modal === "forge") return <BlacksmithWorkshop backLabel="Town Square" onBack={() => setModal(null)} />;
  if (modal === "rose") return <RoseLanternScreen onClose={() => setModal(null)} />;
  if (modal === "builder" || modal === "petra") return <BuilderYardPanel initialHost={modal === "petra" ? "petra" : undefined} onClose={() => setModal(null)} />;
  const district = DISTRICTS[page];
  const position = POSITIONS[district.stops.findIndex(id => id === selectedId)] ?? POSITIONS[0];
  return <main className={styles.town} data-town-location={selectedId}>
    <header className={styles.header}>
      <button onClick={goToRanch}>← Back to Ranch</button>
      <h1>Town Square</h1>
      <button data-navigation-launcher onClick={() => open("menu")}>Menu</button>
    </header>
    <div className={styles.workspace}>
      <section className={styles.mapPanel} aria-label={district.name}>
        <div className={styles.map} style={{ backgroundImage: `url("${MAP}${district.art}")` }}>
          <nav aria-label="Town destinations">
            {district.stops.map((id, index) => {
              const location = LOCATIONS.find(entry => entry.id === id)!;
              const [left, top] = POSITIONS[index];
              return <button key={id} className={styles.marker} style={{left: `${left}%`, top: `${top}%`}}
                aria-pressed={selectedId === id} aria-label={`Select ${location.short}`}
                onClick={() => setSelectedId(id)}><span aria-hidden="true">{MARKS[id]}</span> {location.short}</button>;
            })}
          </nav>
        </div>
        <nav className={styles.district} aria-label="Town districts">
          <strong>{district.name}</strong>
          <button onClick={() => changePage(1-page)}>{page === 0 ? "Civic Quarter →" : "← Market Square"}</button>
        </nav>
      </section>
      <article className={styles.details} aria-labelledby="town-destination-title">
        <h2 id="town-destination-title"><span aria-hidden="true">{MARKS[selectedId]}</span> {selected.title}</h2>
        <div key={selectedId} className={styles.preview} style={{backgroundImage: `url("${MAP}${district.art}")`, backgroundPosition: `${position[0]}% ${position[1]}%`}}>
          {PREVIEWS[selectedId] && <img src={PREVIEWS[selectedId]} alt="" />}
        </div>
        <div className={styles.copy} aria-live="polite"><strong>{selected.host}</strong><p>{selected.description}</p>{status && <small>{status}</small>}</div>
        {selectedId === "builder" && <div className={styles.services}>
          <h3>Services</h3>
          <button onClick={() => setModal("forge")}><img src="/images/ui/forge-gallery-v1/transfer-receipt-crest.webp" alt="" />Iona’s Forge <span aria-hidden="true">›</span></button>
          <button onClick={() => setModal("petra")}>Petra’s Workshop <span aria-hidden="true">›</span></button>
        </div>}
        <div className={styles.actions}><button className={styles.visit} onClick={visit}>Visit {selected.short}</button><button onClick={() => setModal("details")} aria-label={`Details for ${selected.title}`}>Details</button></div>
      </article>
    </div>
    <footer className={styles.resources} aria-label="Town resources">
      <span>{formatGameDate(save.dayState.weekday, save.dayState.month, save.dayState.dayOfMonth)}</span>
      <span>{formatGold(save.currencies.gold)}</span><span>{formatGuildPoints(save.currencies.guildPoints)}</span>
    </footer>
    {modal === "details" && <GameDialog title={selected.title} onClose={() => setModal(null)}><div className={styles.dialogCopy}><h3>{selected.host}</h3><p>{selected.description}</p>{status && <p>{status}</p>}{selectedId === "rose" && <p>{rose.reason}</p>}{selectedId === "coliseum" && <><p>{c3.marks} Marks · {c4.weeklyScore} Weekly Score</p><p>{c4.activeRun ? `Gauntlet stage ${c4.activeRun.stageIndex + 1} waiting` : `${boss.name} · ${c4.bossClaimed ? "reward claimed" : "reward available"}`}</p></>}</div></GameDialog>}
  </main>;
}

