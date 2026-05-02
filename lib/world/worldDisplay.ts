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
  "chapter7_road_brief": "Road Brief",
  "chapter7_prepare_road_supplies": "Prepare Road Supplies",
  "chapter7_ready_creature_helper": "Ready a Creature Helper",
  "chapter7_travel_brindlewood": "Travel to Brindlewood Road",
  "chapter7_scout_road": "Scout the Road",
  "chapter7_complete_road_service": "Complete Road Service",
  "chapter7_return_road_report": "Return Road Report",
  "chapter7_wayfarer_recognition": "Wayfarer Recognition",
  "road-ready-ranch-work": "Road-Ready Ranch Work",
  "town-route-proof": "Town Route Proof",
  "prepare-private-stock": "Private Stock Preparation",
  "sell-under-market-eye": "Market-Eyed Sale",
  "brindlewood-scout-road": "Scout the Road",
  "brindlewood-deliver-supplies": "Deliver Road Supplies",
  "brindlewood-courier-check": "Courier Check",
  "brindlewood-road-rumor": "Gather Road Rumor",
  "homefold-home-check": "Check Home Status",
  "homefold-ranch-room-pass": "Use a Ranch Room",
  "homefold-local-errands": "Run Local Errands",
  "homefold-map-table": "Review the Map Table",
  "silvergrain-market-inspection": "Inspect Market Demand",
  "silvergrain-submit-premium-sample": "Submit Premium Sample",
  "silvergrain-buyer-introduction": "Meet Buyer Contact",
  "silvergrain-price-rumor": "Record Price Rumor",
  "silvergrain-negotiate-buyer-terms": "Negotiate Buyer Terms",
  "silvergrain-browse-rare-stock": "Browse Rare Stock",
  "wayfarer-road-ledger-route": "Road Ledger Route",
  "velvet-private-goods-channel": "Private Goods Channel",
  "guild-official-registry-path": "Official Registry Path",
  "homefold-home-rhythm": "Home Rhythm",
  "brindlewood-road-chain": "Road Ledger Route",
  "silvergrain-exchange-chain": "Silvergrain Market Thread",
  "road-supply-run": "Road Supply Run",
  "road-patrol": "Road Patrol",
  "rumor-gathering": "Rumor Gathering",
  "broken-cart-assist": "Broken Cart Assist",
  "lost-courier": "Lost Courier",
  "lost-courier-found": "Lost Courier Found",
  "muddy-delay": "Muddy Delay",
  "helpful-road-rumor": "Helpful Road Rumor",
  "hidden-supply-cache": "Hidden Supply Cache",
  "suspicious-tracks": "Suspicious Tracks",
  "wayfarer-inspector-notice": "Wayfarer Inspector Notice",
  "stray-creature-sighting": "Stray Creature Sighting",
  "region_action": "Region Action",
  "dispatch_result": "Dispatch Result",
  "both": "Road Action",
  "cart-lifted": "Cart Lifted Clean",
  "courier-guided-back": "Courier Guided Back",
  "slow-but-steady": "Slow but Steady",
  "cache-logged": "Cache Logged Properly",
  "tracks-marked": "Tracks Marked",
  "rumor-recorded": "Rumor Recorded",
  "notice-filed": "Notice Filed",
  "sighting-noted": "Sighting Noted",
  "home rhythm support": "Home Rhythm Support",
  "basic supplies": "Basic Supplies",
  "story comfort": "Story Comfort",
  "road supplies": "Road Supplies",
  "travel discount hook": "Travel Discount Hook",
  "courier pay": "Courier Pay",
  "premium sale info": "Premium Sale Info",
  "rare seed hook": "Rare Seed Hook",
  "recipe hook": "Recipe Hook",
  "premium buyer hook": "Premium Buyer Hook",
  "private terms hook": "Private Terms Hook",
  "road-scout": "Road Scout",
  "supply-run": "Supply Run",
  "courier-check": "Courier Check",
  "premium-sample": "Premium Sample",
  "registry-acknowledgment": "Registry Acknowledgment",
  "check-home-status": "Check Home Status",
  "use-ranch-room": "Use a Ranch Room",
  "town-facing-action": "Complete a Town-Facing Action",
  "review-story-journal": "Review Current Story or Journal",
  "scout-road": "Scout the Road",
  "deliver-supplies": "Deliver Road Supplies",
  "return-report": "Return Road Report",
  "inspect-demand": "Inspect Market Demand",
  "prepare-premium-sample": "Prepare Premium Sample",
  "buyer-introduction": "Buyer Introduction",
  "record-price-rumor": "Record Price Rumor",
  "secure-private-terms": "Secure Private Terms",
  "wayfarer_dispatch": "Wayfarer Dispatch",
  "velvet_market_ring": "Velvet Market Ring",
  "guild_hall_circle": "Guild Hall Circle",
  "homefold_valley": "Homefold Valley",
  "brindlewood_road": "Brindlewood Road",
  "silvergrain_exchange": "Silvergrain Exchange",
  "crownmere_capital": "Crownmere Capital",
  "player_ranch": "Player Ranch",
  "hearthmere_town": "Hearthmere Town",
  "market_row": "Market Row",
  "guild_hall_branch": "Guild Hall Branch",
  "roadside_camp": "Roadside Camp",
  "old_toll_marker": "Old Toll Marker",
  "wayfarer_post": "Wayfarer Post",
  "brindlewood_waystation": "Brindlewood Waystation",
  "exchange_square": "Exchange Square",
  "velvet_buyer_hall": "Velvet Buyer Hall",
  "premium_produce_stalls": "Premium Produce Stalls",
  "royal_palace_district": "Royal Palace District",
  "royal_breeding_registry": "Royal Breeding Registry",
  "home_base": "Home Base",
  "hometown": "Hometown",
  "market_district": "Market District",
  "guild_branch": "Guild Branch",
  "road_camp": "Road Camp",
  "road_marker": "Road Marker",
  "faction_post": "Faction Post",
  "waystation": "Waystation",
  "trade_square": "Trade Square",
  "buyer_hall": "Buyer Hall",
  "premium_market": "Premium Market",
  "capital_city": "Capital City",
  "palace_district": "Palace District",
  "royal_registry": "Royal Registry",
  "royal permits": "Royal Permits",
  "registry seals": "Registry Seals",
  "capital commissions": "Capital Commissions",
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
  "chapter7_road_brief": {
    where: "Story Journal, Factions, Town, or Regions",
    action: "Review the Wayfarer Dispatch and Brindlewood Road assignment.",
    next: "Open the Journal or Regions page and acknowledge the road assignment.",
  },
  "chapter7_prepare_road_supplies": {
    where: "Ranch",
    action: "Cook, harvest, plant, water, fertilize, or keep wheat/bread/food ready for the road.",
    next: "Use a Ranch room or pack supplies before leaving Homefold.",
  },
  "chapter7_ready_creature_helper": {
    where: "Ranch",
    action: "Care for a creature, recover stamina, use creature field work, breed, hatch, or prove lineage.",
    next: "Use the Barn, Fields, Nursery, or Breeding room to ready a helper.",
  },
  "chapter7_travel_brindlewood": {
    where: "Regions",
    action: "Use in-world region travel to Brindlewood Road.",
    next: "Open Regions and travel to Brindlewood Road.",
  },
  "chapter7_scout_road": {
    where: "Brindlewood Road",
    action: "Perform Scout the Road from the Brindlewood Road actions.",
    next: "Travel to Brindlewood Road, then scout the route.",
  },
  "chapter7_complete_road_service": {
    where: "Brindlewood Road",
    action: "Perform Deliver Road Supplies or Courier Check.",
    next: "Complete a practical road service action for Wayfarer Dispatch.",
  },
  "chapter7_return_road_report": {
    where: "Brindlewood Road",
    action: "Perform the road report step through Gather Road Rumor.",
    next: "Return the report so the first outside assignment has a written close.",
  },
  "chapter7_wayfarer_recognition": {
    where: "Brindlewood Road or Factions",
    action: "Complete the Road Ledger Route report or earn enough Wayfarer recognition.",
    next: "Finish the Brindlewood report and check Wayfarer standing.",
  },
};

