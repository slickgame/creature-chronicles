import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcContractOfferKind } from "@/lib/town/npcContractLedger";
import type { NpcGiftReaction } from "@/lib/town/npcSocial";

export type NpcMiniChainRequirement = {
  actionKey: string;
  count: number;
  label: string;
};

export type NpcMiniChainRewardItem = {
  itemId: string;
  quantity: number;
};

export type NpcMiniChainMilestone = {
  id: string;
  npcId: FarmEconomyNpcId;
  title: string;
  subtitle: string;
  requirements: NpcMiniChainRequirement[];
  rewardSummary: string;
  followUpFlavor: string;
  relationshipGain: number;
  goldReward?: number;
  itemRewards?: NpcMiniChainRewardItem[];
  memoryEventId?: string;
};

export type NpcMiniChain = {
  npcId: FarmEconomyNpcId;
  title: string;
  routeFlavor: string;
  milestones: NpcMiniChainMilestone[];
};

export type NpcMiniChainProgress = {
  actionCounts: Record<string, number>;
  completedMilestoneIds: string[];
  lastUnlockedMilestoneId?: string;
  lastUnlockedDay?: number;
};

export type NpcMiniChainProgressMap = Record<string, NpcMiniChainProgress>;

export type NpcMiniChainUpdateResult = {
  progress: NpcMiniChainProgressMap;
  unlockedMilestones: NpcMiniChainMilestone[];
};

export function miniChainActionKey(npcId: string, action: string) {
  return `${npcId}:${action}`;
}

export function getGiftMiniChainActionKeys(npcId: string, reaction: NpcGiftReaction) {
  const keys = [miniChainActionKey(npcId, "gift:any")];
  if (reaction === "love" || reaction === "like") {
    keys.push(miniChainActionKey(npcId, "gift:liked"));
  }
  if (reaction === "love") {
    keys.push(miniChainActionKey(npcId, "gift:love"));
  }
  return keys;
}

export function getLedgerMiniChainActionKeys(npcId: string, kind: NpcContractOfferKind) {
  return [
    miniChainActionKey(npcId, "ledger:total"),
    miniChainActionKey(npcId, `ledger:${kind}`),
  ];
}

export function getOutingMiniChainActionKeys(npcId: string, invitationId: string) {
  return [
    miniChainActionKey(npcId, "outing:total"),
    miniChainActionKey(npcId, `outing:${invitationId}`),
  ];
}

