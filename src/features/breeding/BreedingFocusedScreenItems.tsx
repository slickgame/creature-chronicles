"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getBreedingSupportItem,
  getBreedingSupportItemActiveCount,
  getBreedingSupportItemCount,
  useBreedingSupportItem,
} from "@/data/breedingItems";
import { getBreedingParticipants, PLAYER_PARTICIPANT_ID } from "@/data/breeding";
import { useGameContext } from "@/state/GameProvider";
import type { BreedingParticipant } from "@/types/breeding";
import type { BreedingSupportItemId } from "@/types/items";
import { BreedingFocusedScreen as LedgerBreedingScreen } from "./BreedingFocusedScreenLedger";
import { GameDialog } from "@/features/ui/GameDialog";
import { RanchIcon } from "@/features/ui/RanchIcon";
import styles from "./BreedingFocusedScreenItems.module.css";

type PairMemory = { giverId: string | null; receiverId: string | null };
type PendingUse = { itemId: BreedingSupportItemId; targetId?: string };

const ENERGY_ITEM_IDS = ["energy_snack", "energy_meal"] as const satisfies readonly BreedingSupportItemId[];
const PAIR_ITEM_IDS = ["fertility_tonic", "trait_stabilizer", "mutation_catalyst"] as const satisfies readonly BreedingSupportItemId[];
const SHELF_ITEM_IDS = [...ENERGY_ITEM_IDS, ...PAIR_ITEM_IDS] as const;

function pairMemoryKey(saveId: string): string {
  return `creature_chronicles_breeding_pair_${saveId}`;
}

function readPair(saveId: string): PairMemory {
  try {
    const raw = window.localStorage.getItem(pairMemoryKey(saveId));
    if (!raw) return { giverId: PLAYER_PARTICIPANT_ID, receiverId: null };
    const parsed = JSON.parse(raw) as PairMemory;
    return {
      giverId: parsed.giverId ?? PLAYER_PARTICIPANT_ID,
      receiverId: parsed.receiverId ?? null,
    };
  } catch {
    return { giverId: PLAYER_PARTICIPANT_ID, receiverId: null };
  }
}

function targetId(participant: BreedingParticipant | null): string | undefined {
  if (!participant) return undefined;
  return participant.kind === "player" ? "player" : participant.creatureId;
}

function targetCanReceiveEnergy(participant: BreedingParticipant | null): boolean {
  return Boolean(participant && participant.energy < participant.maxEnergy);
}