const FACTION_INFLUENCE: Record<string, string> = {
  wayfarer_dispatch: "Complete The Road Ledger, prove ranch reliability, travel to Brindlewood Road, and complete Road Work assignments.",
  velvet_market_ring: "Prepare quality goods, submit premium samples, inspect Silvergrain demand, meet buyer contacts, and negotiate private terms.",
  guild_hall_circle: "Use guild travel, complete civic work, acknowledge A Wider Invitation, and prepare for formal assignments.",
};

const REGION_IMPORTANCE: Record<string, string> = {
  homefold_valley: "Your current home loop around Hearthmere: ranch work, town relationships, Market Row services, and the Guild Hall Branch.",
  brindlewood_road: "The first road beyond town, positioned for courier jobs, inspections, Chapter 6's route-facing proof, and Chapter 7's Road Work assignment.",
  silvergrain_exchange: "The premium market route: quality samples, buyer introductions, rare stock hooks, price rumors, and Velvet Market Ring leverage.",
};

const FACTION_CHAIN_DATA: Record<string, { title: string; currentStep: string; nextRequirement: string; reward: string }> = {
  wayfarer_dispatch: {
    title: "Brindlewood Road Ledger",
    currentStep: "Prove the ranch can support road work and courier checks.",
    nextRequirement: "Complete The Road Ledger, visit Brindlewood Road, or finish a road action.",
    reward: "Wayfarer reputation, route priority, and future road assignments.",
  },
  velvet_market_ring: {
    title: "Silvergrain Buyer Thread",
    currentStep: "Show that the ranch can read demand, submit samples, and hold private buyer attention.",
    nextRequirement: "Progress Velvet Market Introduction, unlock Silvergrain Exchange, submit a premium sample, or negotiate buyer terms.",
    reward: "Velvet Market reputation, private buyer terms, rare stock hooks, and premium trade leverage.",
  },
  guild_hall_circle: {
    title: "Outer Charter Oversight",
    currentStep: "Keep the wider invitation legible to formal inspectors without surrendering player choice.",
    nextRequirement: "Acknowledge A Wider Invitation and confirm a World Map route.",
    reward: "Guild reputation, assignment legitimacy, and Chapter 7 branch support.",
  },
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

export function getFactionQuestChain(factionId: string, reputation: number, status: string) {
  const data = FACTION_CHAIN_DATA[factionId] ?? {
    title: "Uncharted Faction Thread",
    currentStep: "Build enough trust for this organization to define a route.",
    nextRequirement: "Progress related quests, region actions, or story objectives.",
    reward: "Future faction rewards.",
  };

  return {
    ...data,
    state: status === "locked" ? "Locked" : reputation >= 50 ? "Completed" : reputation > 0 ? "Active" : "Available",
    reputationReward: reputation >= 50 ? "Current chain cap reached" : `Next reputation target: ${reputation < 20 ? 20 : 50}`,
  };
}
