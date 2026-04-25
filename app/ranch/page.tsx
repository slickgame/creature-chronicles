"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useGame } from "@/context/GameContext";
import RanchOperationsPanel from "@/components/ranch/RanchOperationsPanel";
import StoryObjectiveStrip from "@/components/story/StoryObjectiveStrip";

type RanchTab = "house" | "fields" | "barn" | "nursery" | "breeding";

function SettingsModal({
  open,
  onClose,
  playerNameInput,
  setPlayerNameInput,
  onSaveName,
  onResetGame,
}: {
  open: boolean;
  onClose: () => void;
  playerNameInput: string;
  setPlayerNameInput: (value: string) => void;
  onSaveName: () => void;
  onResetGame: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border-4 border-green-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-green-200 px-5 py-4">
          <h2 className="text-xl font-bold text-green-950">Ranch Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="font-bold text-green-950">Rename Player</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={playerNameInput}
                onChange={(event) => setPlayerNameInput(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-green-300 bg-white px-3 py-2"
                placeholder="Enter player name"
              />
              <button
                type="button"
                onClick={onSaveName}
                className="min-h-11 rounded-xl bg-green-700 px-4 py-2 font-semibold text-white"
              >
                Save Name
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-bold text-red-950">Reset Save</p>
            <p className="mt-1 text-sm text-stone-700">
              Starts the ranch over from the default state.
            </p>
            <button
              type="button"
              onClick={onResetGame}
              className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white"
            >
              Reset Save
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function RanchPageContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedInventory = searchParams.get("inventory");

  const initialTab: RanchTab =
    requestedTab === "house" ||
    requestedTab === "fields" ||
    requestedTab === "barn" ||
    requestedTab === "nursery" ||
    requestedTab === "breeding"
      ? requestedTab
      : "house";

  const initialInventoryOpen = requestedInventory === "1";

  const { playerData, resetGame, renamePlayer } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(playerData.name);

  function handleSavePlayerName() {
    renamePlayer(playerNameInput);
  }

  function handleResetGame() {
    resetGame();
    setSettingsOpen(false);
  }

  return (
    <main className="h-[calc(100vh-6rem)] min-h-[720px] overflow-hidden bg-gradient-to-b from-green-100 to-lime-200 p-3 sm:p-4 md:h-screen md:min-h-0 md:p-5">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-3">
        <header className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-green-700">Ranch</p>
            <h1 className="text-3xl font-bold text-green-950 sm:text-4xl">Ranch</h1>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="min-h-11 w-full rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow sm:w-fit"
          >
            Ranch Details
          </button>
        </header>

        <div className="shrink-0">
          <StoryObjectiveStrip />
        </div>

        <div className="min-h-0 flex-1">
          <RanchOperationsPanel
            initialTab={initialTab}
            initialInventoryOpen={initialInventoryOpen}
          />
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        playerNameInput={playerNameInput}
        setPlayerNameInput={setPlayerNameInput}
        onSaveName={handleSavePlayerName}
        onResetGame={handleResetGame}
      />
    </main>
  );
}

export default function RanchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-green-100 to-lime-200 p-6">
          <div className="mx-auto max-w-7xl rounded-2xl border-4 border-green-900 bg-white/85 p-6 text-green-950 shadow-xl">
            Loading ranch...
          </div>
        </main>
      }
    >
      <RanchPageContent />
    </Suspense>
  );
}
