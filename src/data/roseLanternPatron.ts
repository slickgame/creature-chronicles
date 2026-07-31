import {
  ROSE_LANTERN_STATE_FLAG,
  ROSE_LANTERN_VERSION,
  acceptRoseLanternHouseRules,
  getRoseLanternAccess,
  getRoseLanternState,
  getRoseLanternTrustRank,
  spendRoseLanternRumorToken,
  visitRoseLanternSalon,
  workRoseLanternHospitalityShift as workRoseLanternHospitalityShiftBase,
  type RoseLanternAccess,
  type RoseLanternActionResult,
  type RoseLanternState,
} from "./roseLantern";
import type { GameSave } from "@/types/save";

export {
  ROSE_LANTERN_STATE_FLAG,
  ROSE_LANTERN_VERSION,
  acceptRoseLanternHouseRules,
  getRoseLanternAccess,
  getRoseLanternState,
  getRoseLanternTrustRank,
  spendRoseLanternRumorToken,
  visitRoseLanternSalon,
};
export type { RoseLanternAccess, RoseLanternActionResult, RoseLanternState };

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function workRoseLanternHospitalityShift(save: GameSave): RoseLanternActionResult {
  const base = workRoseLanternHospitalityShiftBase(save);
  if (!base.ok) return base;

  const goldBonus = numberFlag(save.flags.chapterThreePatronHospitalityGoldBonus);
  const trustBonus = numberFlag(save.flags.chapterThreePatronHospitalityTrustBonus);
  const rumorBonus = numberFlag(save.flags.chapterThreePatronHospitalityRumorBonus);
  if (goldBonus <= 0 && trustBonus <= 0 && rumorBonus <= 0) return base;

  const state = getRoseLanternState(base.save);
  const nextState: RoseLanternState = {
    ...state,
    trust: Math.min(100, state.trust + trustBonus),
    rumorTokens: state.rumorTokens + rumorBonus,
    history: [
      `Day ${save.dayState.dayNumber}: Patron charter bonus applied; +${goldBonus} Gold, +${trustBonus} House Trust, +${rumorBonus} Rumor Token${rumorBonus === 1 ? "" : "s"}.`,
      ...state.history,
    ].slice(0, 20),
  };
  const nextSave: GameSave = {
    ...base.save,
    currencies: {
      ...base.save.currencies,
      gold: base.save.currencies.gold + goldBonus,
    },
    flags: {
      ...base.save.flags,
      [ROSE_LANTERN_STATE_FLAG]: JSON.stringify(nextState),
      m69RoseLanternPatronBonusUsed: true,
    },
  };
  return {
    save: nextSave,
    state: nextState,
    ok: true,
    message: `${base.message} Patron charter: +${goldBonus} Gold, +${trustBonus} House Trust, and +${rumorBonus} Rumor Token${rumorBonus === 1 ? "" : "s"}.`,
  };
}
