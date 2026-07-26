"use client";

import { useEffect } from "react";
import { PlayerInventoryMenu as CorePlayerInventoryMenu } from "./PlayerInventoryMenu";
import { useGameContext } from "@/state/GameProvider";

type InventoryCreatureEvent = CustomEvent<{ creatureId?: string }>;

function findButtonByText(text: string, root: ParentNode = document): HTMLButtonElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.trim() === text,
    ) ?? null
  );
}

export function PlayerInventoryMenu() {
  const { currentSave } = useGameContext();

  useEffect(() => {
    function handleOpen(event: Event) {
      const creatureId = (event as InventoryCreatureEvent).detail?.creatureId;
      if (!creatureId || !currentSave) return;
      const creature = (currentSave.creatures ?? []).find(
        (item) => item.creatureId === creatureId,
      );
      if (!creature) return;

      findButtonByText("Menu")?.click();

      window.setTimeout(() => {
        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        if (!dialog) return;
        findButtonByText("Creatures", dialog)?.click();

        window.setTimeout(() => {
          const openDialog = document.querySelector<HTMLElement>("[role='dialog']");
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

    window.addEventListener(
      "creature-chronicles:open-inventory-creature",
      handleOpen,
    );
    return () =>
      window.removeEventListener(
        "creature-chronicles:open-inventory-creature",
        handleOpen,
      );
  }, [currentSave]);

  return <CorePlayerInventoryMenu />;
}
