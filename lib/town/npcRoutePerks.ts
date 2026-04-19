import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcMiniChainProgressMap } from "@/lib/town/npcMiniChains";

export type NpcRoutePerkId =
  | "maris_greenhouse_touch"
  | "selene_private_premium"
  | "tamsin_comfort_kitchen";

export type NpcLoverEvolutionId =
  | "maris_greenhouse_bond"
  | "selene_elite_buyer_status"
  | "tamsin_hearth_devotion";

export type NpcRoutePerkUnlockSource = "mini_chain" | "payoff_invitation";

export type NpcRoutePerkStateEntry = {
  unlocked: boolean;
  unlockedDay?: number;
  source?: NpcRoutePerkUnlockSource;
};

export type NpcRoutePerkState = Partial<Record<NpcRoutePerkId, NpcRoutePerkStateEntry>>;

export type NpcLoverEvolutionStateEntry = {
  unlocked: boolean;
  unlockedDay?: number;
  invitationId?: string;
};

export type NpcLoverEvolutionState = Partial<Record<NpcLoverEvolutionId, NpcLoverEvolutionStateEntry>>;

export type NpcRoutePerk = {
  id: NpcRoutePerkId;
  npcId: FarmEconomyNpcId;
  title: string;
  subtitle: string;
  unlockMilestoneId: string;
  unlockInvitationId: string;
  unlockSummary: string;
  effectSummary: string;
  flavorText: string;
};

export type NpcLoverEvolution = {
  id: NpcLoverEvolutionId;
  npcId: FarmEconomyNpcId;
  requiredRoutePerkId: NpcRoutePerkId;
  invitationId: string;
  title: string;
  subtitle: string;
  unlockSummary: string;
  effectSummary: string;
  flavorText: string;
  lockedHint: string;
};

export const NPC_ROUTE_PERKS: Record<NpcRoutePerkId, NpcRoutePerk> = {
  maris_greenhouse_touch: {
    id: "maris_greenhouse_touch",
    npcId: "maris_thorn",
    title: "Greenhouse Touch",
    subtitle: "Maris keeps a few warm, dirt-sweet extras aside for you.",
    unlockMilestoneId: "maris_after_hours_bloom",
    unlockInvitationId: "maris_private_grower_payoff",
    unlockSummary: "Complete Maris's greenhouse route or accept her private grower payoff invitation.",
    effectSummary: "Paid seed and fertilizer purchases include one extra matching item.",
    flavorText:
      "Maris ties the packet shut with a crooked little smile, like the bonus was always meant to end up in your palm.",
  },
  selene_private_premium: {
    id: "selene_private_premium",
    npcId: "selene_voss",
    title: "Private Premium Terms",
    subtitle: "Selene quietly routes your best goods through buyers with deeper purses.",
    unlockMilestoneId: "selene_after_hours_terms_route",
    unlockInvitationId: "selene_private_buyer_payoff",
    unlockSummary: "Complete Selene's after-hours route or accept her private buyer payoff invitation.",
    effectSummary: "Quality produce and cooked-good sale quotes gain an extra +8% demand multiplier.",
    flavorText:
      "Selene marks your lots with one precise stroke of ink, eyes lifting just long enough to make the arrangement feel personal.",
  },
  tamsin_comfort_kitchen: {
    id: "tamsin_comfort_kitchen",
    npcId: "tamsin_vale",
    title: "Comfort Kitchen",
    subtitle: "Tamsin's table habits linger in your own kitchen work.",
    unlockMilestoneId: "tamsin_private_table_route",
    unlockInvitationId: "tamsin_private_dinner_payoff",
    unlockSummary: "Complete Tamsin's private table route or accept her private dinner payoff invitation.",
    effectSummary: "Comfort recipes produce one extra serving when cooked at the ranch.",
    flavorText:
      "Tamsin's little tricks make the pot stretch farther, warm and generous as her hand brushing yours over the counter.",
  },
};

export const NPC_ROUTE_PERK_IDS = Object.keys(NPC_ROUTE_PERKS) as NpcRoutePerkId[];

