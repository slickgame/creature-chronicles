import type {
  CreatureAbility,
  CreatureRecord,
  CreatureStatKey,
  CreatureStats,
  HabitatRecord,
  SpeciesDefinition,
  StatGrade,
  StatGrades,
  StatGrowthProfile,
  VariantDefinition,
} from "@/types/creature";
import type { CreatureId, HabitatId, SaveId, SpeciesId, VariantId } from "@/types/ids";

export const CREATURE_PLACEHOLDER_IMAGE = "/images/ui/icons/icon_paw_crest.png";

export const STAT_KEYS: CreatureStatKey[] = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];

export const DEFAULT_STAT_GRADES: StatGrades = {
  STR: "D",
  DEX: "D",
  STA: "D",
  CHA: "D",
  WIL: "D",
  FER: "D",
};

export const STAT_GRADE_MULTIPLIERS: Record<StatGrade, number> = {
  D: 0.85,
  C: 1,
  B: 1.15,
  A: 1.3,
  S: 1.5,
};

const STAT_GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];
const FELINE_SPECIES_ID = "species_feline" as SpeciesId;
const CANINE_SPECIES_ID = "species_canine" as SpeciesId;
const FELINE_HABITAT_ID = "habitat_feline" as HabitatId;
const CANINE_HABITAT_ID = "habitat_canine" as HabitatId;

function getCreatureXpToNext(level: number): number {
  return 45 + level * 30;
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return Math.abs(hash) % modulo;
}

function ability(id: string, name: string, grade: CreatureAbility["grade"], source: CreatureAbility["source"], description: string): CreatureAbility {
  return { id, name, grade, source, description };
}

export const GENERAL_ABILITY_POOL: CreatureAbility[] = [
  ability("quick_learner", "Quick Learner", "C", "general", "Gains +10% creature XP from breeding attempts."),
  ability("hardy_body", "Hardy Body", "C", "general", "Reduces breeding energy cost by 2 and slightly favors Stamina growth on level-up."),
  ability("warm_temper", "Warm Temper", "C", "general", "Gains +1 extra affection after breeding attempts."),
  ability("lucky_spark", "Lucky Spark", "B", "general", "Adds +2% pregnancy chance and improves the chance of positive inheritance rolls."),
  ability("focused_growth", "Focused Growth", "B", "general", "Gains +3 creature XP and slightly favors Willpower growth on level-up."),
  ability("efficient_worker", "Efficient Worker", "B", "general", "Reduces breeding energy cost by 3."),
];

export const SPECIES_DEFINITIONS: SpeciesDefinition[] = [
  {
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    name: "Feline",
    description: "Agile, affectionate, and naturally curious ranch companions. Felines favor Dexterity, Charm, and careful bonding.",
    baseStats: { STR: 4, DEX: 8, STA: 5, CHA: 7, WIL: 5, FER: 6 },
    baseMaxHearts: 4,
    growthProfile: { STR: 7, DEX: 24, STA: 10, CHA: 22, WIL: 14, FER: 16 },
    exclusiveAbilityPool: [
      ability("feline_grace", "Feline Grace", "B", "species", "Breeding attempts involving this creature gain +3% pregnancy chance, +4 creature XP, and +1 affection for this creature."),
      ability("soft_step", "Soft Step", "C", "species", "Reduces breeding energy cost by 2 and slightly favors Dexterity growth on level-up."),
      ability("curious_heart", "Curious Heart", "C", "species", "Gains +2 creature XP from breeding and slightly improves Charm growth."),
      ability("moonlit_patience", "Moonlit Patience", "B", "species", "Adds +2% pregnancy chance and slightly favors Fertility growth on level-up."),
    ],
  },
  {
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    name: "Canine",
    description: "Loyal, sturdy, and task-focused ranch companions. Canines favor Stamina, Willpower, and dependable work.",
    baseStats: { STR: 7, DEX: 5, STA: 8, CHA: 5, WIL: 7, FER: 5 },
    baseMaxHearts: 5,
    growthProfile: { STR: 18, DEX: 10, STA: 25, CHA: 8, WIL: 22, FER: 12 },
    exclusiveAbilityPool: [
      ability("pack_loyalty", "Pack Loyalty", "B", "species", "Breeding attempts involving this creature gain +2% pregnancy chance. If the player participates, the player gains bonus Breeder XP."),
      ability("guard_instinct", "Guard Instinct", "C", "species", "Adds bonus Breeder XP when the player participates and slightly favors Willpower growth."),
      ability("steady_nerves", "Steady Nerves", "C", "species", "Reduces breeding energy cost by 2 and slightly favors Stamina growth."),
      ability("loyal_spark", "Loyal Spark", "B", "species", "Adds +2% pregnancy chance and +2 creature XP from breeding attempts."),
    ],
  },
];

