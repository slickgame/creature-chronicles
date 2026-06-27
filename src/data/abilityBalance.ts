import { GENERAL_ABILITY_POOL, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { getTownUpgradeEffects } from "@/data/upgrades";
import type { CreatureAbility, CreatureRecord } from "@/types/creature";
import type { MarketListing } from "@/types/market";
import type { GameSave } from "@/types/save";
import type { SpeciesId, VariantId } from "@/types/ids";

const BASIC_D_ABILITIES: CreatureAbility[] = [
  { id: "plain_vigor", name: "Plain Vigor", grade: "D", source: "general", description: "A minor knack for daily ranch life. Gives only a small growth identity compared to higher grade abilities." },
  { id: "soft_focus", name: "Soft Focus", grade: "D", source: "general", description: "A weak but useful focus trait. Slightly favors one stable growth path over time." },
  { id: "gentle_start", name: "Gentle Start", grade: "D", source: "general", description: "A modest early-life trait. Useful, but intentionally weaker than C grade and above." },
  { id: "steady_habits", name: "Steady Habits", grade: "D", source: "general", description: "A small reliability trait that marks the creature as slightly easier to develop." },
  { id: "faint_spark", name: "Faint Spark", grade: "D", source: "general", description: "A barely awakened talent. It can become valuable if bred into stronger lines later." },
];

const GRADE_ORDER: CreatureAbility["grade"][] = ["D", "C", "B", "A", "S"];
const STARTER_ABILITY_CHANCE = 6;
const MARKET_ABILITY_CHANCE_BY_TIER = [7, 12, 20, 32, 46];
const MARKET_SECOND_ABILITY_CHANCE_BY_TIER = [0, 0, 4, 9, 16];
const GRADE_WEIGHTS_BY_TIER: Array<Record<CreatureAbility["grade"], number>> = [
  { F: 0, D: 78, C: 19, B: 3, A: 0, S: 0 },
  { F: 0, D: 66, C: 27, B: 7, A: 0, S: 0 },
  { F: 0, D: 52, C: 34, B: 12, A: 2, S: 0 },
  { F: 0, D: 38, C: 39, B: 18, A: 4, S: 1 },
  { F: 0, D: 25, C: 41, B: 25, A: 7, S: 2 },
];

function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003; return Math.abs(hash) % modulo; }
function uniqueAbilities(abilities: CreatureAbility[]): CreatureAbility[] { return abilities.filter((ability, index, pool) => pool.findIndex((item) => item.id === ability.id) === index); }
function getAbilityPool(speciesId: SpeciesId, variantId: VariantId, includeAdvanced: boolean): CreatureAbility[] { const species = getSpeciesDefinition(speciesId); const variant = getVariantDefinition(variantId); return uniqueAbilities(includeAdvanced ? [...BASIC_D_ABILITIES, ...GENERAL_ABILITY_POOL, ...species.exclusiveAbilityPool, ...variant.exclusiveAbilityPool] : [...BASIC_D_ABILITIES, ...GENERAL_ABILITY_POOL.filter((ability) => ability.grade === "C")]); }
function pickGrade(seed: string, tier: number): CreatureAbility["grade"] { const weights = GRADE_WEIGHTS_BY_TIER[Math.max(0, Math.min(4, tier))] ?? GRADE_WEIGHTS_BY_TIER[0]; const roll = deterministicRoll(seed, 100); let cursor = 0; for (const grade of GRADE_ORDER) { cursor += weights[grade] ?? 0; if (roll < cursor) return grade; } return "D"; }
function fallbackGrade(targetGrade: CreatureAbility["grade"], pool: CreatureAbility[]): CreatureAbility["grade"] { const targetIndex = GRADE_ORDER.indexOf(targetGrade); for (let index = targetIndex; index >= 0; index -= 1) if (pool.some((ability) => ability.grade === GRADE_ORDER[index])) return GRADE_ORDER[index]; for (let index = targetIndex + 1; index < GRADE_ORDER.length; index += 1) if (pool.some((ability) => ability.grade === GRADE_ORDER[index])) return GRADE_ORDER[index]; return "D"; }
function pickAbility(seed: string, pool: CreatureAbility[], tier: number, existing: CreatureAbility[] = []): CreatureAbility | null { const available = pool.filter((ability) => !existing.some((item) => item.id === ability.id)); if (!available.length) return null; const targetGrade = pickGrade(`${seed}_grade`, tier); const grade = fallbackGrade(targetGrade, available); const gradePool = available.filter((ability) => ability.grade === grade); return gradePool[deterministicRoll(`${seed}_pick`, gradePool.length)] ?? available[0] ?? null; }

export function rollScarceStarterAbilities(seed: string, speciesId: SpeciesId, variantId: VariantId): CreatureAbility[] { if (deterministicRoll(`${seed}_starter_ability`, 100) >= STARTER_ABILITY_CHANCE) return []; const ability = pickAbility(`${seed}_starter`, getAbilityPool(speciesId, variantId, false), 0); return ability ? [ability] : []; }

export function rollMarketAbilitiesForTier(seed: string, speciesId: SpeciesId, variantId: VariantId, marketQualityTier: number): CreatureAbility[] { const variant = getVariantDefinition(variantId); const tier = Math.max(0, Math.min(4, marketQualityTier)); const rarityBonus = variant.rarity === "Rare" ? 3 : variant.rarity === "Epic" ? 6 : variant.rarity === "Uncommon" ? 1 : 0; const chance = (MARKET_ABILITY_CHANCE_BY_TIER[tier] ?? MARKET_ABILITY_CHANCE_BY_TIER[0]) + rarityBonus; if (deterministicRoll(`${seed}_market_ability`, 100) >= chance) return []; const pool = getAbilityPool(speciesId, variantId, tier >= 2); const first = pickAbility(`${seed}_market_first`, pool, tier); const abilities = first ? [first] : []; const secondChance = MARKET_SECOND_ABILITY_CHANCE_BY_TIER[tier] ?? 0; if (abilities.length && deterministicRoll(`${seed}_market_second`, 100) < secondChance) { const second = pickAbility(`${seed}_market_second_pick`, pool, tier, abilities); if (second) abilities.push(second); } return abilities; }

export function rollMarketListingAbilities(save: GameSave, listing: MarketListing, seed: string, speciesId: SpeciesId, variantId: VariantId): CreatureAbility[] { return rollMarketAbilitiesForTier(seed, speciesId, variantId, getTownUpgradeEffects(save).marketQualityTier); }

export function rebalanceExistingCreatureAbilities(creature: CreatureRecord, seed: string, speciesId: SpeciesId, variantId: VariantId): CreatureAbility[] { if (creature.origin === "starter" || creature.creatureId.includes("starter")) return rollScarceStarterAbilities(seed, speciesId, variantId); if (creature.origin === "market" || creature.creatureId.includes("market")) return rollMarketAbilitiesForTier(seed, speciesId, variantId, 0); return creature.abilities ?? []; }
