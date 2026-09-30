"use client";

import { useMemo, useState } from "react";
import { GAME_TITLE } from "@/data/gameConstants";
import { formatDateTime, formatEnergy, formatGold, formatGuildPoints } from "@/lib/formatters";
import { SAVE_SLOT_COUNT, summarizeSave } from "@/lib/save/localSave";
import { GameDialog } from "@/features/ui/GameDialog";
import { RanchIcon } from "@/features/ui/RanchIcon";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import { SaveTransferPanel } from "./SaveTransferPanel";
import styles from "./MainMenuScreen.module.css";

type MenuMode = "main" | "new-game" | "load-game" | "save-transfer" | "options";
const PANEL_TITLES = { "new-game": "New Game", "load-game": "Load Game", "save-transfer": "Import / Export Save", options: "Settings" };

function SaveSlotCard({ save, slotIndex, selected, onSelect, onLoad, onDelete }: {
  save: GameSave | null;
  slotIndex: number;
  selected?: boolean;
  onSelect?: () => void;
  onLoad?: () => void;
  onDelete?: () => void;
}) {
  const summary = save ? summarizeSave(save) : null;
  return (
    <article className={`${styles.slotCard} ${selected ? styles.slotCardSelected : ""}`} data-ui-text-box="auto">
      <header className={styles.slotHeader}><h3>File {slotIndex + 1}</h3><span>{selected ? "Selected" : save ? "Saved" : "Empty"}</span></header>
      {summary ? <div className={styles.slotBody}>
        <p className={styles.slotName}>{summary.ranchName}</p>
        <p>{summary.playerName} · Day {summary.dayNumber} · {summary.dateLabel}</p>
        <p>{summary.creatureCount} creatures · {summary.eggCount} eggs</p>
        <p>{formatGold(summary.gold)} · {formatGuildPoints(summary.guildPoints)} · Energy {formatEnergy(summary.energy, summary.maxEnergy)}</p>
        <p className={styles.slotDate}>Saved {formatDateTime(summary.updatedAt)}</p>
      </div> : <div className={styles.emptySlot}><p>A fresh start for a new ranch.</p></div>}
      <div className={styles.slotActions}>
        {onSelect && <button type="button" onClick={onSelect} aria-pressed={selected}>Select Slot</button>}
        {save && onLoad && <button type="button" className={styles.primary} onClick={onLoad}>Load</button>}
        {save && onDelete && <button type="button" className={styles.dangerButton} onClick={onDelete}>Delete</button>}
      </div>
    </article>
  );
}

