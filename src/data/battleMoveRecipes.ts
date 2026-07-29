import type { BattleMoveCombinationRecipe } from "@/types/battle";

export const BATTLE_MOVE_COMBINATION_RECIPES: readonly BattleMoveCombinationRecipe[] = [
  {
    recipeId: "recipe_predator_pursuit",
    name: "Predator Pursuit",
    description: "Combines focused marking with a pursuit technique to create a rare finisher.",
    outputMoveId: "predator_pursuit",
    parentAMoveIds: ["focused_stare", "shadow_feint"],
    parentBMoveIds: ["chase", "flurry_dash"],
    symmetric: true,
    baseChance: 12,
    requiredChildTags: ["pursuit", "predatory", "finisher", "cunning"],
    notes: [
      "The parents may satisfy either side of the recipe when symmetric is true.",
      "Successful conception resolves and stores this recipe once using immutable parent move snapshots.",
    ],
  },
  {
    recipeId: "recipe_guardian_chorus",
    name: "Guardian Chorus",
    description: "Combines a protective rally with a calming team technique.",
    outputMoveId: "guardian_chorus",
    parentAMoveIds: ["pack_howl", "rally"],
    parentBMoveIds: ["calming_presence", "calming_neigh", "unyielding_aura"],
    symmetric: true,
    baseChance: 10,
    requiredChildTags: ["support", "protective", "loyal", "calm"],
    notes: [
      "Designed for support-oriented cross-family pairings.",
      "The recipe does not bypass normal child compatibility or learned-move limits.",
    ],
  },
  {
    recipeId: "recipe_restorative_rhythm",
    name: "Restorative Rhythm",
    description: "Combines nurturing healing with disciplined calming techniques.",
    outputMoveId: "restorative_rhythm",
    parentAMoveIds: ["nesting_comfort", "soothing_pulse", "mend_wounds"],
    parentBMoveIds: ["calming_neigh", "calming_presence", "steady_trot"],
    symmetric: true,
    baseChance: 8,
    requiredChildTags: ["nurturing", "calm", "support", "healer"],
    notes: [
      "This rare recipe produces a team healing and cleansing move.",
      "The result is rolled once at conception and carried through pregnancy, egg, hatchling, and birth history.",
    ],
  },
];

export const BATTLE_MOVE_COMBINATION_RECIPES_BY_ID: Record<string, BattleMoveCombinationRecipe> =
  BATTLE_MOVE_COMBINATION_RECIPES.reduce(
    (recipesById, recipe) => ({ ...recipesById, [recipe.recipeId]: recipe }),
    {} as Record<string, BattleMoveCombinationRecipe>,
  );

export function getBattleMoveCombinationRecipe(recipeId: string): BattleMoveCombinationRecipe {
  const recipe = BATTLE_MOVE_COMBINATION_RECIPES_BY_ID[recipeId];
  if (!recipe) throw new Error(`Unknown battle move combination recipe: ${recipeId}`);
  return recipe;
}
