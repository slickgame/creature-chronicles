export const TUTORIAL_LIFECYCLE_VERSION = 1;

export type TutorialLifecycleState = {
  version: number;
  completedIds: string[];
  dismissedIds: string[];
  replayIds: string[];
};
