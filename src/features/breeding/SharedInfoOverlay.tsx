"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getBreedingParticipants } from "@/data/breeding";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { SharedPlayerDetail } from "@/features/player/PlayerDetailPanel";
import { useGameContext } from "@/state/GameProvider";

type OverlaySelection =
  | { kind: "creature"; creatureId: string }
  | { kind: "player" }
  | null;

function findParticipantDialog(names: Set<string>): HTMLElement | null {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>('section[role="dialog"]'),
  );

  return (
    dialogs.find((dialog) => {
      const heading = dialog.querySelector("h2")?.textContent?.trim() ?? "";
      return names.has(heading);
    }) ?? null
  );
}

function prepareHost(
  dialog: HTMLElement,
  compactHeader: boolean,
): HTMLElement {
  let host = dialog.querySelector<HTMLElement>(
    '[data-shared-info-host="true"]',
  );

  if (!host) {
    host = document.createElement("div");
    host.dataset.sharedInfoHost = "true";
    host.style.display = "block";
    dialog.appendChild(host);
  }

  const header = dialog.firstElementChild as HTMLElement | null;
  Array.from(dialog.children).forEach((child) => {
    const element = child as HTMLElement;
    if (element === host || element === header) return;
    element.style.display = "none";
  });

  if (compactHeader && header) {
    Array.from(header.children).forEach((child) => {
      const element = child as HTMLElement;
      if (element.tagName.toLowerCase() === "button") return;
      element.style.display = "none";
    });
    header.style.display = "flex";
    header.style.justifyContent = "flex-end";
    header.style.minHeight = "0";
  }

  return host;
}

export function SharedInfoOverlay() {
  const { appScreen, currentSave } = useGameContext();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [selection, setSelection] = useState<OverlaySelection>(null);

  const participantNames = useMemo(() => {
    if (!currentSave) return new Set<string>();
    return new Set([
      currentSave.player.name,
      ...(currentSave.creatures ?? []).map((creature) => creature.nickname),
    ]);
  }, [currentSave]);

  const creature = useMemo(() => {
    if (!currentSave || selection?.kind !== "creature") return null;
    return (
      (currentSave.creatures ?? []).find(
        (item) => item.creatureId === selection.creatureId,
      ) ?? null
    );
  }, [currentSave, selection]);

  const playerParticipant = useMemo(() => {
    if (!currentSave) return null;
    return (
      getBreedingParticipants(currentSave).find(
        (participant) => participant.kind === "player",
      ) ?? null
    );
  }, [currentSave]);

  useEffect(() => {
    if (appScreen !== "breeding" || !currentSave) {
      setTarget(null);
      setSelection(null);
      return;
    }

    function sync() {
      const dialog = findParticipantDialog(participantNames);
      if (!dialog) {
        setTarget(null);
        setSelection(null);
        return;
      }

      const heading = dialog.querySelector("h2")?.textContent?.trim() ?? "";
      const nextSelection: OverlaySelection =
        heading === currentSave.player.name
          ? { kind: "player" }
          : (() => {
              const matchedCreature = (currentSave.creatures ?? []).find(
                (item) => item.nickname === heading,
              );
              return matchedCreature
                ? {
                    kind: "creature" as const,
                    creatureId: matchedCreature.creatureId,
                  }
                : null;
            })();

      if (!nextSelection) {
        setTarget(null);
        setSelection(null);
        return;
      }

      setSelection(nextSelection);
      setTarget(prepareHost(dialog, nextSelection.kind === "player"));
    }

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [appScreen, currentSave, participantNames]);

  if (!target || !currentSave || !selection) return null;

  if (selection.kind === "player") {
    return createPortal(
      <SharedPlayerDetail
        save={currentSave}
        participant={playerParticipant}
      />,
      target,
    );
  }

  if (!creature) return null;

  return createPortal(
    <SharedCreatureDetail
      creature={creature}
      mode="full"
      dayNumber={currentSave.dayState.dayNumber}
      showActions={false}
    />,
    target,
  );
}
