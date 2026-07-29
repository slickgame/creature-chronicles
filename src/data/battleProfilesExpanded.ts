import * as core from "./battleProfiles";
import type { BattleMoveId, BattleSpeciesProfile } from "@/types/battle";
import type { SpeciesId } from "@/types/ids";

export * from "./battleProfiles";

const EXTRA_SPECIES_MOVES: Record<string, BattleMoveId[]> = {
  species_feline: ["shadow_feint"],
  species_canine: ["resonant_bark"],
  species_bovine: ["unyielding_aura"],
  species_lapine: ["soothing_pulse"],
  species_equine: ["thunder_tread"],
};

const EXTRA_UNIVERSAL_COMPATIBILITY: Record<string, BattleMoveId[]> = {
  species_feline: ["will_bolt", "suppress", "energy_link", "predator_pursuit"],
  species_canine: ["will_bolt", "mend_wounds", "suppress", "energy_link", "predator_pursuit", "guardian_chorus"],
  species_bovine: ["will_bolt", "mend_wounds", "suppress", "energy_link", "guardian_chorus"],
  species_lapine: ["will_bolt", "mend_wounds", "energy_link", "restorative_rhythm"],
  species_equine: ["will_bolt", "mend_wounds", "suppress", "energy_link", "guardian_chorus", "restorative_rhythm"],
};

function unique(values: readonly BattleMoveId[]): BattleMoveId[] {
  return Array.from(new Set(values));
}

export const BATTLE_SPECIES_PROFILES: readonly BattleSpeciesProfile[] = core.BATTLE_SPECIES_PROFILES.map((profile) => ({
  ...profile,
  speciesMoveIds: unique([
    ...profile.speciesMoveIds,
    ...(EXTRA_SPECIES_MOVES[profile.speciesId] ?? []),
  ]),
  universalCompatibilityMoveIds: unique([
    ...profile.universalCompatibilityMoveIds,
    ...(EXTRA_UNIVERSAL_COMPATIBILITY[profile.speciesId] ?? []),
  ]),
}));

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
