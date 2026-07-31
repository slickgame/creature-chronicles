"use client";

import { useMemo, useRef, useState } from "react";
import {
  SAVE_SLOT_COUNT,
  exportPortableSave,
  getPortableSaveFilename,
  importPortableSaveToSlot,
  inspectPortableSave,
  setActiveSaveId,
  summarizeSave,
} from "@/lib/save/localSave";
import { formatDateTime, formatGameDate } from "@/lib/formatters";
import type { GameSave } from "@/types/save";
import styles from "./SaveTransferPanel.module.css";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SaveTransferPanel({
  saveSlots,
  refreshSaveSlots,
  onBack,
}: {
  saveSlots: Array<GameSave | null>;
  refreshSaveSlots: () => void;
  onBack: () => void;
}) {
  const firstSavedSlot = Math.max(0, saveSlots.findIndex(Boolean));
  const firstEmptySlot = saveSlots.findIndex((save) => !save);
  const [exportSlot, setExportSlot] = useState(firstSavedSlot);
  const [targetSlot, setTargetSlot] = useState(firstEmptySlot >= 0 ? firstEmptySlot : 0);
  const [travelText, setTravelText] = useState("");
  const [message, setMessage] = useState("Export a desktop save, then import the file or travel code on your iPhone.");
  const [overwriteArmedSlot, setOverwriteArmedSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportSave = saveSlots[exportSlot] ?? null;
  const inspection = useMemo(() => travelText.trim() ? inspectPortableSave(travelText) : null, [travelText]);

  function getExportText(): string | null {
    if (!exportSave) {
      setMessage(`File ${exportSlot + 1} is empty.`);
      return null;
    }
    return exportPortableSave(exportSave);
  }

  async function handleCopy() {
    const text = getExportText();
    if (!text) return;
    setTravelText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Travel save copied. Paste it into the iPhone import box, a private message to yourself, or a secure notes app.");
    } catch {
      setMessage("The travel code is displayed below. Select it manually if clipboard access is unavailable.");
    }
  }

  function handleDownload() {
    const text = getExportText();
    if (!text || !exportSave) return;
    downloadTextFile(getPortableSaveFilename(exportSave), text);
    setMessage("Travel save downloaded. Send the .ccsave file to your iPhone with AirDrop, Files, email, or another private transfer method.");
  }

  async function handleShare() {
    const text = getExportText();
    if (!text || !exportSave) return;
    const file = new File([text], getPortableSaveFilename(exportSave), { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Creature Chronicles Travel Save",
          text: `${exportSave.player.name}'s Ranch Day ${exportSave.dayState.dayNumber} save`,
          files: [file],
        });
        setMessage("Travel save opened in the device share sheet.");
        return;
      }
      await navigator.share?.({
        title: "Creature Chronicles Travel Save",
        text,
      });
      setMessage("Travel save opened in the share sheet as text.");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setMessage("Sharing was unavailable. Use Copy Travel Code or Download File instead.");
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setTravelText(text);
      const checked = inspectPortableSave(text);
      setMessage(checked.message);
      setOverwriteArmedSlot(null);
    };
    reader.onerror = () => setMessage("The selected file could not be read.");
    reader.readAsText(file);
  }

  function handleImport() {
    const checked = inspectPortableSave(travelText);
    if (!checked.ok || !checked.save) {
      setMessage(checked.message);
      return;
    }
    if (saveSlots[targetSlot] && overwriteArmedSlot !== targetSlot) {
      setOverwriteArmedSlot(targetSlot);
      setMessage(`File ${targetSlot + 1} already contains ${saveSlots[targetSlot]?.player.name}. Press Import again to confirm replacement.`);
      return;
    }

    const result = importPortableSaveToSlot(travelText, targetSlot);
    if (!result.ok || !result.save) {
      setMessage(result.message);
      return;
    }
    setActiveSaveId(String(result.save.saveId));
    refreshSaveSlots();
    setOverwriteArmedSlot(null);
    setMessage(`${result.message} It is now the active save and can be continued from the main menu.`);
  }

  return (
    <section className={styles.panel} aria-labelledby="travel-save-title">
      <header className={styles.header}>
        <div>
          <p>Desktop ↔ iPhone</p>
          <h2 id="travel-save-title">Travel Save Transfer</h2>
          <span>Portable files include an integrity checksum and are normalized through the current save migration pipeline when imported.</span>
        </div>
        <button type="button" onClick={onBack}>Back</button>
      </header>

      <p className={styles.message} role="status">{message}</p>

      <div className={styles.columns}>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <span>Step 1</span>
            <h3>Export a Save</h3>
          </div>
          <label>
            Source file
            <select value={exportSlot} onChange={(event) => setExportSlot(Number(event.target.value))}>
              {Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
                const save = saveSlots[index];
                return <option key={index} value={index}>File {index + 1}{save ? ` — ${save.player.name}, Day ${save.dayState.dayNumber}` : " — Empty"}</option>;
              })}
            </select>
          </label>

          {exportSave ? (() => {
            const summary = summarizeSave(exportSave);
            return (
              <div className={styles.preview}>
                <strong>{summary.ranchName}</strong>
                <span>Ranch Day {summary.dayNumber} · {formatGameDate(exportSave.dayState.weekday, exportSave.dayState.month, exportSave.dayState.dayOfMonth)}</span>
                <span>{summary.creatureCount} creatures · {summary.eggCount} eggs</span>
                <small>Updated {formatDateTime(summary.updatedAt)}</small>
              </div>
            );
          })() : <div className={styles.empty}>Choose a file containing save data.</div>}

          <div className={styles.actions}>
            <button type="button" onClick={handleCopy} disabled={!exportSave}>Copy Travel Code</button>
            <button type="button" onClick={handleDownload} disabled={!exportSave}>Download .ccsave</button>
            <button type="button" onClick={handleShare} disabled={!exportSave || typeof navigator === "undefined" || !("share" in navigator)}>Share</button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <span>Step 2</span>
            <h3>Import on This Device</h3>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={() => fileInputRef.current?.click()}>Choose .ccsave / JSON</button>
            <button type="button" onClick={() => { setTravelText(""); setOverwriteArmedSlot(null); setMessage("Import field cleared."); }}>Clear</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ccsave,.json,application/json,text/plain"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />

          <label>
            Travel code
            <textarea
              value={travelText}
              onChange={(event) => { setTravelText(event.target.value); setOverwriteArmedSlot(null); }}
              placeholder="Paste the copied travel save code here, or choose a file above."
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>

          {inspection ? (
            <div className={inspection.ok ? styles.validPreview : styles.invalidPreview}>
              <strong>{inspection.ok ? inspection.ranchName : "Import unavailable"}</strong>
              {inspection.ok ? <span>{inspection.playerName} · Day {inspection.dayNumber} · {inspection.creatureCount} creatures · {inspection.eggCount} eggs</span> : null}
              <small>{inspection.message}</small>
            </div>
          ) : null}

          <label>
            Destination file
            <select value={targetSlot} onChange={(event) => { setTargetSlot(Number(event.target.value)); setOverwriteArmedSlot(null); }}>
              {Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
                const save = saveSlots[index];
                return <option key={index} value={index}>File {index + 1}{save ? ` — Replace ${save.player.name}` : " — Empty"}</option>;
              })}
            </select>
          </label>

          <button
            type="button"
            className={overwriteArmedSlot === targetSlot ? styles.dangerButton : styles.importButton}
            onClick={handleImport}
            disabled={!inspection?.ok}
          >
            {overwriteArmedSlot === targetSlot ? `Confirm Replace File ${targetSlot + 1}` : `Import Into File ${targetSlot + 1}`}
          </button>
        </section>
      </div>

      <footer className={styles.footer}>
        <strong>Vacation testing note</strong>
        <p>Desktop and iPhone saves remain separate after transfer. Export the newest device save before switching devices again so progress is not overwritten.</p>
      </footer>
    </section>
  );
}