export function BreedingFocusedScreen() {
  const [showItems,setShowItems]=useState(false);
  const { currentSave, saveCurrentGame } = useGameContext();
  const [shelfHost, setShelfHost] = useState<HTMLElement | null>(null);
  const [pair, setPair] = useState<PairMemory>({ giverId: PLAYER_PARTICIPANT_ID, receiverId: null });
  const [pendingUse, setPendingUse] = useState<PendingUse | null>(null);
  const [message, setMessage] = useState("Use owned support items here without leaving the Breeding Pen.");

  const participants = useMemo(
    () => (currentSave ? getBreedingParticipants(currentSave) : []),
    [currentSave],
  );
  const giver = participants.find((participant) => participant.participantId === pair.giverId) ?? null;
  const receiver = participants.find((participant) => participant.participantId === pair.receiverId) ?? null;

  useEffect(() => {
    if (!currentSave) return;
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const host = document.querySelector<HTMLElement>('aside[aria-label="Breeding preview details"]');
        setShelfHost((previous) => previous === host ? previous : host);
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
      attributeFilter: ["disabled", "src", "value"],
    });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
      window.cancelAnimationFrame(frame);
    };
  }, [currentSave]);

  function executeUse(itemId: BreedingSupportItemId, selectedTargetId?: string) {
    if (!currentSave) return;
    const result = useBreedingSupportItem(currentSave, itemId, {
      source: "breeding-pen",
      targetId: selectedTargetId,
    });
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setPendingUse(null);
  }

  function requestUse(itemId: BreedingSupportItemId, selectedTargetId?: string) {
    const item = getBreedingSupportItem(itemId);
    if (!item || !currentSave) return;
    if (item.confirmationRequired) {
      setPendingUse({ itemId, targetId: selectedTargetId });
      return;
    }
    executeUse(itemId, selectedTargetId);
  }

  function supportCount(itemId: BreedingSupportItemId): number {
    return currentSave ? getBreedingSupportItemCount(currentSave, itemId) : 0;
  }

  function armed(itemId: BreedingSupportItemId): boolean {
    return Boolean(currentSave && getBreedingSupportItemActiveCount(currentSave, itemId) > 0);
  }

  const ownedShelfItems = SHELF_ITEM_IDS.reduce((total, itemId) => total + supportCount(itemId), 0);
  const armedShelfItems = PAIR_ITEM_IDS.filter((itemId) => armed(itemId)).length;

  const shelf = currentSave ? (
    <><button type="button" style={{order:-2}} onClick={() => setShowItems(true)}><RanchIcon name="bag" />Support Items{armedShelfItems ? ` (${armedShelfItems} armed)` : ""}</button>{showItems ? <GameDialog title="Support Items" onClose={() => setShowItems(false)}><p>{ownedShelfItems} owned · {armedShelfItems} armed</p>
      <div className={styles.shelfBody}>
        {ENERGY_ITEM_IDS.map((itemId) => {
          const item = getBreedingSupportItem(itemId)!;
          const count = supportCount(itemId);
          return (
            <div key={itemId} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <strong>{item.name} ×{count}</strong>
                <span>{item.exactEffect}</span>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  disabled={count <= 0 || !targetCanReceiveEnergy(giver)}
                  onClick={() => requestUse(itemId, targetId(giver))}
                >
                  Giver
                </button>
                <button
                  type="button"
                  disabled={count <= 0 || !targetCanReceiveEnergy(receiver)}
                  onClick={() => requestUse(itemId, targetId(receiver))}
                >
                  Receiver
                </button>
              </div>
            </div>
          );
        })}

        {PAIR_ITEM_IDS.map((itemId) => {
          const item = getBreedingSupportItem(itemId)!;
          const count = supportCount(itemId);
          const isArmed = armed(itemId);
          return (
            <div key={itemId} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <strong>{item.name} ×{count}</strong>
                <span className={isArmed ? styles.armed : undefined}>{isArmed ? "Armed — " : ""}{item.exactEffect}</span>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={count <= 0 || isArmed}
                  onClick={() => requestUse(itemId)}
                >
                  {isArmed ? "Armed" : "Arm"}
                </button>
              </div>
            </div>
          );
        })}

        <p className={styles.message}>{message}</p>
      </div>
    </GameDialog> : null}</>
  ) : null;

  return (
    <>
      <LedgerBreedingScreen />
      {shelfHost && shelf ? createPortal(shelf, shelfHost) : null}

      {pendingUse ? (
        <GameDialog title="Confirm rare breeding item" onClose={() => setPendingUse(null)}><div>
            <p>Rare Item Confirmation</p>
            <h2>Arm {getBreedingSupportItem(pendingUse.itemId)?.name}?</h2>
            <p>{getBreedingSupportItem(pendingUse.itemId)?.exactEffect}</p>
            <p className={styles.warning}>One owned item is consumed immediately. Successful-conception items remain armed through failed attempts and cannot be returned to inventory.</p>
            <div className={styles.confirmActions}>
              <button type="button" onClick={() => setPendingUse(null)}>Cancel</button>
              <button type="button" onClick={() => executeUse(pendingUse.itemId, pendingUse.targetId)}>Confirm Use</button>
            </div>
          </div></GameDialog>
      ) : null}
    </>
  );
}
