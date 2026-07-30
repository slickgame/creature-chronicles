"use client";

import { SharedInfoOverlay } from "@/features/breeding/SharedInfoOverlay";
import { BeginnerMilestonesPanel } from "@/features/ranch/BeginnerMilestonesPanel";
import { DailyReportOverlayCards } from "@/features/ranch/DailyReportOverlayCards";
import { RanchAdvisorOverlay } from "@/features/ranch/RanchAdvisorOverlay";
import { ChapterOneStoryOverlay } from "@/features/story/ChapterOneStoryOverlay";
import { StoryImageAdminOverlay } from "@/features/story/StoryImageAdminOverlay";
import { StoryLogOverlay } from "@/features/story/StoryLogOverlay";
import { useGameContext } from "@/state/GameProvider";

export function RanchHubOverlays() {
  const { appScreen, currentSave } = useGameContext();
  if (!currentSave) return null;
  if (appScreen === "breeding") return <SharedInfoOverlay />;
  if (appScreen === "ranch-office") return <><StoryLogOverlay /><StoryImageAdminOverlay /></>;
  if (appScreen !== "ranch-hub") return null;
  return <><RanchAdvisorOverlay /><BeginnerMilestonesPanel /><DailyReportOverlayCards /><ChapterOneStoryOverlay /></>;
}
