import * as core from "./battleOutfitterIntegration";
import {
  BATTLE_OUTFITTER_ITEMS,
  getBattleOutfitterStock,
} from "@/data/battleOutfitter";
import type { BattleState, BattleStatusStack } from "@/types/battle";
import type { GameSave } from "@/types/save";

export * from "./battleOutfitterIntegration";

function upsertInspiredStatus(statuses: BattleStatusStack[]): BattleStatusStack[] {
  const existing = statuses.find((status) => status.status === "inspired");
  const next: BattleStatusStack = {
    status: "inspired",
    duration: Math.max(1, existing?.duration ?? 0),
    amount: Math.max(3, existing?.amount ?? 0),
    stacks: Math.max(1, existing?.stacks ?? 1),
    maxStacks: Math.max(2, existing?.maxStacks ?? 2),
  };
  return [...statuses.filter((status) => status.status !== "inspired"), next];
}

export function applyTeamTacticsKit(
  save: GameSave,
  state: BattleState,
): core.BattleOutfitterCombatResult {
  const item = BATTLE_OUTFITTER_ITEMS.find(
    (entry) => entry.itemId === core.TEAM_TACTICS_KIT_ID,
  );
  if (!item || getBattleOutfitterStock(save, item) <= 0) {
    return {
      save,
      state,
      ok: false,
      message: "No Team Tactics Kit is available.",
    };
  }

  const nextSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [item.flagKey]: getBattleOutfitterStock(save, item) - 1,
      mBattleOutfitterCombatIntegration: true,
    },
  };

  const combatants = Object.values(state.combatants).reduce(
    (next, combatant) => {
      if (combatant.sideId !== "player" || combatant.isFainted) {
        next[combatant.battleCombatantId] = combatant;
        return next;
      }
      next[combatant.battleCombatantId] = {
        ...combatant,
        battleStats: {
          ...combatant.battleStats,
          battleEnergy: combatant.battleStats.battleEnergy + 10,
        },
        maxBattleEnergy: combatant.maxBattleEnergy + 10,
        currentBattleEnergy: combatant.currentBattleEnergy + 10,
        statuses: upsertInspiredStatus(combatant.statuses),
      };
      return next;
    },
    {} as BattleState["combatants"],
  );

  return {
    save: nextSave,
    state: {
      ...state,
      combatants,
      log: [
        ...state.log,
        "Team Tactics Kit activated: the ranch team starts Inspired and gains 10 current and maximum Battle Energy.",
      ],
    },
    ok: true,
    message: "Team Tactics Kit activated for this battle.",
  };
}
