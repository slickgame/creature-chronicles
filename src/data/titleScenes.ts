import type { GameSave } from "@/types/save";

export const TITLE_SCENES = {
  arrival: { id: "arrival", imagePath: "/images/title/progression/arrival.webp", label: "A New Beginning" },
  welcome: { id: "welcome", imagePath: "/images/title/progression/welcome.webp", label: "Welcome to Bramble Farm" },
} as const;

/** Presentation only: read the active save, never advance story or tutorial state. */
export function getTitleScene(save: GameSave | null | undefined) {
  if (save?.flags.m24ChapterOneStoryComplete === true || save?.flags.chapterOneGuidedComplete === true) {
    return TITLE_SCENES.welcome;
  }
  if (save?.flags.m24IntroSeen === true) return TITLE_SCENES.welcome;
  return TITLE_SCENES.arrival;
}
