"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getBattleMoveInheritancePreview } from "@/data/battleMoveInheritance";
import { getBattleMove } from "@/data/battleMoves";
import { getSpeciesDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import { BreedingFocusedScreen as ItemsBreedingScreen } from "./BreedingFocusedScreenItems";
import styles from "./BreedingFocusedScreenMoves.module.css";

type PairMemory = { giverId: string | null; receiverId: string | null };

function pairMemoryKey(saveId: string): string {
  return `creature_chronicles_breeding_pair_${saveId}`;
}

function readPair(saveId: string): PairMemory {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(pairMemoryKey(saveId)) ?? "null",
    ) as PairMemory | null;
    return {
      giverId: parsed?.giverId ?? "player",
      receiverId: parsed?.receiverId ?? null,
    };
  } catch {
    return { giverId: "player", receiverId: null };
  }
}

export function BreedingFocusedScreen() {
  const { currentSave } = useGameContext();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [pair, setPair] = useState<PairMemory>({ giverId: "player", receiverId: null });

  useEffect(() => {
    if (!currentSave) return;
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextHost = document.querySelector<HTMLElement>(
          'aside[aria-label="Breeding preview details"]',
        );
        setHost((previous) => previous === nextHost ? previous : nextHost);
        const nextPair = readPair(String(currentSave.saveId));
        setPair((previous) =>
          previous.giverId === nextPair.giverId && previous.receiverId === nextPair.receiverId
            ? previous
            : nextPair,
        );
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "value"],
    });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
      window.cancelAnimationFrame(frame);
    };
  }, [currentSave]);

  const preview = useMemo(
    () => currentSave
      ? getBattleMoveInheritancePreview(currentSave, pair.giverId, pair.receiverId)
      : null,
    [currentSave, pair.giverId, pair.receiverId],
  );

  const panel = preview ? (
    <details className={styles.panel} data-ui-text-box="auto" aria-label="Move lineage preview">
      <summary>
        <span>Move Lineage</span>
        <span>{preview.canProduceOffspring ? `+${preview.contextBonus}% pair bonus` : "Select two creatures"}</span>
      </summary>
      <div className={styles.body}>
        <p>{preview.reason}</p>
        {preview.childSpeciesId ? (
          <div className={styles.childLabel}>
            <span>Projected family move compatibility</span>
            <strong>{getSpeciesDefinition(preview.childSpeciesId).name}</strong>
          </div>
        ) : null}

        {preview.directCandidates.length ? (
          <section>
            <h3>Possible Parent Moves</h3>
            <div className={styles.list}>
              {preview.directCandidates.slice(0, 6).map((candidate) => (
                <article key={candidate.moveId}>
                  <div>
                    <strong>{candidate.moveName}</strong>
                    <span>{getBattleMove(candidate.moveId).category} · {candidate.knownByBothParents ? "both parents" : "one parent"}</span>
                  </div>
                  <b>{candidate.finalChance}%</b>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {preview.combinationCandidates.length ? (
          <section>
            <h3>Possible Combination Moves</h3>
            <div className={styles.list}>
              {preview.combinationCandidates.map((candidate) => (
                <article key={candidate.recipeId} className={styles.combination}>
                  <div>
                    <strong>{candidate.outputMoveName}</strong>
                    <span>{candidate.contributingMoveNames.join(" + ")}</span>
                  </div>
                  <b>{candidate.chance}%</b>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {preview.canProduceOffspring && !preview.directCandidates.length && !preview.combinationCandidates.length ? (
          <p className={styles.nativeNote}>No bonus technique is available, but every hatchling still receives its species’ complete native starting library.</p>
        ) : null}
        <p className={styles.disclosure}>Chances are visible before breeding. Exact rolls and the final inherited loadout are locked only after successful conception.</p>
      </div>
    </details>
  ) : null;

  return (
    <>
      <ItemsBreedingScreen />
      {host && panel ? createPortal(panel, host) : null}
    </>
  );
}
