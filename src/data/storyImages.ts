import { RANCH_ADVISOR } from "@/data/ranchAdvisor";
import { TAX_COLLECTOR } from "@/data/taxCollector";

export type StoryImageId =
  | "chapter1_intro_deed"
  | "chapter1_intro_arrival"
  | "chapter1_intro_veyra"
  | "chapter1_intro_priorities"
  | "chapter1_intro_tax_notice"
  | "chapter1_intro_town"
  | "chapter1_goal_assign_chores"
  | "chapter1_goal_assign_security"
  | "chapter1_goal_assign_comfort"
  | "chapter1_goal_assign_feed"
  | "chapter1_goal_assign_garden"
  | "chapter1_goal_assign_hauling"
  | "chapter1_goal_resolve_chores"
  | "chapter1_goal_produce_feed"
  | "chapter1_goal_gather_materials"
  | "chapter1_goal_repair_ranch"
  | "chapter1_goal_ranch_upgrade"
  | "chapter1_goal_breed"
  | "chapter1_goal_egg"
  | "chapter1_goal_market"
  | "chapter1_goal_tax"
  | "chapter1_goal_guild"
  | "chapter1_goal_reward"
  | "chapter1_complete_restored"
  | "chapter1_complete_veyra_records"
  | "chapter1_complete_guild_ledger"
  | "chapter1_complete_future_road";

export type StoryImageManifestEntry = {
  id: StoryImageId;
  filename: string;
  path: string;
  title: string;
  chapter: "chapter1";
  sceneId: string;
  description: string;
  promptNotes: string;
  placeholderPath: string;
  status: "placeholder" | "final";
  recommendedAspectRatio: "4:3" | "3:2" | "16:9" | "1:1";
  notes?: string;
};

const STORY_IMAGE_BASE = "/images/story";
export const STORY_IMAGE_FALLBACK_PATH = "/images/ui/icons/icon_paw_crest.png";

