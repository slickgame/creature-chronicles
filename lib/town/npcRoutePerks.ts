import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcMiniChainProgressMap } from "@/lib/town/npcMiniChains";

export type NpcRoutePerkId =
  | "maris_greenhouse_touch"
  | "selene_private_premium"
  | "tamsin_comfort_kitchen";

export type NpcRoutePerkUnlockSource = "mini_chain" | "payoff_invitation";

export type NpcRoutePerkStateEntry = {
  unlocked: boolean;
  unlockedDay?: number;
  source?: NpcRoutePerkUnlockSource;
};

export type NpcRoutePerkState = Partial<Record<NpcRoutePerkId, NpcRoutePerkStateEntry>>;

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

export function hasNpcRoutePerk(state: NpcRoutePerkState, perkId: NpcRoutePerkId) {
  return state[perkId]?.unlocked === true;
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
