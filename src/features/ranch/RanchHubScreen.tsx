"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { formatEnergy, formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext, type DayAdvanceResult } from "@/state/GameProvider";
import styles from "./RanchHubScreen.module.css";

type ModalMode = "none" | "sleep-confirm" | "day-summary" | "requests" | "coming-soon";
type BuildingId = "house" | "feline" | "canine" | "breeding" | "nursery" | "market" | "guild";

type Building = {
  id: BuildingId;
  title: string;
  milestone: "Available" | "M3" | "M4" | "M5" | "M6" | "M7";
  description: string;
  actionLabel: string;
  imageSrc: string;
  x: number;
  y: number;
  width: number;
};

const HUD_ICONS = {
  crest: "/images/ui/icons/icon_paw_crest.png",
  energy: "/images/ui/icons/icon_energy_lightning.png",
  calendar: "/images/ui/icons/icon_calendar.png",
  home: "/images/ui/icons/icon_home.png",
  sleep: "/images/ui/icons/icon_sleep_moon.png",
  requests: "/images/ui/home/icon_home_requests.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
} as const;

const BUILDINGS: Building[] = [
  {
    id: "house",
    title: "Ranch House",
    milestone: "Available",
    description: "Rest for the night and advance to the next day.",
    actionLabel: "Sleep",
    imageSrc: "/images/buildings/ranch/ranch_house.png",
    x: 48,
    y: 59,
    width: 11,
  },
  {
    id: "feline",
    title: "Feline Habitat",
    milestone: "M3",
    description: "Future home for Feline, Sphinx, and Saberfang creatures.",
    actionLabel: "Coming in M3",
    imageSrc: "/images/buildings/ranch/feline_habitat.png",
    x: 19,
    y: 62,
    width: 11,
  },
  {
    id: "canine",
    title: "Canine Habitat",
    milestone: "M3",
    description: "Future home for Canine, Hellhound, and Direwolf creatures.",
    actionLabel: "Coming in M3",
    imageSrc: "/images/buildings/ranch/canine_habitat.png",
    x: 74,
    y: 58,
    width: 11,
  },
  {
    id: "breeding",
    title: "Breeding Pen",
    milestone: "M4",
    description: "Future location for pair selection, previews, and breeding scenes.",
    actionLabel: "Coming in M4",
    imageSrc: "/images/buildings/ranch/breeding_pen.png",
    x: 49,
    y: 76,
    width: 10,
  },
  {
    id: "nursery",
    title: "Egg Nursery",
    milestone: "M5",
    description: "Future location for pregnancy, egg timers, and hatch results.",
    actionLabel: "Coming in M5",
    imageSrc: "/images/buildings/ranch/egg_nursery.png",
    x: 32,
    y: 78,
    width: 9,
  },
  {
    id: "market",
    title: "Market Road",
    milestone: "M6",
    description: "Future market access for weekly creature listings and paid rerolls.",
    actionLabel: "Coming in M6",
    imageSrc: "/images/buildings/ranch/market_road.png",
    x: 64,
    y: 76,
    width: 9,
  },
  {
    id: "guild",
    title: "Guild Board",
    milestone: "M7",
    description: "Future contract board for bronze, silver, and gold requests.",
    actionLabel: "Coming in M7",
    imageSrc: "/images/buildings/ranch/guild_board.png",
    x: 80,
    y: 76,
    width: 9,
  },
];

function getBuildingStyle(building: Building): CSSProperties {
  return {
    left: `${building.x}%`,
    top: `${building.y}%`,
    width: `${building.width}%`,
  };
}

