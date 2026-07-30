import { GameRoot } from "@/features/root/GameRoot";
import { RanchHubOverlays } from "@/features/root/RanchHubOverlays";
import { ChapterOneGuidedTutorial } from "@/features/tutorial/ChapterOneGuidedTutorial";

export default function HomePage() {
  return <><GameRoot /><RanchHubOverlays /><ChapterOneGuidedTutorial /></>;
}