export const NPC_MINI_CHAINS: Record<FarmEconomyNpcId, NpcMiniChain> = {
  maris_thorn: {
    npcId: "maris_thorn",
    title: "Maris's Greenhouse Route",
    routeFlavor:
      "A grower path about proving your hands, earning private stock, and letting the greenhouse become familiar.",
    milestones: [
      {
        id: "maris_favorite_hands",
        npcId: "maris_thorn",
        title: "Favorite Hands",
        subtitle: "Maris notices when you bring something she actually craves.",
        requirements: [
          {
            actionKey: miniChainActionKey("maris_thorn", "gift:love"),
            count: 1,
            label: "Give Maris one loved gift.",
          },
        ],
        rewardSummary: "+8 relationship, Berry Seed x2, warmer seed-counter flavor.",
        followUpFlavor:
          "Maris starts calling out your good taste with a grin that makes the whole stall feel smaller.",
        relationshipGain: 8,
        itemRewards: [{ itemId: "berry_seed", quantity: 2 }],
      },
      {
        id: "maris_reliable_grower",
        npcId: "maris_thorn",
        title: "Reliable Grower",
        subtitle: "A completed grower deal gives Maris proof that her stock thrives with you.",
        requirements: [
          {
            actionKey: miniChainActionKey("maris_thorn", "ledger:maris_grower_deal"),
            count: 1,
            label: "Complete one Maris grower deal.",
          },
        ],
        rewardSummary: "+10 relationship, Rich Fertilizer x1, private-stock follow-up.",
        followUpFlavor:
          "Maris begins setting better soil aside with your name on it, like she expected you to earn it.",
        relationshipGain: 10,
        itemRewards: [{ itemId: "rich_fertilizer", quantity: 1 }],
      },
      {
        id: "maris_greenhouse_regular",
        npcId: "maris_thorn",
        title: "Greenhouse Regular",
        subtitle: "The first greenhouse walk turns a business visit into a habit.",
        requirements: [
          {
            actionKey: miniChainActionKey("maris_thorn", "outing:maris_greenhouse_walk"),
            count: 1,
            label: "Complete Maris's Greenhouse Walk outing.",
          },
        ],
        rewardSummary: "+12 relationship, Apple Seed x2, greenhouse route memory hook.",
        followUpFlavor:
          "Maris talks about the greenhouse like you already know where everything is kept warm.",
        relationshipGain: 12,
        itemRewards: [{ itemId: "apple_seed", quantity: 2 }],
      },
      {
        id: "maris_after_hours_bloom",
        npcId: "maris_thorn",
        title: "After-Hours Bloom",
        subtitle: "Her grower trust turns into a private after-hours rhythm.",
        requirements: [
          {
            actionKey: miniChainActionKey("maris_thorn", "ledger:maris_grower_deal"),
            count: 2,
            label: "Complete two Maris grower deals.",
          },
          {
            actionKey: miniChainActionKey("maris_thorn", "outing:maris_after_hours_rows"),
            count: 1,
            label: "Complete Maris's After-Hours Rows outing.",
          },
        ],
        rewardSummary: "+16 relationship, Rich Fertilizer x2, After-Hours Bloom memory.",
        followUpFlavor:
          "Maris's route now has an after-hours greenhouse flag ready for future private scenes.",
        relationshipGain: 16,
        itemRewards: [{ itemId: "rich_fertilizer", quantity: 2 }],
        memoryEventId: "maris_after_hours_bloom_route",
      },
    ],
  },
  selene_voss: {
    npcId: "selene_voss",
    title: "Selene's Private Buyer Route",
    routeFlavor:
      "A polished market path about quality, leverage, and being invited behind the public terms.",
    milestones: [
      {
        id: "selene_presentable_supplier",
        npcId: "selene_voss",
        title: "Presentable Supplier",
        subtitle: "Selene likes proof that you can read her tastes.",
        requirements: [
          {
            actionKey: miniChainActionKey("selene_voss", "gift:liked"),
            count: 1,
            label: "Give Selene one liked or loved gift.",
          },
        ],
        rewardSummary: "+8 relationship, 60g, sharper private-buyer flavor.",
        followUpFlavor:
          "Selene starts correcting your presentation like she expects you to stand beside her again.",
        relationshipGain: 8,
        goldReward: 60,
      },
      {
        id: "selene_premium_candidate",
        npcId: "selene_voss",
        title: "Premium Candidate",
        subtitle: "Premium board work proves you can satisfy better buyers.",
        requirements: [
          {
            actionKey: miniChainActionKey("selene_voss", "ledger:selene_premium_board"),
            count: 1,
            label: "Complete one Selene premium board contract.",
          },
        ],
        rewardSummary: "+10 relationship, 90g, private-board follow-up.",
        followUpFlavor:
          "Selene begins using private-board language even when the public market is still open.",
        relationshipGain: 10,
        goldReward: 90,
      },
      {
        id: "selene_market_companion",
        npcId: "selene_voss",
        title: "Market Companion",
        subtitle: "A market stroll makes your usefulness visibly personal.",
        requirements: [
          {
            actionKey: miniChainActionKey("selene_voss", "outing:selene_market_stroll"),
            count: 1,
            label: "Complete Selene's Market Stroll outing.",
          },
        ],
        rewardSummary: "+12 relationship, 120g, market companion hook.",
        followUpFlavor:
          "Selene now frames some opportunities as invitations instead of listings.",
        relationshipGain: 12,
        goldReward: 120,
      },
      {
        id: "selene_after_hours_terms_route",
        npcId: "selene_voss",
        title: "After-Hours Terms",
        subtitle: "The ledger closes, but Selene's private route opens wider.",
        requirements: [
          {
            actionKey: miniChainActionKey("selene_voss", "ledger:selene_premium_board"),
            count: 2,
            label: "Complete two Selene premium board contracts.",
          },
          {
            actionKey: miniChainActionKey("selene_voss", "outing:selene_after_hours_ledger"),
            count: 1,
            label: "Complete Selene's After-Hours Ledger outing.",
          },
        ],
        rewardSummary: "+16 relationship, 180g, After-Hours Terms route memory.",
        followUpFlavor:
          "Selene's route now has a private-ledger flag ready for elite buyer scenes.",
        relationshipGain: 16,
        goldReward: 180,
        memoryEventId: "selene_private_terms_route",
      },
    ],
  },
  tamsin_vale: {
    npcId: "tamsin_vale",
    title: "Tamsin's Kitchen Trust Route",
    routeFlavor:
      "A domestic kitchen path about thoughtful gifts, cooked deliveries, tea, and private table trust.",
    milestones: [
      {
        id: "tamsin_thoughtful_guest",
        npcId: "tamsin_vale",
        title: "Thoughtful Guest",
        subtitle: "Tamsin warms quickly to someone who remembers comfort.",
        requirements: [
          {
            actionKey: miniChainActionKey("tamsin_vale", "gift:love"),
            count: 1,
            label: "Give Tamsin one loved gift.",
          },
        ],
        rewardSummary: "+8 relationship, Warm Milk x1, gentler kitchen flavor.",
        followUpFlavor:
          "Tamsin starts setting aside small comforts before you ask for them.",
        relationshipGain: 8,
        itemRewards: [{ itemId: "warm_milk", quantity: 1 }],
      },
      {
        id: "tamsin_commission_regular",
        npcId: "tamsin_vale",
        title: "Commission Regular",
        subtitle: "A finished kitchen commission proves you can feed her trust.",
        requirements: [
          {
            actionKey: miniChainActionKey("tamsin_vale", "ledger:tamsin_commission"),
            count: 1,
            label: "Complete one Tamsin cooking commission.",
          },
        ],
        rewardSummary: "+10 relationship, Berry Tart x1, commission follow-up.",
        followUpFlavor:
          "Tamsin begins talking about your deliveries like they belong in her evening plans.",
        relationshipGain: 10,
        itemRewards: [{ itemId: "berry_tart", quantity: 1 }],
      },
      {
        id: "tamsin_tea_companion",
        npcId: "tamsin_vale",
        title: "Tea Companion",
        subtitle: "A quiet cup turns the counter into something more personal.",
        requirements: [
          {
            actionKey: miniChainActionKey("tamsin_vale", "outing:tamsin_kitchen_tea"),
            count: 1,
            label: "Complete Tamsin's Kitchen Tea outing.",
          },
        ],
        rewardSummary: "+12 relationship, Apple Pie x1, tea companion hook.",
        followUpFlavor:
          "Tamsin now treats tea as a private invitation, not a courtesy.",
        relationshipGain: 12,
        itemRewards: [{ itemId: "apple_pie", quantity: 1 }],
      },
      {
        id: "tamsin_private_table_route",
        npcId: "tamsin_vale",
        title: "Private Table",
        subtitle: "Dinner service becomes a route flag for after-hours intimacy.",
        requirements: [
          {
            actionKey: miniChainActionKey("tamsin_vale", "ledger:tamsin_commission"),
            count: 2,
            label: "Complete two Tamsin cooking commissions.",
          },
          {
            actionKey: miniChainActionKey("tamsin_vale", "outing:tamsin_lamplit_table"),
            count: 1,
            label: "Complete Tamsin's Lamplit Table outing.",
          },
        ],
        rewardSummary: "+16 relationship, Hearty Stew x1, Private Table route memory.",
        followUpFlavor:
          "Tamsin's route now has a lamplit-table flag ready for private dinner scenes.",
        relationshipGain: 16,
        itemRewards: [{ itemId: "hearty_stew", quantity: 1 }],
        memoryEventId: "tamsin_private_table_route",
      },
    ],
  },
};

