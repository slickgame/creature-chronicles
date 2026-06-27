import { rollMarketListingAbilities } from "@/data/abilityBalance";
import { buildStats, getAllCreatureVariants, getBaseMaxHearts, getCreatureMaxEnergyFromStats, getSpeciesDefinition, getVariantDefinition, getVariantsForFamily, rollStatGrades, shiftStatGrade, STAT_KEYS } from "@/data/creatures";
import { getTownUpgradeEffects } from "@/data/upgrades";
import type { CreatureAbility, CreatureFamily, CreatureRecord, CreatureStats, HabitatRecord, StatGrade, StatGrades } from "@/types/creature";
import type { CreatureId, HabitatId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { MarketActionResult, MarketListing, MarketState } from "@/types/market";

const BASE_REROLL_COST = 150;
const RARITY_PRICE = { Common: 700, Uncommon: 1100, Rare: 1800, Epic: 3200 } as const;
const MARKET_BASE_VARIANTS: VariantId[] = ["variant_base_feline", "variant_base_canine", "variant_cow", "variant_bunny", "variant_horse"] as VariantId[];
const MARKET_SPECIAL_VARIANTS: VariantId[] = ["variant_sphinx", "variant_tiger", "variant_hellhound", "variant_direwolf", "variant_minotaur", "variant_moon_yak", "variant_antlerhare", "variant_dream_lop", "variant_unicorn", "variant_nightmare"] as VariantId[];

export type MarketListingPreview = { stats: CreatureStats; statGrades: StatGrades; abilities: CreatureAbility[]; maxEnergy: number; maxHearts: number };
function getCreatureXpToNext(level: number): number { return 45 + level * 30; }
function makeListingId(weekNumber: number, rerollCount: number, slotIndex: number): string { return `market_${weekNumber}_${rerollCount}_${slotIndex}`; }
function seededNumber(seed: number): number { const value = Math.sin(seed) * 10000; return value - Math.floor(value); }
function getListingSeed(save: GameSave, listing: MarketListing): string { return `${save.saveId}_${listing.listingId}_market`; }

function chooseMarketVariant(save: GameSave, slotIndex: number, rerollCount: number): VariantId {
  const effects = getTownUpgradeEffects(save);
  const seed = save.dayState.weekNumber * 37 + rerollCount * 17 + slotIndex * 11;
  const roll = seededNumber(seed);
  if (effects.marketVariantChance > 0 && roll < effects.marketVariantChance) { const specialIndex = Math.floor(seededNumber(seed * 5 + 97) * MARKET_SPECIAL_VARIANTS.length); return MARKET_SPECIAL_VARIANTS[specialIndex] ?? "variant_unicorn" as VariantId; }
  const baseIndex = Math.floor(seededNumber(seed * 3 + 19) * MARKET_BASE_VARIANTS.length);
  return MARKET_BASE_VARIANTS[baseIndex] ?? "variant_base_feline" as VariantId;
}

function improveStatGradesForMarket(statGrades: StatGrades, save: GameSave, listingId: string): StatGrades {
  const qualityTier = getTownUpgradeEffects(save).marketQualityTier;
  if (qualityTier <= 0) return statGrades;
  return STAT_KEYS.reduce((grades, key, index) => { const roll = seededNumber(save.dayState.weekNumber * 211 + listingId.length * 17 + index * 43); const upgradeChance = [0, 0.08, 0.13, 0.19, 0.26][qualityTier] ?? 0; const downgradeProtection = [0, 0.15, 0.25, 0.35, 0.5][qualityTier] ?? 0; const currentGrade = grades[key]; let nextGrade: StatGrade = currentGrade; if (roll < upgradeChance) nextGrade = shiftStatGrade(currentGrade, 1); if (currentGrade === "D" && roll < downgradeProtection) nextGrade = "C"; return { ...grades, [key]: nextGrade }; }, statGrades);
}

function improveAbilitiesForMarket(abilities: CreatureAbility[], save: GameSave, listing: MarketListing): CreatureAbility[] {
  const qualityTier = getTownUpgradeEffects(save).marketQualityTier;
  if (qualityTier <= 0) return abilities;
  const gradeBoostChance = [0, 0.04, 0.08, 0.13, 0.18][qualityTier] ?? 0;
  return abilities.map((ability, index) => { const roll = seededNumber(save.dayState.weekNumber * 307 + listing.slotIndex * 41 + index * 13); if (roll >= gradeBoostChance) return ability; if (ability.grade === "D") return { ...ability, grade: "C" as const, description: `${ability.description} Market screening improved this ability's reliability.` }; if (ability.grade === "C") return { ...ability, grade: "B" as const, description: `${ability.description} Market screening improved this ability's reliability.` }; if (ability.grade === "B") return { ...ability, grade: "A" as const, description: `${ability.description} Market screening improved this ability's reliability.` }; return ability; });
}

function createListing(save: GameSave, slotIndex: number, rerollCount: number): MarketListing { const variantId = chooseMarketVariant(save, slotIndex, rerollCount); const variant = getVariantDefinition(variantId); const species = getSpeciesDefinition(variant.speciesId); const rarityPrice = RARITY_PRICE[variant.rarity]; const weekMod = Math.floor(seededNumber(save.dayState.weekNumber * 19 + slotIndex + rerollCount * 23) * 140); const price = Math.round((rarityPrice + weekMod + rerollCount * 25) / 10) * 10; return { listingId: makeListingId(save.dayState.weekNumber, rerollCount, slotIndex), weekNumber: save.dayState.weekNumber, slotIndex, speciesId: species.speciesId, variantId: variant.variantId, family: variant.family, displayName: variant.name, rarity: variant.rarity, price, status: "available", createdAt: new Date().toISOString() }; }
function createListings(save: GameSave, rerollCount = 0): MarketListing[] { const count = getTownUpgradeEffects(save).marketListingCount; return Array.from({ length: count }, (_, index) => createListing(save, index, rerollCount)); }
export function createDefaultMarketState(save: GameSave): MarketState { return { weekNumber: save.dayState.weekNumber, rerollCount: 0, lastRestockedDayNumber: save.dayState.dayNumber, lastRestockedAt: new Date().toISOString(), listings: createListings(save, 0) }; }
export function createDevMarketState(save: GameSave): MarketState { const rerollCount = (save.market?.rerollCount ?? 0) + 1; return { weekNumber: save.dayState.weekNumber, rerollCount, lastRestockedDayNumber: save.dayState.dayNumber, lastRestockedAt: new Date().toISOString(), listings: createListings(save, rerollCount) }; }
export function ensureCurrentMarketState(save: GameSave): GameSave { const expectedCount = getTownUpgradeEffects(save).marketListingCount; if (save.market && save.market.weekNumber === save.dayState.weekNumber && save.market.listings.length === expectedCount) return save; return { ...save, market: createDefaultMarketState(save) }; }
export function getMarketRerollCost(save: GameSave): number { const market = ensureCurrentMarketState(save).market ?? createDefaultMarketState(save); const baseCost = BASE_REROLL_COST + market.rerollCount * 75; const discount = getTownUpgradeEffects(save).marketRerollDiscount; return Math.max(25, Math.round((baseCost * (1 - discount)) / 10) * 10); }
function getHabitatForFamily(save: GameSave, family: CreatureFamily): HabitatRecord | null { return (save.habitats ?? []).find((habitat) => habitat.family === family) ?? null; }

export function getMarketListingPreview(save: GameSave, listing: MarketListing): MarketListingPreview {
  const variant = getVariantDefinition(listing.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const seed = getListingSeed(save, listing);
  const statGrades = improveStatGradesForMarket(rollStatGrades(seed, variant.rarity), save, listing.listingId);
  const stats = buildStats(species.baseStats, variant.statAdjustments, statGrades);
  const maxEnergy = getCreatureMaxEnergyFromStats(stats, variant.variantId);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);
  const abilities = improveAbilitiesForMarket(rollMarketListingAbilities(save, listing, seed, species.speciesId, variant.variantId), save, listing);
  return { stats, statGrades, abilities, maxEnergy, maxHearts };
}

function createCreatureFromListing(save: GameSave, listing: MarketListing): CreatureRecord { const variant = getVariantDefinition(listing.variantId); const species = getSpeciesDefinition(variant.speciesId); const habitat = getHabitatForFamily(save, variant.family); const now = new Date().toISOString(); const creatureId = `creature_market_${Date.now()}_${listing.slotIndex}` as CreatureId; const level = 1; const preview = getMarketListingPreview(save, listing); return { creatureId, ownerSaveId: save.saveId, speciesId: species.speciesId, variantId: variant.variantId, habitatId: (habitat?.habitatId ?? `habitat_${variant.family}`) as HabitatId, nickname: variant.name, level, xp: 0, xpToNext: getCreatureXpToNext(level), stats: preview.stats, statGrades: preview.statGrades, abilities: preview.abilities, energy: preview.maxEnergy, maxEnergy: preview.maxEnergy, hearts: preview.maxHearts, maxHearts: preview.maxHearts, affection: 35, generation: 1, shiny: false, cosmeticVariant: null, origin: "market", originLabel: `Market Purchase · Week ${save.dayState.weekNumber}`, isLocked: false, createdAt: now, notes: `Purchased from the town market during week ${save.dayState.weekNumber}.` }; }

export function buyMarketListing(save: GameSave, listingId: string): MarketActionResult { const syncedSave = ensureCurrentMarketState(save); const market = syncedSave.market ?? createDefaultMarketState(syncedSave); const listing = market.listings.find((item) => item.listingId === listingId); if (!listing) return { save: syncedSave, ok: false, message: "That market listing no longer exists." }; if (listing.status === "sold") return { save: syncedSave, ok: false, message: "That listing has already been sold." }; if (syncedSave.currencies.gold < listing.price) return { save: syncedSave, ok: false, message: "Not enough Gold for this creature." }; const habitat = getHabitatForFamily(syncedSave, listing.family); if (!habitat) return { save: syncedSave, ok: false, message: "No matching habitat is available for this creature." }; if (habitat.creatureIds.length >= habitat.capacity) return { save: syncedSave, ok: false, message: `${habitat.name} is full.` }; const creature = createCreatureFromListing(syncedSave, listing); const nextListings = market.listings.map((item) => item.listingId === listingId ? { ...item, status: "sold" as const } : item); const nextSave: GameSave = { ...syncedSave, updatedAt: new Date().toISOString(), currencies: { ...syncedSave.currencies, gold: syncedSave.currencies.gold - listing.price }, creatureIds: [...syncedSave.creatureIds, creature.creatureId], creatures: [...(syncedSave.creatures ?? []), creature], habitats: (syncedSave.habitats ?? []).map((item) => item.habitatId === habitat.habitatId ? { ...item, creatureIds: [...item.creatureIds, creature.creatureId] } : item), market: { ...market, listings: nextListings }, flags: { ...syncedSave.flags, m6MarketPurchaseMade: true, m85MarketStatGrades: true, m9MarketOriginCreated: true, m13MarketContentPack: true, m18ScarceMarketAbilities: true } }; return { save: nextSave, ok: true, message: `${creature.nickname} joined ${habitat.name}.` }; }

export function rerollMarketListings(save: GameSave): MarketActionResult { const syncedSave = ensureCurrentMarketState(save); const market = syncedSave.market ?? createDefaultMarketState(syncedSave); const cost = getMarketRerollCost(syncedSave); if (syncedSave.currencies.gold < cost) return { save: syncedSave, ok: false, message: "Not enough Gold to reroll the market." }; const nextRerollCount = market.rerollCount + 1; return { save: { ...syncedSave, updatedAt: new Date().toISOString(), currencies: { ...syncedSave.currencies, gold: syncedSave.currencies.gold - cost }, market: { ...market, rerollCount: nextRerollCount, listings: createListings(syncedSave, nextRerollCount) }, flags: { ...syncedSave.flags, m6MarketRerolled: true } }, ok: true, message: `Market listings rerolled for ${cost} Gold.` }; }
export function getMarketListingImage(listing: MarketListing): string { return getVariantDefinition(listing.variantId).portraitPath; }
export function getMarketListingProfileImage(listing: MarketListing): string { return getVariantDefinition(listing.variantId).profilePath; }
export function getMarketListingDescription(listing: MarketListing): string { return getVariantDefinition(listing.variantId).description; }
export function getMarketVariantsForPreview() { return getAllCreatureVariants(); }
