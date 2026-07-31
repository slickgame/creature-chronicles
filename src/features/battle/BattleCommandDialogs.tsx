"use client";

import { useState } from "react";
import {
  getBattleTargetTypeLabel,
  type BattleUiMoveAvailability,
} from "@/data/battleUi";
import type { BattleCombatant, BattleMoveEffect } from "@/types/battle";
import styles from "./BattleArenaScreen.module.css";

type BattleMoveGridProps = {
  options: readonly BattleUiMoveAvailability[];
  actor: BattleCombatant;
  onChooseMove: (moveId: string) => void;
};

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function effectDetail(effect: BattleMoveEffect): string {
  const pieces: string[] = [titleCase(effect.type)];
  if (effect.target) pieces.push(`Target: ${titleCase(effect.target)}`);
  if (effect.amount !== undefined) pieces.push(`Amount: ${effect.amount}`);
  if (effect.status) pieces.push(`Status: ${titleCase(effect.status)}`);
  if (effect.stat) pieces.push(`Stat: ${titleCase(effect.stat)}`);
  if (effect.chance !== undefined) pieces.push(`Chance: ${effect.chance}%`);
  if (effect.duration !== undefined) pieces.push(`Duration: ${effect.duration} round${effect.duration === 1 ? "" : "s"}`);
  if (effect.maxStacks !== undefined) pieces.push(`Max stacks: ${effect.maxStacks}`);
  if (effect.note) pieces.push(effect.note);
  return pieces.join(" · ");
}

export function BattleMoveGrid({ options, actor, onChooseMove }: BattleMoveGridProps) {
  const [inspected, setInspected] = useState<BattleUiMoveAvailability | null>(null);

  return (
    <>
      <div className={styles.moveGrid}>
        {options.map((option) => {
          const currentCooldown = actor.cooldowns[option.move.id] ?? 0;
          return (
            <article
              key={option.move.id}
              className={`${styles.moveCard} ${styles[`category_${option.move.category}`]}`}
              data-usable={option.usable ? "true" : "false"}
            >
              <button
                type="button"
                className={styles.moveSelectButton}
                onClick={() => onChooseMove(option.move.id)}
                disabled={!option.usable}
              >
                <span className={styles.moveTitle}>
                  <strong>{option.move.name}</strong>
                  <em>{option.move.category}</em>
                </span>
                <span className={styles.moveNumbers}>
                  PWR {option.move.power} · ACC {option.move.accuracy}% · BE {option.move.battleEnergyCost} · CD {currentCooldown}/{option.move.cooldown}
                </span>
                <small>{option.reason ?? "Ready"}</small>
              </button>
              <button
                type="button"
                className={styles.moveInfoButton}
                onClick={() => setInspected(option)}
                aria-label={`More information about ${option.move.name}`}
                title={`More information about ${option.move.name}`}
              >
                i
              </button>
            </article>
          );
        })}
      </div>

      {inspected ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setInspected(null);
          }}
        >
          <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="battle-move-dialog-title">
            <header className={styles.modalHeader}>
              <div>
                <span>{titleCase(inspected.move.category)} Move</span>
                <h2 id="battle-move-dialog-title">{inspected.move.name}</h2>
              </div>
              <button type="button" onClick={() => setInspected(null)} aria-label="Close move details">×</button>
            </header>

            <p className={styles.modalDescription}>{inspected.move.description}</p>

            <div className={styles.moveDetailGrid}>
              <div><span>Target</span><strong>{getBattleTargetTypeLabel(inspected.move.targetType)}</strong></div>
              <div><span>Power</span><strong>{inspected.move.power}</strong></div>
              <div><span>Accuracy</span><strong>{inspected.move.accuracy}%</strong></div>
              <div><span>Battle Energy</span><strong>{inspected.move.battleEnergyCost}</strong></div>
              <div><span>Cooldown</span><strong>{actor.cooldowns[inspected.move.id] ?? 0}/{inspected.move.cooldown}</strong></div>
              <div><span>Priority</span><strong>{inspected.move.priority >= 0 ? "+" : ""}{inspected.move.priority}</strong></div>
              <div><span>Scaling</span><strong>{titleCase(inspected.move.scalingStat ?? "none")}</strong></div>
              <div><span>Resisted By</span><strong>{titleCase(inspected.move.resistedBy ?? "none")}</strong></div>
            </div>

            <section className={styles.moveEffectsSection}>
              <h3>Effects</h3>
              <ul>
                {inspected.move.effects.map((effect, index) => <li key={`${effect.type}-${index}`}>{effectDetail(effect)}</li>)}
              </ul>
            </section>

            <div className={styles.moveMetaLine}>
              <span>{titleCase(inspected.move.sourceType)} source</span>
              <span>{inspected.move.rarity ? `${titleCase(inspected.move.rarity)} rarity` : "Standard rarity"}</span>
              <span>{inspected.move.inheritable ? "Inheritable" : "Not inheritable"}</span>
            </div>

            {inspected.move.tags.length ? <p className={styles.moveTags}><strong>Tags:</strong> {inspected.move.tags.join(" · ")}</p> : null}
            <p className={inspected.usable ? styles.moveReady : styles.moveUnavailable}>{inspected.reason ?? "This move is ready to use on the selected target."}</p>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function BattleLogButton({ entries }: { entries: readonly string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.battleLogButton} onClick={() => setOpen(true)}>
        Battle Log <span>{entries.length}</span>
      </button>
      {open ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section className={`${styles.modalPanel} ${styles.logDialog}`} role="dialog" aria-modal="true" aria-labelledby="battle-log-dialog-title">
            <header className={styles.modalHeader}>
              <div><span>Turn-by-turn record</span><h2 id="battle-log-dialog-title">Battle Log</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close battle log">×</button>
            </header>
            <div className={styles.dialogLogList}>
              {entries.length ? entries.map((entry, index) => <p key={`${index}-${entry}`}><span>{index + 1}</span>{entry}</p>) : <p>No battle events have been recorded yet.</p>}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
