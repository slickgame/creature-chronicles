import { getSpeciesDefinition, getVariantDefinition, getVariantsForFamily } from "@/data/creatures";
import type { CreatureRecord, HabitatRecord } from "@/types/creature";
import type { CreatureId, HabitatId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { MarketActionResult, MarketListing, MarketState } from "@/types/market";

const LISTING_COUNT = 4;
const BASE_REROLL_COST = 150;

const RARITY_PRICE = {
  Common: 700,
  Uncommon: 1100,
  Rare: 1800,
  Epic: 3200,
} as const;

function makeListingId(weekNumber: number, rerollCount: number, slotIndex: number): string {
  return `market_${weekNumber}_${rerollCount}_${slotIndex}`;
}

function seededNumber(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function chooseWeightedVariant(seed: number): VariantId {
  const roll = seededNumber(seed);

  if (roll < 0.44) return "variant_base_feline" as VariantId;
  if (roll < 0.88) return "variant_base_canine" as VariantId;
  if (roll < 0.91) return "variant_sphinx" as VariantId;
  if (roll < 0.94) return "variant_tiger" as VariantId;
  if (roll < 0.97) return "variant_hellhound" as VariantId;
  return "variant_direwolf" as VariantId;
}

function createListing(save: GameSave, slotIndex: number, rerollCount: number): MarketListing {
  const variantId = chooseWeightedVariant(save.dayState.weekNumber * 37 + rerollCount * 17 + slotIndex * 11);
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const rarityPrice = RARITY_PRICE[variant.rarity];
  const weekMod = Math.floor(seededNumber(save.dayState.weekNumber * 19 + slotIndex) * 140);
  const price = Math.round((rarityPrice + weekMod + rerollCount * 25) / 10) * 10;

  return {
    listingId: makeListingId(save.dayState.weekNumber, rerollCount, slotIndex),
    weekNumber: save.dayState.weekNumber,
    slotIndex,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    family: variant.family,
    displayName: variant.name,
    rarity: variant.rarity,
    price,
    status: "available",
    createdAt: new Date().toISOString(),
  };
}

function createListings(save: GameSave, rerollCount = 0): MarketListing[] {
  return Array.from({ length: LISTING_COUNT }, (_, index) => createListing(save, index, rerollCount));
}

export function createDefaultMarketState(save: GameSave): MarketState {
  return {
    weekNumber: save.dayState.weekNumber,
    rerollCount: 0,
    lastRestockedDayNumber: save.dayState.dayNumber,
    lastRestockedAt: new Date().toISOString(),
    listings: createListings(save, 0),
  };
}

export function ensureCurrentMarketState(save: GameSave): GameSave {
  if (save.market && save.market.weekNumber === save.dayState.weekNumber && save.market.listings.length > 0) {
    return save;
  }

  return {
    ...save,
    market: createDefaultMarketState(save),
  };
}

export function getMarketRerollCost(save: GameSave): number {
  const market = ensureCurrentMarketState(save).market ?? createDefaultMarketState(save);
  return BASE_REROLL_COST + market.rerollCount * 75;
}

function getHabitatForFamily(save: GameSave, family: "feline" | "canine"): HabitatRecord | null {
  return (save.habitats ?? []).find((habitat) => habitat.family === family) ?? null;
}

function createCreatureFromListing(save: GameSave, listing: MarketListing): CreatureRecord {
  const variant = getVariantDefinition(listing.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const habitat = getHabitatForFamily(save, variant.family);
  const now = new Date().toISOString();
  const creatureId = `creature_market_${Date.now()}_${listing.slotIndex}` as CreatureId;

  return {
    creatureId,
    ownerSaveId: save.saveId,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId: (habitat?.habitatId ?? `habitat_${variant.family}`) as HabitatId,
    nickname: variant.name,
    level: 1,
    xp: 0,
    stats: {
      STR: Math.max(1, species.baseStats.STR + (variant.statAdjustments.STR ?? 0)),
      DEX: Math.max(1, species.baseStats.DEX + (variant.statAdjustments.DEX ?? 0)),
      STA: Math.max(1, species.baseStats.STA + (variant.statAdjustments.STA ?? 0)),
      CHA: Math.max(1, species.baseStats.CHA + (variant.statAdjustments.CHA ?? 0)),
      WIL: Math.max(1, species.baseStats.WIL + (variant.statAdjustments.WIL ?? 0)),
      FER: Math.max(1, species.baseStats.FER + (variant.statAdjustments.FER ?? 0)),
    },
    abilities: [species.exclusiveAbilityPool[0], variant.exclusiveAbilityPool[0]].filter(Boolean),
    energy: 100,
    maxEnergy: 100,
    hearts: 4,
    maxHearts: 4,
    affection: 35,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    createdAt: now,
    notes: `Purchased from the town market during week ${save.dayState.weekNumber}.`,
  };
}

export function buyMarketListing(save: GameSave, listingId: string): MarketActionResult {
  const syncedSave = ensureCurrentMarketState(save);
  const market = syncedSave.market ?? createDefaultMarketState(syncedSave);
  const listing = market.listings.find((item) => item.listingId === listingId);

  if (!listing) {
    return { save: syncedSave, ok: false, message: "That market listing no longer exists." };
  }

  if (listing.status === "sold") {
    return { save: syncedSave, ok: false, message: "That listing has already been sold." };
  }

  if (syncedSave.currencies.gold < listing.price) {
    return { save: syncedSave, ok: false, message: "Not enough Gold for this creature." };
  }

  const habitat = getHabitatForFamily(syncedSave, listing.family);

  if (!habitat) {
    return { save: syncedSave, ok: false, message: "No matching habitat is available for this creature." };
  }

  if (habitat.creatureIds.length >= habitat.capacity) {
    return { save: syncedSave, ok: false, message: `${habitat.name} is full.` };
  }

  const creature = createCreatureFromListing(syncedSave, listing);
  const nextListings = market.listings.map((item) =>
    item.listingId === listingId ? { ...item, status: "sold" as const } : item,
  );

  const nextSave: GameSave = {
    ...syncedSave,
    updatedAt: new Date().toISOString(),
    currencies: {
      ...syncedSave.currencies,
      gold: syncedSave.currencies.gold - listing.price,
    },
    creatureIds: [...syncedSave.creatureIds, creature.creatureId],
    creatures: [...(syncedSave.creatures ?? []), creature],
    habitats: (syncedSave.habitats ?? []).map((item) =>
      item.habitatId === habitat.habitatId
        ? { ...item, creatureIds: [...item.creatureIds, creature.creatureId] }
        : item,
    ),
    market: {
      ...market,
      listings: nextListings,
    },
    flags: {
      ...syncedSave.flags,
      m6MarketPurchaseMade: true,
    },
  };

  return { save: nextSave, ok: true, message: `${creature.nickname} joined ${habitat.name}.` };
}

export function rerollMarketListings(save: GameSave): MarketActionResult {
  const syncedSave = ensureCurrentMarketState(save);
  const market = syncedSave.market ?? createDefaultMarketState(syncedSave);
  const cost = getMarketRerollCost(syncedSave);

  if (syncedSave.currencies.gold < cost) {
    return { save: syncedSave, ok: false, message: "Not enough Gold to reroll the market." };
  }

  const nextRerollCount = market.rerollCount + 1;

  return {
    save: {
      ...syncedSave,
      updatedAt: new Date().toISOString(),
      currencies: {
        ...syncedSave.currencies,
        gold: syncedSave.currencies.gold - cost,
      },
      market: {
        ...market,
        rerollCount: nextRerollCount,
        listings: createListings(syncedSave, nextRerollCount),
      },
      flags: {
        ...syncedSave.flags,
        m6MarketRerolled: true,
      },
    },
    ok: true,
    message: `Market listings rerolled for ${cost} Gold.`,
  };
}

export function getMarketListingImage(listing: MarketListing): string {
  return getVariantDefinition(listing.variantId).portraitPath;
}

export function getMarketListingDescription(listing: MarketListing): string {
  return getVariantDefinition(listing.variantId).description;
}

export function getMarketVariantsForPreview() {
  return [...getVariantsForFamily("feline"), ...getVariantsForFamily("canine")];
}
