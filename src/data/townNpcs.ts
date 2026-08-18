import type { GameSave } from "@/types/save";
import type { TownNpcDefinition, TownNpcId, TownNpcTrustRecord, TownNpcTrustState } from "@/types/townNpc";

const TRUST_LEVEL_THRESHOLDS = [0, 20, 50, 90, 140] as const;
const TRUST_TIER_LABELS = ["New Contact", "Familiar", "Trusted", "Favored", "Confidant"] as const;

export const TOWN_NPCS: Record<TownNpcId, TownNpcDefinition> = {
  tamsin_vale: {
    npcId: "tamsin_vale",
    name: "Tamsin Vale",
    title: "Adoption Steward",
    systemRole: "Vale's Adoption Hearth, adoption listings, welfare screening, new arrivals, special placements",
    portraitPath: "/images/npcs/town/tamsin_vale_portrait.png",
    profilePath: "/images/buildings/town/market_stall.png",
    intro: "Tamsin Vale runs Vale's Adoption Hearth, matching creatures with safe homes and responsible keepers.",
    trustUnlocks: { 1: "Basic adoption listings", 2: "5% cheaper adoption fees + personal Guild requests", 3: "10% cheaper arrival refreshes + priority personal requests", 4: "+0.5% special placement chance + Gold personal requests", 5: "10% cheaper adoption fees + Confidant request rewards" },
  },
  pella_mosswick: {
    npcId: "pella_mosswick",
    name: "Pella Mosswick",
    title: "Supply Depot Keeper",
    systemRole: "Supply Depot, feed, materials, tools, energy items, nursery supplies, daily bargains",
    portraitPath: "/images/ui/icons/icon_shop_bag.png",
    profilePath: "/images/backgrounds/market/market_road_interior.png",
    intro: "Pella Mosswick runs the Supply Depot, a crowded little shop stacked with feed sacks, repair kits, tools, gossip, and emergency bundles.",
    trustUnlocks: { 1: "Basic Supply Depot stock", 2: "5% cheaper Supply Depot prices + personal Guild requests", 3: "Priority personal requests with enhanced rewards", 4: "Gold personal Guild requests", 5: "12% cheaper Supply Depot prices + Confidant request rewards" },
  },
  petra_hale: {
    npcId: "petra_hale",
    name: "Petra Hale",
    title: "Master Builder",
    systemRole: "Builder's Yard, ranch expansion, construction hauling, repairs, fencing, permanent security projects",
    portraitPath: "/images/buildings/town/builders_yard.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Petra Hale runs the Builder's Yard and posts practical contracts whenever town construction needs reliable ranch help.",
    trustUnlocks: { 1: "Builder work orders", 2: "Petra personal construction requests", 3: "Priority construction requests with enhanced rewards", 4: "Gold construction requests", 5: "Confidant construction requests with bonus rewards" },
  },
  mara_vell: {
    npcId: "mara_vell",
    name: "Mara Vell",
    title: "Guild Quartermaster",
    systemRole: "Guild Points, request board upgrades, town service upgrades, service economy",
    portraitPath: "/images/npcs/guild/mara_vell_portrait.png",
    profilePath: "/images/npcs/guild/mara_vell_profile.png",
    intro: "Mara Vell keeps the guild ledger moving and turns completed work into town upgrades.",
    trustUnlocks: { 1: "Standard Guild work orders", 2: "Mara personal Guild requests", 3: "Priority Mara requests with enhanced rewards", 4: "Gold quartermaster requests", 5: "Confidant quartermaster requests with bonus rewards" },
  },
  veyra: {
    npcId: "veyra",
    name: "Veyra Bramble",
    title: "Ranch Steward",
    systemRole: "Chapter story, restoration, ranch welfare, early goals",
    portraitPath: "/images/ui/icons/icon_ranch_ledger.png",
    profilePath: "/images/backgrounds/ranch/ranch_office_interior.png",
    intro: "Veyra Bramble watches the ranch's recovery closely and cares more about humane outcomes than quick coin.",
    trustUnlocks: { 1: "Chapter guidance and ordinary restoration work", 2: "Veyra personal restoration requests", 3: "Priority restoration requests with enhanced rewards", 4: "Gold restoration requests", 5: "Confidant restoration requests with bonus rewards" },
  },
  selene_virell: {
    npcId: "selene_virell",
    name: "Dr. Selene Virell",
    title: "Egg Care & Lineage Specialist",
    systemRole: "Egg Atelier, lineage records, fertility requests, egg appraisal, incubation care, ability polish",
    portraitPath: "/images/npcs/town/selene_virell_portrait.png",
    profilePath: "/images/backgrounds/nursery/egg_nursery_interior.png",
    intro: "Dr. Selene Virell runs the Egg Atelier and maintains the town's most careful lineage and fertility records.",
    trustUnlocks: { 1: "Egg Atelier services", 2: "Selene personal lineage requests", 3: "Cheaper accelerated incubation + Selene's 3-part lineage study", 4: "Cheaper ability/stat polish + Gold lineage requests", 5: "Confidant lineage rewards; completed study activates permanent Lineage Consultation" },
  },
  rhea_flint: {
    npcId: "rhea_flint",
    name: "Rhea Flint",
    title: "Training Grounds Coach",
    systemRole: "Training Grounds, timed drills, stat coaching, disciplined service assignments",
    portraitPath: "/images/ui/icons/icon_breeder_level.png",
    profilePath: "/images/backgrounds/ranch/ranch_office_interior.png",
    intro: "Rhea Flint runs the Training Grounds and values creatures that can finish difficult work without cutting corners.",
    trustUnlocks: { 1: "Standard Training Grounds access", 2: "Rhea personal drill requests", 3: "Priority drill requests with enhanced rewards", 4: "Gold training requests", 5: "Confidant training requests with bonus rewards" },
  },
  daria_voss: {
    npcId: "daria_voss",
    name: "Daria Voss",
    title: "Battle Outfitter",
    systemRole: "Battle Outfitter, combat equipment, move training, security preparation, field kits",
    portraitPath: "/images/ui/icons/icon_battle_outfitter.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Daria Voss outfits serious teams for dangerous work and occasionally needs proven creatures for field tests and security contracts.",
    trustUnlocks: { 1: "Standard outfitter services", 2: "Daria personal field-test requests", 3: "Priority field tests with enhanced rewards", 4: "Gold outfitter requests", 5: "Confidant outfitter requests with bonus rewards" },
  },
  maribel_quince: {
    npcId: "maribel_quince",
    name: "Maribel Quince",
    title: "Town Registrar",
    systemRole: "Registry, taxes, permits, contract records, town reputation",
    portraitPath: "/images/ui/icons/icon_contract_scroll.png",
    profilePath: "/images/buildings/town/guild_board.png",
    intro: "Maribel Quince keeps the town legal, solvent, and buried under just enough paperwork to survive.",
    trustUnlocks: { 1: "Standard registry notices", 2: "Maribel personal registry requests", 3: "Priority registry requests with enhanced rewards", 4: "Gold registry requests", 5: "Confidant registry requests with bonus rewards" },
  },
  kaida_thorn: {
    npcId: "kaida_thorn",
    name: "Kaida Thorn",
    title: "Ranger Captain",
    systemRole: "Security, patrols, danger events, guard contracts, frontier threats",
    portraitPath: "/images/ui/icons/icon_bronze_contract.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Kaida Thorn keeps the roads watched and respects ranchers who send capable creatures to dangerous work.",
    trustUnlocks: { 1: "Standard security notices", 2: "Kaida personal patrol requests", 3: "Priority patrol requests with enhanced rewards", 4: "Gold ranger requests", 5: "Confidant ranger requests with bonus rewards" },
  },
};

