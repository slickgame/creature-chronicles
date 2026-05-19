"use client";

import { type CSSProperties, useState } from "react";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./TownScreen.module.css";

type TownLocationId = "market" | "guild" | "ranch";

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
  travel: "/images/ui/icons/icon_travel_arrow.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
} as const;

const LOCATIONS: TownLocation[] = [
  {
    id: "market",
    title: "Market Stall",
    badge: "M6 Open",
    description: "Buy weekly creature listings and pay Gold to reroll the available market stock.",
    imageSrc: "/images/buildings/town/market_stall.png",
    x: 28,
    y: 66,
    width: 16,
  },
  {
    id: "guild",
    title: "Guild Board",
    badge: "M7 Soon",
    description: "Future contract board for requests, donations, deadlines, and Guild Point rewards.",
    imageSrc: "/images/buildings/town/guild_board.png",
    x: 62,
    y: 61,
    width: 13,
  },
  {
    id: "ranch",
    title: "Ranch Gate",
    badge: "Return",
    description: "Travel back to your ranch hub.",
    imageSrc: "/images/buildings/town/ranch_gate.png",
    x: 80,
    y: 77,
    width: 12,
  },
];

function getLocationStyle(location: TownLocation): CSSProperties {
  return {
    left: `${location.x}%`,
    top: `${location.y}%`,
    width: `${location.width}%`,
  };
}

export function TownScreen() {
  const { currentSave, goToMainMenu, goToMarket, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Welcome to town. The market is open for M6.");
  const [showGuildModal, setShowGuildModal] = useState(false);

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before entering town.</p>
          <button type="button" onClick={goToMainMenu}>Return to Main Menu</button>
        </section>
      </main>
    );
  }

  function handleLocationClick(location: TownLocation) {
    if (location.id === "market") {
      goToMarket();
      return;
    }

    if (location.id === "ranch") {
      goToRanch();
      return;
    }

    setMessage("Guild contracts are planned for M7.");
    setShowGuildModal(true);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.mapShade} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.identity}>
            <img src={TOWN_ICONS.map} alt="" />
            <div>
              <span>Town Square</span>
              <strong>{currentSave.player.name}</strong>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button type="button" onClick={goToRanch}>
              <img src={TOWN_ICONS.travel} alt="" /> Back to Ranch
            </button>
            <button type="button" onClick={goToMainMenu}>
              Main Menu
            </button>
          </div>
        </header>

        <section className={styles.titlePanel}>
          <p className={styles.kicker}>M6 Town Access</p>
          <h1>Town Square</h1>
          <p>Visit the market now. Guild contracts and other town services will expand in later milestones.</p>
          <p className={styles.message}>{message}</p>
          <p className={styles.statLine}>
            <span>Gold / GP</span>
            <strong>{formatGold(currentSave.currencies.gold)} • {formatGuildPoints(currentSave.currencies.guildPoints)}</strong>
          </p>
        </section>

        <section className={styles.mapLayer} aria-label="Town locations">
          {LOCATIONS.map((location) => (
            <button
              key={location.id}
              type="button"
              style={getLocationStyle(location)}
              className={styles.mapButton}
              onClick={() => handleLocationClick(location)}
              aria-label={`${location.title}. ${location.description}`}
            >
              <img src={location.imageSrc} alt="" />
              <span className={styles.mapLabel}>{location.title}</span>
              <span className={styles.mapBadge}>{location.badge}</span>
            </button>
          ))}
        </section>

        {showGuildModal ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setShowGuildModal(false)}>
            <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="guild-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="guild-title">Guild Board</h2>
              <p>Guild contracts arrive in M7. This board will eventually show requests, deadlines, rarity requirements, Gold rewards, and Guild Point payouts.</p>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowGuildModal(false)}>Close</button>
              </div>
            </section>
          </div>
        ) : null}

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
