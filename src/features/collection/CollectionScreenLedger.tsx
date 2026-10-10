"use client";

import { CollectionScreen as PolishedCollectionScreen } from "./CollectionScreenPolished";
import { useGameContext } from "@/state/GameProvider";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";

export function CollectionScreen() {
  const { goToBreeding } = useGameContext();

  function openLedger() {
    window.sessionStorage.setItem(OPEN_LEDGER_KEY, "1");
    goToBreeding();
  }

  return (
    <PolishedCollectionScreen headerLinks={
      <button type="button" onClick={openLedger}>Breeding Ledger</button>
    } />
  );
}