export const VARIANT_DEFINITIONS: VariantDefinition[] = [
  {
    variantId: "variant_base_feline" as VariantId,
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    name: "Base Feline",
    rarity: "Common",
    description: "A balanced starter feline with reliable bonding, strong agility, and flexible ranch utility.",
    statAdjustments: {},
    maxEnergyBonus: 0,
    maxHeartsBonus: 0,
    growthProfile: { DEX: 3, CHA: 2, FER: 1 },
    exclusiveAbilityPool: [
      ability("steady_purr", "Steady Purr", "C", "variant", "Adds +2% pregnancy chance and +2 affection after breeding attempts."),
      ability("bright_eyes", "Bright Eyes", "C", "variant", "Gains +2 creature XP and slightly favors Dexterity growth."),
    ],
    portraitPath: "/images/creatures/feline/base_feline_portrait.png",
    profilePath: "/images/creatures/feline/base_feline_profile.png",
  },
  {
    variantId: "variant_sphinx" as VariantId,
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    name: "Sphinx",
    rarity: "Rare",
    description: "A refined feline variant with mystic presence, high charm, and strong social utility potential.",
    statAdjustments: { CHA: 2, WIL: 1, DEX: 1 },
    maxEnergyBonus: 4,
    maxHeartsBonus: 1,
    growthProfile: { CHA: 7, WIL: 4, DEX: 3, FER: 3 },
    exclusiveAbilityPool: [
      ability("ancient_poise", "Ancient Poise", "B", "variant", "Adds +5% pregnancy chance and bonus Breeder XP when the player participates."),
      ability("sun_warmed", "Sun-Warmed", "C", "variant", "Reduces breeding energy cost by 3 and gives +1 affection after breeding."),
      ability("royal_gaze", "Royal Gaze", "B", "variant", "Adds +3% pregnancy chance and slightly favors Charm growth."),
    ],
    portraitPath: "/images/creatures/feline/sphinx_portrait.png",
    profilePath: "/images/creatures/feline/sphinx_profile.png",
  },
  {
    variantId: "variant_tiger" as VariantId,
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    name: "Tiger",
    rarity: "Rare",
    description: "A powerful tiger variant with an imposing silhouette, strong physical presence, and high-risk contract potential.",
    statAdjustments: { STR: 3, STA: 1, DEX: 1, CHA: -1 },
    maxEnergyBonus: 8,
    maxHeartsBonus: 0,
    growthProfile: { STR: 9, DEX: 5, STA: 3, CHA: -2 },
    exclusiveAbilityPool: [
      ability("tiger_instinct", "Tiger Instinct", "B", "variant", "Gains +5 creature XP from breeding and strongly favors Strength growth."),
      ability("apex_pounce", "Apex Pounce", "C", "variant", "Reduces breeding energy cost by 2 and slightly favors Dexterity growth."),
      ability("striped_vigor", "Striped Vigor", "B", "variant", "Gains +3 creature XP and slightly favors Stamina growth."),
    ],
    portraitPath: "/images/creatures/feline/saberfang_portrait.png",
    profilePath: "/images/creatures/feline/saberfang_profile.png",
  },
  {
    variantId: "variant_base_canine" as VariantId,
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    name: "Base Canine",
    rarity: "Common",
    description: "A balanced starter canine with dependable stamina, loyalty, and everyday ranch utility.",
    statAdjustments: {},
    maxEnergyBonus: 6,
    maxHeartsBonus: 0,
    growthProfile: { STA: 3, WIL: 2, STR: 1 },
    exclusiveAbilityPool: [
      ability("steady_companion", "Steady Companion", "C", "variant", "Reduces breeding energy cost by 4 and gives +2 creature XP from breeding attempts."),
      ability("gentle_guard", "Gentle Guard", "C", "variant", "Gives +1 affection after breeding and slightly favors Willpower growth."),
    ],
    portraitPath: "/images/creatures/canine/base_canine_portrait.png",
    profilePath: "/images/creatures/canine/base_canine_profile.png",
  },
  {
    variantId: "variant_hellhound" as VariantId,
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    name: "Hellhound",
    rarity: "Rare",
    description: "A fierce canine variant with heat, grit, and excellent future contract identity.",
    statAdjustments: { STR: 2, WIL: 2, STA: 1, CHA: -1 },
    maxEnergyBonus: 10,
    maxHeartsBonus: 0,
    growthProfile: { STR: 7, WIL: 6, STA: 3, CHA: -2 },
    exclusiveAbilityPool: [
      ability("ember_blood", "Ember Blood", "B", "variant", "Gains +6 creature XP from breeding and strongly favors Strength growth."),
      ability("infernal_focus", "Infernal Focus", "C", "variant", "Adds +3% pregnancy chance and +3 creature XP from breeding attempts."),
      ability("ash_resolve", "Ash Resolve", "B", "variant", "Reduces breeding energy cost by 3 and slightly favors Willpower growth."),
    ],
    portraitPath: "/images/creatures/canine/hellhound_portrait.png",
    profilePath: "/images/creatures/canine/hellhound_profile.png",
  },
  {
    variantId: "variant_direwolf" as VariantId,
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    name: "Direwolf",
    rarity: "Rare",
    description: "A large, disciplined canine variant with excellent stamina, loyalty, and group-task potential.",
    statAdjustments: { STA: 2, STR: 1, WIL: 1 },
    maxEnergyBonus: 14,
    maxHeartsBonus: 1,
    growthProfile: { STA: 9, WIL: 5, STR: 3 },
    exclusiveAbilityPool: [
      ability("alpha_bond", "Alpha Bond", "B", "variant", "Adds +6% pregnancy chance and bonus Breeder XP when the player participates."),
      ability("winter_coat", "Winter Coat", "C", "variant", "Reduces breeding energy cost by 2."),
      ability("pack_anchor", "Pack Anchor", "B", "variant", "Gives +3 creature XP and strongly favors Stamina growth."),
    ],
    portraitPath: "/images/creatures/canine/direwolf_portrait.png",
    profilePath: "/images/creatures/canine/direwolf_profile.png",
  },
];