export function getTrustLevel(points: number): number {
  let level = 1;
  TRUST_LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (points >= threshold) level = index + 1;
  });
  return Math.max(1, Math.min(5, level));
}

export function getTrustTierLabel(level: number): string {
  return TRUST_TIER_LABELS[Math.max(0, Math.min(TRUST_TIER_LABELS.length - 1, Math.floor(level) - 1))] ?? TRUST_TIER_LABELS[0];
}

export function getNextTrustThreshold(points: number): number | null {
  const next = TRUST_LEVEL_THRESHOLDS.find((threshold) => threshold > points);
  return typeof next === "number" ? next : null;
}

export function getNpcTrustRecord(save: GameSave, npcId: TownNpcId): TownNpcTrustRecord {
  const current = save.townNpcTrust?.[npcId];
  const points = Math.max(0, Number(current?.points ?? 0));
  return {
    npcId,
    points,
    level: getTrustLevel(points),
    introduced: Boolean(current?.introduced),
    lastChangedDayNumber: current?.lastChangedDayNumber,
  };
}

export function getTownNpcTrustState(save: GameSave): TownNpcTrustState {
  return (Object.keys(TOWN_NPCS) as TownNpcId[]).reduce<TownNpcTrustState>(
    (state, npcId) => ({ ...state, [npcId]: getNpcTrustRecord(save, npcId) }),
    {},
  );
}

