"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getBattleMoveInheritancePreview } from "@/data/battleMoveInheritance";


import { useGameContext } from "@/state/GameProvider";
import { BreedingFocusedScreen as ItemsBreedingScreen } from "./BreedingFocusedScreenItems";

import { BreedingInheritanceBook } from "./BreedingInheritanceBook";


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
  const [showMoves,setShowMoves]=useState(false);
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
    const interval = window.setInterval(sync, 250);
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
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

  const panel = preview ? <><button type="button" style={{order:-1}} onClick={()=>setShowMoves(true)}><img src="/images/ui/icons/icon_collection_book.png" alt=""/>Inheritance</button>{showMoves&&currentSave?<BreedingInheritanceBook save={currentSave} giverId={pair.giverId} receiverId={pair.receiverId} onClose={()=>setShowMoves(false)}/>:null}</> : null;

  return (
    <>
      <ItemsBreedingScreen />
      {host && panel ? createPortal(panel, host) : null}
    </>
  );
}

