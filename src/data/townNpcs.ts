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
    trustUnlocks: { 1: "Basic adoption listings", 2: "5% cheaper adoption fees", 3: "10% cheaper arrival refreshes", 4: "+0.5% special placement chance", 5: "Rescue network requests later" },
  },
  pella_mosswick: {
    npcId: "pella_mosswick",
    name: "Pella Mosswick",
    title: "Supply Depot Keeper",
    systemRole: "Supply Depot, feed, materials, tools, energy items, nursery supplies, daily bargains",
    portraitPath: "/images/ui/icons/icon_shop_bag.png",
    profilePath: "/images/backgrounds/market/market_road_interior.png",
    intro: "Pella Mosswick runs the Supply Depot, a crowded little shop stacked with feed sacks, repair kits, tools, gossip, and emergency bundles.",
    trustUnlocks: { 1: "Basic Supply Depot stock", 2: "5% cheaper Supply Depot prices", 3: "Bulk bundles later", 4: "Rare supply shelf later", 5: "Custom orders later" },
  },
  petra_hale: {
    npcId: "petra_hale",
    name: "Petra Hale",
    title: "Master Builder",
    systemRole: "Builder's Yard, ranch expansion, construction hauling, repairs, fencing, permanent security projects",
    portraitPath: "/images/buildings/town/builders_yard.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Petra Hale runs the Builder's Yard and posts practical contracts whenever town construction needs reliable ranch help.",
    trustUnlocks: { 1: "Builder work orders", 2: "Priority repair requests later", 3: "Construction favors later", 4: "Special project contracts later", 5: "Masterwork projects later" },
  },
  mara_vell: {
    npcId: "mara_vell",
    name: "Mara Vell",
    title: "Guild Quartermaster",
    systemRole: "Guild Points, request board upgrades, town service upgrades, service economy",
    portraitPath: "/images/npcs/guild/mara_vell_portrait.png",
    profilePath: "/images/npcs/guild/mara_vell_profile.png",
    intro: "Mara Vell keeps the guild ledger moving and turns completed work into town upgrades.",
    trustUnlocks: { 1: "Guild grants", 2: "Service discount later", 3: "Better work orders later", 4: "Upgrade favors later", 5: "Quartermaster contracts later" },
  },
  veyra: {
    npcId: "veyra",
    name: "Veyra Bramble",
    title: "Ranch Steward",
    systemRole: "Chapter story, restoration, ranch welfare, early goals",
    portraitPath: "/images/ui/icons/icon_ranch_ledger.png",
    profilePath: "/images/backgrounds/ranch/ranch_office_interior.png",
    intro: "Veyra Bramble watches the ranch's recovery closely and cares more about humane outcomes than quick coin.",
    trustUnlocks: { 1: "Chapter guidance", 2: "Restoration notes", 3: "Welfare bonuses later", 4: "Story route later", 5: "Restoration capstone later" },
  },
  selene_virell: {
    npcId: "selene_virell",
    name: "Dr. Selene Virell",
    title: "Egg Care & Lineage Specialist",
    systemRole: "Egg Atelier, lineage records, fertility requests, egg appraisal, incubation care, ability polish",
    portraitPath: "/images/npcs/town/selene_virell_portrait.png",
    profilePath: "/images/backgrounds/nursery/egg_nursery_interior.png",
    intro: "Dr. Selene Virell runs the Egg Atelier and maintains the town's most careful lineage and fertility records.",
    trustUnlocks: { 1: "Egg Atelier services", 2: "Slightly cheaper acceleration later", 3: "Cheaper accelerated incubation", 4: "Cheaper ability polish", 5: "Higher polish efficiency later" },
  },
  rhea_flint: {
    npcId: "rhea_flint",
    name: "Rhea Flint",
    title: "Training Grounds Coach",
    systemRole: "Training Grounds, timed drills, stat coaching, disciplined service assignments",
    portraitPath: "/images/ui/icons/icon_breeder_level.png",
    profilePath: "/images/backgrounds/ranch/ranch_office_interior.png",
    intro: "Rhea Flint runs the Training Grounds and values creatures that can finish difficult work without cutting corners.",
    trustUnlocks: { 1: "Training requests", 2: "Coach notes later", 3: "Advanced drill contracts later", 4: "Special coaching favors later", 5: "Elite training contracts later" },
  },
  daria_voss: {
    npcId: "daria_voss",
    name: "Daria Voss",
    title: "Battle Outfitter",
    systemRole: "Battle Outfitter, combat equipment, move training, security preparation, field kits",
    portraitPath: "/images/ui/icons/icon_battle_outfitter.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Daria Voss outfits serious teams for dangerous work and occasionally needs proven creatures for field tests and security contracts.",
    trustUnlocks: { 1: "Outfitter requests", 2: "Field-test favors later", 3: "Special equipment requests later", 4: "Rare preparation contracts later", 5: "Master outfitter contracts later" },
  },
  maribel_quince: {
    npcId: "maribel_quince",
    name: "Maribel Quince",
    title: "Town Registrar",
    systemRole: "Registry, taxes, permits, contract records, town reputation",
    portraitPath: "/images/ui/icons/icon_contract_scroll.png",
    profilePath: "/images/buildings/town/guild_board.png",
    intro: "Maribel Quince keeps the town legal, solvent, and buried under just enough paperwork to survive.",
    trustUnlocks: { 1: "Registry records later", 2: "Tax notices later", 3: "Contract history later", 4: "Permit favors later", 5: "Legal protection later" },
  },
  kaida_thorn: {
    npcId: "kaida_thorn",
    name: "Kaida Thorn",
    title: "Ranger Captain",
    systemRole: "Security, patrols, danger events, guard contracts, frontier threats",
    portraitPath: "/images/ui/icons/icon_bronze_contract.png",
    profilePath: "/images/backgrounds/town/town_square.png",
    intro: "Kaida Thorn keeps the roads watched and respects ranchers who send capable creatures to dangerous work.",
    trustUnlocks: { 1: "Security notices later", 2: "Patrol support later", 3: "Danger reduction later", 4: "Ranger missions later", 5: "Frontier protection later" },
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