export function grantNpcTrust(save: GameSave, npcId: TownNpcId, amount: number, introduced = true): GameSave {
  const current = getNpcTrustRecord(save, npcId);
  const points = Math.max(0, current.points + amount);
  const nextRecord: TownNpcTrustRecord = {
    npcId,
    points,
    level: getTrustLevel(points),
    introduced: current.introduced || introduced,
    lastChangedDayNumber: save.dayState.dayNumber,
  };
  return {
    ...save,
    townNpcTrust: { ...(save.townNpcTrust ?? {}), [npcId]: nextRecord },
    flags: {
      ...save.flags,
      [`trust_${npcId}`]: points,
      [`trustLevel_${npcId}`]: nextRecord.level,
      m36TownNpcTrust: true,
    },
  };
}

export function getNpcTrustSummary(save: GameSave, npcId: TownNpcId): string {
  const record = getNpcTrustRecord(save, npcId);
  const definition = TOWN_NPCS[npcId];
  const next = getNextTrustThreshold(record.points);
  const tier = getTrustTierLabel(record.level);
  return next
    ? `${definition.name} · ${tier} · ${record.points}/${next} Trust`
    : `${definition.name} · ${tier} · Max Trust`;
}

export function getNpcNextUnlock(save: GameSave, npcId: TownNpcId): string {
  const record = getNpcTrustRecord(save, npcId);
  const definition = TOWN_NPCS[npcId];
  const nextLevel = Math.min(5, record.level + 1);
  if (record.level >= 5) return definition.trustUnlocks[5] ?? "Max trust reached";
  return definition.trustUnlocks[nextLevel] ?? "More trust rewards later";
}

export function getTamsinAdoptionFeeMultiplier(save: GameSave): number {
  const level = getNpcTrustRecord(save, "tamsin_vale").level;
  if (level >= 5) return 0.9;
  if (level >= 2) return 0.95;
  return 1;
}

export function getTamsinArrivalRefreshMultiplier(save: GameSave): number {
  const level = getNpcTrustRecord(save, "tamsin_vale").level;
  if (level >= 5) return 0.82;
  if (level >= 3) return 0.9;
  return 1;
}

export function getTamsinSpecialPlacementBonus(save: GameSave): number {
  return getNpcTrustRecord(save, "tamsin_vale").level >= 4 ? 0.005 : 0;
}

export function getPellaSupplyPriceMultiplier(save: GameSave): number {
  const level = getNpcTrustRecord(save, "pella_mosswick").level;
  if (level >= 5) return 0.88;
  if (level >= 2) return 0.95;
  return 1;
}

export function getIntroducedTownNpcIds(save: GameSave): TownNpcId[] {
  const trust = getTownNpcTrustState(save);
  return (Object.keys(TOWN_NPCS) as TownNpcId[]).filter(
    (npcId) =>
      trust[npcId]?.introduced ||
      npcId === "tamsin_vale" ||
      npcId === "pella_mosswick" ||
      npcId === "petra_hale" ||
      npcId === "mara_vell" ||
      npcId === "veyra" ||
      npcId === "selene_virell" ||
      npcId === "rhea_flint" ||
      npcId === "daria_voss",
  );
}
