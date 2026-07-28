"use client";

import { useEffect, useState } from "react";
import { BreedingFocusedScreen as CoreBreedingFocusedScreen } from "./BreedingFocusedScreen";
import { BreedingRecordsScreen } from "@/features/breeding-records/BreedingRecordsScreen";
import { useGameContext } from "@/state/GameProvider";

const STORAGE_KEY = "creature_chronicles_breeding_focus";

type BreedingFocus = {
  creatureId?: string;
  preferredRole?: "giver" | "receiver";
  giverId?: string;
  receiverId?: string;
};

function clickRoleChooser(role: "giver" | "receiver"): boolean {
  const label = role === "giver" ? "Choose Giver" : "Choose Receiver";
  const button = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button[aria-label]"),
  ).find((candidate) => candidate.getAttribute("aria-label") === label);
  if (!button) return false;
  button.click();
  return true;
}

function clickParticipant(name: string): boolean {
  const expectedLabel = `Select ${name}`;
  const button = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button[aria-label]"),
  ).find((candidate) => candidate.getAttribute("aria-label") === expectedLabel);
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

export function BreedingFocusedScreen() {
  const { appScreen, currentSave } = useGameContext();
  const [ledgerOpen, setLedgerOpen] = useState(false);

  useEffect(() => {
    if (ledgerOpen || appScreen !== "breeding" || !currentSave) return;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let focus: BreedingFocus;
    try {
      focus = JSON.parse(raw) as BreedingFocus;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const nameFor = (id?: string) =>
      id
        ? (currentSave.creatures ?? []).find(
            (creature) => creature.creatureId === id,
          )?.nickname ?? null
        : null;
    const singleName = nameFor(focus.creatureId);
    const giverName = nameFor(focus.giverId);
    const receiverName = nameFor(focus.receiverId);

    function selectRole(role: "giver" | "receiver", name: string, onDone: () => void) {
      let attempts = 0;
      const openSelector = () => {
        attempts += 1;
        if (!clickRoleChooser(role)) {
          if (attempts < 12) window.setTimeout(openSelector, 90);
          return;
        }
        let selectAttempts = 0;
        const selectParticipant = () => {
          selectAttempts += 1;
          if (clickParticipant(name)) {
            onDone();
            return;
          }
          if (selectAttempts < 12) window.setTimeout(selectParticipant, 90);
        };
        window.setTimeout(selectParticipant, 60);
      };
      openSelector();
    }

    if (giverName && receiverName) {
      selectRole("giver", giverName, () => {
        selectRole("receiver", receiverName, () => {
          window.sessionStorage.removeItem(STORAGE_KEY);
        });
      });
      return;
    }

    if (singleName) {
      selectRole(focus.preferredRole ?? "receiver", singleName, () => {
        window.sessionStorage.removeItem(STORAGE_KEY);
      });
      return;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
  }, [appScreen, currentSave, ledgerOpen]);

  if (ledgerOpen) {
    return <BreedingRecordsScreen onClose={() => setLedgerOpen(false)} />;
  }

  return (
    <>
      <CoreBreedingFocusedScreen />
      <button
        type="button"
        onClick={() => setLedgerOpen(true)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 45,
          minHeight: 42,
          padding: "9px 16px",
          border: "2px solid #2a1b12",
          borderRadius: 13,
          background: "linear-gradient(#c9f0ff,#56c7ff)",
          color: "#071923",
          fontWeight: 950,
          boxShadow: "0 5px 0 rgba(0,0,0,.4), 0 0 18px rgba(86,199,255,.18)",
        }}
      >
        Breeding Ledger
      </button>
    </>
  );
}
