"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SAVE_SYSTEM_RESETS,
  resetSaveSystem,
  type SaveSystemResetId,
} from "@/data/devSaveResets";
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  createSaveBackupFromSave,
  exportSavePackage,
  getSaveBackup,
  inspectSaveImport,
  listSaveBackups,
  type SaveBackupRecord,
  type SaveImportReport,
} from "@/lib/save/saveReliability";
import { useGameContext } from "@/state/GameProvider";
import styles from "./SaveReliabilityPanel.module.css";

type ReliabilityTab = "status" | "backups" | "import" | "resets";

type PendingAction =
  | { kind: "restore"; backupId: string }
  | { kind: "import" }
  | { kind: "reset"; resetId: SaveSystemResetId }
  | null;

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function localTimestamp(value?: string): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US");
}

function backupReasonLabel(record: SaveBackupRecord): string {
  return record.reason.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SaveReliabilityPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ReliabilityTab>("status");
  const [message, setMessage] = useState("Save reliability tools are ready.");
  const [importText, setImportText] = useState("");
  const [importReport, setImportReport] = useState<SaveImportReport | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [backupRefresh, setBackupRefresh] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const backups = useMemo(
    () => currentSave ? listSaveBackups(currentSave.slotIndex) : [],
    [currentSave, backupRefresh],
  );

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (pendingAction) {
        event.preventDefault();
        setPendingAction(null);
        return;
      }
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open, pendingAction]);

  if (!currentSave) return null;

  const reliability = currentSave.saveReliability ?? {};
  const validationIssues = reliability.lastValidationIssues ?? [];

  function refreshBackups() {
    setBackupRefresh((value) => value + 1);
  }

  function createManualBackup() {
    const backup = createSaveBackupFromSave(currentSave, "manual");
    if (!backup) {
      setMessage("Backup could not be created because browser storage is unavailable.");
      return;
    }
    saveCurrentGame({
      ...currentSave,
      saveReliability: {
        ...reliability,
        lastBackupAt: backup.createdAt,
      },
    });
    refreshBackups();
    setMessage(`Manual backup created for Save Slot ${currentSave.slotIndex + 1}.`);
  }

  function exportPackage() {
    const text = exportSavePackage(currentSave);
    downloadTextFile(
      `${currentSave.player.name || "creature-chronicles"}-slot-${currentSave.slotIndex + 1}-package.json`,
      text,
    );
    setMessage("Versioned save package downloaded.");
  }

  function copyPackage() {
    const text = exportSavePackage(currentSave);
    void navigator.clipboard?.writeText(text).then(() => setMessage("Versioned save package copied to clipboard."));
  }

  function inspectImport() {
    const report = inspectSaveImport(importText, currentSave.slotIndex);
    setImportReport(report);
    setMessage(report.ok
      ? `Import is valid. Source schema ${report.sourceSchemaVersion}; target schema ${CURRENT_SAVE_SCHEMA_VERSION}.`
      : `Import rejected: ${report.issues.join(" ")}`);
  }

  function applyImport() {
    const report = inspectSaveImport(importText, currentSave.slotIndex);
    setImportReport(report);
    if (!report.ok || !report.save) {
      setMessage(`Import rejected: ${report.issues.join(" ")}`);
      setPendingAction(null);
      return;
    }
    const backup = createSaveBackupFromSave(currentSave, "before-import");
    const imported = saveCurrentGame({
      ...report.save,
      saveReliability: {
        ...(report.save.saveReliability ?? {}),
        lastBackupAt: backup?.createdAt,
        lastAutosaveReason: "save-import",
      },
    });
    refreshBackups();
    setPendingAction(null);
    setMessage(`Imported and migrated save for ${imported.player.name}. The previous active save was backed up first.`);
  }

  function restoreBackup(backupId: string) {
    const backup = getSaveBackup(currentSave.slotIndex, backupId);
    if (!backup) {
      setMessage("That backup is no longer available.");
      setPendingAction(null);
      return;
    }
    const report = inspectSaveImport(backup.rawJson, currentSave.slotIndex);
    if (!report.ok || !report.save) {
      setMessage(`Backup could not be restored: ${report.issues.join(" ")}`);
      setPendingAction(null);
      return;
    }
    createSaveBackupFromSave(currentSave, "before-restore");
    saveCurrentGame({
      ...report.save,
      saveReliability: {
        ...(report.save.saveReliability ?? {}),
        lastAutosaveReason: "backup-restore",
      },
    });
    refreshBackups();
    setPendingAction(null);
    setMessage(`Restored backup from ${localTimestamp(backup.createdAt)}.`);
  }

  function applySystemReset(resetId: SaveSystemResetId) {
    const result = resetSaveSystem(currentSave, resetId);
    if (result.ok) {
      createSaveBackupFromSave(currentSave, "manual");
      saveCurrentGame({
        ...result.save,
        saveReliability: {
          ...(result.save.saveReliability ?? {}),
          lastAutosaveReason: `system-reset:${resetId}`,
        },
      });
      refreshBackups();
    }
    setPendingAction(null);
    setMessage(result.message);
  }

  function readFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setImportText(text);
      setImportReport(null);
      setMessage(`Loaded ${file.name}. Inspect the file before importing.`);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <button type="button" className={styles.launchButton} onClick={() => setOpen(true)}>
        Save Reliability
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Save reliability and versioning tools"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <p>Developer Save Protection</p>
                <h1>Save Reliability</h1>
                <span>{message}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </header>

            <nav className={styles.tabs} aria-label="Save reliability sections">
              {([
                ["status", "Status"],
                ["backups", `Backups (${backups.length})`],
                ["import", "Import / Export"],
                ["resets", "System Resets"],
              ] as Array<[ReliabilityTab, string]>).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? styles.activeTab : undefined}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className={styles.content}>
              {tab === "status" ? (
                <div className={styles.stack}>
                  <section className={styles.summaryGrid}>
                    <div><span>Schema</span><strong>{currentSave.schemaVersion ?? 0} / {CURRENT_SAVE_SCHEMA_VERSION}</strong></div>
                    <div><span>Last Autosave</span><strong>{localTimestamp(reliability.lastAutosaveAt ?? currentSave.updatedAt)}</strong></div>
                    <div><span>Autosave Reason</span><strong>{reliability.lastAutosaveReason ?? "Legacy save"}</strong></div>
                    <div><span>Backups</span><strong>{backups.length}</strong></div>
                    <div><span>Interrupted Recoveries</span><strong>{reliability.recoveredInterruptedTransactions ?? 0}</strong></div>
                    <div><span>Duplicates Prevented</span><strong>{reliability.preventedDuplicateOutcomes ?? 0}</strong></div>
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Validation</h2>
                    <p>Last checked: {localTimestamp(reliability.lastValidatedAt)}</p>
                    {validationIssues.length ? (
                      <ul>{validationIssues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul>
                    ) : <p className={styles.good}>No unresolved validation warnings are recorded.</p>}
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Protection Enabled</h2>
                    <p>Versioned migrations, pre-migration backups, load validation, transaction recovery, and duplicate outcome prevention are active at save boundaries.</p>
                  </section>
                </div>
              ) : null}

              {tab === "backups" ? (
                <div className={styles.stack}>
                  <div className={styles.actionRow}>
                    <button type="button" onClick={createManualBackup}>Create Manual Backup</button>
                  </div>
                  {backups.length ? backups.map((backup) => (
                    <section key={backup.backupId} className={styles.card} data-ui-text-box="auto">
                      <div className={styles.cardHeader}>
                        <div>
                          <h2>{backupReasonLabel(backup)}</h2>
                          <p>{localTimestamp(backup.createdAt)} · Schema {backup.schemaVersion}</p>
                        </div>
                        <button type="button" onClick={() => setPendingAction({ kind: "restore", backupId: backup.backupId })}>
                          Restore
                        </button>
                      </div>
                    </section>
                  )) : <section className={styles.card}><p>No backups have been created for this slot yet.</p></section>}
                </div>
              ) : null}

              {tab === "import" ? (
                <div className={styles.stack}>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Versioned Export</h2>
                    <p>Exports include the schema version, timestamp, and checksum.</p>
                    <div className={styles.actionRow}>
                      <button type="button" onClick={copyPackage}>Copy Package</button>
                      <button type="button" onClick={exportPackage}>Download Package</button>
                    </div>
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Development Importer</h2>
                    <p>Both versioned packages and older raw save JSON are accepted. Imports are validated, migrated, deduplicated, and backed up before replacement.</p>
                    <div className={styles.actionRow}>
                      <button type="button" onClick={() => fileInputRef.current?.click()}>Load JSON File</button>
                      <button type="button" onClick={inspectImport} disabled={!importText.trim()}>Inspect Import</button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => readFile(event.target.files?.[0] ?? null)} />
                    <textarea value={importText} onChange={(event) => { setImportText(event.target.value); setImportReport(null); }} placeholder="Paste a save package or legacy save JSON here." />
                    {importReport ? (
                      <div className={importReport.ok ? styles.reportGood : styles.reportBad}>
                        <strong>{importReport.ok ? "Import Valid" : "Import Rejected"}</strong>
                        <span>Format: {importReport.packageFormat} · Source schema: {importReport.sourceSchemaVersion}</span>
                        {importReport.issues.length ? <ul>{importReport.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul> : <p>No repairs are required.</p>}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={!importReport?.ok}
                      onClick={() => setPendingAction({ kind: "import" })}
                    >
                      Import Into Active Slot
                    </button>
                  </section>
                </div>
              ) : null}

              {tab === "resets" ? (
                <div className={styles.resetGrid}>
                  {SAVE_SYSTEM_RESETS.map((definition) => (
                    <section key={definition.resetId} className={styles.card} data-ui-text-box="auto">
                      <h2>{definition.name}</h2>
                      <p>{definition.description}</p>
                      <span className={styles.warning}>{definition.warning}</span>
                      <button type="button" className={styles.dangerButton} onClick={() => setPendingAction({ kind: "reset", resetId: definition.resetId })}>
                        Reset This System
                      </button>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {pendingAction ? (
        <div className={styles.confirmBackdrop} role="presentation" onMouseDown={() => setPendingAction(null)}>
          <section className={styles.confirm} role="dialog" aria-modal="true" aria-label="Confirm save reliability action" onMouseDown={(event) => event.stopPropagation()}>
            <p>Confirm Save Action</p>
            <h2>{pendingAction.kind === "restore" ? "Restore this backup?" : pendingAction.kind === "import" ? "Replace the active save?" : "Reset this system?"}</h2>
            <span>The current save is backed up before restore, import, or system reset. This action still changes the active slot immediately.</span>
            <div>
              <button type="button" onClick={() => setPendingAction(null)}>Cancel</button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => {
                  if (pendingAction.kind === "restore") restoreBackup(pendingAction.backupId);
                  else if (pendingAction.kind === "import") applyImport();
                  else applySystemReset(pendingAction.resetId);
                }}
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
