"use client";

import { DailyReportOverlayCards } from "@/features/ranch/DailyReportOverlayCards";
import { TestPanel } from "@/features/ranch/TestPanel";
import { GameRoot } from "@/features/root/GameRoot";
import { useGameContext } from "@/state/GameProvider";

function HomeOverlay() {
  const { appScreen, currentSave } = useGameContext();
  if (!currentSave || appScreen !== "ranch-hub") return null;
  return <><TestPanel /><DailyReportOverlayCards /></>;
}

export default function HomePage() {
  return <><GameRoot /><HomeOverlay /></>;
}
