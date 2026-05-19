import type {
  CreatureAbility,
  CreatureRecord,
  CreatureStats,
  HabitatRecord,
  SpeciesDefinition,
  VariantDefinition,
} from "@/types/creature";
import type { CreatureId, HabitatId, SaveId, SpeciesId, VariantId } from "@/types/ids";

export const CREATURE_PLACEHOLDER_IMAGE = "/images/ui/icons/icon_paw_crest.png";

const FELINE_SPECIES_ID = "species_feline" as SpeciesId;
const CANINE_SPECIES_ID = "species_canine" as SpeciesId;

const FELINE_HABITAT_ID = "habitat_feline" as HabitatId;
const CANINE_HABITAT_ID = "habitat_canine" as HabitatId;

function getCreatureXpToNext(level: number): number {
  return 45 + level * 30;
}

function ability(
  id: string,
  name: string,
  grade: CreatureAbility["grade"],
  source: CreatureAbility["source"],
  description: string,
): CreatureAbility {
  return { id, name, grade, source, description };
}

export const SPECIES_DEFINITIONS: SpeciesDefinition[] = [
  {
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    name: "Feline",
    description:
      "Agile, affectionate, and naturally curious ranch companions. Felines favor speed, charm, and careful bonding.",
    baseStats: { STR: 4, DEX: 8, STA: 5, CHA: 7, WIL: 5, FER: 6 },
    exclusiveAbilityPool: [
      ability("feline_grace", "Feline Grace", "B", "species", "Improves daily affection gain and slightly improves avoidance of negative ranch events."),
      ability("soft_step", "Soft Step", "C", "species", "Future utility talent for scouting, careful movement, and low-risk exploration tasks."),
    ],
  },
  {
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    name: "Canine",
    description:
      "Loyal, sturdy, and task-focused ranch companions. Canines favor stamina, willpower, and dependable work.",
    baseStats: { STR: 7, DEX: 5, STA: 8, CHA: 5, WIL: 7, FER: 5 },
    exclusiveAbilityPool: [
      ability("pack_loyalty", "Pack Loyalty", "B", "species", "Improves morale-based tasks and future group synergy checks."),
      ability("guard_instinct", "Guard Instinct", "C", "species", "Future utility talent for ranch defense, contract protection, and watch duties."),
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
    exclusiveAbilityPool: [ability("steady_purr", "Steady Purr", "C", "variant", "Improves early ranch comfort and gives this creature a reliable starter identity.")],
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
    exclusiveAbilityPool: [
      ability("ancient_poise", "Ancient Poise", "B", "variant", "Improves calm-related checks and future rare-contract suitability."),
      ability("sun_warmed", "Sun-Warmed", "C", "variant", "Future comfort talent that improves rest quality in upgraded habitats."),
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
    exclusiveAbilityPool: [
      ability("tiger_instinct", "Tiger Instinct", "B", "variant", "Future combat and intimidation talent for difficult contracts."),
      ability("apex_pounce", "Apex Pounce", "C", "variant", "Improves burst-task suitability and future hunting events."),
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
    exclusiveAbilityPool: [ability("steady_companion", "Steady Companion", "C", "variant", "Improves early ranch reliability and gives this creature a dependable starter identity.")],
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
    exclusiveAbilityPool: [
      ability("ember_blood", "Ember Blood", "B", "variant", "Future heat-themed talent for harsh biomes, rare contracts, and special events."),
      ability("infernal_focus", "Infernal Focus", "C", "variant", "Improves difficult task consistency when morale is low."),
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
    exclusiveAbilityPool: [
      ability("alpha_bond", "Alpha Bond", "B", "variant", "Improves future pack synergy and leadership-based ranch actions."),
      ability("winter_coat", "Winter Coat", "C", "variant", "Future cold-weather utility talent for seasonal events and habitats."),
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

function buildStats(baseStats: CreatureStats, adjustments: Partial<CreatureStats>): CreatureStats {
  return {
    STR: Math.max(1, baseStats.STR + (adjustments.STR ?? 0)),
    DEX: Math.max(1, baseStats.DEX + (adjustments.DEX ?? 0)),
    STA: Math.max(1, baseStats.STA + (adjustments.STA ?? 0)),
    CHA: Math.max(1, baseStats.CHA + (adjustments.CHA ?? 0)),
    WIL: Math.max(1, baseStats.WIL + (adjustments.WIL ?? 0)),
    FER: Math.max(1, baseStats.FER + (adjustments.FER ?? 0)),
  };
}

function createStarterCreature(
  ownerSaveId: SaveId,
  creatureId: CreatureId,
  variantId: VariantId,
  habitatId: HabitatId,
  nickname: string,
): CreatureRecord {
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const now = new Date().toISOString();
  const level = 1;

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
    stats: buildStats(species.baseStats, variant.statAdjustments),
    abilities: [species.exclusiveAbilityPool[0], variant.exclusiveAbilityPool[0]],
    energy: 100,
    maxEnergy: 100,
    hearts: 4,
    maxHearts: 4,
    affection: 50,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    createdAt: now,
    notes: "Starter creature generated for the M3 habitat/profile milestone.",
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