export const NPC_LOVER_EVOLUTIONS: Record<NpcLoverEvolutionId, NpcLoverEvolution> = {
  maris_greenhouse_bond: {
    id: "maris_greenhouse_bond",
    npcId: "maris_thorn",
    requiredRoutePerkId: "maris_greenhouse_touch",
    invitationId: "maris_lover_greenhouse_vow",
    title: "Greenhouse Bond",
    subtitle: "Maris treats your ranch like an extension of her warmest rows.",
    unlockSummary:
      "Reach lover-tier trust with Maris, unlock Greenhouse Touch, then complete Greenhouse Vow.",
    effectSummary: "Greenhouse Touch improves to +2 extra seed or fertilizer items on paid purchases.",
    flavorText:
      "Maris starts packing your orders like she is stocking a shared future, all warm eyes and dirt-smudged confidence.",
    lockedHint:
      "Finish Maris's route perk layer, keep her at lover-tier, then accept the Greenhouse Vow invitation.",
  },
  selene_elite_buyer_status: {
    id: "selene_elite_buyer_status",
    npcId: "selene_voss",
    requiredRoutePerkId: "selene_private_premium",
    invitationId: "selene_lover_elite_terms",
    title: "Elite Buyer Status",
    subtitle: "Selene places your name where only her most profitable clients can see it.",
    unlockSummary:
      "Reach lover-tier trust with Selene, unlock Private Premium Terms, then complete Elite Terms.",
    effectSummary: "Private Premium Terms improves from +8% to +15% demand multiplier on quality sales.",
    flavorText:
      "Selene's ledger begins opening doors before you arrive, and she enjoys making you notice exactly who arranged it.",
    lockedHint:
      "Finish Selene's route perk layer, keep her at lover-tier, then accept the Elite Terms invitation.",
  },
  tamsin_hearth_devotion: {
    id: "tamsin_hearth_devotion",
    npcId: "tamsin_vale",
    requiredRoutePerkId: "tamsin_comfort_kitchen",
    invitationId: "tamsin_lover_hearth_supper",
    title: "Hearth Devotion",
    subtitle: "Tamsin's private table turns into habits that follow you home.",
    unlockSummary:
      "Reach lover-tier trust with Tamsin, unlock Comfort Kitchen, then complete Hearth Supper.",
    effectSummary: "Comfort Kitchen improves to +2 extra servings from comfort recipes.",
    flavorText:
      "Tamsin's recipes start carrying the hush of a table set for two, generous enough to feed the whole house.",
    lockedHint:
      "Finish Tamsin's route perk layer, keep her at lover-tier, then accept the Hearth Supper invitation.",
  },
};

export const NPC_LOVER_EVOLUTION_IDS = Object.keys(NPC_LOVER_EVOLUTIONS) as NpcLoverEvolutionId[];

export const TAMSIN_COMFORT_RECIPE_IDS = [
  "bread",
  "porridge",
  "vegetable_soup",
  "hearty_stew",
  "warm_milk",
  "apple_pie",
  "berry_tart",
] as const;

export function normalizeNpcRoutePerkState(value: unknown): NpcRoutePerkState {
  if (!value || typeof value !== "object") return {};

  const source = value as Partial<Record<NpcRoutePerkId, Partial<NpcRoutePerkStateEntry>>>;
  return NPC_ROUTE_PERK_IDS.reduce<NpcRoutePerkState>((normalized, perkId) => {
    const entry = source[perkId];
    if (!entry || entry.unlocked !== true) return normalized;

    normalized[perkId] = {
      unlocked: true,
      unlockedDay: typeof entry.unlockedDay === "number" ? entry.unlockedDay : undefined,
      source: entry.source === "payoff_invitation" ? "payoff_invitation" : "mini_chain",
    };
    return normalized;
  }, {});
}

