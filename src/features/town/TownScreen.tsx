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
    title: "Guild Hall",
    badge: "M7 Open",
    description: "Enter the guild hall to review contracts, donate creatures, and earn Guild Points.",
    imageSrc: "/images/buildings/town/guild_hall.png",
    x: 60,
    y: 60,
    width: 15,
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
  const { currentSave, goToGuildHall, goToMainMenu, goToMarket, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Welcome to town. The market and guild hall are open.");

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

    if (location.id === "guild") {
      goToGuildHall();
      return;
    }

    if (location.id === "ranch") {
      goToRanch();
      return;
    }

    setMessage("That town location is not available yet.");
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
          <p className={styles.kicker}>M7 Town Access</p>
          <h1>Town Square</h1>
          <p>Visit the market or enter the Guild Hall for weekly contracts.</p>
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

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