export function MainMenuScreen() {
  const { createNewGame, currentSave, deleteGame, goToRanch, isHydrated, loadGame, refreshSaveSlots, saveSlots, version } = useGameContext();
  const [mode, setMode] = useState<MenuMode>("main");
  const [playerName, setPlayerName] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [message, setMessage] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<{ kind: "replace" | "delete"; slot: number } | null>(null);
  const activeSummary = useMemo(() => currentSave ? summarizeSave(currentSave) : null, [currentSave]);

  function startNewGame() {
    setSelectedSlot(Math.max(0, Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => i).find(i => !saveSlots[i]) ?? 0));
    setMessage("");
    setMode("new-game");
  }
  function handleCreateGame() {
    if (saveSlots[selectedSlot]) { setPendingSaveAction({ kind: "replace", slot: selectedSlot }); return; }
    createNewGame(playerName, selectedSlot);
    setPlayerName("");
  }
  function handleLoad(slotIndex: number) {
    const save = loadGame(slotIndex);
    if (!save) { setMessage(`File ${slotIndex + 1} is empty.`); return; }
    setMessage(`Loaded ${save.player.name}’s save.`);
    setMode("main");
  }
  function confirmSaveAction() {
    if (!pendingSaveAction) return;
    const { kind, slot } = pendingSaveAction;
    setPendingSaveAction(null);
    if (kind === "delete") { deleteGame(slot); setMessage(`Deleted File ${slot + 1}.`); }
    else { createNewGame(playerName, slot); setPlayerName(""); }
  }
  function closePanel() { setMode("main"); setMessage(""); }

  return (
    <main className={styles.titleScreen} aria-labelledby="game-title">
      <div className={styles.backgroundArt} aria-hidden="true" />
      <section className={styles.welcome}>
        <h1 id="game-title" className={`${styles.brand} ${logoFailed ? styles.brandFallback : ""}`}>
          {logoFailed ? GAME_TITLE : <img src="/images/ui/logo/creature_chronicles_logo.png" alt={GAME_TITLE} width={714} height={343} fetchPriority="high" onError={() => setLogoFailed(true)} />}
        </h1>
        <nav className={styles.menu} aria-label="Main menu">
          {!isHydrated ? <p className={styles.loading} role="status">Loading your ranch…</p> : <div className={styles.continueRow}>
            <button type="button" className={`${styles.menuButton} ${styles.continueButton}`} onClick={currentSave ? goToRanch : startNewGame} aria-describedby="active-ranch-summary">
              <RanchIcon name="leaf" /><span>{currentSave ? "Continue" : "New Game"}</span><RanchIcon name="leaf" />
            </button>
            <section id="active-ranch-summary" className={styles.saveSummary} aria-label={activeSummary ? "Current save" : "Welcome"} data-ui-text-box="auto">
              <RanchIcon name="house" />
              <div>{activeSummary ? <><h2>{activeSummary.ranchName}</h2><p>{activeSummary.playerName} · Day {activeSummary.dayNumber}</p><p>{activeSummary.creatureCount} creatures · {activeSummary.eggCount} eggs</p></> : <><h2>Your ranch awaits</h2><p>Start your own story.</p></>}</div>
            </section>
          </div>}
          {currentSave && <button type="button" className={styles.menuButton} disabled={!isHydrated} onClick={startNewGame}><RanchIcon name="leaf" /><span>New Game</span></button>}
          <button type="button" className={styles.menuButton} disabled={!isHydrated} onClick={() => { setMessage(""); setMode("load-game"); }}><RanchIcon name="chores" /><span>Load Game</span></button>
          <button type="button" className={styles.menuButton} onClick={() => setMode("options")}><RanchIcon name="gear" /><span>Settings</span></button>
          <button type="button" className={styles.transferLink} disabled={!isHydrated} onClick={() => setMode("save-transfer")}><span aria-hidden="true">⇄</span> Import / Export Save</button>
        </nav>
        {message && mode === "main" && <p className={styles.messageText} role="status">{message}</p>}
      </section>
      <footer className={styles.versionBadge}>{version}</footer>

      {mode !== "main" && <GameDialog title={PANEL_TITLES[mode]} onClose={closePanel} wide={mode !== "options"}>
        {mode === "new-game" && <section className={styles.menuPanel}>
          <label className={styles.inputLabel}>Player Name<input value={playerName} maxLength={24} placeholder="Enter name" onChange={event => setPlayerName(event.target.value)} /></label>
          <p className={styles.panelHint}>Choose a file for your new ranch. Occupied files require confirmation before replacement.</p>
          <div className={styles.slotGrid}>{Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => <SaveSlotCard key={index} save={saveSlots[index] ?? null} slotIndex={index} selected={selectedSlot === index} onSelect={() => setSelectedSlot(index)} />)}</div>
          <button type="button" className={`${styles.confirmButton} ${styles.primary}`} onClick={handleCreateGame}>Create Save</button>
        </section>}
        {mode === "load-game" && <section className={styles.menuPanel}>
          {message && <p role="status">{message}</p>}
          <div className={styles.slotGrid}>{Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => <SaveSlotCard key={index} save={saveSlots[index] ?? null} slotIndex={index} onLoad={() => handleLoad(index)} onDelete={() => setPendingSaveAction({ kind: "delete", slot: index })} />)}</div>
        </section>}
        {mode === "options" && <section className={styles.menuPanel}>
          <p>Progress is saved locally in this browser. Export a backup to keep a copy or move to another device.</p>
          <button type="button" className={styles.primary} onClick={() => setMode("save-transfer")}>Import / Export Save</button>
          {currentSave?.settings.devMode && <p className={styles.panelHint}>Developer tools are enabled for this save.</p>}
          <p className={styles.panelHint}>Audio volume and text-speed settings are not available yet.</p>
          <p className={styles.panelHint}>To exit the game, close this browser tab.</p>
        </section>}
        {mode === "save-transfer" && <SaveTransferPanel saveSlots={saveSlots} refreshSaveSlots={refreshSaveSlots} onBack={closePanel} />}
      </GameDialog>}
      {pendingSaveAction && <GameDialog title={`${pendingSaveAction.kind === "delete" ? "Delete" : "Replace"} File ${pendingSaveAction.slot + 1}?`} onClose={() => setPendingSaveAction(null)}>
        <p><strong>{saveSlots[pendingSaveAction.slot]?.player.name}</strong> · {saveSlots[pendingSaveAction.slot]?.player.ranchName} · Day {saveSlots[pendingSaveAction.slot]?.dayState.dayNumber}</p>
        <p>{pendingSaveAction.kind === "delete" ? "This removes the selected save file." : "Creating this new game replaces the selected save file."} Export a backup first if you want to keep it.</p>
        <div className={styles.slotActions}><button type="button" data-initial-focus onClick={() => setPendingSaveAction(null)}>Keep Existing Save</button><button type="button" onClick={confirmSaveAction}>{pendingSaveAction.kind === "delete" ? "Delete Save" : "Replace & Start New Game"}</button></div>
      </GameDialog>}
    </main>
  );
}
