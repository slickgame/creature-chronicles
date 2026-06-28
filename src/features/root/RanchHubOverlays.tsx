"use client";

import { SharedInfoOverlay } from "@/features/breeding/SharedInfoOverlay";
import { ChapterOneGuidePanel } from "@/features/ranch/ChapterOneGuidePanel";
import { DailyReportOverlayCards } from "@/features/ranch/DailyReportOverlayCards";
import { RanchAdvisorOverlay } from "@/features/ranch/RanchAdvisorOverlay";
import { ChapterOneStoryOverlay } from "@/features/story/ChapterOneStoryOverlay";
import { StoryImageAdminOverlay } from "@/features/story/StoryImageAdminOverlay";
import { StoryLogOverlay } from "@/features/story/StoryLogOverlay";
import { VeyraTrustOverlay } from "@/features/story/VeyraTrustOverlay";
import { useGameContext } from "@/state/GameProvider";

export function RanchHubOverlays() {
  const { appScreen, currentSave } = useGameContext();
  if (!currentSave) return null;
  if (appScreen === "breeding") return <SharedInfoOverlay />;
  if (appScreen === "ranch-office") return <><StoryLogOverlay /><StoryImageAdminOverlay /></>;
  if (appScreen !== "ranch-hub") return null;
  return <><RanchAdvisorOverlay /><ChapterOneGuidePanel /><DailyReportOverlayCards /><VeyraTrustOverlay /><ChapterOneStoryOverlay /></>;
}
