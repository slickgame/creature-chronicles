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

export function PlayerInventoryMenu() {
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

      openManagedMenu();

      window.setTimeout(() => {
        const root = rootRef.current;
        const dialog = root?.querySelector<HTMLElement>("[role='dialog']") ?? null;
        if (!dialog) return;
        findButtonByText("Creatures", dialog)?.click();

        window.setTimeout(() => {
          const openDialog = rootRef.current?.querySelector<HTMLElement>("[role='dialog']") ?? null;
          const card = openDialog
            ? Array.from(openDialog.querySelectorAll<HTMLElement>("article")).find(
                (article) =>
                  article.querySelector("strong")?.textContent?.trim() === creature.nickname,
              )
            : null;
          if (!card) return;
          card.scrollIntoView({ block: "center", behavior: "smooth" });
          card.animate(
            [
              { boxShadow: "0 0 0 2px rgba(127,219,255,.9),0 0 18px rgba(86,199,255,.35)" },
              { boxShadow: "0 0 0 0 rgba(127,219,255,0),0 0 0 rgba(86,199,255,0)" },
            ],
            { duration: 1600, easing: "ease-out" },
          );
        }, 100);
      }, 100);
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
      <CorePlayerInventoryMenu />
    </div>
  );
}