export function RanchHubScreen() {
  const { advanceDay, currentSave, goToMainMenu, version } = useGameContext();
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [daySummary, setDaySummary] = useState<DayAdvanceResult | null>(null);
  const [message, setMessage] = useState("Welcome back to the ranch.");
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId>("house");

  const selectedBuilding = useMemo(
    () => BUILDINGS.find((building) => building.id === selectedBuildingId) ?? BUILDINGS[0],
    [selectedBuildingId],
  );

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

  function handleBuildingClick(building: Building) {
    setSelectedBuildingId(building.id);

    if (building.id === "house") {
      setMessage("Ranch House selected. Rest here to advance the day.");
      setModalMode("sleep-confirm");
      return;
    }

    setMessage(`${building.title} is planned for ${building.milestone}.`);
    setModalMode("coming-soon");
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
        <div className={styles.mapShade} aria-hidden="true" />

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
              <img src={HUD_ICONS.calendar} alt="" />
              <span>Date</span>
              <strong>{dateLabel}</strong>
            </div>
            <div>
              <img src={HUD_ICONS.energy} alt="" />
              <span>Energy</span>
              <strong>
                {formatEnergy(currentSave.currencies.energy, currentSave.currencies.maxEnergy)}
              </strong>
            </div>
            <div className={styles.goldStat}>
              <img src={HUD_ICONS.gold} alt="" />
              <span>Gold</span>
              <strong>{formatGold(currentSave.currencies.gold)}</strong>
            </div>
            <div>
              <img src={HUD_ICONS.crest} alt="" />
              <span>GP</span>
              <strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong>
            </div>
          </div>

          <nav className={styles.hudActions} aria-label="Ranch actions">
            <button type="button" className={styles.iconButton} onClick={() => setModalMode("requests")}>
              <img src={HUD_ICONS.requests} alt="" />
              <span>Requests</span>
            </button>
            <button type="button" className={styles.menuButton} onClick={goToMainMenu}>
              <img src={HUD_ICONS.home} alt="" />
              <span>Main Menu</span>
            </button>
          </nav>
        </header>

        <section className={styles.ranchTitlePanel}>
          <p className={styles.kicker}>Home Ranch</p>
          <h1>Ranch Hub</h1>
          <p>
            Select buildings directly on the ranch map. Ranch House is active now;
            habitats and economy locations unlock in later milestones.
          </p>
          <p className={styles.message}>{message}</p>
        </section>

        <section className={styles.mapLayer} aria-label="Ranch map buildings">
          {BUILDINGS.map((building) => (
            <button
              key={building.id}
              type="button"
              style={getBuildingStyle(building)}
              className={`${styles.mapBuilding} ${
                selectedBuildingId === building.id ? styles.selectedBuilding : ""
              } ${building.id === "house" ? styles.availableBuilding : styles.lockedBuilding}`}
              onClick={() => handleBuildingClick(building)}
              aria-label={`${building.title}. ${building.actionLabel}. ${building.description}`}
            >
              <img src={building.imageSrc} alt="" />
              <span className={styles.mapBuildingLabel}>{building.title}</span>
              <span className={styles.mapBuildingBadge}>{building.actionLabel}</span>
            </button>
          ))}
        </section>

        <aside className={styles.selectedPanel} aria-label="Selected ranch location">
          <span className={styles.selectedMilestone}>{selectedBuilding.milestone}</span>
          <h2>{selectedBuilding.title}</h2>
          <p>{selectedBuilding.description}</p>
          <strong>{selectedBuilding.actionLabel}</strong>
        </aside>

        {modalMode !== "none" ? (
          <div className={styles.modalBackdrop} role="presentation">
            {modalMode === "sleep-confirm" ? (
              <section
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sleep-title"
              >
                <img className={styles.modalIcon} src={HUD_ICONS.sleep} alt="" />
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

            {modalMode === "coming-soon" ? (
              <section
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="coming-soon-title"
              >
                <h2 id="coming-soon-title">{selectedBuilding.title}</h2>
                <p>{selectedBuilding.description}</p>
                <p className={styles.comingSoonText}>{selectedBuilding.actionLabel}</p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.primaryAction} onClick={() => setModalMode("none")}>
                    Close
                  </button>
                </div>
              </section>
            ) : null}

            {modalMode === "requests" ? (
              <section
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="requests-title"
              >
                <img className={styles.modalIcon} src={HUD_ICONS.requests} alt="" />
                <h2 id="requests-title">Requests</h2>
                <p>
                  The request board is a placeholder for M7 guild contracts. It will eventually
                  show client requests, deadlines, rewards, and donation options.
                </p>
                <ul>
                  <li>Bronze, silver, and gold request slots are planned.</li>
                  <li>Contract rewards will use Gold and Guild Points.</li>
                  <li>Creature donation value will connect here later.</li>
                </ul>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.primaryAction} onClick={() => setModalMode("none")}>
                    Close
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