export function normalizeNpcLoverEvolutionState(value: unknown): NpcLoverEvolutionState {
  if (!value || typeof value !== "object") return {};

  const source = value as Partial<Record<NpcLoverEvolutionId, Partial<NpcLoverEvolutionStateEntry>>>;
  return NPC_LOVER_EVOLUTION_IDS.reduce<NpcLoverEvolutionState>((normalized, evolutionId) => {
    const entry = source[evolutionId];
    if (!entry || entry.unlocked !== true) return normalized;

    normalized[evolutionId] = {
      unlocked: true,
      unlockedDay: typeof entry.unlockedDay === "number" ? entry.unlockedDay : undefined,
      invitationId: typeof entry.invitationId === "string" ? entry.invitationId : undefined,
    };
    return normalized;
  }, {});
}

export function hasNpcRoutePerk(state: NpcRoutePerkState, perkId: NpcRoutePerkId) {
  return state[perkId]?.unlocked === true;
}

export function hasNpcLoverEvolution(
  state: NpcLoverEvolutionState,
  evolutionId: NpcLoverEvolutionId
) {
  return state[evolutionId]?.unlocked === true;
}

export function unlockNpcRoutePerk(
  state: NpcRoutePerkState,
  perkId: NpcRoutePerkId,
  unlockedDay: number,
  source: NpcRoutePerkUnlockSource
): NpcRoutePerkState {
  if (state[perkId]?.unlocked) return state;

  return {
    ...state,
    [perkId]: {
      unlocked: true,
      unlockedDay,
      source,
    },
  };
}

export function unlockNpcLoverEvolution(
  state: NpcLoverEvolutionState,
  evolutionId: NpcLoverEvolutionId,
  unlockedDay: number,
  invitationId: string
): NpcLoverEvolutionState {
  if (state[evolutionId]?.unlocked) return state;

  return {
    ...state,
    [evolutionId]: {
      unlocked: true,
      unlockedDay,
      invitationId,
    },
  };
}

export function getNpcRoutePerkByMilestone(milestoneId: string) {
  return NPC_ROUTE_PERK_IDS.map((perkId) => NPC_ROUTE_PERKS[perkId]).find(
    (perk) => perk.unlockMilestoneId === milestoneId
  );
}

export function getNpcRoutePerkByInvitation(invitationId: string) {
  return NPC_ROUTE_PERK_IDS.map((perkId) => NPC_ROUTE_PERKS[perkId]).find(
    (perk) => perk.unlockInvitationId === invitationId
  );
}

export function getNpcRoutePerksForNpc(npcId: string) {
  return NPC_ROUTE_PERK_IDS.map((perkId) => NPC_ROUTE_PERKS[perkId]).filter(
    (perk) => perk.npcId === npcId
  );
}

export function getNpcLoverEvolutionByInvitation(invitationId: string) {
  return NPC_LOVER_EVOLUTION_IDS.map((evolutionId) => NPC_LOVER_EVOLUTIONS[evolutionId]).find(
    (evolution) => evolution.invitationId === invitationId
  );
}

export function getNpcLoverEvolutionsForNpc(npcId: string) {
  return NPC_LOVER_EVOLUTION_IDS.map((evolutionId) => NPC_LOVER_EVOLUTIONS[evolutionId]).filter(
    (evolution) => evolution.npcId === npcId
  );
}

export function isTamsinComfortRecipe(recipeId: string) {
  return (TAMSIN_COMFORT_RECIPE_IDS as readonly string[]).includes(recipeId);
}

export function ensureNpcRoutePerksForMiniChainProgress(
  state: NpcRoutePerkState,
  progressMap: NpcMiniChainProgressMap,
  fallbackUnlockedDay: number
): NpcRoutePerkState {
  return NPC_ROUTE_PERK_IDS.reduce<NpcRoutePerkState>((nextState, perkId) => {
    const perk = NPC_ROUTE_PERKS[perkId];
    const progress = progressMap[perk.npcId];
    if (!progress?.completedMilestoneIds.includes(perk.unlockMilestoneId)) return nextState;

    return unlockNpcRoutePerk(
      nextState,
      perkId,
      progress.lastUnlockedMilestoneId === perk.unlockMilestoneId
        ? progress.lastUnlockedDay ?? fallbackUnlockedDay
        : fallbackUnlockedDay,
      "mini_chain"
    );
  }, state);
}
