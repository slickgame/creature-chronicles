const WORLD_LABELS: Record<string, string> = {
  "road_ledger_intro": "Road Ledger Introduction",
  "velvet_market_intro": "Velvet Market Introduction",
  "wayfarer-road-ledger": "The Road Ledger",
  "market-ring-introduction": "Velvet Market Introduction",
  "chapter-six-support-slot": "A Wider Invitation",
  "choose-first-outer-thread": "Choose the First Outer Thread",
  "chapter6_wider_invitation": "Wider Invitation",
  "chapter6_quest_log_review": "Quest Log Review",
  "chapter6_faction_signal": "First Alignment Signal",
  "chapter6_route_goods": "Route Goods",
  "chapter6_creature_lineage_proof": "Creature Lineage Proof",
  "chapter6_town_registration": "Town Registration",
  "chapter6_world_route_confirmed": "World Route Confirmation",
  "road-ready-ranch-work": "Road-Ready Ranch Work",
  "town-route-proof": "Town Route Proof",
  "prepare-private-stock": "Private Stock Preparation",
  "sell-under-market-eye": "Market-Eyed Sale",
  "wayfarer_dispatch": "Wayfarer Dispatch",
  "velvet_market_ring": "Velvet Market Ring",
  "guild_hall_circle": "Guild Hall Circle",
  "homefold_valley": "Homefold Valley",
  "brindlewood_road": "Brindlewood Road",
  "silvergrain_exchange": "Silvergrain Exchange",
  "regional_travel_discount": "Regional Travel Discount",
  "road_assignment_priority": "Road Assignment Priority",
  "premium_sell_multiplier": "Premium Sell Multiplier",
  "exclusive_market_contracts": "Exclusive Market Contracts",
  "inspection_bonus": "Inspection Bonus",
  "commission_slot_unlock": "Commission Slot Unlock",
  active: "Active",
  available: "Available",
  completed: "Completed",
  locked: "Locked",
  warm: "Warm",
  trusted: "Trusted",
  allied: "Allied",
};

const QUEST_HINTS: Record<string, { where: string; action: string; next: string }> = {
  "road-ready-ranch-work": {
    where: "Ranch",
    action: "Use House chores, Fields, cooking, or harvest work with a creature helper.",
    next: "Assign a creature to cook, clean, plant, water, fertilize, or harvest.",
  },
  "town-route-proof": {
    where: "Town, Market, or Guild Hall",
    action: "Use a town-facing sale, delivery, contract, social errand, or in-world visit.",
    next: "Sell produce, complete an NPC request or contract, or travel to Market/Guild Hall from Town.",
  },
  "prepare-private-stock": {
    where: "Ranch",
    action: "Harvest produce or cook a known recipe with creature help.",
    next: "Use Fields to harvest or the House Recipe Workshop to cook.",
  },
  "sell-under-market-eye": {
    where: "Town Produce Exchange or NPC Requests",
    action: "Sell produce through Selene or complete a delivery/contract.",
    next: "Open Town > Market > Produce Exchange or Town > Work > NPC Requests.",
  },
  "choose-first-outer-thread": {
    where: "Story Journal",
    action: "Review Chapter 6's Quest Log, Factions, and World Map route signal.",
    next: "Open the Quest Log, then check Factions and World Map to settle the first route signal.",
  },
};

const FACTION_INFLUENCE: Record<string, string> = {
  wayfarer_dispatch: "Complete The Road Ledger, prove ranch reliability, use town travel routes, and complete Chapter 6 route work.",
  velvet_market_ring: "Prepare quality goods, sell through Selene, complete market-facing deliveries, and send Chapter 6 market signals.",
  guild_hall_circle: "Use guild travel, complete civic work, acknowledge A Wider Invitation, and prepare for formal assignments.",
};

const REGION_IMPORTANCE: Record<string, string> = {
  homefold_valley: "Your current home loop: ranch work, town relationships, market services, and guild access.",
  brindlewood_road: "The first road beyond town, positioned for courier jobs, inspections, and Chapter 6's route-facing proof.",
  silvergrain_exchange: "A premium market destination tied to Selene, private buyers, higher-stakes goods, and Chapter 6's first route charter.",
};

const STANDING_GOALS = [
  { standing: "warm", reputation: 20 },
  { standing: "trusted", reputation: 50 },
  { standing: "allied", reputation: 80 },
];

export function formatWorldLabel(id: string) {
  return WORLD_LABELS[id] ?? id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatWorldList(ids: string[]) {
  if (ids.length === 0) return "None known yet";
  return ids.map(formatWorldLabel).join(", ");
}

export function formatQuestCategoryLabel(category: string) {
  if (category === "main_story") return "Main Story";
  if (category === "side_quest") return "Side Quest";
  if (category === "faction_quest") return "Faction Quest";
  if (category === "regional_assignment") return "Regional Assignment";
  return formatWorldLabel(category);
}

export function getQuestObjectiveDisplayHint(objectiveId: string) {
  return QUEST_HINTS[objectiveId] ?? {
    where: "Journal",
    action: "Follow the objective description.",
    next: "Look for the matching action in Ranch, Town, Market, or Guild Hall.",
  };
}

export function getQuestNextStep(
  objectives: Array<{ id: string; completed: boolean }>
) {
  const nextObjective = objectives.find((objective) => !objective.completed) ?? objectives[0];
  return nextObjective ? getQuestObjectiveDisplayHint(nextObjective.id) : null;
}

export function getFactionInfluenceHint(factionId: string) {
  return FACTION_INFLUENCE[factionId] ?? "Progress related authored quests and regional assignments.";
}

export function getFactionNextGoal(reputation: number) {
  const nextGoal = STANDING_GOALS.find((goal) => reputation < goal.reputation);
  if (!nextGoal) return "Allied standing reached for the current framework.";
  return `${nextGoal.reputation} reputation for ${formatWorldLabel(nextGoal.standing)} standing`;
}

export function getRegionImportance(regionId: string) {
  return REGION_IMPORTANCE[regionId] ?? "A future destination hook for quests, factions, and travel.";
}
