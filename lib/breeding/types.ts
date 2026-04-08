export type EggQuality = "poor" | "normal" | "strong" | "exceptional";

export type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

export type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

export type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

export type SortDirection = "asc" | "desc";
export type PresetSortMode = "custom" | "best_match";

export type SortOption =
  | "name"
  | "fertility"
  | "happiness"
  | "generation"
  | "ready";

export type BreedingPreset = {
  slot: number;
  name: string;
  giverType: "player" | "creature";
  giverCreatureId: number | null;
  receiverType: "player" | "creature";
  receiverCreatureId: number | null;
};

export type PresetValidation = {
  giverMissing: boolean;
  receiverMissing: boolean;
  sameCreature: boolean;
  familyRisk: "none" | "half_sibling" | "full_sibling" | "parent_child";
  canLoad: boolean;
};

export type SavedBreedingUiState = {
  favoriteCreatureIds: number[];
  presets: BreedingPreset[];
  presetSortMode?: PresetSortMode;
};

export type DetailTarget =
  | {
      type: "player";
      roleLabel: string;
    }
  | {
      type: "creature";
      roleLabel: string;
      creature: {
        id: number;
        name: string;
        nickname: string;
        level: number;
        happiness: number;
        generation: number;
        breedingStamina: number;
        maxBreedingStamina: number;
        breedingsToday: number;
        dailyBreedingLimit: number;
        giver: string | null;
        receiver: string | null;
        giverId: number | null;
        receiverId: number | null;
        giverIsPlayer?: boolean;
        receiverIsPlayer?: boolean;
        stats: {
          strength: number;
          endurance: number;
          intelligence: number;
          speed: number;
          fertility: number;
          vitality: number;
        };
        skills?: {
          breedingCare?: {
            level: number;
          };
        };
        traits?: CreatureTraitEntry[];
      };
    };

export type PresetPreviewTarget = {
  slot: number;
  preset: BreedingPreset;
};

export const BREEDING_UI_STORAGE_KEY = "creature-chronicles-breeding-ui-v1";

export const HORSE_SPECIFIC_TRAITS: CreatureTrait[] = [
  "barnwise",
  "surefooted",
];

export const CAT_SPECIFIC_TRAITS: CreatureTrait[] = [
  "night_prawler",
  "graceful",
];

export const GENERAL_BREEDABLE_TRAITS: CreatureTrait[] = [
  "domestic",
  "industrious",
  "calm",
  "fertile",
  "quick",
  "sturdy",
  "affectionate",
  "keen",
];

export const ALL_BREEDABLE_TRAITS: CreatureTrait[] = [
  ...GENERAL_BREEDABLE_TRAITS,
  ...HORSE_SPECIFIC_TRAITS,
  ...CAT_SPECIFIC_TRAITS,
];
