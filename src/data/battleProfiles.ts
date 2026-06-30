import type { BattleSpeciesProfile } from "@/types/battle";
import type { SpeciesId } from "@/types/ids";

const FELINE_SPECIES_ID = "species_feline" as SpeciesId;
const CANINE_SPECIES_ID = "species_canine" as SpeciesId;
const BOVINE_SPECIES_ID = "species_bovine" as SpeciesId;
const LAPINE_SPECIES_ID = "species_lapine" as SpeciesId;
const EQUINE_SPECIES_ID = "species_equine" as SpeciesId;

export const BATTLE_SPECIES_PROFILES = [
  {
    speciesId: FELINE_SPECIES_ID,
    family: "feline",
    roleTags: ["striker", "disruptor", "finisher"],
    bodyTags: ["agile", "light", "clawed", "keen_eyed"],
    temperamentTags: ["cunning", "independent", "predatory"],
    speciesTags: ["feline", "beast", "starter"],
    affinityMoveTags: ["claw", "pounce", "precision", "evade", "bleed"],
    vulnerabilityTags: ["fragile", "low_guard"],
    resistanceTags: ["agile", "precision"],
    signatureMoveId: "pounce",
    speciesMoveIds: ["pounce", "razor_swipe", "evasive_step", "focused_stare"],
    universalCompatibilityMoveIds: ["strike", "defend", "focus", "quick_step", "guard_break", "taunt"],
    defaultLearnedMoveIds: ["strike", "defend", "pounce", "evasive_step", "razor_swipe", "focused_stare", "quick_step", "focus"],
    defaultEquippedMoveIds: ["strike", "pounce", "evasive_step", "focused_stare"],
    battleStatBonuses: { speed: 4, evasion: 3, accuracy: 2 },
  },
  {
    speciesId: CANINE_SPECIES_ID,
    family: "canine",
    roleTags: ["striker", "support", "tank"],
    bodyTags: ["sturdy", "fanged", "pack_built"],
    temperamentTags: ["loyal", "protective", "aggressive", "disciplined"],
    speciesTags: ["canine", "beast", "starter"],
    affinityMoveTags: ["bite", "howl", "guard", "pursuit", "teamwork"],
    vulnerabilityTags: ["predictable", "disruption_sensitive"],
    resistanceTags: ["guard", "teamwork", "morale"],
    signatureMoveId: "pack_howl",
    speciesMoveIds: ["bite_down", "pack_howl", "protective_lunge", "chase"],
    universalCompatibilityMoveIds: ["strike", "defend", "focus", "first_aid", "guard_break", "rally", "taunt"],
    defaultLearnedMoveIds: ["strike", "defend", "bite_down", "pack_howl", "protective_lunge", "chase", "rally", "focus"],
    defaultEquippedMoveIds: ["strike", "bite_down", "pack_howl", "protective_lunge"],
    battleStatBonuses: { maxHp: 6, defense: 2, statusResist: 2 },
  },
  {
    speciesId: BOVINE_SPECIES_ID,
    family: "bovine",
    roleTags: ["tank", "support", "controller"],
    bodyTags: ["heavy", "sturdy", "horned", "armored"],
    temperamentTags: ["calm", "disciplined", "territorial", "protective"],
    speciesTags: ["bovine", "beast", "starter"],
    affinityMoveTags: ["guard", "heavy", "strike", "horn", "calm"],
    vulnerabilityTags: ["slow", "low_evasion"],
    resistanceTags: ["claw", "bite", "strike", "stun"],
    signatureMoveId: "stubborn_guard",
    speciesMoveIds: ["heavy_shove", "stubborn_guard", "calming_presence", "horn_check"],
    universalCompatibilityMoveIds: ["strike", "defend", "focus", "first_aid", "guard_break", "rally", "taunt"],
    defaultLearnedMoveIds: ["strike", "defend", "heavy_shove", "stubborn_guard", "calming_presence", "horn_check", "guard_break", "rally"],
    defaultEquippedMoveIds: ["strike", "heavy_shove", "stubborn_guard", "calming_presence"],
    battleStatBonuses: { maxHp: 12, defense: 5, resistance: 2, speed: -2 },
  },
  {
    speciesId: LAPINE_SPECIES_ID,
    family: "lapine",
    roleTags: ["support", "finisher", "disruptor"],
    bodyTags: ["agile", "light", "swift", "soft_framed"],
    temperamentTags: ["skittish", "nurturing", "docile", "cunning"],
    speciesTags: ["lapine", "beast", "starter"],
    affinityMoveTags: ["agile", "evade", "heal", "pursuit", "quick"],
    vulnerabilityTags: ["fragile", "pressure_sensitive"],
    resistanceTags: ["evade", "slowed"],
    signatureMoveId: "quick_kick",
    speciesMoveIds: ["quick_kick", "evasive_hop", "nesting_comfort", "flurry_dash"],
    universalCompatibilityMoveIds: ["strike", "defend", "focus", "quick_step", "first_aid", "rally"],
    defaultLearnedMoveIds: ["strike", "defend", "quick_kick", "evasive_hop", "nesting_comfort", "flurry_dash", "quick_step", "first_aid"],
    defaultEquippedMoveIds: ["strike", "quick_kick", "evasive_hop", "nesting_comfort"],
    battleStatBonuses: { speed: 5, evasion: 4, battleEnergy: 4, defense: -1 },
  },
  {
    speciesId: EQUINE_SPECIES_ID,
    family: "equine",
    roleTags: ["striker", "support", "tank"],
    bodyTags: ["sturdy", "hoofed", "swift", "heavy"],
    temperamentTags: ["disciplined", "calm", "protective", "territorial"],
    speciesTags: ["equine", "beast", "starter"],
    affinityMoveTags: ["hoof", "charge", "focus", "rally", "heavy"],
    vulnerabilityTags: ["predictable", "turning_radius"],
    resistanceTags: ["slowed", "exhausted", "morale"],
    signatureMoveId: "hoof_strike",
    speciesMoveIds: ["hoof_strike", "steady_trot", "field_charge", "calming_neigh"],
    universalCompatibilityMoveIds: ["strike", "defend", "focus", "first_aid", "guard_break", "rally"],
    defaultLearnedMoveIds: ["strike", "defend", "hoof_strike", "steady_trot", "field_charge", "calming_neigh", "guard_break", "rally"],
    defaultEquippedMoveIds: ["strike", "hoof_strike", "steady_trot", "field_charge"],
    battleStatBonuses: { maxHp: 8, physicalPower: 2, battleEnergy: 6, speed: 1 },
  },
] as const satisfies readonly BattleSpeciesProfile[];

export const BATTLE_SPECIES_PROFILES_BY_ID: Record<SpeciesId, BattleSpeciesProfile> = BATTLE_SPECIES_PROFILES.reduce(
  (profilesById, profile) => ({ ...profilesById, [profile.speciesId]: profile }),
  {} as Record<SpeciesId, BattleSpeciesProfile>,
);

export function getBattleSpeciesProfile(speciesId: SpeciesId): BattleSpeciesProfile {
  const profile = BATTLE_SPECIES_PROFILES_BY_ID[speciesId];
  if (!profile) throw new Error(`Unknown battle species profile: ${speciesId}`);
  return profile;
}

export function getBattleSpeciesTags(speciesId: SpeciesId): string[] {
  const profile = getBattleSpeciesProfile(speciesId);
  return [
    profile.family,
    ...profile.roleTags,
    ...profile.bodyTags,
    ...profile.temperamentTags,
    ...profile.speciesTags,
    ...profile.affinityMoveTags,
    ...profile.vulnerabilityTags,
    ...profile.resistanceTags,
  ];
}
