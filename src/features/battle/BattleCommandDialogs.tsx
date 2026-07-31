"use client";

import { useState } from "react";
import {
  getBattleEffectGlossary,
  getBattleStatGlossary,
  getBattleStatusGlossary,
  getBattleTagGlossary,
  type BattleGlossaryEntry,
} from "@/data/battleGlossary";
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

function glossaryTitle(entry: BattleGlossaryEntry): string {
  return `${entry.label}\n${entry.flavor}\n${entry.mechanics}`;
}

function GlossaryTerm({ entry, label }: { entry: BattleGlossaryEntry; label?: string }) {
  return (
    <span
      className={styles.glossaryTerm}
      tabIndex={0}
      title={glossaryTitle(entry)}
      aria-label={`${entry.label}. ${entry.mechanics}`}
    >
      {label ?? entry.label}
    </span>
  );
}

function EffectDetail({ effect }: { effect: BattleMoveEffect }) {
  const effectEntry = getBattleEffectGlossary(effect.type);
  return (
    <div className={styles.effectDetail}>
      <strong><GlossaryTerm entry={effectEntry} label={titleCase(effect.type)} /></strong>
      {effect.target ? <span>Target: {titleCase(effect.target)}</span> : null}
      {effect.amount !== undefined ? <span>Amount: {effect.amount}</span> : null}
      {effect.status ? <span>Status: <GlossaryTerm entry={getBattleStatusGlossary(effect.status)} /></span> : null}
      {effect.stat ? <span>Stat: <GlossaryTerm entry={getBattleStatGlossary(effect.stat)} /></span> : null}
      {effect.chance !== undefined ? <span>Chance: {effect.chance}%</span> : null}
      {effect.duration !== undefined ? <span>Duration: {effect.duration} round{effect.duration === 1 ? "" : "s"}</span> : null}
      {effect.maxStacks !== undefined ? <span>Max stacks: {effect.maxStacks}</span> : null}
      {effect.note ? <span>{effect.note}</span> : null}
    </div>
  );
}

function moveGlossaryEntries(option: BattleUiMoveAvailability): BattleGlossaryEntry[] {
  const entries = new Map<string, BattleGlossaryEntry>();
  const add = (entry: BattleGlossaryEntry | null) => {
    if (entry) entries.set(entry.key, entry);
  };

  option.move.effects.forEach((effect) => {
    add(getBattleEffectGlossary(effect.type));
    if (effect.status) add(getBattleStatusGlossary(effect.status));
    if (effect.stat) add(getBattleStatGlossary(effect.stat));
  });
  if (option.move.scalingStat && option.move.scalingStat !== "none") add(getBattleStatGlossary(option.move.scalingStat));
  if (option.move.resistedBy && option.move.resistedBy !== "none") add(getBattleStatGlossary(option.move.resistedBy));
  option.move.tags.forEach((tag) => add(getBattleTagGlossary(tag)));
  return Array.from(entries.values());
}

export function BattleMoveGrid({ options, actor, onChooseMove }: BattleMoveGridProps) {
  const [inspected, setInspected] = useState<BattleUiMoveAvailability | null>(null);
  const glossaryEntries = inspected ? moveGlossaryEntries(inspected) : [];

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
              <div><span>Scaling</span><strong>{inspected.move.scalingStat && inspected.move.scalingStat !== "none" ? <GlossaryTerm entry={getBattleStatGlossary(inspected.move.scalingStat)} /> : "None"}</strong></div>
              <div><span>Resisted By</span><strong>{inspected.move.resistedBy && inspected.move.resistedBy !== "none" ? <GlossaryTerm entry={getBattleStatGlossary(inspected.move.resistedBy)} /> : "None"}</strong></div>
            </div>

            <section className={styles.moveEffectsSection}>
              <h3>Effects</h3>
              <p className={styles.glossaryHint}>Hover or focus an underlined term for its definition and exact battle rule.</p>
              <ul>
                {inspected.move.effects.map((effect, index) => <li key={`${effect.type}-${index}`}><EffectDetail effect={effect} /></li>)}
              </ul>
            </section>

            {glossaryEntries.length ? (
              <section className={styles.glossaryReferenceSection}>
                <div>
                  <h3>Gameplay Terms</h3>
                  <p>Definitions used by this move, including flavor and live mechanical values.</p>
                </div>
                <div className={styles.glossaryReferenceGrid}>
                  {glossaryEntries.map((entry) => (
                    <article key={entry.key}>
                      <strong>{entry.label}</strong>
                      <em>{entry.flavor}</em>
                      <p>{entry.mechanics}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className={styles.moveMetaLine}>
              <span>{titleCase(inspected.move.sourceType)} source</span>
              <span>{inspected.move.rarity ? `${titleCase(inspected.move.rarity)} rarity` : "Standard rarity"}</span>
              <span>{inspected.move.inheritable ? "Inheritable" : "Not inheritable"}</span>
            </div>

            {inspected.move.tags.length ? (
              <p className={styles.moveTags}>
                <strong>Tags:</strong>{" "}
                {inspected.move.tags.map((tag, index) => {
                  const entry = getBattleTagGlossary(tag);
                  return <span key={tag}>{index > 0 ? " · " : ""}{entry ? <GlossaryTerm entry={entry} /> : titleCase(tag)}</span>;
                })}
              </p>
            ) : null}
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