export function getSpeciesDefinition(speciesId: SpeciesId): SpeciesDefinition {
  const species = SPECIES_DEFINITIONS.find((item) => item.speciesId === speciesId);
  if (!species) throw new Error(`Unknown species: ${speciesId}`);
  return species;
}

export function normalizeVariantId(variantId: VariantId): VariantId {
  if (variantId === ("variant_saberfang" as VariantId)) return "variant_tiger" as VariantId;
  return variantId;
}

export function getVariantDefinition(variantId: VariantId): VariantDefinition {
  const normalizedVariantId = normalizeVariantId(variantId);
  const variant = VARIANT_DEFINITIONS.find((item) => item.variantId === normalizedVariantId);
  if (!variant) throw new Error(`Unknown variant: ${variantId}`);
  return variant;
}

export function getVariantsForFamily(family: "feline" | "canine"): VariantDefinition[] {
  return VARIANT_DEFINITIONS.filter((variant) => variant.family === family);
}

export function getCombinedGrowthProfile(speciesId: SpeciesId, variantId: VariantId): StatGrowthProfile {
  const species = getSpeciesDefinition(speciesId);
  const variant = getVariantDefinition(variantId);
  return STAT_KEYS.reduce((profile, key) => ({
    ...profile,
    [key]: Math.max(1, species.growthProfile[key] + (variant.growthProfile[key] ?? 0)),
  }), {} as StatGrowthProfile);
}

export function getStatGradeMultiplier(grade: StatGrade): number {
  return STAT_GRADE_MULTIPLIERS[grade] ?? 1;
}

export function applyStatGrades(rawStats: CreatureStats, statGrades: StatGrades): CreatureStats {
  return STAT_KEYS.reduce((stats, key) => ({
    ...stats,
    [key]: Math.max(1, Math.round(rawStats[key] * getStatGradeMultiplier(statGrades[key]))),
  }), {} as CreatureStats);
}

export function rollStatGrade(seed: string, rarity: VariantDefinition["rarity"] = "Common"): StatGrade {
  const roll = deterministicRoll(seed, 100);
  const rareBoost = rarity === "Rare" ? 8 : rarity === "Epic" ? 15 : rarity === "Uncommon" ? 4 : 0;
  const adjusted = Math.min(99, roll + rareBoost);

  if (adjusted >= 97) return "S";
  if (adjusted >= 82) return "A";
  if (adjusted >= 55) return "B";
  if (adjusted >= 25) return "C";
  return "D";
}

export function rollStatGrades(seed: string, rarity: VariantDefinition["rarity"] = "Common"): StatGrades {
  return STAT_KEYS.reduce((grades, key, index) => ({
    ...grades,
    [key]: rollStatGrade(`${seed}_${key}_${index}`, rarity),
  }), {} as StatGrades);
}

