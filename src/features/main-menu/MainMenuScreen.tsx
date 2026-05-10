"use client";

import { useMemo, useState } from "react";
import { GAME_TITLE } from "@/data/gameConstants";
import {
  formatDateTime,
  formatEnergy,
  formatGameDate,
  formatGold,
  formatGuildPoints,
} from "@/lib/formatters";
import { SAVE_SLOT_COUNT, summarizeSave } from "@/lib/save/localSave";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./MainMenuScreen.module.css";

type MenuMode = "main" | "new-game" | "load-game" | "options";

const IMAGE_PATHS = {
  logo: "/images/ui/logo/creature_chronicles_logo.png",
  newGameButton: "/images/ui/buttons/button_new_game.png",
  loadGameButton: "/images/ui/buttons/button_load_game.png",
  settingsButton: "/images/ui/buttons/button_settings.png",
  exitButton: "/images/ui/buttons/button_exit_game.png",
  crestIcon: "/images/ui/icons/icon_paw_crest.png",
} as const;

function SaveSlotCard({
  save,
  slotIndex,
  selected,
  onSelect,
  onLoad,
  onDelete,
}: {
  save: GameSave | null;
  slotIndex: number;
  selected?: boolean;
  onSelect?: () => void;
  onLoad?: () => void;
  onDelete?: () => void;
}) {
  const summary = save ? summarizeSave(save) : null;

  return (
    <article className={`${styles.slotCard} ${selected ? styles.slotCardSelected : ""}`}>
      <div className={styles.slotHeader}>
        <h3>File {slotIndex + 1}</h3>
        <span>{save ? "Saved" : "Empty"}</span>
      </div>

      {summary ? (
        <div className={styles.slotBody}>
          <p className={styles.slotName}>{summary.playerName}</p>
          <p>{summary.ranchName}</p>
          <p>
            Day {summary.dayNumber} • {summary.dateLabel}
          </p>
          <p>
            {formatGold(summary.gold)} • {formatGuildPoints(summary.guildPoints)}
          </p>
          <p>Energy {formatEnergy(summary.energy, summary.maxEnergy)}</p>
          <p>
            Creatures {summary.creatureCount} • Eggs {summary.eggCount}
          </p>
          <p className={styles.slotDate}>Updated {formatDateTime(summary.updatedAt)}</p>
        </div>
      ) : (
        <div className={styles.emptySlot}>
          <p>No save data.</p>
          <p>This slot can be used for a new game.</p>
        </div>
      )}

      <div className={styles.slotActions}>
        {onSelect ? (
          <button type="button" onClick={onSelect}>
            Select Slot
          </button>
        ) : null}

        {save && onLoad ? (
          <button type="button" onClick={onLoad}>
            Load
          </button>
        ) : null}

        {save && onDelete ? (
          <button type="button" className={styles.dangerButton} onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function MainMenuScreen() {
  const {
    buildPhase,
    createNewGame,
    currentSave,
    deleteGame,
    goToRanch,
    isHydrated,
    loadGame,
    saveSlots,
    version,
  } = useGameContext();

  const [mode, setMode] = useState<MenuMode>("main");
  const [playerName, setPlayerName] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [message, setMessage] = useState("M2 ranch hub ready.");
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);

  const activeSummary = useMemo(() => {
    return currentSave ? summarizeSave(currentSave) : null;
  }, [currentSave]);

  function handleCreateGame() {
    createNewGame(playerName, selectedSlot);
    setPlayerName("");
  }

  function handleLoad(slotIndex: number) {
    const save = loadGame(slotIndex);

    if (!save) {
      setMessage(`File ${slotIndex + 1} is empty.`);
      return;
    }

    setMessage(`Loaded ${save.player.name}'s save.`);
  }

  function handleDelete(slotIndex: number) {
    if (confirmDeleteSlot !== slotIndex) {
      setConfirmDeleteSlot(slotIndex);
      setMessage(`Click Delete again to erase File ${slotIndex + 1}.`);
      return;
    }

    deleteGame(slotIndex);
    setConfirmDeleteSlot(null);
    setMessage(`Deleted File ${slotIndex + 1}.`);
  }

  function handleExitGame() {
    setMessage("Exit requested. If the browser blocks closing this tab, close it manually.");

    if (typeof window !== "undefined") {
      window.close();
    }
  }

  return (
    <main className={styles.screen}>
      <section className={styles.heroPanel} aria-labelledby="game-title">
        <div className={styles.backgroundArt} aria-hidden="true" />

        <div className={styles.versionBadge}>{version}</div>

        <section className={styles.leftColumn}>
          <div className={styles.logoBox}>
            <p className={styles.smallLabel}>Planning Rebuild</p>
            <img
              src={IMAGE_PATHS.logo}
              alt={GAME_TITLE}
              className={styles.logoImage}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <h1 id="game-title" className={styles.title}>
              {GAME_TITLE}
            </h1>
            <p className={styles.subtitle}>Ranch • Breeding • Contracts • Collection</p>
          </div>

          <div className={styles.statusCard}>
            <div className={styles.statusTitleRow}>
              <img src={IMAGE_PATHS.crestIcon} alt="" />
              <h2>{buildPhase}</h2>
            </div>

            {!isHydrated ? (
              <p>Loading local saves...</p>
            ) : activeSummary ? (
              <dl className={styles.previewStats}>
                <div>
                  <dt>Current Save</dt>
                  <dd>{activeSummary.playerName}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>
                    {formatGameDate(
                      currentSave?.dayState.weekday ?? "Mon",
                      currentSave?.dayState.month ?? 1,
                      currentSave?.dayState.dayOfMonth ?? 1,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Energy</dt>
                  <dd>{formatEnergy(activeSummary.energy, activeSummary.maxEnergy)}</dd>
                </div>
                <div>
                  <dt>Gold</dt>
                  <dd>{formatGold(activeSummary.gold)}</dd>
                </div>
              </dl>
            ) : (
              <p>No active save yet. Start a new game or load an existing file.</p>
            )}

            {currentSave ? (
              <button type="button" className={styles.continueButton} onClick={goToRanch}>
                Continue to Ranch
              </button>
            ) : null}

            <p className={styles.messageText}>{message}</p>
          </div>
        </section>

        <section className={styles.rightColumn}>
          {mode === "main" ? (
            <nav className={styles.menu} aria-label="Main menu">
              <button
                type="button"
                className={styles.imageButton}
                style={{ backgroundImage: `url(${IMAGE_PATHS.newGameButton})` }}
                onClick={() => setMode("new-game")}
              >
                New Game
              </button>
              <button
                type="button"
                className={styles.imageButton}
                style={{ backgroundImage: `url(${IMAGE_PATHS.loadGameButton})` }}
                onClick={() => setMode("load-game")}
              >
                Load Game
              </button>
              <button
                type="button"
                className={styles.imageButton}
                style={{ backgroundImage: `url(${IMAGE_PATHS.settingsButton})` }}
                onClick={() => setMode("options")}
              >
                Options
              </button>
              <button
                type="button"
                className={styles.imageButton}
                style={{ backgroundImage: `url(${IMAGE_PATHS.exitButton})` }}
                onClick={handleExitGame}
              >
                Exit Game
              </button>
            </nav>
          ) : null}

          {mode === "new-game" ? (
            <section className={styles.menuPanel}>
              <div className={styles.panelHeader}>
                <h2>New Game</h2>
                <button type="button" onClick={() => setMode("main")}>
                  Back
                </button>
              </div>

              <label className={styles.inputLabel}>
                Player Name
                <input
                  value={playerName}
                  maxLength={24}
                  placeholder="Enter name"
                  onChange={(event) => setPlayerName(event.target.value)}
                />
              </label>

              <p className={styles.panelHint}>
                Choose a save file. Creating a new game in an occupied slot will overwrite
                that file.
              </p>

              <div className={styles.slotGrid}>
                {Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => (
                  <SaveSlotCard
                    key={`new-slot-${index}`}
                    save={saveSlots[index] ?? null}
                    slotIndex={index}
                    selected={selectedSlot === index}
                    onSelect={() => setSelectedSlot(index)}
                  />
                ))}
              </div>

              <button type="button" className={styles.confirmButton} onClick={handleCreateGame}>
                Create Save
              </button>
            </section>
          ) : null}

          {mode === "load-game" ? (
            <section className={styles.menuPanel}>
              <div className={styles.panelHeader}>
                <h2>Load Game</h2>
                <button type="button" onClick={() => setMode("main")}>
                  Back
                </button>
              </div>

              <div className={styles.slotGrid}>
                {Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => (
                  <SaveSlotCard
                    key={`load-slot-${index}`}
                    save={saveSlots[index] ?? null}
                    slotIndex={index}
                    onLoad={() => handleLoad(index)}
                    onDelete={() => handleDelete(index)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {mode === "options" ? (
            <section className={styles.menuPanel}>
              <div className={styles.panelHeader}>
                <h2>Options</h2>
                <button type="button" onClick={() => setMode("main")}>
                  Back
                </button>
              </div>

              <div className={styles.optionRows}>
                <div>
                  <span>Music Volume</span>
                  <strong>70%</strong>
                </div>
                <div>
                  <span>SFX Volume</span>
                  <strong>80%</strong>
                </div>
                <div>
                  <span>Text Speed</span>
                  <strong>Normal</strong>
                </div>
                <div>
                  <span>Dev Mode</span>
                  <strong>Enabled</strong>
                </div>
              </div>

              <p className={styles.panelHint}>
                These are display-only for M2. Full settings editing comes later.
              </p>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
