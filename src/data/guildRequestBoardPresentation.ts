import type { GuildContract, GuildContractCategory, GuildContractTier } from "@/types/guild";

export const GUILD_REQUEST_BOARD_ASSETS = {
  board: "/images/guild/request-board/request_board_empty.png",
  flyers: {
    bronze: "/images/guild/request-board/flyer_base_bronze.png",
    silver: "/images/guild/request-board/flyer_base_silver.png",
    gold: "/images/guild/request-board/flyer_base_gold.png",
  },
  badges: {
    donation: "/images/guild/request-board/badge_donation.png",
    service: "/images/guild/request-board/badge_service.png",
    registry: "/images/guild/request-board/badge_registry.png",
    lineage: "/images/guild/request-board/badge_lineage.png",
    restoration: "/images/guild/request-board/badge_restoration.png",
    security: "/images/guild/request-board/badge_security.png",
  },
} as const;

export const GUILD_REQUEST_BOARD_PAGE_SIZE = 6;

export type GuildFlyerBadgeKind = keyof typeof GUILD_REQUEST_BOARD_ASSETS.badges;

export type GuildBoardSlot = {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  baseRotationDeg: number;
};

/**
 * Six fixed pin locations. The empty board never knows how many requests exist;
 * React simply fills the first N slots for the current filtered page.
 */
export const GUILD_REQUEST_BOARD_SLOTS: readonly GuildBoardSlot[] = [
  { leftPercent: 19, topPercent: 29, widthPercent: 22, baseRotationDeg: -1.2 },
  { leftPercent: 50, topPercent: 27, widthPercent: 22, baseRotationDeg: 0.8 },
  { leftPercent: 81, topPercent: 30, widthPercent: 22, baseRotationDeg: -0.5 },
  { leftPercent: 20, topPercent: 70, widthPercent: 22, baseRotationDeg: 0.7 },
  { leftPercent: 50, topPercent: 69, widthPercent: 22, baseRotationDeg: -0.9 },
  { leftPercent: 80, topPercent: 71, widthPercent: 22, baseRotationDeg: 1.1 },
] as const;

export function getGuildFlyerBaseAsset(tier: GuildContractTier): string {
  return GUILD_REQUEST_BOARD_ASSETS.flyers[tier];
}

function categoryBadge(category: GuildContractCategory): GuildFlyerBadgeKind | null {
  if (category === "registry") return "registry";
  if (category === "lineage") return "lineage";
  if (category === "restoration") return "restoration";
  if (category === "security") return "security";
  if (category === "service") return "service";
  return null;
}

/**
 * Specific authored categories win. Otherwise the contract's submission type
 * supplies the badge, so general requests still read as Donation or Service.
 */
export function getGuildFlyerBadgeKind(contract: GuildContract): GuildFlyerBadgeKind {
  return categoryBadge(contract.category) ?? (contract.type === "service_creature" ? "service" : "donation");
}

export function getGuildFlyerBadgeAsset(contract: GuildContract): string {
  return GUILD_REQUEST_BOARD_ASSETS.badges[getGuildFlyerBadgeKind(contract)];
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable micro-rotation so flyers feel hand-pinned but never jitter on refresh. */
export function getGuildFlyerRotation(contractId: string, slotIndex: number): number {
  const jitterSteps = [-0.8, -0.45, -0.2, 0.15, 0.4, 0.75] as const;
  const jitter = jitterSteps[stableHash(contractId) % jitterSteps.length];
  const base = GUILD_REQUEST_BOARD_SLOTS[slotIndex % GUILD_REQUEST_BOARD_SLOTS.length]?.baseRotationDeg ?? 0;
  return Number((base + jitter).toFixed(2));
}

export function getGuildBoardPageCount(contractCount: number): number {
  return Math.max(1, Math.ceil(Math.max(0, contractCount) / GUILD_REQUEST_BOARD_PAGE_SIZE));
}

export function getGuildBoardPage<T>(items: readonly T[], page: number): T[] {
  const pageCount = getGuildBoardPageCount(items.length);
  const safePage = Math.max(0, Math.min(Math.trunc(page), pageCount - 1));
  const start = safePage * GUILD_REQUEST_BOARD_PAGE_SIZE;
  return items.slice(start, start + GUILD_REQUEST_BOARD_PAGE_SIZE);
}
