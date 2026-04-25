"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import MainStoryPanel from "@/components/story/MainStoryPanel";
import StoryJournal from "@/components/story/StoryJournal";

function getLocationLabel(location: string) {
  if (location === "ranch") return "Ranch";
  if (location === "town") return "Town";
  if (location === "market") return "Market";
  if (location === "guild_hall") return "Guild Hall";
  return "Home";
}

function StoryModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-3 sm:p-5">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-4 border-stone-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <h2 className="min-w-0 truncate text-lg font-bold text-stone-950 sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export default function StoryObjectiveStrip() {
  const {
    currentMainStoryChapter,
    currentMainStoryObjective,
    mainStoryChapterProgress,
  } = useGame();
  const [storyOpen, setStoryOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border-2 border-indigo-900 bg-white/92 p-3 shadow-lg sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-indigo-700">
              Chapter {currentMainStoryChapter.chapterNumber} - {currentMainStoryChapter.title}
            </p>
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="min-w-0 text-lg font-bold text-stone-950 sm:text-xl">
                {currentMainStoryObjective.title}
              </h2>
              <span className="w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                {getLocationLabel(currentMainStoryObjective.locationHint)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 max-w-4xl text-sm text-stone-700">
              {currentMainStoryObjective.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-[150px] rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-950">
              <p className="font-bold">
                {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} steps
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-indigo-700"
                  style={{ width: `${mainStoryChapterProgress.percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStoryOpen(true)}
                className="min-h-11 rounded-xl bg-indigo-800 px-3 py-2 text-sm font-semibold text-white shadow"
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setJournalOpen(true)}
                className="min-h-11 rounded-xl bg-stone-800 px-3 py-2 text-sm font-semibold text-white shadow"
              >
                Journal
              </button>
            </div>
          </div>
        </div>
      </section>

      <StoryModal open={storyOpen} onClose={() => setStoryOpen(false)} title="Main Story">
        <MainStoryPanel />
      </StoryModal>

      <StoryModal open={journalOpen} onClose={() => setJournalOpen(false)} title="Story Journal">
        <StoryJournal />
      </StoryModal>
    </>
  );
}
