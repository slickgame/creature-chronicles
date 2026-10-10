"use client";

import { SharedInfoOverlay } from "@/features/breeding/SharedInfoOverlay";
import { ChapterOneStoryOverlay } from "@/features/story/ChapterOneStoryOverlay";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { getPendingPredatorEvent } from "@/data/predatorEvents";
import { useGameContext } from "@/state/GameProvider";

export function RanchHubOverlays() {
  const { appScreen, currentSave } = useGameContext();
  const { view } = useNavigation();
  if (!currentSave || view || currentSave.flags.badEnding || getPendingPredatorEvent(currentSave)) return null;
  if (appScreen === "breeding") return <SharedInfoOverlay />;
  if (appScreen !== "ranch-hub") return null;
  return <ChapterOneStoryOverlay />;
}
