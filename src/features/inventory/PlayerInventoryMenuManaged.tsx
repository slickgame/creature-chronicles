"use client";

import { useEffect, useRef } from "react";
import { PlayerInventoryMenu as CorePlayerInventoryMenu } from "./PlayerInventoryMenuExpanded";
import { useGameContext } from "@/state/GameProvider";

type InventoryCreatureEvent = CustomEvent<{ creatureId?: string }>;

const OPEN_PLAYER_MENU_EVENT = "creature-chronicles:open-player-menu";
const OPEN_CREATURE_EVENT = "creature-chronicles:open-inventory-creature";

function findButtonByText(text: string, root: ParentNode = document): HTMLButtonElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.trim() === text,
    ) ?? null
  );
}

export function PlayerInventoryMenu(props: { controlledOpen?: boolean; onClose?: () => void } = {}) {
  const { appScreen, currentSave } = useGameContext();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openManagedMenu() {
      const root = rootRef.current;
      if (!root) return;
      findButtonByText("Menu", root)?.click();
    }

    function handleOpenPlayerMenu() {
      openManagedMenu();
    }

    function handleOpenCreature(event: Event) {
      const creatureId = (event as InventoryCreatureEvent).detail?.creatureId;
      if (!creatureId || !currentSave) return;
      const creature = (currentSave.creatures ?? []).find(
        (item) => item.creatureId === creatureId,
      );
      if (!creature) return;

      try {const key=`inventoryAtelier:${currentSave.saveId}`;const previous=JSON.parse(sessionStorage.getItem(key)??'{}');sessionStorage.setItem(key,JSON.stringify({...previous,recipient:creatureId}));}catch{}
      openManagedMenu();
    }

    window.addEventListener(OPEN_PLAYER_MENU_EVENT, handleOpenPlayerMenu);
    window.addEventListener(OPEN_CREATURE_EVENT, handleOpenCreature);
    return () => {
      window.removeEventListener(OPEN_PLAYER_MENU_EVENT, handleOpenPlayerMenu);
      window.removeEventListener(OPEN_CREATURE_EVENT, handleOpenCreature);
    };
  }, [currentSave]);

  return (
    <div
      ref={rootRef}
      data-player-menu-root="true"
      data-player-menu-launcher-hidden={appScreen === "egg-atelier" ? "true" : "false"}
      style={{ display: "contents" }}
    >
      <CorePlayerInventoryMenu {...props} />
    </div>
  );
}
