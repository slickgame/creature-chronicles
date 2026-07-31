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

  const patronGold = numberFlag(save.flags.chapterThreePatronHospitalityGoldBonus);
  const patronTrust = numberFlag(save.flags.chapterThreePatronHospitalityTrustBonus);
  const patronRumor = numberFlag(save.flags.chapterThreePatronHospitalityRumorBonus);
  const galaGold = numberFlag(save.flags.chapterThreeGalaHospitalityGoldBonus);
  const galaTrust = numberFlag(save.flags.chapterThreeGalaHospitalityTrustBonus);
  const galaRumor = numberFlag(save.flags.chapterThreeGalaHospitalityRumorBonus);
  const goldBonus = patronGold + galaGold;
  const trustBonus = patronTrust + galaTrust;
  const rumorBonus = patronRumor + galaRumor;
  if (goldBonus <= 0 && trustBonus <= 0 && rumorBonus <= 0) return base;

  const state = getRoseLanternState(base.save);
  const nextState: RoseLanternState = {
    ...state,
    trust: Math.min(100, state.trust + trustBonus),
    rumorTokens: state.rumorTokens + rumorBonus,
    history: [
      `Day ${save.dayState.dayNumber}: Charter and Founders' Gala bonuses applied; +${goldBonus} Gold, +${trustBonus} House Trust, +${rumorBonus} Rumor Token${rumorBonus === 1 ? "" : "s"}.`,
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
      ...(patronGold > 0 || patronTrust > 0 || patronRumor > 0 ? { m69RoseLanternPatronBonusUsed: true } : {}),
      ...(galaGold > 0 || galaTrust > 0 || galaRumor > 0 ? { m70FoundersGalaHospitalityLegacyUsed: true } : {}),
    },
  };
  return {
    save: nextSave,
    state: nextState,
    ok: true,
    message: `${base.message} Active charters and civic legacy: +${goldBonus} Gold, +${trustBonus} House Trust, and +${rumorBonus} Rumor Token${rumorBonus === 1 ? "" : "s"}.`,
  };
}
