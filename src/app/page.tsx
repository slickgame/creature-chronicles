import { GameRoot } from "@/features/root/GameRoot";
import { RanchHubOverlays } from "@/features/root/RanchHubOverlays";
import { ChapterOneGuidedTutorial } from "@/features/tutorial/ChapterOneGuidedTutorial";

import { NavigationProvider } from "@/features/navigation/NavigationContext";

export default function HomePage() {
  return <NavigationProvider><GameRoot /><RanchHubOverlays /><ChapterOneGuidedTutorial /></NavigationProvider>;
}