export function shiftStatGrade(grade: StatGrade, amount: number): StatGrade {
  const index = STAT_GRADE_ORDER.indexOf(grade);
  return STAT_GRADE_ORDER[Math.max(0, Math.min(STAT_GRADE_ORDER.length - 1, index + amount))];
}

export function buildStats(baseStats: CreatureStats, adjustments: Partial<CreatureStats>, statGrades: StatGrades): CreatureStats {
  const rawStats = STAT_KEYS.reduce((stats, key) => ({
    ...stats,
    [key]: Math.max(1, baseStats[key] + (adjustments[key] ?? 0)),
  }), {} as CreatureStats);
  return applyStatGrades(rawStats, statGrades);
}

export function getBaseMaxHearts(speciesId: SpeciesId, variantId: VariantId): number {
  const species = getSpeciesDefinition(speciesId);
  const variant = getVariantDefinition(variantId);
  return species.baseMaxHearts + variant.maxHeartsBonus;
}

export function getVariantMaxEnergyBonus(variantId: VariantId): number {
  return getVariantDefinition(variantId).maxEnergyBonus;
}

export function rollCreatureAbilities(seed: string, speciesId: SpeciesId, variantId: VariantId, forceStarter = false): CreatureAbility[] {
  const species = getSpeciesDefinition(speciesId);
  const variant = getVariantDefinition(variantId);
  const speciesAbility = species.exclusiveAbilityPool[deterministicRoll(`${seed}_species_ability`, species.exclusiveAbilityPool.length)];
  const variantAbility = variant.exclusiveAbilityPool[deterministicRoll(`${seed}_variant_ability`, variant.exclusiveAbilityPool.length)];
  const abilities = [speciesAbility, variantAbility].filter(Boolean);
  const generalChance = forceStarter ? 100 : variant.rarity === "Rare" ? 42 : variant.rarity === "Epic" ? 65 : 24;

  if (deterministicRoll(`${seed}_general_ability`) < generalChance) {
    const generalAbility = GENERAL_ABILITY_POOL[deterministicRoll(`${seed}_general_pick`, GENERAL_ABILITY_POOL.length)];
    if (!abilities.some((abilityItem) => abilityItem.id === generalAbility.id)) abilities.push(generalAbility);
  }

  return abilities.slice(0, 3);
}

function createStarterCreature(ownerSaveId: SaveId, creatureId: CreatureId, variantId: VariantId, habitatId: HabitatId, nickname: string): CreatureRecord {
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const now = new Date().toISOString();
  const level = 1;
  const statGrades = rollStatGrades(`${ownerSaveId}_${creatureId}_starter`, variant.rarity);
  const stats = buildStats(species.baseStats, variant.statAdjustments, statGrades);
  const maxHearts = getBaseMaxHearts(species.speciesId, variant.variantId);

  return {
    creatureId,
    ownerSaveId,
    speciesId: species.speciesId,
    variantId: variant.variantId,
    habitatId,
    nickname,
    level,
    xp: 0,
    xpToNext: getCreatureXpToNext(level),
    stats,
    statGrades,
    abilities: rollCreatureAbilities(`${ownerSaveId}_${creatureId}_starter`, species.speciesId, variant.variantId, true),
    energy: 100,
    maxEnergy: 100,
    hearts: maxHearts,
    maxHearts,
    affection: 50,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    createdAt: now,
    notes: "Starter creature generated for the M8.5 stat grade and individuality milestone.",
  };
}

export function createStarterCreatures(ownerSaveId: SaveId): CreatureRecord[] {
  return [
    createStarterCreature(ownerSaveId, "creature_starter_feline" as CreatureId, "variant_base_feline" as VariantId, FELINE_HABITAT_ID, "Mira"),
    createStarterCreature(ownerSaveId, "creature_starter_canine" as CreatureId, "variant_base_canine" as VariantId, CANINE_HABITAT_ID, "Rook"),
  ];
}

export function createStarterHabitats(): HabitatRecord[] {
  return [
    { habitatId: FELINE_HABITAT_ID, family: "feline", name: "Feline Habitat", level: 1, capacity: 6, creatureIds: ["creature_starter_feline" as CreatureId], unlocked: true },
    { habitatId: CANINE_HABITAT_ID, family: "canine", name: "Canine Habitat", level: 1, capacity: 6, creatureIds: ["creature_starter_canine" as CreatureId], unlocked: true },
  ];
}