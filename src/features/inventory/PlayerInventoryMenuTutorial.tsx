"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getQuickhatchCatalystCount,
  QUICKHATCH_CATALYST,
  useTutorialQuickhatchCatalyst,
} from "@/data/tutorialQuickhatch";
import { useGameContext } from "@/state/GameProvider";
import type { EggId } from "@/types/ids";
import { PlayerInventoryMenu as ManagedInventoryMenu } from "./PlayerInventoryMenuManaged";
import styles from "./PlayerInventoryMenuTutorial.module.css";

const OPEN_EVENT = "creature-chronicles:open-tutorial-inventory";

export function PlayerInventoryMenu() {
  const { appScreen, currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedEggId, setSelectedEggId] = useState<string>("");
  const [message, setMessage] = useState("Select the guided egg, then confirm the rare item use.");
  const activeEggs = useMemo(
    () => (currentSave?.eggs ?? []).filter((egg) => egg.status !== "hatched"),
    [currentSave],
  );
  const stock = currentSave ? getQuickhatchCatalystCount(currentSave) : 0;
  const selectedEgg = activeEggs.find((egg) => String(egg.eggId) === selectedEggId) ?? activeEggs[0] ?? null;

  useEffect(() => {
    if (!selectedEggId && activeEggs[0]) setSelectedEggId(String(activeEggs[0].eggId));
    if (selectedEggId && !activeEggs.some((egg) => String(egg.eggId) === selectedEggId)) {
      setSelectedEggId(activeEggs[0] ? String(activeEggs[0].eggId) : "");
    }
  }, [activeEggs, selectedEggId]);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      setConfirming(false);
    }
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    let frame = 0;
    const tagMenu = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const menu = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) => button.textContent?.trim() === "Menu",
        );
        if (menu) menu.dataset.tutorialId = "open-inventory";
      });
    };
    tagMenu();
    const observer = new MutationObserver(tagMenu);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!currentSave || appScreen === "main-menu") return <ManagedInventoryMenu />;

  function executeUse() {
    if (!currentSave || !selectedEgg) return;
    const result = useTutorialQuickhatchCatalyst(currentSave, selectedEgg.eggId as EggId);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setConfirming(false);
    if (result.ok) window.setTimeout(() => setOpen(false), 900);
  }

  return (
    <>
      <ManagedInventoryMenu />
      {stock > 0 ? (
        <button
          type="button"
          className={styles.quickButton}
          data-tutorial-id="quickhatch-catalyst"
          onClick={() => setOpen(true)}
        >
          <img src={QUICKHATCH_CATALYST.iconPath} alt="" />
          <span>{QUICKHATCH_CATALYST.name}</span>
          <strong>×{stock}</strong>
        </button>
      ) : null}

      {open ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-label="Tutorial inventory item" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p>Inventory Lesson</p>
                <h2>Use a Targeted Item</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </header>

            <article className={styles.itemCard} data-tutorial-id="quickhatch-catalyst">
              <img src={QUICKHATCH_CATALYST.iconPath} alt="" />
              <div>
                <span>{QUICKHATCH_CATALYST.rarity} · Tutorial Exclusive</span>
                <h3>{QUICKHATCH_CATALYST.name} ×{stock}</h3>
                <p>{QUICKHATCH_CATALYST.description}</p>
                <strong>{QUICKHATCH_CATALYST.exactEffect}</strong>
              </div>
            </article>

            <label className={styles.targetPicker}>
              <span>Egg Target</span>
              <select value={selectedEgg ? String(selectedEgg.eggId) : ""} onChange={(event) => setSelectedEggId(event.target.value)}>
                {activeEggs.length ? activeEggs.map((egg) => (
                  <option key={egg.eggId} value={String(egg.eggId)}>
                    {egg.suggestedName || `${egg.rarity} Egg`} — {egg.status === "ready" ? "Ready" : `${egg.daysRemaining} day(s) left`}
                  </option>
                )) : <option value="">No active eggs</option>}
              </select>
            </label>

            {selectedEgg ? (
              <section className={styles.eggSummary}>
                <div><span>Rarity</span><strong>{selectedEgg.rarity}</strong></div>
                <div><span>Status</span><strong>{selectedEgg.status}</strong></div>
                <div><span>Projected Abilities</span><strong>{selectedEgg.projectedAbilities.length}</strong></div>
                <div><span>Lineage</span><strong>{selectedEgg.lineageRiskLabel}</strong></div>
              </section>
            ) : null}

            <p className={styles.message}>{message}</p>
            <footer>
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className={styles.primary} disabled={!selectedEgg || stock <= 0} onClick={() => setConfirming(true)}>
                Consume and Hatch
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {confirming ? (
        <div className={styles.confirmBackdrop} role="presentation" onClick={() => setConfirming(false)}>
          <section className={styles.confirm} role="dialog" aria-modal="true" aria-label="Confirm Quickhatch Catalyst" onClick={(event) => event.stopPropagation()}>
            <p>Rare Item Confirmation</p>
            <h2>Consume {QUICKHATCH_CATALYST.name}?</h2>
            <p>This permanently consumes the one-time catalyst and immediately hatches {selectedEgg?.suggestedName || "the selected egg"}.</p>
            <div>
              <button type="button" onClick={() => setConfirming(false)}>Keep Item</button>
              <button type="button" className={styles.primary} onClick={executeUse}>Confirm Use</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
