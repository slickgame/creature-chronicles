"use client";

import { useEffect } from "react";
import { BreedingScreen as CoreBreedingScreen } from "./BreedingScreen";
import { useGameContext } from "@/state/GameProvider";

const STORAGE_KEY = "creature_chronicles_breeding_focus";

type BreedingFocus = {
  creatureId?: string;
  preferredRole?: "giver" | "receiver";
  giverId?: string;
  receiverId?: string;
};

function findRoleColumn(role: "giver" | "receiver"): HTMLElement | null {
  const label = role === "giver" ? "Giver" : "Receiver";
  return (
    Array.from(document.querySelectorAll<HTMLElement>("aside")).find(
      (column) => column.querySelector("h2")?.textContent?.trim() === label,
    ) ?? null
  );
}

function clickParticipant(role: "giver" | "receiver", name: string): boolean {
  const column = findRoleColumn(role);
  if (!column) return false;
  const button = Array.from(column.querySelectorAll<HTMLButtonElement>("button")).find(
    (candidate) => candidate.querySelector("strong")?.textContent?.trim() === name,
  );
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

export function BreedingScreen() {
  const { appScreen, currentSave } = useGameContext();

  useEffect(() => {
    if (appScreen !== "breeding" || !currentSave) return;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let focus: BreedingFocus;
    try {
      focus = JSON.parse(raw) as BreedingFocus;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const getName = (id?: string) =>
      id
        ? (currentSave.creatures ?? []).find(
            (creature) => creature.creatureId === id,
          )?.nickname ?? null
        : null;
    const singleName = getName(focus.creatureId);
    const giverName = getName(focus.giverId);
    const receiverName = getName(focus.receiverId);
    let attempts = 0;

    const applyFocus = () => {
      attempts += 1;
      let complete = false;

      if (giverName && receiverName) {
        const giverClicked = clickParticipant("giver", giverName);
        const receiverClicked = clickParticipant("receiver", receiverName);
        complete = giverClicked && receiverClicked;
      } else if (singleName) {
        complete = clickParticipant(focus.preferredRole ?? "receiver", singleName);
      } else {
        complete = true;
      }

      if (complete) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (attempts < 12) window.setTimeout(applyFocus, 90);
    };

    window.setTimeout(applyFocus, 0);
  }, [appScreen, currentSave]);

  return <CoreBreedingScreen />;
}
