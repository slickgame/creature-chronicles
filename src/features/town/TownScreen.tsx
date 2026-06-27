"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { TAX_COLLECTOR, getTaxCollectorState } from "@/data/taxCollector";
import { getTotalTownUpgradeTiers } from "@/data/upgrades";
import { formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./TownScreen.module.css";

type TownLocationId = "market" | "guild" | "ranch" | "tax";
type ModalMode = "none" | "town-info" | "nav-menu" | "tax";

type TownLocation = {
  id: TownLocationId;
  title: string;
  badge: string;
  description: string;
  imageSrc: string;
  x: number;
  y: number;
  width: number;
};

const TOWN_ICONS = {
  crest: "/images/ui/icons/icon_paw_crest.png",
  map: "/images/ui/icons/icon_town_map.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
  market: "/images/buildings/town/market_stall.png",
  guild: "/images/buildings/town/guild_hall.png",
  ranch: "/images/buildings/town/ranch_gate.png",
  menu: "/images/ui/icons/icon_collection_book.png",
  tax: TAX_COLLECTOR.portraitPath,
} as const;

const LOCATIONS: TownLocation[] = [
  { id: "market", title: "Market Stall", badge: "M10.5 Upgradable", description: "Buy weekly creature listings and pay Gold to reroll the available market stock.", imageSrc: "/images/buildings/town/market_stall.png", x: 28, y: 66, width: 16 },
  { id: "guild", title: "Guild Hall", badge: "M10.5 Services", description: "Enter the guild hall to review contracts, donate creatures, earn Guild Points, and upgrade town services.", imageSrc: "/images/buildings/town/guild_hall.png", x: 60, y: 60, width: 15 },
  { id: "tax", title: "Tax Office", badge: "Notice", description: "Review the posted monthly tax and payment deadline.", imageSrc: TAX_COLLECTOR.portraitPath, x: 45, y: 74, width: 8 },
  { id: "ranch", title: "Ranch Gate", badge: "Return", description: "Travel back to your ranch hub.", imageSrc: "/images/buildings/town/ranch_gate.png", x: 80, y: 77, width: 12 },
];

function getLocationStyle(location: TownLocation): CSSProperties {
  return { left: `${location.x}%`, top: `${location.y}%`, width: `${location.width}%` };
}

export function TownScreen() {
  const { currentSave, goToGuildHall, goToMainMenu, goToMarket, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Welcome to town. The market and guild hall are open.");
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const marketLevel = useMemo(() => (currentSave ? getTotalTownUpgradeTiers(currentSave, "market") + 1 : 1), [currentSave]);
  const boardLevel = useMemo(() => (currentSave ? getTotalTownUpgradeTiers(currentSave, "guild") + 1 : 1), [currentSave]);
  const totalTownUpgrades = useMemo(() => (currentSave ? getTotalTownUpgradeTiers(currentSave) : 0), [currentSave]);
  const dateLabel = useMemo(() => currentSave ? formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth) : "Mon 1/1", [currentSave]);
  const taxState = useMemo(() => currentSave ? getTaxCollectorState(currentSave) : null, [currentSave]);
  const visibleLocations = useMemo(() => LOCATIONS.filter((location) => location.id !== "tax" || taxState?.visible), [taxState?.visible]);

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering town.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function closeModal() { setModalMode("none"); }
  function handleLocationClick(location: TownLocation) { if (location.id === "market") { goToMarket(); return; } if (location.id === "guild") { goToGuildHall(); return; } if (location.id === "ranch") { goToRanch(); return; } if (location.id === "tax") { setMessage("The monthly payment notice is posted."); setModalMode("tax"); return; } setMessage("That town location is not available yet."); }
  function getDynamicBadge(location: TownLocation): string { if (location.id === "market") return `Lv. ${marketLevel}`; if (location.id === "guild") return `Board Lv. ${boardLevel}`; if (location.id === "tax") return taxState?.mood === "urgent" ? "Final Notice" : taxState?.mood === "paid" ? "Paid" : "Tax Notice"; return location.badge; }

  const taxDue = Number(currentSave.flags.taxCurrentMonthDue ?? taxState?.due ?? 0);
  const taxDays = Number(currentSave.flags.taxDaysUntilDue ?? taxState?.daysUntilDue ?? 0);

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.mapShade} aria-hidden="true" /><header className={styles.header}><div className={styles.identity}><img src={TOWN_ICONS.map} alt="" /><div><span>Town Square</span><strong>{currentSave.player.name}</strong></div></div><section className={styles.townStats} aria-label="Town resources"><div><img src={TOWN_ICONS.crest} alt="" /><span>Date</span><strong>{dateLabel}</strong></div><div><img src={TOWN_ICONS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div><img src={TOWN_ICONS.gp} alt="" /><span>GP</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div><div><img src={TOWN_ICONS.tax} alt="" /><span>Tax</span><strong>{taxDue ? `${taxDue}g / ${taxDays}d` : "Posting"}</strong></div></section><nav className={styles.headerActions} aria-label="Town navigation"><button type="button" onClick={() => setModalMode("nav-menu")}><img src={TOWN_ICONS.menu} alt="" /> Menu</button></nav></header><section className={`${styles.titlePanel} ${styles.compactTitlePanel}`}><div><p className={styles.kicker}>M15 Monthly Tax</p><h1>Town Square</h1></div><button type="button" className={styles.infoButton} onClick={() => setModalMode("town-info")} aria-label="Town square details">i</button></section><section className={styles.mapLayer} aria-label="Town locations">{visibleLocations.map((location) => <button key={location.id} type="button" style={getLocationStyle(location)} className={styles.mapButton} onClick={() => handleLocationClick(location)} aria-label={`${location.title}. ${location.description}`}><img src={location.imageSrc} alt="" /><span className={styles.mapLabel}>{location.title}</span><span className={styles.mapBadge}>{getDynamicBadge(location)}</span></button>)}</section>{modalMode !== "none" ? <div className={styles.modalBackdrop} role="presentation">{modalMode === "nav-menu" ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.navMenuPanel}`} role="dialog" aria-modal="true" aria-labelledby="town-menu-title"><header className={styles.modalHeader}><div><p className={styles.kicker}>Town Navigation</p><h2 id="town-menu-title">Menu</h2></div><button type="button" onClick={closeModal}>Close</button></header><div className={styles.navMenuGrid}><button type="button" onClick={goToMarket}><img src={TOWN_ICONS.market} alt="" /><span>Market Stall</span><em>Buy creatures and reroll stock</em></button><button type="button" onClick={goToGuildHall}><img src={TOWN_ICONS.guild} alt="" /><span>Guild Hall</span><em>Contracts and service upgrades</em></button>{taxState?.visible ? <button type="button" onClick={() => setModalMode("tax")}><img src={TOWN_ICONS.tax} alt="" /><span>Tax Office</span><em>{taxDue} Gold due by Day 30</em></button> : null}<button type="button" onClick={goToRanch}><img src={TOWN_ICONS.ranch} alt="" /><span>Back to Ranch</span><em>Return home</em></button><button type="button" onClick={goToMainMenu}><img src={TOWN_ICONS.crest} alt="" /><span>Main Menu</span><em>Save slots</em></button></div></section> : null}{modalMode === "town-info" ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.townInfoPanel}`} role="dialog" aria-modal="true" aria-labelledby="town-info-title"><header className={styles.modalHeader}><div><p className={styles.kicker}>Town Square</p><h2 id="town-info-title">Town Hub</h2></div><button type="button" onClick={closeModal}>Close</button></header><p className={styles.townInfoLead}>Visit the market for weekly creature listings or enter the Guild Hall for contracts, donations, Guild Points, and town service upgrades.</p><div className={styles.townInfoStats}><div><span>Status</span><strong>{message}</strong></div><div><span>Gold / GP</span><strong>{formatGold(currentSave.currencies.gold)} • {formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div><div><span>Tax</span><strong>{taxDue} Gold</strong></div><div><span>Due</span><strong>Day 30</strong></div></div><p className={styles.townInfoNote}>Service levels: Market Lv. {marketLevel} • Board Lv. {boardLevel} • {totalTownUpgrades} upgrade tiers.</p><p className={styles.townInfoNote}>The monthly bill is posted at the start of the month and stays fixed until it is collected.</p></section> : null}{modalMode === "tax" && taxState ? <section className={`${styles.modalPanel} ${styles.nightModalPanel} ${styles.taxCollectorPanel}`} role="dialog" aria-modal="true" aria-labelledby="tax-title"><header className={styles.modalHeader}><div><p className={styles.kicker}>{TAX_COLLECTOR.title}</p><h2 id="tax-title">{TAX_COLLECTOR.name}</h2></div><button type="button" onClick={closeModal}>Close</button></header><div className={styles.taxCollectorLayout}><div className={styles.taxPortraitWrap}><img src={TAX_COLLECTOR.portraitPath} alt={TAX_COLLECTOR.name} /></div><div><h3>{taxState.heading}</h3><p className={styles.townInfoLead}>{taxState.body}</p><div className={styles.townInfoStats}><div><span>Posted Tax</span><strong>{taxDue} Gold</strong></div><div><span>Due Day</span><strong>Day 30</strong></div><div><span>Days Left</span><strong>{taxDays}</strong></div><div><span>Your Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div></div><p className={styles.townInfoNote}>This bill is finalized at the start of each month. Changes during the month affect future bills, not this one.</p></div></div></section> : null}</div> : null}<footer className={styles.versionFooter}>{version}</footer></section></main>;
}
