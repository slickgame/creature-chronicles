import {
  getColiseumC4State,
  recordColiseumC4BattleResult as recordBaseColiseumC4BattleResult,
} from "./coliseumC4";

export * from "./coliseumC4";

/**
 * Adds a strict save-backed progression gate around C4 result processing.
 *
 * The base C4 implementation already protects duplicate result IDs, locked
 * rosters, and later-stage continuations. This wrapper closes two remaining
 * sequencing gaps:
 *
 * - an active gauntlet cannot replay stage 1 and overwrite its continuation;
 * - Daily Challenges and Boss Trials cannot be recorded while a gauntlet is
 *   waiting for its next saved stage.
 */
export function recordColiseumC4BattleResult(
  ...args: Parameters<typeof recordBaseColiseumC4BattleResult>
): ReturnType<typeof recordBaseColiseumC4BattleResult> {
  const [save, challenge, stageIndex] = args;
  const state = getColiseumC4State(save);
  const activeRun = state.activeRun;

  if (activeRun) {
    const isSavedContinuation =
      challenge.mode === "gauntlet" &&
      activeRun.challengeKey === challenge.challengeKey &&
      activeRun.stageIndex === stageIndex;

    if (!isSavedContinuation) {
      return {
        save,
        state,
        ok: false,
        changed: false,
        duplicate: false,
        message:
          "A C4 gauntlet is already active. Resume its saved stage or abandon the run before recording another challenge result.",
        xpSummaries: [],
      };
    }
  } else if (challenge.mode === "gauntlet" && stageIndex !== 0) {
    return {
      save,
      state,
      ok: false,
      changed: false,
      duplicate: false,
      message:
        "This gauntlet stage has no saved continuation. Start at stage 1 before recording later stages.",
      xpSummaries: [],
    };
  }

  return recordBaseColiseumC4BattleResult(...args);
}