export const STORY_IMAGE_MANIFEST: Record<StoryImageId, StoryImageManifestEntry> = {
  chapter1_intro_deed: {
    id: "chapter1_intro_deed",
    filename: "chapter1_intro_deed.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_deed.png`,
    title: "Chapter 1 Intro — Inherited Deed",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "Opening image showing the inherited deed and the player's first connection to Bramble Farm.",
    promptNotes: "Old farm deed or letter being opened; rustic fantasy-ranch tone; moody but hopeful; no modern objects.",
    placeholderPath: "/images/ui/logo/creature_chronicles_logo.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_intro_arrival: {
    id: "chapter1_intro_arrival",
    filename: "chapter1_intro_arrival.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_arrival.png`,
    title: "Chapter 1 Intro — Arrival at Bramble Farm",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "The player arrives at an overgrown farm with damaged fences and creatures watching from the property edges.",
    promptNotes: "Wide establishing shot of neglected ranch entrance, overgrown grass, leaning fences, distant watching creatures; slightly ominous but inviting.",
    placeholderPath: "/images/ui/logo/creature_chronicles_logo.png",
    status: "placeholder",
    recommendedAspectRatio: "16:9",
  },
  chapter1_intro_veyra: {
    id: "chapter1_intro_veyra",
    filename: "chapter1_intro_veyra.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_veyra.png`,
    title: "Chapter 1 Intro — Meeting Veyra",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "Veyra Bramble waiting on the porch, introducing herself as the one who works and lives on the farm.",
    promptNotes: "Veyra on the ranch porch; warm but confident; farm background; practical advisor energy; story illustration framing.",
    placeholderPath: RANCH_ADVISOR.portraitPath,
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_intro_priorities: {
    id: "chapter1_intro_priorities",
    filename: "chapter1_intro_priorities.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_priorities.png`,
    title: "Chapter 1 Intro — Ranch Priorities",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "The ranch priority loop: security, feed, materials, comfort, eggs, and taxes.",
    promptNotes: "Stylized chore board or ledger with symbols for security, feed, materials, comfort, eggs, taxes; useful tutorial composition.",
    placeholderPath: "/images/ui/icons/icon_ranch_chores_board.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_intro_tax_notice: {
    id: "chapter1_intro_tax_notice",
    filename: "chapter1_intro_tax_notice.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_tax_notice.png`,
    title: "Chapter 1 Intro — Lady Vesper's Notice",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "Introduction to Lady Vesper, the Royal Tax Collector, through a formal posted notice.",
    promptNotes: "Official tax notice with wax seal or formal tax collector presence; stern, elegant, administrative pressure.",
    placeholderPath: TAX_COLLECTOR.portraitPath,
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_intro_town: {
    id: "chapter1_intro_town",
    filename: "chapter1_intro_town.png",
    path: `${STORY_IMAGE_BASE}/chapter1_intro_town.png`,
    title: "Chapter 1 Intro — Town Overview",
    chapter: "chapter1",
    sceneId: "chapter-one-intro",
    description: "The nearby town that supports the ranch: Market, Guild, and Ranch Office.",
    promptNotes: "Small fantasy town square or road with market stalls, guild hall, and ranch office hints; inviting but busy.",
    placeholderPath: "/images/ui/icons/icon_shop_bag.png",
    status: "placeholder",
    recommendedAspectRatio: "16:9",
  },
  chapter1_goal_assign_chores: {
    id: "chapter1_goal_assign_chores",
    filename: "chapter1_goal_assign_chores.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_chores.png`,
    title: "Chapter 1 Goal — Assign Chores",
    chapter: "chapter1",
    sceneId: "goal-assign-chores",
    description: "First interaction with the ranch chore board.",
    promptNotes: "Chore assignment board; player taking first control of ranch workflow; practical and readable composition.",
    placeholderPath: "/images/ui/icons/icon_ranch_chores_board.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_assign_security: {
    id: "chapter1_goal_assign_security",
    filename: "chapter1_goal_assign_security.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_security.png`,
    title: "Chapter 1 Goal — Assign Security",
    chapter: "chapter1",
    sceneId: "goal-assign-security",
    description: "Assigning a creature to watch the ranch perimeter.",
    promptNotes: "Ranch perimeter or gate patrol; watchful creature; protective tone; early danger foreshadowing.",
    placeholderPath: "/images/ui/icons/icon_security_patrol.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_assign_comfort: {
    id: "chapter1_goal_assign_comfort",
    filename: "chapter1_goal_assign_comfort.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_comfort.png`,
    title: "Chapter 1 Goal — Assign Comfort Care",
    chapter: "chapter1",
    sceneId: "goal-assign-comfort",
    description: "Comfort care improving ranch mood and future breeding conditions.",
    promptNotes: "Warm indoor or sheltered ranch care scene; creature comfort, clean bedding, calmer mood; gentle lighting.",
    placeholderPath: "/images/ui/icons/icon_comfort_care.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_assign_feed: {
    id: "chapter1_goal_assign_feed",
    filename: "chapter1_goal_assign_feed.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_feed.png`,
    title: "Chapter 1 Goal — Assign Stable Production",
    chapter: "chapter1",
    sceneId: "goal-assign-feed",
    description: "Stable production and feed generation.",
    promptNotes: "Barn or stable with feed bins, hay, ranch supplies; practical food security moment.",
    placeholderPath: "/images/ui/icons/icon_stable_production.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_assign_garden: {
    id: "chapter1_goal_assign_garden",
    filename: "chapter1_goal_assign_garden.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_garden.png`,
    title: "Chapter 1 Goal — Assign Garden Tending",
    chapter: "chapter1",
    sceneId: "goal-assign-garden",
    description: "Garden tending and growth support.",
    promptNotes: "Gentle ranch garden scene with crops, herbs, and a helper creature tending plants; calm early-game tone.",
    placeholderPath: "/images/ui/icons/icon_garden_tending.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_assign_hauling: {
    id: "chapter1_goal_assign_hauling",
    filename: "chapter1_goal_assign_hauling.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_assign_hauling.png`,
    title: "Chapter 1 Goal — Assign Field Hauling",
    chapter: "chapter1",
    sceneId: "goal-assign-hauling",
    description: "Hauling materials and building resource momentum.",
    promptNotes: "Moving crates, lumber, stones, or ranch supplies; work-focused; sense of forward motion.",
    placeholderPath: "/images/ui/icons/icon_field_hauling.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_resolve_chores: {
    id: "chapter1_goal_resolve_chores",
    filename: "chapter1_goal_resolve_chores.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_resolve_chores.png`,
    title: "Chapter 1 Goal — Resolve Chores",
    chapter: "chapter1",
    sceneId: "goal-resolve-chores",
    description: "The first nightly chore resolution and morning results.",
    promptNotes: "Morning report or ranch at dawn showing overnight work paid off; practical success moment.",
    placeholderPath: "/images/ui/icons/icon_sleep_recovery.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_produce_feed: {
    id: "chapter1_goal_produce_feed",
    filename: "chapter1_goal_produce_feed.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_produce_feed.png`,
    title: "Chapter 1 Goal — Produce Feed",
    chapter: "chapter1",
    sceneId: "goal-produce-feed",
    description: "A stocked feed supply that gives the ranch breathing room.",
    promptNotes: "Feed bins and supplies visibly stocked; resource buffer; stable, grounded success.",
    placeholderPath: "/images/ui/icons/icon_stable_production.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_gather_materials: {
    id: "chapter1_goal_gather_materials",
    filename: "chapter1_goal_gather_materials.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_gather_materials.png`,
    title: "Chapter 1 Goal — Gather Materials",
    chapter: "chapter1",
    sceneId: "goal-gather-materials",
    description: "Materials used for ranch repairs and upgrades.",
    promptNotes: "Lumber, stone, crates, salvage; ranch maintenance resource scene; useful but humble.",
    placeholderPath: "/images/ui/icons/icon_ranch_upgrade.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_repair_ranch: {
    id: "chapter1_goal_repair_ranch",
    filename: "chapter1_goal_repair_ranch.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_repair_ranch.png`,
    title: "Chapter 1 Goal — Repair Ranch",
    chapter: "chapter1",
    sceneId: "goal-repair-ranch",
    description: "Visible ranch repair work after damage or neglect.",
    promptNotes: "Fence, roof, gate, or structure being repaired; before/after feel; safety restored.",
    placeholderPath: "/images/ui/icons/icon_ranch_ledger.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_ranch_upgrade: {
    id: "chapter1_goal_ranch_upgrade",
    filename: "chapter1_goal_ranch_upgrade.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_ranch_upgrade.png`,
    title: "Chapter 1 Goal — Ranch Upgrade",
    chapter: "chapter1",
    sceneId: "goal-ranch-upgrade",
    description: "The first meaningful ranch improvement.",
    promptNotes: "Improved facility or upgrade board; long-term progress; brighter than repair scene.",
    placeholderPath: "/images/ui/icons/icon_ranch_ledger.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_breed: {
    id: "chapter1_goal_breed",
    filename: "chapter1_goal_breed.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_breed.png`,
    title: "Chapter 1 Goal — First Breeding",
    chapter: "chapter1",
    sceneId: "goal-breed",
    description: "The player's first breeding attempt.",
    promptNotes: "Breeding pen scene with two creatures; calm, intentional, non-explicit, warm ranch lighting.",
    placeholderPath: "/images/ui/icons/icon_breeding_pen_upgrade.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_egg: {
    id: "chapter1_goal_egg",
    filename: "chapter1_goal_egg.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_egg.png`,
    title: "Chapter 1 Goal — First Egg",
    chapter: "chapter1",
    sceneId: "goal-egg",
    description: "The first egg appearing in the nursery.",
    promptNotes: "Nursery scene with egg as focus; gentle, hopeful, delicate atmosphere; no clutter.",
    placeholderPath: "/images/ui/icons/icon_nursery_upgrade.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_market: {
    id: "chapter1_goal_market",
    filename: "chapter1_goal_market.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_market.png`,
    title: "Chapter 1 Goal — Market Access",
    chapter: "chapter1",
    sceneId: "goal-market",
    description: "The Market becoming part of the player's routine.",
    promptNotes: "Town market stall with creatures or merchants; economic opportunity; colorful but grounded.",
    placeholderPath: "/images/ui/icons/icon_shop_bag.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_tax: {
    id: "chapter1_goal_tax",
    filename: "chapter1_goal_tax.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_tax.png`,
    title: "Chapter 1 Goal — Tax Pressure",
    chapter: "chapter1",
    sceneId: "goal-tax",
    description: "Lady Vesper's financial reminder and the first tax pressure beat.",
    promptNotes: "Formal tax pressure scene; stern ledger or official notice; elegant but intimidating.",
    placeholderPath: TAX_COLLECTOR.portraitPath,
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_guild: {
    id: "chapter1_goal_guild",
    filename: "chapter1_goal_guild.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_guild.png`,
    title: "Chapter 1 Goal — Guild Recognition",
    chapter: "chapter1",
    sceneId: "goal-guild",
    description: "Completing a guild request and being recognized by town systems.",
    promptNotes: "Guild request board, seal, or delivery scene; public recognition; practical town approval.",
    placeholderPath: "/images/ui/icons/icon_guild_contract.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_goal_reward: {
    id: "chapter1_goal_reward",
    filename: "chapter1_goal_reward.png",
    path: `${STORY_IMAGE_BASE}/chapter1_goal_reward.png`,
    title: "Chapter 1 Goal — Reward Card",
    chapter: "chapter1",
    sceneId: "goal-reward-generic",
    description: "Generic reward/completion image used for goal completion pages.",
    promptNotes: "Simple illustrated milestone reward card; gold/feed/material/guild point symbolism; clean UI-friendly composition.",
    placeholderPath: STORY_IMAGE_FALLBACK_PATH,
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_complete_restored: {
    id: "chapter1_complete_restored",
    filename: "chapter1_complete_restored.png",
    path: `${STORY_IMAGE_BASE}/chapter1_complete_restored.png`,
    title: "Chapter 1 Complete — Restored Ranch",
    chapter: "chapter1",
    sceneId: "chapter-one-complete",
    description: "The ranch now looks alive, maintained, and claimed.",
    promptNotes: "Morning light over a healthier ranch; clear progress and ownership; optimistic end-of-chapter image.",
    placeholderPath: STORY_IMAGE_FALLBACK_PATH,
    status: "placeholder",
    recommendedAspectRatio: "16:9",
  },
  chapter1_complete_veyra_records: {
    id: "chapter1_complete_veyra_records",
    filename: "chapter1_complete_veyra_records.png",
    path: `${STORY_IMAGE_BASE}/chapter1_complete_veyra_records.png`,
    title: "Chapter 1 Complete — Veyra Reviews Records",
    chapter: "chapter1",
    sceneId: "chapter-one-complete",
    description: "Veyra reviewing the ranch's progress with quiet satisfaction.",
    promptNotes: "Veyra with ledgers, chore board, or nursery notes; approving but still practical; story portrait framing.",
    placeholderPath: RANCH_ADVISOR.portraitPath,
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_complete_guild_ledger: {
    id: "chapter1_complete_guild_ledger",
    filename: "chapter1_complete_guild_ledger.png",
    path: `${STORY_IMAGE_BASE}/chapter1_complete_guild_ledger.png`,
    title: "Chapter 1 Complete — Town Ledger and Guild Seal",
    chapter: "chapter1",
    sceneId: "chapter-one-complete",
    description: "The town now recognizes the ranch as functioning again.",
    promptNotes: "Town ledger, guild seal, stamped contract, or symbolic recognition scene; official progress.",
    placeholderPath: "/images/ui/icons/icon_guild_contract.png",
    status: "placeholder",
    recommendedAspectRatio: "4:3",
  },
  chapter1_complete_future_road: {
    id: "chapter1_complete_future_road",
    filename: "chapter1_complete_future_road.png",
    path: `${STORY_IMAGE_BASE}/chapter1_complete_future_road.png`,
    title: "Chapter 1 Complete — The Road Ahead",
    chapter: "chapter1",
    sceneId: "chapter-one-complete",
    description: "Foreshadowing image hinting that bigger problems are coming.",
    promptNotes: "Distant road, horizon, shadow, strange visitor, or subtle ominous sign beyond the ranch; sequel hook.",
    placeholderPath: STORY_IMAGE_FALLBACK_PATH,
    status: "placeholder",
    recommendedAspectRatio: "16:9",
  },
};

export function getStoryImage(id: StoryImageId): StoryImageManifestEntry {
  return STORY_IMAGE_MANIFEST[id];
}

export function getStoryImagePath(id: StoryImageId): string {
  const entry = STORY_IMAGE_MANIFEST[id];
  return entry.status === "final" ? entry.path : entry.placeholderPath;
}

export function getStoryImagePromptNotes(id: StoryImageId): string {
  return STORY_IMAGE_MANIFEST[id].promptNotes;
}

export function getStoryImagesByChapter(chapter: "chapter1"): StoryImageManifestEntry[] {
  return Object.values(STORY_IMAGE_MANIFEST).filter((entry) => entry.chapter === chapter);
}