export function createDefaultNpcMiniChainProgress(): NpcMiniChainProgress {
  return {
    actionCounts: {},
    completedMilestoneIds: [],
  };
}

export function getNpcMiniChain(npcId: string) {
  return NPC_MINI_CHAINS[npcId as FarmEconomyNpcId] ?? null;
}

export function getNpcMiniChainProgress(
  progressMap: NpcMiniChainProgressMap,
  npcId: string
): NpcMiniChainProgress {
  return progressMap[npcId] ?? createDefaultNpcMiniChainProgress();
}

export function normalizeNpcMiniChainProgressMap(progress: unknown): NpcMiniChainProgressMap {
  if (!progress || typeof progress !== "object") return {};

  return Object.fromEntries(
    Object.entries(progress as Record<string, Partial<NpcMiniChainProgress>>).map(([npcId, value]) => [
      npcId,
      {
        actionCounts: normalizeActionCounts(value.actionCounts),
        completedMilestoneIds: Array.isArray(value.completedMilestoneIds)
          ? Array.from(new Set(value.completedMilestoneIds.filter((id): id is string => typeof id === "string")))
          : [],
        ...(typeof value.lastUnlockedMilestoneId === "string"
          ? { lastUnlockedMilestoneId: value.lastUnlockedMilestoneId }
          : {}),
        ...(typeof value.lastUnlockedDay === "number" && Number.isFinite(value.lastUnlockedDay)
          ? { lastUnlockedDay: Math.max(1, Math.floor(value.lastUnlockedDay)) }
          : {}),
      },
    ])
  );
}

