"use client";

import { useMemo, useState } from "react";
import { formatEnergy, formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext, type DayAdvanceResult } from "@/state/GameProvider";
import styles from "./RanchHubScreen.module.css";

type ModalMode = "none" | "sleep-confirm" | "day-summary";

const HUD_ICONS = {
  gold: "/images/ui/icons/icon_gold_paw_medallion.png",
  crest: "/images/ui/icons/icon_paw_crest.png",
} as const;

const BUILDINGS = [
  {
    id: "house",
    title: "Ranch House",
    icon: "🏠",
    status: "Available",
    description: "Rest for the night and advance to the next day.",
    actionLabel: "Sleep",
  },
  {
    id: "feline",
    title: "Feline Habitat",
    icon: "🐈",
    status: "M3",
    description: "Future home for Feline, Sphinx, and Saberfang creatures.",
    actionLabel: "View Soon",
  },
  {
    id: "canine",
    title: "Canine Habitat",
    icon: "🐺",
    status: "M3",
    description: "Future home for Canine, Hellhound, and Direwolf creatures.",
    actionLabel: "View Soon",
  },
  {
    id: "breeding",
    title: "Breeding Pen",
    icon: "💞",
    status: "M4",
    description: "Future location for pair selection, previews, and breeding scenes.",
    actionLabel: "Locked",
  },
  {
    id: "nursery",
    title: "Egg Nursery",
    icon: "🥚",
    status: "M5",
    description: "Future location for pregnancy, egg timers, and hatch results.",
    actionLabel: "Locked",
  },
  {
    id: "market",
    title: "Market Road",
    icon: "🛒",
    status: "M6",
    description: "Future market access for weekly creature listings.",
    actionLabel: "Locked",
  },
  {
    id: "guild",
    title: "Guild Board",
    icon: "📜",
    status: "M7",
    description: "Future contract board for bronze, silver, and gold requests.",
    actionLabel: "Locked",
  },
] as const;

export function RanchHubScreen() {
  const { advanceDay, currentSave, goToMainMenu, version } = useGameContext();
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [daySummary, setDaySummary] = useState<DayAdvanceResult | null>(null);
  const [message, setMessage] = useState("Welcome back to the ranch.");

  const dateLabel = useMemo(() => {
    if (!currentSave) {
      return "Mon 1/1";
    }

    return formatGameDate(
      currentSave.dayState.weekday,
      currentSave.dayState.month,
      currentSave.dayState.dayOfMonth,
    );
  }, [currentSave]);

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before entering the ranch.</p>
          <button type="button" onClick={goToMainMenu}>
            Return to Main Menu
          </button>
        </section>
      </main>
    );
  }

  function handleBuildingClick(buildingId: string) {
    if (buildingId === "house") {
      setModalMode("sleep-confirm");
      return;
    }

    const building = BUILDINGS.find((item) => item.id === buildingId);
    setMessage(`${building?.title ?? "This feature"} is planned for ${building?.status ?? "later"}.`);
  }

  function handleSleep() {
    const result = advanceDay();

    if (!result) {
      return;
    }

    setDaySummary(result);
    setModalMode("day-summary");
  }

  return (
    <main className={styles.screen}>
      <section className={styles.ranchFrame}>
        <div className={styles.backgroundArt} aria-hidden="true" />

        <header className={styles.hud}>
          <div className={styles.hudIdentity}>
            <img src={HUD_ICONS.crest} alt="" />
            <div>
              <span>{currentSave.player.ranchName}</span>
              <strong>{currentSave.player.name}</strong>
            </div>
          </div>

          <div className={styles.hudStats} aria-label="Player resources">
            <div>
              <span>Date</span>
              <strong>{dateLabel}</strong>
            </div>
            <div>
              <span>Energy</span>
              <strong>
                {formatEnergy(currentSave.currencies.energy, currentSave.currencies.maxEnergy)}
              </strong>
            </div>
            <div>
              <span>Gold</span>
              <strong>{formatGold(currentSave.currencies.gold)}</strong>
            </div>
            <div>
              <span>GP</span>
              <strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong>
            </div>
          </div>

          <button type="button" className={styles.menuButton} onClick={goToMainMenu}>
            Main Menu
          </button>
        </header>

        <section className={styles.ranchTitlePanel}>
          <p className={styles.kicker}>Home Ranch</p>
          <h1>Ranch Hub</h1>
          <p>
            M2 adds the ranch screen, HUD, clickable buildings, sleep modal, day advance,
            and reset summary shell.
          </p>
          <p className={styles.message}>{message}</p>
        </section>

        <section className={styles.buildingGrid} aria-label="Ranch buildings">
          {BUILDINGS.map((building) => (
            <button
              key={building.id}
              type="button"
              className={`${styles.buildingCard} ${
                building.id === "house" ? styles.availableCard : ""
              }`}
              onClick={() => handleBuildingClick(building.id)}
            >
              <span className={styles.buildingStatus}>{building.status}</span>
              <span className={styles.buildingIcon}>{building.icon}</span>
              <strong>{building.title}</strong>
              <span>{building.description}</span>
              <em>{building.actionLabel}</em>
            </button>
          ))}
        </section>

        {modalMode !== "none" ? (
          <div className={styles.modalBackdrop} role="presentation">
            {modalMode === "sleep-confirm" ? (
              <section
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sleep-title"
              >
                <h2 id="sleep-title">Sleep Until Tomorrow?</h2>
                <p>
                  Sleeping advances the day. Time does not pass from normal ranch actions;
                  only sleeping changes the date.
                </p>
                <ul>
                  <li>Energy will be restored to full.</li>
                  <li>Daily reset hooks will run.</li>
                  <li>Future eggs, pregnancies, market, and contracts will update here.</li>
                </ul>
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setModalMode("none")}>
                    Cancel
                  </button>
                  <button type="button" className={styles.primaryAction} onClick={handleSleep}>
                    Sleep
                  </button>
                </div>
              </section>
            ) : null}

            {modalMode === "day-summary" ? (
              <section
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="summary-title"
              >
                <h2 id="summary-title">New Day Summary</h2>
                <p>
                  {daySummary?.previousDateLabel} → {daySummary?.nextDateLabel}
                </p>
                <ul>
                  {daySummary?.summaryItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => {
                      setModalMode("none");
                      setMessage("A new day begins on the ranch.");
                    }}
                  >
                    Start Day
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
