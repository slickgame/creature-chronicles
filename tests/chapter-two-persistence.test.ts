import assert from "node:assert/strict";
import test from "node:test";
import {
  consultChapterTwoPetra,
  getChapterTwoState,
  inspectChapterTwoTracks,
  prepareChapterTwoSave,
} from "@/data/chapterTwoTroubleBeyondFence";
import { createNewGameSave } from "@/lib/save/localSave";
import type { CreatureId } from "@/types/ids";


test("completed Chapter 2 construction and patrol preparation do not regress", () => {
  let save = createNewGameSave("Persistent Patrol", 0);
  save = {
    ...save,
    flags: {
      ...save.flags,
      chapterOneGuidedComplete: true,
      m15ChapterOneOnboardingComplete: true,
    },
  };
  save = inspectChapterTwoTracks(prepareChapterTwoSave(save)).save;
  save = consultChapterTwoPetra(save).save;

  const guardId = save.creatures?.[0]?.creatureId as CreatureId;
  save = prepareChapterTwoSave({
    ...save,
    flags: { ...save.flags, builderProject_reinforced_fence_built: true },
    ranchJobs: {
      ...save.ranchJobs!,
      assignments: {
        ...save.ranchJobs!.assignments,
        security_patrol: [guardId],
      },
    },
  });
  assert.equal(getChapterTwoState(save).stage, "defense");

  const reassigned = prepareChapterTwoSave({
    ...save,
    flags: { ...save.flags, ranchSecurityScoreToday: 0 },
    ranchJobs: {
      ...save.ranchJobs!,
      assignments: {
        ...save.ranchJobs!.assignments,
        security_patrol: [],
      },
    },
  });
  const state = getChapterTwoState(reassigned);
  assert.equal(state.fortificationBuilt, true);
  assert.equal(state.patrolPrepared, true);
  assert.equal(state.stage, "defense");
});