function normalizeActionCounts(counts: unknown) {
  if (!counts || typeof counts !== "object") return {};

  return Object.fromEntries(
    Object.entries(counts as Record<string, unknown>)
      .filter(([key, value]) => key.length > 0 && typeof value === "number" && Number.isFinite(value))
      .map(([key, value]) => [key, Math.max(0, Math.floor(value as number))])
  );
}

export function recordNpcMiniChainActions(
  progressMap: NpcMiniChainProgressMap,
  npcId: string,
  actionKeys: string[],
  currentDay: number
): NpcMiniChainUpdateResult {
  const chain = getNpcMiniChain(npcId);
  if (!chain || actionKeys.length === 0) {
    return { progress: progressMap, unlockedMilestones: [] };
  }

  const currentProgress = getNpcMiniChainProgress(progressMap, npcId);
  const nextActionCounts = { ...currentProgress.actionCounts };
  actionKeys.forEach((key) => {
    nextActionCounts[key] = (nextActionCounts[key] ?? 0) + 1;
  });

  const completed = new Set(currentProgress.completedMilestoneIds);
  const unlockedMilestones: NpcMiniChainMilestone[] = [];

  for (const milestone of chain.milestones) {
    if (completed.has(milestone.id)) continue;
    const ready = milestone.requirements.every(
      (requirement) => (nextActionCounts[requirement.actionKey] ?? 0) >= requirement.count
    );
    if (!ready) break;

    completed.add(milestone.id);
    unlockedMilestones.push(milestone);
  }

  const nextProgress: NpcMiniChainProgress = {
    actionCounts: nextActionCounts,
    completedMilestoneIds: Array.from(completed),
    ...(unlockedMilestones.length > 0
      ? {
          lastUnlockedMilestoneId: unlockedMilestones[unlockedMilestones.length - 1].id,
          lastUnlockedDay: currentDay,
        }
      : {
          ...(currentProgress.lastUnlockedMilestoneId
            ? { lastUnlockedMilestoneId: currentProgress.lastUnlockedMilestoneId }
            : {}),
          ...(currentProgress.lastUnlockedDay ? { lastUnlockedDay: currentProgress.lastUnlockedDay } : {}),
        }),
  };

  return {
    progress: {
      ...progressMap,
      [npcId]: nextProgress,
    },
    unlockedMilestones,
  };
}

export function getNpcMiniChainNextMilestone(
  chain: NpcMiniChain,
  progress: NpcMiniChainProgress
) {
  return chain.milestones.find((milestone) => !progress.completedMilestoneIds.includes(milestone.id)) ?? null;
}

export function getNpcMiniChainRequirementProgress(
  requirement: NpcMiniChainRequirement,
  progress: NpcMiniChainProgress
) {
  return {
    current: progress.actionCounts[requirement.actionKey] ?? 0,
    required: requirement.count,
  };
}
